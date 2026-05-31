import { Injectable } from '@angular/core';
import {
  ImageGenerationProvider,
  HairstyleGenerationRequest,
  HairstyleGenerationResult,
  GenerationProgress,
} from '../../models/hairstyle-ai.model';

/**
 * MockProvider — works in the browser without any API key.
 *
 * Uses the Canvas 2D API to composite a luminance-aware hair-colour overlay
 * on the uploaded photo, giving a functional demo result while the user
 * configures a real provider.
 */
@Injectable()
export class MockProvider implements ImageGenerationProvider {
  readonly providerName = 'mock' as const;

  async generate(
    request: HairstyleGenerationRequest,
    onProgress: (p: GenerationProgress) => void,
  ): Promise<HairstyleGenerationResult> {
    const t0 = Date.now();

    onProgress({ status: 'analyzing',   percent: 12, message: 'Analizando imagen…',      estimatedSecondsLeft: 4 });
    await this.delay(500);
    onProgress({ status: 'generating',  percent: 38, message: 'Preparando estilos…',      estimatedSecondsLeft: 3 });
    await this.delay(700);
    onProgress({ status: 'generating',  percent: 66, message: 'Aplicando peinado…',        estimatedSecondsLeft: 2 });
    await this.delay(600);
    onProgress({ status: 'processing',  percent: 88, message: 'Finalizando resultado…',   estimatedSecondsLeft: 1 });

    const generatedImage = await this.buildCanvasResult(request);

    await this.delay(300);
    onProgress({ status: 'done', percent: 100, message: 'Listo.' });

    return {
      generatedImage,
      prompt: this.buildDemoPrompt(request),
      negativePrompt: NEGATIVE_PROMPT,
      provider: 'Mock Canvas (demo — sin API)',
      durationMs: Date.now() - t0,
    };
  }

  // ─── Canvas compositing ────────────────────────────────────────────────────

  private buildCanvasResult(req: HairstyleGenerationRequest): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxW = Math.min(img.naturalWidth, 768);
          const scale = maxW / img.naturalWidth;
          const canvas = document.createElement('canvas');
          canvas.width = maxW;
          canvas.height = Math.round(img.naturalHeight * scale);
          const ctx = canvas.getContext('2d')!;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Pixel-level recolor of the upper third (hair zone)
          this.recolorHairZone(ctx, canvas, req.hairColor);

          // Semi-transparent label banner at the bottom
          this.drawLabel(ctx, canvas, req);

          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Failed to load source image'));
      img.src = req.imageBase64;
    });
  }

  private recolorHairZone(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    hairColor: string,
  ): void {
    const [nr, ng, nb] = this.hexToRgb(hairColor);
    const zoneH = Math.round(canvas.height * 0.46);   // upper 46 % = hair area
    const id = ctx.getImageData(0, 0, canvas.width, zoneH);
    const d = id.data;

    for (let i = 0; i < d.length; i += 4) {
      const br = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      // Recolor dark pixels (hair) strongly; leave bright pixels (skin/bg) alone
      if (br > 215 || br < 8) continue;
      const strength = Math.min(0.82, ((215 - br) / 200) * 0.9);
      d[i]     = Math.round(d[i]     * (1 - strength) + nr * strength);
      d[i + 1] = Math.round(d[i + 1] * (1 - strength) + ng * strength);
      d[i + 2] = Math.round(d[i + 2] * (1 - strength) + nb * strength);
    }
    ctx.putImageData(id, 0, 0);
  }

  private drawLabel(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    req: HairstyleGenerationRequest,
  ): void {
    const bh = 38;
    ctx.fillStyle = 'rgba(8,8,16,0.72)';
    ctx.fillRect(0, canvas.height - bh, canvas.width, bh);
    ctx.fillStyle = '#c9a96e';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `Vista previa · ${req.hairstyleLabel} · ${req.hairColorName}  (modo demo — sin clave API)`,
      canvas.width / 2,
      canvas.height - bh / 2,
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildDemoPrompt(req: HairstyleGenerationRequest): string {
    return [
      '[MODO DEMO — conecta un proveedor real para generación IA]',
      '',
      'Replace only the hairstyle of the person in this portrait photo.',
      `Apply: ${req.hairstyleLabel}.`,
      `Hair color: ${req.hairColorName} (${req.hairColor}).`,
      'Preserve ALL facial features: eyes, nose, mouth, skin tone, face shape, facial structure.',
      'Professional salon photography. Natural lighting. Photorealistic. 8K quality.',
      'Keep background and clothing identical. No changes to facial structure or skin.',
    ].join('\n');
  }

  private hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}

const NEGATIVE_PROMPT =
  'changed facial features, different face, altered eyes, modified nose, changed skin tone, ' +
  'cartoon, illustration, painting, sketch, anime, deformed, distorted, blurry, low quality';
