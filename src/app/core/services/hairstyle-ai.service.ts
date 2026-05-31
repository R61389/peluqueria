import { Injectable, inject, signal, computed } from '@angular/core';
import {
  HairstyleGenerationRequest,
  HairstyleGenerationResult,
  GenerationProgress,
  AI_HAIRSTYLE_STYLES,
  HairstyleStyleDef,
} from '../models/hairstyle-ai.model';
import { IMAGE_GENERATION_PROVIDER } from './providers/image-generation.token';

/**
 * HairstyleAiService
 *
 * Orchestrates the AI hairstyle generation pipeline:
 *  1. Accepts a photo (base64) + selected style + face metadata.
 *  2. Builds a photorealistic, identity-preserving prompt.
 *  3. Delegates to the injected ImageGenerationProvider (Strategy pattern).
 *  4. Exposes reactive progress and result via Angular Signals.
 *
 * Swap providers in app.config.ts — this service never changes.
 */
@Injectable({ providedIn: 'root' })
export class HairstyleAiService {

  private readonly provider = inject(IMAGE_GENERATION_PROVIDER);

  // ── Reactive state ──────────────────────────────────────────────────────────
  readonly progress = signal<GenerationProgress>({ status: 'idle', percent: 0, message: '' });
  readonly result   = signal<HairstyleGenerationResult | null>(null);
  readonly isActive = computed(() => {
    const s = this.progress().status;
    return s !== 'idle' && s !== 'done' && s !== 'error';
  });

  private abortFlag = false;

  // ── Public API ──────────────────────────────────────────────────────────────

  get providerName(): string {
    return this.provider.providerName;
  }

  get catalog(): HairstyleStyleDef[] {
    return AI_HAIRSTYLE_STYLES;
  }

  /**
   * Generates a hairstyle image and updates `progress` and `result` reactively.
   * Returns the final result for one-shot consumption.
   */
  async generate(request: HairstyleGenerationRequest): Promise<HairstyleGenerationResult> {
    this.abortFlag = false;
    this.result.set(null);
    this.progress.set({ status: 'analyzing', percent: 5, message: 'Iniciando…' });

    try {
      const enrichedRequest = this.enrichRequest(request);

      const result = await this.provider.generate(enrichedRequest, (p) => {
        if (!this.abortFlag) this.progress.set(p);
      });

      if (!this.abortFlag) {
        this.result.set(result);
        this.progress.set({ status: 'done', percent: 100, message: '¡Peinado generado!' });
      }

      return result;

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      this.progress.set({ status: 'error', percent: 0, message });
      throw err;
    }
  }

  /** Cancel an in-progress generation (best-effort; doesn't abort HTTP). */
  cancel(): void {
    this.abortFlag = true;
    this.progress.set({ status: 'idle', percent: 0, message: '' });
    this.result.set(null);
  }

  /** Reset to initial state. */
  reset(): void {
    this.abortFlag = false;
    this.progress.set({ status: 'idle', percent: 0, message: '' });
    this.result.set(null);
  }

  /**
   * Build the standardised prompt for a request (exposed so the UI can
   * show the user exactly what was sent to the AI).
   */
  buildPrompt(request: HairstyleGenerationRequest): { prompt: string; negativePrompt: string } {
    const style = AI_HAIRSTYLE_STYLES.find(s => s.id === request.hairstyle);
    const keywords = style?.promptKeywords ?? request.hairstyleLabel;

    const prompt = [
      'Portrait photograph of a real person.',
      'Replace ONLY the hairstyle — keep all other features identical.',
      `New hairstyle: ${keywords}.`,
      `Hair color: ${request.hairColorName} (${request.hairColor}).`,
      `Face shape: ${request.faceShape}.`,
      'Preserve facial identity: eyes, nose, mouth, chin, jawline, skin tone, skin texture, facial proportions.',
      'Professional salon/barbershop photography quality.',
      'Natural studio lighting. Photorealistic. Ultra detailed. 8K resolution.',
      'Same background, same clothing, same body pose, same expression.',
      'No changes to face structure, skin, makeup, or body.',
    ].join(' ');

    const negativePrompt = [
      'different person, changed facial features, altered eyes, modified nose, different skin tone',
      'face change, plastic surgery effect, age change, gender change',
      'cartoon, illustration, painting, drawing, sketch, anime, 3D render, CGI',
      'deformed, distorted, mutated, extra limbs, bad anatomy',
      'blurry, low quality, pixelated, overexposed, watermark, text',
    ].join(', ');

    return { prompt, negativePrompt };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /** Injects prompt keywords from the catalog into the request. */
  private enrichRequest(req: HairstyleGenerationRequest): HairstyleGenerationRequest {
    return { ...req };
  }
}
