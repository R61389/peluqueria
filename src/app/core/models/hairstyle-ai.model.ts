import { FaceShape } from './face-analysis.model';

// ─── Status ───────────────────────────────────────────────────────────────────

export type GenerationStatus =
  | 'idle' | 'analyzing' | 'uploading' | 'queued'
  | 'generating' | 'processing' | 'done' | 'error';

export type AiProviderName = 'mock' | 'replicate' | 'huggingface' | 'flux-kontext';

// ─── Request / Result ─────────────────────────────────────────────────────────

export interface HairstyleGenerationRequest {
  imageBase64: string;
  hairstyle: string;
  hairstyleLabel: string;
  promptKeywords: string;    // injected verbatim into the AI prompt
  faceShape: FaceShape;
  hairColor: string;
  hairColorName: string;
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

  // ── UNISEX ─────────────────────────────────────────────────────────────────
  {
    id: 'wolf-cut',
    label: 'Wolf Cut',
    labelEs: 'Wolf Cut',
    category: 'medium',
    gender: 'unisex',
    promptKeywords:
      'wolf cut hairstyle: middle-parted curtain bangs falling to cheekbone level, ' +
      'heavy shaggy layers starting at the chin, shorter choppy crown layers creating extreme volume and height, ' +
      'long wispy disconnected ends reaching mid-back, jagged razor-cut tips, ' +
      'mullet-inspired silhouette with short front and long back layers, 1970s rock shag aesthetic. ' +
      'NOT a regular layered cut. NOT a mullet. Specifically wolf cut with curtain bangs and crown volume.',
    compatibleFaceShapes: ['oval', 'square', 'round', 'heart'],
  },
  {
    id: 'long-layers',
    label: 'Long Layers',
    labelEs: 'Capas Largas',
    category: 'long',
    gender: 'unisex',
    promptKeywords:
      'long layered haircut: hair length reaching mid-back or longer, ' +
      'smooth feathered layers starting from the shoulders downward, ' +
      'face-framing front layers gently angled toward the chin, ' +
      'flowing natural movement with no blunt ends, ' +
      'subtle graduation between layers, healthy shiny straight-to-wavy texture. ' +
      'NOT a shag. NOT choppy. Clean elegant long layers with natural fall.',
    compatibleFaceShapes: ['oval', 'square', 'heart', 'triangular'],
  },
  {
    id: 'curtain-bangs',
    label: 'Curtain Bangs',
    labelEs: 'Flequillo Cortina',
    category: 'medium',
    gender: 'unisex',
    promptKeywords:
      'curtain bangs: fringe parted precisely down the center of the forehead, ' +
      'each side sweeping outward and downward past the eyebrows to cheekbone level, ' +
      'soft wispy feathered ends that blend into face-framing layers, ' +
      'medium-length hair at collarbone, gentle loose waves throughout body of hair, ' +
      'bangs must clearly split in the middle like an open curtain. ' +
      'NOT straight-across bangs. NOT side-swept bangs. Specifically center-parted curtain fringe.',
    compatibleFaceShapes: ['oval', 'square', 'round', 'heart'],
  },

  // ── MALE ──────────────────────────────────────────────────────────────────
  {
    id: 'fade',
    label: 'Fade',
    labelEs: 'Fade',
    category: 'short',
    gender: 'male',
    promptKeywords:
      'high skin fade haircut: sides and back shaved completely to skin starting just above the ears, ' +
      'gradual gradient fade blending from skin-bare skin at bottom to short 1-2cm hair at the temples and crown, ' +
      'top hair kept at 4-5cm with natural texture or light hold, ' +
      'sharp clean hairline at the nape, defined temple corners. ' +
      'The fade must be dramatic and clearly visible — zero hair at sides, normal hair on top. ' +
      'NOT a taper. NOT a low fade. High skin fade reaching above the temples.',
    compatibleFaceShapes: ['oval', 'round', 'square'],
  },
  {
    id: 'pompadour',
    label: 'Pompadour',
    labelEs: 'Pompadour',
    category: 'short',
    gender: 'male',
    promptKeywords:
      'classic pompadour haircut: all front hair swept and pushed dramatically backward and upward, ' +
      'creating a tall smooth rounded volume arch 6-8cm above the forehead, ' +
      'sides slicked flat against the head with a high fade or undercut below the recession line, ' +
      'top hair smooth and glossy with strong hold product sheen, ' +
      'clean defined side part if present, retro 1950s rockabilly silhouette. ' +
      'The pompadour peak must be clearly visible as a distinct tall forward sweep. ' +
      'NOT a quiff. NOT flat on top. Tall swept-back pompadour arch.',
    compatibleFaceShapes: ['oval', 'heart', 'triangular'],
  },
  {
    id: 'quiff',
    label: 'Quiff',
    labelEs: 'Quiff',
    category: 'short',
    gender: 'male',
    promptKeywords:
      'modern textured quiff: front hair swept upward and slightly forward forming a voluminous ' +
      'textured peak above the forehead, choppy separated strands visible at the top, ' +
      'skin fade or taper on sides from very short at the bottom blending to 3cm at the top, ' +
      'matte finish with separated textured look, modern British barbershop style. ' +
      'The quiff peak points slightly forward unlike a pompadour which sweeps back. ' +
      'NOT a pompadour. NOT slicked back. Forward-swept textured quiff peak.',
    compatibleFaceShapes: ['oval', 'square', 'rectangular', 'heart'],
  },
  {
    id: 'slick-back',
    label: 'Slick Back',
    labelEs: 'Pelo Hacia Atrás',
    category: 'short',
    gender: 'male',
    promptKeywords:
      'slick back undercut: all hair on top combed straight backward from forehead to crown with no volume, ' +
      'hair lies completely flat against the scalp pulled toward the back, ' +
      'high-shine wet-look gel or pomade finish creating visible glossy sheen, ' +
      'undercut sides very short or faded, sharp defined parting if any. ' +
      'Hair must visibly point straight backward with absolutely no forward movement or volume. ' +
      'NOT a pompadour. NOT a quiff. Completely flat straight-back slicked style.',
    compatibleFaceShapes: ['oval', 'rectangular', 'heart'],
  },
  {
    id: 'textured-crop',
    label: 'Textured Crop',
    labelEs: 'Corte Texturizado',
    category: 'short',
    gender: 'male',
    promptKeywords:
      'textured crop haircut: short 2-3cm top hair pushed slightly forward with a horizontal ' +
      'fringe line across the forehead, choppy point-cut disconnected texture throughout crown, ' +
      'high skin fade or skin-close sides and back, ' +
      'straight horizontal front fringe that falls naturally near the eyebrows, ' +
      'matte messy textured finish, modern European barbershop aesthetic. ' +
      'The defining feature is the forward-pushed textured top with horizontal fringe. ' +
      'NOT a quiff. NOT slicked. Short textured crop with forward fringe.',
    compatibleFaceShapes: ['oval', 'square', 'round'],
  },
  {
    id: 'buzz-cut',
    label: 'Buzz Cut',
    labelEs: 'Rapado',
    category: 'short',
    gender: 'male',
    promptKeywords:
      'buzz cut: hair clipped to a uniform 3-6mm length covering the entire head with no variation, ' +
      'same length on top, sides, and back — no fade, no taper, no variation, ' +
      'clean tight stubble texture visible across entire scalp, ' +
      'sharp defined hairline at forehead and nape, athletic military aesthetic. ' +
      'Completely uniform length everywhere with no fade or gradient. ' +
      'NOT a fade. NOT a taper. Pure uniform buzz cut same length all over.',
    compatibleFaceShapes: ['oval', 'square', 'rectangular'],
  },

  // ── FEMALE ────────────────────────────────────────────────────────────────
  {
    id: 'pixie',
    label: 'Pixie Cut',
    labelEs: 'Pixie',
    category: 'short',
    gender: 'female',
    promptKeywords:
      'pixie cut: very short feminine haircut with hair length 1-3cm on sides and back, ' +
      'slightly longer 4-6cm on top swept to one side or textured upward, ' +
      'tapered or faded nape and ears fully exposed, ' +
      'no length below the ears or nape, face fully framed by short cropped hair, ' +
      'elegant feminine short style. ' +
      'Hair must NOT reach the jaw or chin. Sides and back very short or tapered. Classic short pixie.',
    compatibleFaceShapes: ['oval', 'heart', 'square'],
  },
  {
    id: 'bob',
    label: 'Bob',
    labelEs: 'Bob Clásico',
    category: 'short',
    gender: 'female',
    promptKeywords:
      'classic chin-length bob: hair cut bluntly straight across at jaw level, ' +
      'perfectly even horizontal line all around the perimeter, ' +
      'hair falls smoothly to exactly chin length on both sides, ' +
      'sleek straight texture with slight inward curve at the ends, ' +
      'no layers, no graduation — one uniform blunt length all around, ' +
      'polished glossy finish. ' +
      'The blunt straight-across line at the chin is the defining feature. ' +
      'NOT layered. NOT wavy. Blunt one-length bob at chin.',
    compatibleFaceShapes: ['oval', 'square', 'rectangular'],
  },
  {
    id: 'lob',
    label: 'Lob',
    labelEs: 'Lob (Bob Largo)',
    category: 'medium',
    gender: 'female',
    promptKeywords:
      'long bob lob: hair length cut to collarbone level (2-5cm below the chin), ' +
      'slightly angled longer in front than back, ' +
      'subtle soft waves or straight texture, ' +
      'minimal layering, blunt or softly textured ends, ' +
      'face-framing front pieces slightly longer, modern chic. ' +
      'Length must clearly reach the collarbone, longer than a standard bob but shorter than shoulder. ' +
      'NOT a standard bob (too short). NOT long layers (too long). Specifically collarbone-length lob.',
    compatibleFaceShapes: ['oval', 'square', 'round', 'heart', 'rectangular'],
  },
  {
    id: 'beach-waves',
    label: 'Beach Waves',
    labelEs: 'Ondas Playeras',
    category: 'long',
    gender: 'female',
    promptKeywords:
      'beach waves: long hair past the shoulders with loose irregular S-shaped waves throughout, ' +
      'effortless undone texture as if air-dried after swimming, ' +
      'alternating wave direction creating tousled volume, ' +
      'soft piece-y texture with slightly separated strands, ' +
      'natural movement and body, sun-bleached lived-in appearance. ' +
      'Waves must be loose and irregular, not uniform curls, not straight. ' +
      'NOT tight curls. NOT smooth straight. Loose tousled S-wave beach texture.',
    compatibleFaceShapes: ['oval', 'square', 'rectangular', 'triangular'],
  },
  {
    id: 'bixie',
    label: 'Bixie',
    labelEs: 'Bixie',
    category: 'short',
    gender: 'female',
    promptKeywords:
      'bixie cut: length between a pixie and a bob, hair reaching just below the ear to mid-neck, ' +
      'heavily textured and choppy layers throughout creating movement and volume, ' +
      'side-swept or wispy fringe falling across the forehead, ' +
      'shorter nape with texture, edgy modern feminine. ' +
      'Length must be below the ear but above the shoulder — the specific bixie zone. ' +
      'NOT a full bob (too long). NOT a full pixie (too short). Mid-neck bixie length with texture.',
    compatibleFaceShapes: ['oval', 'heart', 'round'],
  },
  {
    id: 'shag',
    label: 'Shag',
    labelEs: 'Shag con Capas',
    category: 'medium',
    gender: 'female',
    promptKeywords:
      'shag haircut: medium length at collarbone with extreme multi-level layering throughout, ' +
      'heavy curtain bangs or fringe, short choppy layers at crown creating high volume, ' +
      'progressive longer layers descending to collarbone, ' +
      'razor-cut feathered ends on every layer, tousled rock-inspired volume, ' +
      '1970s Stevie Nicks inspired. ' +
      'Multiple clearly visible layers at different heights are the defining feature. ' +
      'NOT a wolf cut (different silhouette). Heavy multi-layer shag with extreme layering.',
    compatibleFaceShapes: ['oval', 'square', 'rectangular', 'heart'],
  },
  {
    id: 'ballerina-bun',
    label: 'Sleek Bun',
    labelEs: 'Moño Elegante',
    category: 'long',
    gender: 'female',
    promptKeywords:
      'sleek high ballerina bun: all hair pulled tightly straight back from the face, ' +
      'gathered and wrapped into a smooth round bun positioned at the crown of the head, ' +
      'zero flyaways or loose strands, perfectly smooth surface from forehead to bun, ' +
      'high-shine gel-sleek appearance, hairline completely exposed, ' +
      'elegant classical ballet aesthetic. ' +
      'The bun must sit high at the crown, not low at the nape. ' +
      'NOT a low bun. NOT messy bun. High tight polished ballerina bun at crown.',
    compatibleFaceShapes: ['oval', 'heart', 'square', 'round'],
  },
  {
    id: 'blunt-bob',
    label: 'Blunt Bob',
    labelEs: 'Bob Recto',
    category: 'short',
    gender: 'female',
    promptKeywords:
      'blunt bob: hair cut at jaw level with razor-sharp perfectly straight horizontal line all around, ' +
      'heavier and thicker than a standard bob, full dense ends with zero thinning, ' +
      'sleek glossy straight texture, no waves no texture no layers, ' +
      'geometric precision cut, strong architectural line at the jaw. ' +
      'The defining feature is the exceptionally heavy blunt straight line — maximum thickness at ends. ' +
      'NOT angled. NOT layered. NOT wavy. Heavy precision blunt-cut straight bob.',
    compatibleFaceShapes: ['oval', 'rectangular', 'heart'],
  },
  {
    id: 'half-up-waves',
    label: 'Half Up Waves',
    labelEs: 'Semi Recogido Ondas',
    category: 'long',
    gender: 'female',
    promptKeywords:
      'half-up half-down hairstyle: the top crown section of hair is gathered and pinned or tied at the back of the head, ' +
      'while the remaining lower half falls loose past the shoulders in soft romantic waves, ' +
      'small face-framing pieces left loose on each side, ' +
      'elegant feminine styling, remaining loose hair has loose S-waves. ' +
      'Top half must be clearly pinned back, bottom half clearly loose and wavy. ' +
      'NOT a full updo. NOT fully down. Specifically half-up construction with loose waves below.',
    compatibleFaceShapes: ['oval', 'heart', 'round', 'square'],
  },
  {
    id: 'french-girl-bob',
    label: 'French Girl Bob',
    labelEs: 'Bob Francés',
    category: 'short',
    gender: 'female',
    promptKeywords:
      'French girl bob: chin-length bob with effortlessly undone soft wavy texture, ' +
      'ends slightly bent outward or inward in alternating directions, ' +
      'natural parting slightly off-center, loose piece-y texture with visible strand separation, ' +
      'no product look — air-dried natural finish, Parisian chic casual elegance. ' +
      'The texture is intentionally slightly messy unlike a sleek bob. ' +
      'NOT a sleek bob. NOT heavily styled. Undone wavy natural French bob.',
    compatibleFaceShapes: ['oval', 'round', 'heart'],
  },
  {
    id: 'mermaid-waves',
    label: 'Mermaid Waves',
    labelEs: 'Ondas Sirena',
    category: 'long',
    gender: 'female',
    promptKeywords:
      'mermaid waves: very long hair reaching mid-chest or waist level with defined deep S-shaped waves throughout, ' +
      'each wave clearly pronounced with alternating crest and trough, ' +
      'smooth glossy surface on each wave crest, cascading flowing movement, ' +
      'hair parted in the middle, very high shine and volume. ' +
      'Waves must be deep and well-defined, not loose beach waves. ' +
      'NOT beach waves (too loose). NOT straight. Deep pronounced glossy S-wave mermaid hair.',
    compatibleFaceShapes: ['oval', 'square', 'rectangular'],
  },
  {
    id: 'curly-natural',
    label: 'Natural Curls',
    labelEs: 'Rulos Naturales',
    category: 'medium',
    gender: 'female',
    promptKeywords:
      'natural curly hair: medium-length hair with defined springy coil or ringlet curls, ' +
      'curl pattern 3B to 3C (tight S-coils with finger-width diameter), ' +
      'voluminous rounded shape, each curl clearly defined and separated, ' +
      'frizz-free hydrated shine on each curl, ' +
      'hair shrinks to collarbone but would reach shoulders when stretched. ' +
      'Curls must be tightly coiled ringlets, not loose waves. ' +
      'NOT loose waves. NOT straight. Defined tight natural curly coils with volume.',
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
