import { Injectable } from '@angular/core';
import {
  ImageGenerationProvider,
  HairstyleGenerationRequest,
  HairstyleGenerationResult,
  GenerationProgress,
} from '../../models/hairstyle-ai.model';

/**
 * FluxKontextProvider — uses FLUX Kontext via Replicate.
 *
 * FLUX Kontext is purpose-built for semantic image editing (modifying a
 * specific region while preserving the rest), making it the ideal model
 * for hairstyle try-on.
 *
 * Model on Replicate: black-forest-labs/flux-kontext-pro
 * Docs: https://replicate.com/black-forest-labs/flux-kontext-pro
 *
 * Configure API key:
 *   localStorage.setItem('replicate_api_key', 'r8_...');
 */
@Injectable()
export class FluxKontextProvider implements ImageGenerationProvider {
  readonly providerName = 'flux-kontext' as const;

  private readonly MODEL = 'black-forest-labs/flux-kontext-pro';
  private readonly API_BASE = 'https://api.replicate.com/v1';

  async generate(
    request: HairstyleGenerationRequest,
    onProgress: (p: GenerationProgress) => void,
  ): Promise<HairstyleGenerationResult> {
    const apiKey = localStorage.getItem('replicate_api_key') ?? '';
    if (!apiKey) {
      throw new Error(
        'Replicate API key required for FLUX Kontext. ' +
        'Set it via: localStorage.setItem("replicate_api_key", "r8_...")',
      );
    }

    const t0 = Date.now();
    const prompt = this.buildKontextPrompt(request);

    onProgress({ status: 'uploading',  percent: 8,  message: 'Preparando imagen…',         estimatedSecondsLeft: 25 });

    const prediction = await this.createPrediction(apiKey, request.imageBase64, prompt);

    onProgress({ status: 'queued',    percent: 18, message: 'En cola FLUX Kontext…',       estimatedSecondsLeft: 22 });

    const outputUrl = await this.pollUntilDone(apiKey, prediction.id, onProgress);

    onProgress({ status: 'processing', percent: 94, message: 'Descargando resultado…',   estimatedSecondsLeft: 2 });
    const generatedImage = await this.fetchAsDataUrl(outputUrl);

    onProgress({ status: 'done', percent: 100, message: '¡Imagen generada!' });

    return {
      generatedImage,
      prompt,
      negativePrompt: '',   // FLUX Kontext uses instruction-based editing, no negative prompt
      provider: `FLUX Kontext Pro (Replicate)`,
      durationMs: Date.now() - t0,
    };
  }

  // ─── API ──────────────────────────────────────────────────────────────────

  private async createPrediction(
    apiKey: string,
    imageBase64: string,
    prompt: string,
  ): Promise<{ id: string }> {
    const res = await fetch(`${this.API_BASE}/models/${this.MODEL}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: {
          input_image: imageBase64,
          prompt,
          output_format: 'jpg',
          safety_tolerance: 2,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`FLUX Kontext error ${res.status}: ${JSON.stringify(err)}`);
    }
    return res.json();
  }

  private async pollUntilDone(
    apiKey: string,
    id: string,
    onProgress: (p: GenerationProgress) => void,
  ): Promise<string> {
    for (let i = 0; i < 60; i++) {
      await this.delay(2000);
      const res = await fetch(`${this.API_BASE}/predictions/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(`Poll error: ${res.status}`);
      const data = await res.json();

      if (data.status === 'succeeded') {
        const out = Array.isArray(data.output) ? data.output[0] : data.output;
        return typeof out === 'string' ? out : out?.url ?? out;
      }
      if (data.status === 'failed')   throw new Error(`FLUX failed: ${data.error}`);
      if (data.status === 'canceled') throw new Error('Prediction canceled');

      const percent = Math.min(92, 20 + (i / 60) * 70);
      onProgress({
        status: 'generating',
        percent,
        message: `FLUX generando… (${i + 1}/60)`,
        estimatedSecondsLeft: Math.max(1, (60 - i) * 2),
      });
    }
    throw new Error('FLUX Kontext timed out');
  }

  private async fetchAsDataUrl(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ─── FLUX-specific prompt ────────────────────────────────────────────────

  private buildKontextPrompt(req: HairstyleGenerationRequest): string {
    return [
      `Change the hairstyle to ${req.hairstyleLabel}.`,
      `Make the hair color ${req.hairColorName}.`,
      'Keep all facial features exactly the same: eyes, nose, mouth, skin tone, face shape.',
      'Keep the background, clothing, and pose identical.',
      'Only modify the hair: cut, length, volume, texture, and color.',
      'Photorealistic, professional salon result.',
    ].join(' ');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
