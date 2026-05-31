import { FaceShape } from './face-analysis.model';

export type HairGender   = 'male' | 'female' | 'unisex';
export type HairCategory = 'short' | 'medium' | 'long' | 'special';

export interface HairstyleAsset {
  /** Unique identifier, matches the SVG filename (e.g. "buzz-cut" → /hairstyles/buzz-cut.svg) */
  id: string;
  name: string;
  nameEs: string;
  /** Path to the transparent-background SVG/PNG inside /public */
  image: string;
  /**
   * Vertical anchor (0–1): the fraction of the image height at which the
   * hairline (forehead boundary) sits.
   * Used to align the asset with the detected hairline in the photo.
   */
  anchorY: number;
  /**
   * How wide the hair image is drawn, expressed as a multiple of the detected
   * face width (jaw-to-jaw).  Typically 1.05–1.35.
   */
  widthScale: number;
  gender: HairGender;
  category: HairCategory;
  /** Face shapes for which this style is recommended */
  compatibleFaceShapes: FaceShape[];
  description: string;
  tags: string[];
}

/** Computed positioning rectangle returned by HairstyleRenderService */
export interface HairDrawRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Key geometric measurements derived from the 68-point landmark set */
export interface HeadMetrics {
  centerX:   number;  // horizontal center of the face
  hairlineY: number;  // top of forehead (just above brows)
  headTopY:  number;  // estimated skull crown
  faceWidth: number;  // jaw-to-jaw distance
  headWidth: number;  // slightly wider than face
  chinY:     number;  // bottom of chin (landmark[8])
}
