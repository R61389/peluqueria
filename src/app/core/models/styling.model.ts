export type StyleCategory =
  | 'minimalist-casual'
  | 'smart-casual'
  | 'monochromatic'
  | 'relaxed-elegant'
  | 'refined-streetwear'
  | 'autumn-winter'
  | 'premium-sport';

export interface StyleLook {
  category: StyleCategory;
  name: string;
  recommendedColors: string[];
  keyGarments: string[];
  combinations: string[];
  idealLooks: string[];
  avoidLooks: string[];
  season: string[];
}
