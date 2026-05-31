import { Injectable } from '@angular/core';
import {
  HairstyleAsset,
  HeadMetrics,
  HairDrawRect,
} from '../models/hairstyle-asset.model';

/**
 * HairstyleRenderService
 *
 * Responsibilities:
 *  1. Load and cache hairstyle SVG/PNG assets.
 *  2. Calculate HeadMetrics from 68-point face-api.js landmarks.
 *  3. Compute the HairDrawRect (position + size) for the overlay.
 *  4. Render: original photo → pixel hair-recolor → asset overlay on a canvas.
 */
@Injectable({ providedIn: 'root' })
export class HairstyleRenderService {

  private readonly imageCache = new Map<string, HTMLImageElement>();

  // ─── 1. Asset loading ──────────────────────────────────────────────────────

  /** Loads an image URL and caches the result. */
  loadAsset(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return Promise.resolve(this.imageCache.get(src)!);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload  = () => { this.imageCache.set(src, img); resolve(img); };
      img.onerror = () => reject(new Error(`Failed to load hairstyle asset: ${src}`));
      img.src = src;
    });
  }

  // ─── 2. Head metrics from landmarks ───────────────────────────────────────

  /**
   * Derives HeadMetrics from the raw 68-point landmark array returned by
   * face-api.js (.withFaceLandmarks()).
   *
   * Landmark groups used:
   *  getJawOutline()  → points [0..16]
   *  Left brow        → points [17..21]
   *  Right brow       → points [22..26]
   *  Nose bridge      → point  [27]
   *  Nose tip         → point  [33]
   *  Chin             → point  [8]
   *  Left eye         → points [36..41]
   *  Right eye        → points [42..47]
   *
   * @param lms   Array of 68 {x, y} points already scaled to canvas coordinates.
   */
  calculateHeadMetrics(lms: Array<{ x: number; y: number }>): HeadMetrics {
    // Face width: outermost jaw points
    const faceWidth = lms[16].x - lms[0].x;
    const headWidth = faceWidth * 1.10;
    const centerX   = (lms[0].x + lms[16].x) / 2;

    // Hairline: slightly above the topmost eyebrow point
    const browPoints = lms.slice(17, 27);
    const minBrowY   = Math.min(...browPoints.map(p => p.y));
    const hairlineY  = minBrowY - faceWidth * 0.04;

    // Head crown estimation:
    // From hairline to nose-tip ≈ 1× nose length; scale upward by that amount.
    const noseLength = lms[33].y - lms[27].y;
    const headTopY   = hairlineY - noseLength * 1.15;

    return {
      centerX,
      hairlineY,
      headTopY,
      faceWidth,
      headWidth,
      chinY: lms[8].y,
    };
  }

  // ─── 3. Positioning ────────────────────────────────────────────────────────

  /**
   * Computes the rectangle in which to draw the hair asset on the canvas.
   *
   * Logic:
   *  – Width  = metrics.headWidth × asset.widthScale
   *  – Height = width × (svgNativeH / svgNativeW)  — preserved aspect ratio
   *  – X      = centerX − width/2
   *  – Y      = hairlineY − asset.anchorY × height
   *    (anchorY is the fraction of the image where the hairline sits,
   *     so this places that anchor at the detected hairline position)
   *
   * @param metrics  Output of calculateHeadMetrics().
   * @param asset    The selected HairstyleAsset.
   * @param imgW     Native pixel width of the loaded asset image.
   * @param imgH     Native pixel height of the loaded asset image.
   */
  computeDrawRect(
    metrics: HeadMetrics,
    asset: HairstyleAsset,
    imgW: number,
    imgH: number,
  ): HairDrawRect {
    const w = metrics.headWidth * asset.widthScale;
    const h = w * (imgH / imgW);
    const x = metrics.centerX - w / 2;
    const y = metrics.hairlineY - asset.anchorY * h;
    return { x, y, w, h };
  }

  // ─── 4. Color tinting ─────────────────────────────────────────────────────

  /**
   * Draws the asset onto an off-screen canvas and recolors it toward
   * `hairColor` while preserving the luminance texture of the original.
   * Returns the tinted off-screen canvas.
   */
  tintAsset(img: HTMLImageElement, hairColor: string): HTMLCanvasElement {
    const oc  = document.createElement('canvas');
    oc.width  = img.naturalWidth  || img.width;
    oc.height = img.naturalHeight || img.height;
    const ctx = oc.getContext('2d')!;

    // Draw original
    ctx.drawImage(img, 0, 0);

    // Extract pixel data and recolor preserving luminance
    const [tr, tg, tb] = this.hexToRgb(hairColor);
    const id = ctx.getImageData(0, 0, oc.width, oc.height);
    const d  = id.data;

    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 10) continue;          // skip transparent pixels

      // Relative luminance of original pixel (0–1)
      const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;

      // Map target color scaled by luminance, clamped to [0, 255]
      const factor = Math.min(lum * 1.5, 1.0);
      d[i]     = Math.min(255, Math.round(tr * factor + d[i]     * 0.15));
      d[i + 1] = Math.min(255, Math.round(tg * factor + d[i + 1] * 0.15));
      d[i + 2] = Math.min(255, Math.round(tb * factor + d[i + 2] * 0.15));
    }

    ctx.putImageData(id, 0, 0);
    return oc;
  }

  // ─── 5. Full render pipeline ───────────────────────────────────────────────

  /**
   * Renders the complete try-on result onto `canvas`:
   *  1. Draws the original source photo at full canvas size.
   *  2. Applies pixel-level hair-zone recoloring on the photo.
   *  3. Loads the hairstyle asset, tints it, and draws it over the face.
   *
   * @param canvas        Target canvas element (already sized).
   * @param sourceImage   Original user photo.
   * @param landmarks     68-point array scaled to **canvas** coordinates.
   * @param asset         Selected HairstyleAsset.
   * @param hairColor     Hex color string (e.g. "#3d2b1f").
   */
  async renderHairstyle(
    canvas: HTMLCanvasElement,
    sourceImage: HTMLImageElement,
    landmarks: Array<{ x: number; y: number }>,
    asset: HairstyleAsset,
    hairColor: string,
  ): Promise<void> {
    const ctx = canvas.getContext('2d')!;

    // Step 1 — draw the photo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

    // Step 2 — compute metrics
    const metrics = this.calculateHeadMetrics(landmarks);

    // Step 3 — pixel hair recolor (on the photo, in the hair zone above forehead)
    this.recolorHairZone(ctx, canvas, hairColor, metrics);

    // Step 4 — load & tint asset
    const assetImg  = await this.loadAsset(asset.image);
    const tinted    = this.tintAsset(assetImg, hairColor);
    const drawRect  = this.computeDrawRect(
      metrics, asset,
      assetImg.naturalWidth  || assetImg.width,
      assetImg.naturalHeight || assetImg.height,
    );

    // Step 5 — composite hair asset over photo
    ctx.save();
    ctx.globalAlpha = 0.93;
    ctx.drawImage(tinted, drawRect.x, drawRect.y, drawRect.w, drawRect.h);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ─── 6. Pixel hair-zone recolor (existing photo hair) ─────────────────────

  /**
   * Recolors the pixel region above the detected hairline toward `hairColor`.
   * Darker pixels (hair-like) are shifted most strongly; bright pixels
   * (background, skin) are left nearly unchanged.
   */
  recolorHairZone(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    hairColor: string,
    metrics: HeadMetrics,
  ): void {
    const [nr, ng, nb] = this.hexToRgb(hairColor);
    const margin = metrics.faceWidth * 0.4;

    const left   = Math.max(0,            Math.round(metrics.centerX - metrics.headWidth / 2 - margin));
    const right  = Math.min(canvas.width, Math.round(metrics.centerX + metrics.headWidth / 2 + margin));
    const top    = Math.max(0,            Math.round(metrics.headTopY  - metrics.faceWidth * 0.12));
    const bottom = Math.min(canvas.height,Math.round(metrics.hairlineY + metrics.faceWidth * 0.05));

    const w = right - left;
    const h = bottom - top;
    if (w <= 0 || h <= 0) return;

    const id = ctx.getImageData(left, top, w, h);
    const d  = id.data;

    for (let i = 0; i < d.length; i += 4) {
      const br = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
      if (br > 210 || br < 10) continue;           // skip near-white bg and pure black

      const strength = Math.min(0.88, (210 - br) / 195 * 0.92);

      d[i]     = Math.round(d[i]     * (1 - strength) + nr * strength);
      d[i + 1] = Math.round(d[i + 1] * (1 - strength) + ng * strength);
      d[i + 2] = Math.round(d[i + 2] * (1 - strength) + nb * strength);
    }

    ctx.putImageData(id, left, top);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  }
}
