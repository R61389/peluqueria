export type HairLength = 'pixie' | 'short' | 'bob' | 'medium' | 'long' | 'extra-long';
export type HairTexture = 'straight' | 'wavy' | 'curly' | 'coily';
export type PartingType = 'center' | 'side-left' | 'side-right' | 'deep-side' | 'none';

export interface HairstyleRecommendation {
  name: string;
  description: string;
  compatibilityScore: number; // 0-100
  idealLength: HairLength;
  idealTexture: HairTexture;
  recommendedParting: PartingType;
  imageUrl?: string;
  tags: string[];
}

export interface HairstyleResult {
  faceShape: string;
  topRecommendations: HairstyleRecommendation[];
  avoidStyles: string[];
  avoidReasons: string[];
}
