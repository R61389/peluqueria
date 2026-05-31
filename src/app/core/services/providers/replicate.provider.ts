import { Injectable } from '@angular/core';
import {
  ImageGenerationProvider,
  HairstyleGenerationRequest,
  HairstyleGenerationResult,
  GenerationProgress,
} from '../../models/hairstyle-ai.model';

const API_BASE = 'https://api.replicate.com/v1';

/**
 * ReplicateProvider — uses Replicate's REST API.
 *
 * Default model: stability-ai/sdxl (img2img)
 * For best results use: black-forest-labs/flux-fill-dev (inpainting)
 *
 * Configure API key:
 *   localStorage.setItem('replicate_api_key', 'r8_...');
 *
 * To use a different model, set:
 *   localStorage.setItem('replicate_model_version', '<version_hash>');
 */
@Injectable()
export class ReplicateProvider implements ImageGenerationProvider {
  readonly providerName = 'replicate' as const;

  // SDXL img2img version — swap for flux-fill-dev for inpainting
  private readonly DEFAULT_VERSION =
    '7762fd07cf82c948538e41f63f77d685e02b063e37ec1054e8e440236177427';

  async generate(
    request: HairstyleGenerationRequest,
    onProgress: (p: GenerationProgress) => void,
  ): Promise<HairstyleGenerationResult> {
    const apiKey = this.resolveApiKey();
    if (!apiKey) {
      throw new Error(
        'Replicate API key not configured. ' +
        'Set it via: localStorage.setItem("replicate_api_key", "r8_...")',
      );
    }

    const t0 = Date.now();
    const { prompt, negativePrompt } = this.buildPrompt(request);
    const version = localStorage.getItem('replicate_model_version') ?? this.DEFAULT_VERSION;

    onProgress({ status: 'uploading', percent: 8, message: 'Enviando imagen al servidor…', estimatedSecondsLeft: 40 });

    // 1. Create prediction
    const prediction = await this.createPrediction(apiKey, version, {
      image: request.imageBase64,
      prompt,
      negative_prompt: negativePrompt,
      prompt_strength: 0.65,
      num_outputs: 1,
      num_inference_steps: 30,
      guidance_scale: 7.5,
    });

    onProgress({ status: 'queued', percent: 15, message: 'En cola de generación…', estimatedSecondsLeft: 35 });

    // 2. Poll until done
    const output = await this.pollPrediction(apiKey, prediction.id, onProgress);

    // 3. Fetch output as base64
    onProgress({ status: 'processing', percent: 94, message: 'Descargando resultado…', estimatedSecondsLeft: 2 });
    const generatedImage = await this.urlToBase64(output[0]);

    onProgress({ status: 'done', percent: 100, message: '¡Listo!' });

    return {
      generatedImage,
      prompt,
      negativePrompt,
      provider: `Replicate / SDXL (${version.slice(0, 8)}…)`,
      durationMs: Date.now() - t0,
    };
  }

  // ─── API calls ─────────────────────────────────────────────────────────────

  private async createPrediction(
    apiKey: string,
    version: string,
    input: Record<string, unknown>,
  ): Promise<{ id: string }> {
    const res = await fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version, input }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Replicate error ${res.status}: ${JSON.stringify(err)}`);
    }
    return res.json();
  }

  private async pollPrediction(
    apiKey: string,
    id: string,
    onProgress: (p: GenerationProgress) => void,
  ): Promise<string[]> {
    const maxAttempts = 90;  // 90 × 2s = 3 min timeout
    let attempt = 0;

    while (attempt < maxAttempts) {
      await this.delay(2000);
      attempt++;

      const res = await fetch(`${API_BASE}/predictions/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(`Poll error: ${res.status}`);
      const data = await res.json();

      const percent = Math.min(90, 15 + (attempt / maxAttempts) * 75);
      const secsLeft = Math.max(1, Math.round((maxAttempts - attempt) * 1.5));

      if (data.status === 'succeeded') return data.output as string[];
      if (data.status === 'failed')   throw new Error(`Replicate prediction failed: ${data.error}`);
      if (data.status === 'canceled') throw new Error('Prediction was canceled');

      onProgress({
        status: 'generating',
        percent,
        message: `Generando… (${attempt}/${maxAttempts})`,
        estimatedSecondsLeft: secsLeft,
      });
    }
    throw new Error('Prediction timed out after 3 minutes');
  }

  private async urlToBase64(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ─── Prompt construction ──────────────────────────────────────────────────

  private buildPrompt(req: HairstyleGenerationRequest): { prompt: string; negativePrompt: string } {
    const prompt = [
      'Portrait photo of a person.',
      'Replace ONLY the hairstyle, keep everything else exactly the same.',
      `Apply: ${req.hairstyleLabel} hairstyle.`,
      `Hair color: ${req.hairColorName}.`,
      'Preserve without any changes: face, eyes, nose, mouth, chin, jawline, skin tone, facial proportions.',
      'Professional salon photography. Natural studio lighting.',
      'Photorealistic, ultra detailed, 8K resolution.',
      'Same background, same clothing, same expression.',
    ].join(' ');

    const negativePrompt = [
      'changed face, different person, altered facial features, modified skin tone',
      'cartoon, illustration, painting, sketch, anime, cgi',
      'deformed, distorted, ugly, bad anatomy, unrealistic',
      'blurry, low quality, pixelated, overexposed',
    ].join(', ');

    return { prompt, negativePrompt };
  }

  private resolveApiKey(): string {
    return (
      localStorage.getItem('replicate_api_key') ?? ''
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
