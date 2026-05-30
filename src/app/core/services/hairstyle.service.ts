import { Injectable } from '@angular/core';
import { FaceShape } from '../models/face-analysis.model';
import { HairstyleResult, HairstyleRecommendation } from '../models/hairstyle.model';

type FaceShapeData = Record<
  FaceShape,
  {
    recommendations: HairstyleRecommendation[];
    avoidStyles: string[];
    avoidReasons: string[];
  }
>;

@Injectable({ providedIn: 'root' })
export class HairstyleService {
  private hairstyleData: FaceShapeData = {
    oval: {
      recommendations: [
        {
          name: 'Textured Layers',
          description:
            'Medium-length cut with layers that add movement and dimension. Works beautifully with natural texture.',
          compatibilityScore: 95,
          idealLength: 'medium',
          idealTexture: 'wavy',
          recommendedParting: 'center',
          tags: ['versatile', 'elegant', 'everyday'],
        },
        {
          name: 'Sleek Bob',
          description:
            'A clean, jaw-length bob that highlights the balanced proportions of an oval face perfectly.',
          compatibilityScore: 90,
          idealLength: 'bob',
          idealTexture: 'straight',
          recommendedParting: 'side-left',
          tags: ['classic', 'polished', 'professional'],
        },
        {
          name: 'Long Waves',
          description:
            'Flowing long hair with soft waves that complement natural symmetry and face proportions.',
          compatibilityScore: 88,
          idealLength: 'long',
          idealTexture: 'wavy',
          recommendedParting: 'center',
          tags: ['romantic', 'feminine', 'effortless'],
        },
        {
          name: 'Pixie Cut',
          description:
            'A short, chic pixie that showcases the ideal bone structure and features of an oval face.',
          compatibilityScore: 85,
          idealLength: 'pixie',
          idealTexture: 'straight',
          recommendedParting: 'none',
          tags: ['bold', 'modern', 'edgy'],
        },
        {
          name: 'Curtain Bangs',
          description:
            'Soft curtain-style bangs that frame the face while maintaining the oval shape\'s natural grace.',
          compatibilityScore: 82,
          idealLength: 'medium',
          idealTexture: 'wavy',
          recommendedParting: 'center',
          tags: ['trendy', 'soft', 'framing'],
        },
      ],
      avoidStyles: ['Extremely voluminous styles', 'Very flat styles', 'Heavy blunt bangs'],
      avoidReasons: [
        'Oval faces suit almost all styles; avoid extremes that distort natural balance',
        'Flat styles can make an oval face look elongated',
        'Heavy bangs can shorten the face unnecessarily',
      ],
    },
    round: {
      recommendations: [
        {
          name: 'Long Layered Cut',
          description:
            'Elongating layers that fall past the chin to visually slim the face and add vertical length.',
          compatibilityScore: 95,
          idealLength: 'long',
          idealTexture: 'straight',
          recommendedParting: 'deep-side',
          tags: ['elongating', 'slimming', 'elegant'],
        },
        {
          name: 'High Top Fade',
          description:
            'Volume on top with tapered sides creates an elongated silhouette that balances round features.',
          compatibilityScore: 92,
          idealLength: 'short',
          idealTexture: 'straight',
          recommendedParting: 'none',
          tags: ['structured', 'modern', 'bold'],
        },
        {
          name: 'Side-Swept Layers',
          description:
            'Asymmetric side-swept style that creates diagonal lines, slimming and elongating the face.',
          compatibilityScore: 88,
          idealLength: 'medium',
          idealTexture: 'wavy',
          recommendedParting: 'deep-side',
          tags: ['asymmetric', 'dynamic', 'flattering'],
        },
        {
          name: 'Lob with Wispy Ends',
          description:
            'Long bob just past the collarbone with feathered, wispy ends that elongate without blunting.',
          compatibilityScore: 85,
          idealLength: 'bob',
          idealTexture: 'straight',
          recommendedParting: 'side-right',
          tags: ['modern', 'practical', 'chic'],
        },
        {
          name: 'Voluminous Crown',
          description:
            'Hair styled with volume at the crown and flat at the sides to create a more oval appearance.',
          compatibilityScore: 82,
          idealLength: 'medium',
          idealTexture: 'curly',
          recommendedParting: 'center',
          tags: ['volumizing', 'stylish', 'defined'],
        },
      ],
      avoidStyles: [
        'Blunt chin-length bobs',
        'Center partings with very flat hair',
        'Short styles that are wider than tall',
      ],
      avoidReasons: [
        'Chin-length blunt cuts add width at the widest point',
        'Center partings emphasize roundness',
        'Wide short styles accentuate the circular shape',
      ],
    },
    square: {
      recommendations: [
        {
          name: 'Soft Waves',
          description:
            'Flowing waves that soften angular features and create romantic curves around the jawline.',
          compatibilityScore: 95,
          idealLength: 'medium',
          idealTexture: 'wavy',
          recommendedParting: 'side-left',
          tags: ['softening', 'romantic', 'feminine'],
        },
        {
          name: 'Layered Pixie',
          description:
            'Pixie with soft, layered top and tapered sides that reduces the appearance of a strong jaw.',
          compatibilityScore: 88,
          idealLength: 'pixie',
          idealTexture: 'straight',
          recommendedParting: 'side-right',
          tags: ['chic', 'modern', 'softening'],
        },
        {
          name: 'Wispy Bangs with Layers',
          description:
            'Feathered bangs combined with layers that break up the straight lines of a square face.',
          compatibilityScore: 87,
          idealLength: 'medium',
          idealTexture: 'straight',
          recommendedParting: 'side-left',
          tags: ['softening', 'framing', 'classic'],
        },
        {
          name: 'Curly Lob',
          description:
            'Natural curls or textured waves in a lob that disguise sharp angles with soft movement.',
          compatibilityScore: 85,
          idealLength: 'bob',
          idealTexture: 'curly',
          recommendedParting: 'side-right',
          tags: ['textured', 'natural', 'flattering'],
        },
        {
          name: 'Long Soft Shag',
          description:
            'Long shaggy layers with curtain bangs that soften the face with cascading movement.',
          compatibilityScore: 83,
          idealLength: 'long',
          idealTexture: 'wavy',
          recommendedParting: 'center',
          tags: ['bohemian', 'soft', 'layered'],
        },
      ],
      avoidStyles: [
        'Blunt-cut bobs at jaw level',
        'Straight geometric cuts',
        'Side-shaved styles',
      ],
      avoidReasons: [
        'Blunt bobs at jaw level emphasize width and angularity',
        'Geometric cuts mirror and accentuate face angles',
        'Shaved sides expose and highlight the jaw width',
      ],
    },
    rectangular: {
      recommendations: [
        {
          name: 'Full Fringe',
          description:
            'A full fringe across the forehead that shortens the visual length of a rectangular face.',
          compatibilityScore: 95,
          idealLength: 'medium',
          idealTexture: 'straight',
          recommendedParting: 'none',
          tags: ['shortening', 'classic', 'flattering'],
        },
        {
          name: 'Voluminous Sides',
          description:
            'Medium cut with volume and width at the sides to balance the elongated face shape.',
          compatibilityScore: 90,
          idealLength: 'medium',
          idealTexture: 'wavy',
          recommendedParting: 'center',
          tags: ['balancing', 'volumizing', 'stylish'],
        },
        {
          name: 'Curly Short Cut',
          description:
            'Short curls that add lateral width to soften the elongated silhouette.',
          compatibilityScore: 87,
          idealLength: 'short',
          idealTexture: 'curly',
          recommendedParting: 'side-left',
          tags: ['natural', 'widening', 'textured'],
        },
        {
          name: 'Beachy Waves Lob',
          description:
            'Casual wavy lob that adds softness and reduces the appearance of face length.',
          compatibilityScore: 85,
          idealLength: 'bob',
          idealTexture: 'wavy',
          recommendedParting: 'center',
          tags: ['casual', 'effortless', 'balancing'],
        },
        {
          name: 'Layered Bob with Bangs',
          description:
            'Chin-length bob with layering and a fringe to create width and reduce length perception.',
          compatibilityScore: 82,
          idealLength: 'bob',
          idealTexture: 'straight',
          recommendedParting: 'none',
          tags: ['structured', 'balancing', 'classic'],
        },
      ],
      avoidStyles: [
        'Long straight styles',
        'Center partings with flat hair',
        'Very short styles with no volume',
      ],
      avoidReasons: [
        'Long straight styles elongate the face further',
        'Center partings draw the eye vertically, emphasizing length',
        'Flat styles add to the narrow appearance',
      ],
    },
    heart: {
      recommendations: [
        {
          name: 'Chin-Length Bob',
          description:
            'Bob cut at chin level that adds visual width to the lower face, balancing a wider forehead.',
          compatibilityScore: 95,
          idealLength: 'bob',
          idealTexture: 'straight',
          recommendedParting: 'center',
          tags: ['balancing', 'classic', 'elegant'],
        },
        {
          name: 'Side-Swept with Volume at Jaw',
          description:
            'Side-parted style with volume concentrated near the jaw to balance a heart-shaped face.',
          compatibilityScore: 92,
          idealLength: 'medium',
          idealTexture: 'wavy',
          recommendedParting: 'side-right',
          tags: ['balancing', 'feminine', 'chic'],
        },
        {
          name: 'Layered Pixie',
          description:
            'Short pixie with longer layers on top and soft sides that complement delicate features.',
          compatibilityScore: 88,
          idealLength: 'pixie',
          idealTexture: 'straight',
          recommendedParting: 'side-left',
          tags: ['delicate', 'modern', 'complementary'],
        },
        {
          name: 'Soft Curtain Bangs',
          description:
            'Curtain-style bangs that minimize forehead width while maintaining an airy, romantic feel.',
          compatibilityScore: 87,
          idealLength: 'long',
          idealTexture: 'wavy',
          recommendedParting: 'center',
          tags: ['minimizing', 'romantic', 'trendy'],
        },
        {
          name: 'Textured Lob',
          description:
            'Long bob with texture and movement that draws attention to the lower face.',
          compatibilityScore: 84,
          idealLength: 'bob',
          idealTexture: 'wavy',
          recommendedParting: 'side-left',
          tags: ['textured', 'modern', 'balancing'],
        },
      ],
      avoidStyles: [
        'Volume at temples/forehead',
        'Very short crops that expose the jawline',
        'Slicked-back styles',
      ],
      avoidReasons: [
        'Volume at top emphasizes the wider forehead',
        'Very short crops can make a pointed chin more prominent',
        'Slicked-back reveals forehead width without balance',
      ],
    },
    triangular: {
      recommendations: [
        {
          name: 'Volume at Crown',
          description:
            'Style with height and volume at the crown to balance a wider jaw with the forehead.',
          compatibilityScore: 95,
          idealLength: 'medium',
          idealTexture: 'curly',
          recommendedParting: 'center',
          tags: ['balancing', 'volumizing', 'dramatic'],
        },
        {
          name: 'Textured Undercut',
          description:
            'Tapered sides with a textured, voluminous top that creates balance for wider jaw lines.',
          compatibilityScore: 90,
          idealLength: 'short',
          idealTexture: 'straight',
          recommendedParting: 'side-right',
          tags: ['structured', 'modern', 'balancing'],
        },
        {
          name: 'Swept Quiff',
          description:
            'High quiff style that adds dramatic height, drawing the eye upward to balance jaw width.',
          compatibilityScore: 88,
          idealLength: 'short',
          idealTexture: 'straight',
          recommendedParting: 'side-left',
          tags: ['dramatic', 'bold', 'height-adding'],
        },
        {
          name: 'Layered Medium Cut',
          description:
            'Medium length with layers that start above the jawline to avoid adding width there.',
          compatibilityScore: 85,
          idealLength: 'medium',
          idealTexture: 'wavy',
          recommendedParting: 'center',
          tags: ['layered', 'elegant', 'balanced'],
        },
        {
          name: 'Afro or Big Natural Curls',
          description:
            'Full, rounded natural styles that create width at the top to counterbalance jaw width.',
          compatibilityScore: 82,
          idealLength: 'short',
          idealTexture: 'coily',
          recommendedParting: 'none',
          tags: ['natural', 'bold', 'balancing'],
        },
      ],
      avoidStyles: [
        'Jaw-length bobs',
        'Chin-length blunt cuts',
        'Styles with volume at jaw level',
      ],
      avoidReasons: [
        'Jaw-length cuts add visual width exactly at the widest point',
        'Blunt ends at chin emphasize jaw width',
        'Lateral volume at jaw makes the face appear even wider',
      ],
    },
  };

  getRecommendations(faceShape: FaceShape): HairstyleResult {
    const data = this.hairstyleData[faceShape];
    return {
      faceShape,
      topRecommendations: data.recommendations,
      avoidStyles: data.avoidStyles,
      avoidReasons: data.avoidReasons,
    };
  }
}
