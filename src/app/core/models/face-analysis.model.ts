export type FaceShape = 'oval' | 'round' | 'square' | 'rectangular' | 'triangular' | 'heart';
export type Gender = 'male' | 'female' | 'non-binary';
export type SkinTone = 'very-fair' | 'fair' | 'medium' | 'olive' | 'tan' | 'dark' | 'very-dark';
export type SkinUndertone = 'warm' | 'cool' | 'neutral';

export interface FaceLandmark {
  x: number;
  y: number;
}

export interface FaceAnalysisResult {
  faceShape: FaceShape;
  faceShapeConfidence: number;
  estimatedAge: number;
  ageConfidence: number;
  gender: Gender;
  genderConfidence: number;
  facialContrast: 'low' | 'medium' | 'high';
  skinTone: SkinTone;
  skinUndertone: SkinUndertone;
  facialSymmetry: number; // 0-100
  landmarks: FaceLandmark[];
  imageData: string; // base64
}
