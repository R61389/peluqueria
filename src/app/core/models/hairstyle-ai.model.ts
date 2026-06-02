import { FaceShape } from './face-analysis.model';

// ─── Status ───────────────────────────────────────────────────────────────────

export type GenerationStatus =
  | 'idle' | 'analyzing' | 'uploading' | 'queued'
  | 'generating' | 'processing' | 'done' | 'error';

export type AiProviderName = 'mock' | 'replicate' | 'huggingface' | 'flux-kontext';

// ─── Request / Result ─────────────────────────────────────────────────────────

export interface HairstyleGenerationRequest {
  imageBase64: string;       // data:image/jpeg;base64,…
  hairstyle: string;         // e.g. 'wolf-cut'
  hairstyleLabel: string;    // e.g. 'Wolf Cut'
  faceShape: FaceShape;
  hairColor: string;         // hex e.g. '#3d2b1f'
  hairColorName: string;     // e.g. 'Dark Brown'
}

export interface HairstyleGenerationResult {
  generatedImage: string;    // data URL
  prompt: string;
  negativePrompt: string;
  provider: string;
  durationMs: number;
}

export interface GenerationProgress {
  status: GenerationStatus;
  percent: number;           // 0–100
  message: string;
  estimatedSecondsLeft?: number;
}

// ─── Style catalog ────────────────────────────────────────────────────────────

export interface HairstyleStyleDef {
  id: string;
  label: string;
  labelEs: string;
  category: 'short' | 'medium' | 'long';
  gender: 'male' | 'female' | 'unisex';
  /** Keywords injected verbatim into the AI prompt */
  promptKeywords: string;
  compatibleFaceShapes: FaceShape[];
}

/** Master catalog used by the AI try-on system */
export const AI_HAIRSTYLE_STYLES: HairstyleStyleDef[] = [
  {
    id: 'wolf-cut',
    label: 'Wolf Cut',
    labelEs: 'Wolf Cut',
    category: 'medium',
    gender: 'unisex',
    promptKeywords: 'wolf cut with curtain bangs, shaggy layers, high volume, 70s rock inspired',
    compatibleFaceShapes: ['oval', 'square', 'round', 'heart'],
  },
  {
    id: 'pixie',
    label: 'Pixie Cut',
    labelEs: 'Pixie',
    category: 'short',
    gender: 'female',
    promptKeywords: 'short pixie cut, cropped sides and back, slightly longer on top, feminine modern style',
    compatibleFaceShapes: ['oval', 'heart', 'square'],
  },
  {
    id: 'bob',
    label: 'Bob',
    labelEs: 'Bob',
    category: 'short',
    gender: 'female',
    promptKeywords: 'sleek chin-length bob, blunt straight ends, smooth polished finish',
    compatibleFaceShapes: ['oval', 'square', 'rectangular'],
  },
  {
    id: 'long-layers',
    label: 'Long Layers',
    labelEs: 'Capas Largas',
    category: 'long',
    gender: 'unisex',
    promptKeywords: 'long layered hair past shoulders, feathered layers, natural movement and flow',
    compatibleFaceShapes: ['oval', 'square', 'heart', 'triangular'],
  },
  {
    id: 'curtain-bangs',
    label: 'Curtain Bangs',
    labelEs: 'Flequillo Cortina',
    category: 'medium',
    gender: 'unisex',
    promptKeywords: 'curtain bangs parted in the middle, soft wispy fringe, medium length with face-framing layers',
    compatibleFaceShapes: ['oval', 'square', 'round', 'heart'],
  },
  {
    id: 'fade',
    label: 'Fade',
    labelEs: 'Fade',
    category: 'short',
    gender: 'male',
    promptKeywords: 'high skin fade on sides, clean taper, textured top with short length',
    compatibleFaceShapes: ['oval', 'round', 'square'],
  },
  {
    id: 'pompadour',
    label: 'Pompadour',
    labelEs: 'Pompadour',
    category: 'short',
    gender: 'male',
    promptKeywords: 'classic pompadour with high swept-back front volume, tapered faded sides, retro elegant',
    compatibleFaceShapes: ['oval', 'heart', 'triangular'],
  },
  {
    id: 'quiff',
    label: 'Quiff',
    labelEs: 'Quiff',
    category: 'short',
    gender: 'male',
    promptKeywords: 'modern textured quiff, swept-up front, short sides with taper fade',
    compatibleFaceShapes: ['oval', 'square', 'rectangular', 'heart'],
  },
  {
    id: 'slick-back',
    label: 'Slick Back',
    labelEs: 'Pelo Hacia Atrás',
    category: 'short',
    gender: 'male',
    promptKeywords: 'slicked-back hair, all combed straight back, high gloss finish, classic sophistication',
    compatibleFaceShapes: ['oval', 'rectangular', 'heart'],
  },
  {
    id: 'textured-crop',
    label: 'Textured Crop',
    labelEs: 'Corte Texturizado',
    category: 'short',
    gender: 'male',
    promptKeywords: 'textured crop with skin fade sides, choppy textured top, straight fringe, modern European',
    compatibleFaceShapes: ['oval', 'square', 'round'],
  },
  {
    id: 'buzz-cut',
    label: 'Buzz Cut',
    labelEs: 'Rapado',
    category: 'short',
    gender: 'male',
    promptKeywords: 'buzz cut, uniformly very short stubble all over, clean athletic look',
    compatibleFaceShapes: ['oval', 'square', 'rectangular'],
  },
  // ── Female styles ──────────────────────────────────────────────────────────
  {
    id: 'lob',
    label: 'Lob',
    labelEs: 'Lob (Bob Largo)',
    category: 'medium',
    gender: 'female',
    promptKeywords: 'long bob lob, collarbone length, slightly angled ends, soft natural waves, modern chic',
    compatibleFaceShapes: ['oval', 'square', 'round', 'heart', 'rectangular'],
  },
  {
    id: 'beach-waves',
    label: 'Beach Waves',
    labelEs: 'Ondas Playeras',
    category: 'long',
    gender: 'female',
    promptKeywords: 'long beachy waves, effortless tousled texture, loose natural waves, sun-kissed volume',
    compatibleFaceShapes: ['oval', 'square', 'rectangular', 'triangular'],
  },
  {
    id: 'bixie',
    label: 'Bixie',
    labelEs: 'Bixie',
    category: 'short',
    gender: 'female',
    promptKeywords: 'bixie cut between bob and pixie, textured layers, side-swept fringe, modern feminine',
    compatibleFaceShapes: ['oval', 'heart', 'round'],
  },
  {
    id: 'shag',
    label: 'Shag',
    labelEs: 'Shag con Capas',
    category: 'medium',
    gender: 'female',
    promptKeywords: 'shag haircut with choppy layers, curtain bangs, face-framing layers, retro 70s inspired volume',
    compatibleFaceShapes: ['oval', 'square', 'rectangular', 'heart'],
  },
  {
    id: 'ballerina-bun',
    label: 'Sleek Bun',
    labelEs: 'Moño Elegante',
    category: 'long',
    gender: 'female',
    promptKeywords: 'sleek polished bun on top of head, smooth pulled-back style, elegant ballerina aesthetic',
    compatibleFaceShapes: ['oval', 'heart', 'square', 'round'],
  },
  {
    id: 'blunt-bob',
    label: 'Blunt Bob',
    labelEs: 'Bob Recto',
    category: 'short',
    gender: 'female',
    promptKeywords: 'blunt cut bob jaw length, perfectly straight sharp ends, sleek glossy finish, geometric precision',
    compatibleFaceShapes: ['oval', 'rectangular', 'heart'],
  },
  {
    id: 'half-up-waves',
    label: 'Half Up Waves',
    labelEs: 'Semi Recogido Ondas',
    category: 'long',
    gender: 'female',
    promptKeywords: 'half-up half-down style with romantic loose waves, top section pulled back softly, feminine and elegant',
    compatibleFaceShapes: ['oval', 'heart', 'round', 'square'],
  },
  {
    id: 'french-girl-bob',
    label: 'French Girl Bob',
    labelEs: 'Bob Francés',
    category: 'short',
    gender: 'female',
    promptKeywords: 'french girl bob with soft wavy texture, slightly undone ends, effortless Parisian chic',
    compatibleFaceShapes: ['oval', 'round', 'heart'],
  },
  {
    id: 'mermaid-waves',
    label: 'Mermaid Waves',
    labelEs: 'Ondas Sirena',
    category: 'long',
    gender: 'female',
    promptKeywords: 'long mermaid waves past chest, deep S-shaped wave pattern, glossy flowing movement',
    compatibleFaceShapes: ['oval', 'square', 'rectangular'],
  },
  {
    id: 'curly-natural',
    label: 'Natural Curls',
    labelEs: 'Rulos Naturales',
    category: 'medium',
    gender: 'female',
    promptKeywords: 'natural curly hair, defined bouncy ringlets, voluminous curly afro-inspired or 3C curl pattern',
    compatibleFaceShapes: ['oval', 'rectangular', 'triangular', 'heart'],
  },
];

// ─── Provider strategy interface ─────────────────────────────────────────────

export interface ImageGenerationProvider {
  readonly providerName: AiProviderName;
  generate(
    request: HairstyleGenerationRequest,
    onProgress: (p: GenerationProgress) => void,
  ): Promise<HairstyleGenerationResult>;
}

export interface ProviderConfig {
  apiKey: string;
  model?: string;
  endpoint?: string;
}
