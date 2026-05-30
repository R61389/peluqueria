export type ColorSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type MetalType = 'gold' | 'silver' | 'rose-gold' | 'mixed';

export interface ColorPalette {
  name: string;
  colors: string[]; // hex codes
  description: string;
}

export interface ColorimetryResult {
  dominantSeason: ColorSeason;
  seasonConfidence: number;
  subType: string;
  recommendedPalette: ColorPalette;
  avoidPalette: ColorPalette;
  neutralColors: string[];
  accentColors: string[];
  idealMetals: MetalType[];
  characteristics: string[];
}
