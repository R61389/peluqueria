import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaceAnalysisResult } from '../../core/models/face-analysis.model';
import { ColorimetryResult } from '../../core/models/colorimetry.model';
import { StyleLook } from '../../core/models/styling.model';

const STYLE_LOOKS: StyleLook[] = [
  {
    category: 'minimalist-casual',
    name: 'Minimalist Casual',
    recommendedColors: ['#F5F5F5', '#E8E8E8', '#2F2F2F', '#1C1C1C', '#C9A96E'],
    keyGarments: ['Clean-cut trousers', 'Fitted white tee', 'Minimalist sneakers', 'Simple watch'],
    combinations: [
      'White tee + beige chinos + white sneakers',
      'Black fitted shirt + grey trousers + loafers',
      'Monochrome outfit in neutral tones',
    ],
    idealLooks: ['Clean lines', 'Quality fabrics', 'Minimal accessories'],
    avoidLooks: ['Heavy patterns', 'Overly layered looks', 'Clashing colors'],
    season: ['Spring', 'Summer'],
  },
  {
    category: 'smart-casual',
    name: 'Smart Casual',
    recommendedColors: ['#1C2D40', '#2C3E50', '#D4A574', '#8B7355', '#F5F5DC'],
    keyGarments: ['Oxford shirt', 'Slim-fit chinos', 'Chelsea boots', 'Blazer'],
    combinations: [
      'Oxford shirt + navy chinos + Chelsea boots',
      'Knit sweater + straight trousers + loafers',
      'Light blazer + tee + tailored jeans',
    ],
    idealLooks: ['Polished yet relaxed', 'Structured silhouettes', 'Quality materials'],
    avoidLooks: ['Overly casual', 'Sports-only wear', 'Ill-fitting pieces'],
    season: ['Autumn', 'Winter', 'Spring'],
  },
  {
    category: 'monochromatic',
    name: 'Monochromatic',
    recommendedColors: ['#F0F0F0', '#D0D0D0', '#808080', '#404040', '#1A1A1A'],
    keyGarments: ['Tone-on-tone shirt', 'Matching trousers', 'Same-tone shoes', 'Subtle accessories'],
    combinations: [
      'All-white summer look',
      'Head-to-toe charcoal with texture play',
      'Navy monochrome with different fabrics',
    ],
    idealLooks: ['Tonal dressing', 'Texture contrast', 'Elongated silhouette'],
    avoidLooks: ['Accidental color blocking', 'Too many patterns', 'Mismatched whites'],
    season: ['All seasons'],
  },
  {
    category: 'relaxed-elegant',
    name: 'Relaxed Elegant',
    recommendedColors: ['#C9A96E', '#8B6914', '#F5DEB3', '#DEB887', '#2F1B0E'],
    keyGarments: ['Linen shirt', 'Relaxed trousers', 'Leather sandals', 'Simple chain'],
    combinations: [
      'Linen shirt + wide-leg linen trousers',
      'Silk blouse + tailored shorts + mules',
      'Oversized blazer + slip dress + heels',
    ],
    idealLooks: ['Effortless sophistication', 'Natural fabrics', 'Flowing silhouettes'],
    avoidLooks: ['Too structured', 'Overly casual', 'Synthetic fabrics'],
    season: ['Spring', 'Summer'],
  },
  {
    category: 'refined-streetwear',
    name: 'Refined Streetwear',
    recommendedColors: ['#0A0A0F', '#1A1A26', '#C9A96E', '#7C3AED', '#F0EFF4'],
    keyGarments: ['Premium hoodie', 'Cargo pants', 'Designer sneakers', 'Crossbody bag'],
    combinations: [
      'Premium hoodie + cargo pants + chunky sneakers',
      'Oversized jacket + slim joggers + retro sneakers',
      'Graphic tee + wide-leg jeans + boots',
    ],
    idealLooks: ['High-low mix', 'Premium basics', 'Statement shoes'],
    avoidLooks: ['Logo overload', 'Cheap synthetic blends', 'Ill-fitting silhouettes'],
    season: ['Autumn', 'Winter'],
  },
  {
    category: 'autumn-winter',
    name: 'Autumn/Winter Cozy',
    recommendedColors: ['#8B4513', '#D2691E', '#A0522D', '#5C3317', '#F5DEB3'],
    keyGarments: ['Cable knit sweater', 'Wool trousers', 'Ankle boots', 'Long coat'],
    combinations: [
      'Turtleneck + tailored trousers + Chelsea boots',
      'Camel coat + dark jeans + loafers',
      'Chunky knit + leather trousers + ankle boots',
    ],
    idealLooks: ['Layered warmth', 'Earth tones', 'Textured fabrics'],
    avoidLooks: ['Summer fabrics in winter', 'Too many competing textures', 'Oversized everything'],
    season: ['Autumn', 'Winter'],
  },
  {
    category: 'premium-sport',
    name: 'Premium Sport',
    recommendedColors: ['#1A1A26', '#C9A96E', '#FFFFFF', '#2D2D3E', '#6B7280'],
    keyGarments: ['Performance jacket', 'Training trousers', 'Premium sneakers', 'Sport watch'],
    combinations: [
      'Performance jacket + matching trousers',
      'Compression top + joggers + retro sneakers',
      'Quarter-zip + track pants + running shoes',
    ],
    idealLooks: ['Technical fabrics', 'Clean athletic lines', 'Functional accessories'],
    avoidLooks: ['Mixing too many sport brands', 'Worn-out items', 'Wrong fit'],
    season: ['All seasons'],
  },
];

@Component({
  selector: 'app-styling',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './styling.component.html',
  styleUrls: ['./styling.component.scss'],
})
export class StylingComponent {
  faceAnalysis = input.required<FaceAnalysisResult>();
  colorimetry = input.required<ColorimetryResult>();

  styleLooks = STYLE_LOOKS;

  selectedStyle: StyleLook | null = null;

  selectStyle(style: StyleLook): void {
    this.selectedStyle = this.selectedStyle?.category === style.category ? null : style;
  }
}
