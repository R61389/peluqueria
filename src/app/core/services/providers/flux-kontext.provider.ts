import { Injectable } from '@angular/core';
import {
  ImageGenerationProvider,
  HairstyleGenerationRequest,
  HairstyleGenerationResult,
  GenerationProgress,
} from '../../models/hairstyle-ai.model';

@Injectable()
export class FluxKontextProvider implements ImageGenerationProvider {
  readonly providerName = 'flux-kontext' as const;

  private readonly MODEL    = 'black-forest-labs/flux-kontext-pro';
  private readonly API_BASE = 'https://api.replicate.com/v1';

  async generate(
    request: HairstyleGenerationRequest,
    onProgress: (p: GenerationProgress) => void,
  ): Promise<HairstyleGenerationResult> {
    console.log('[STEP 5] FluxKontextProvider.generate() ejecutado');
    const apiKey = localStorage.getItem('replicate_api_key') ?? '';
    console.log('[STEP 6] API key presente:', !!apiKey, '| longitud:', apiKey.length);
    if (!apiKey) {
      throw new Error(
        'No hay clave de Replicate. ' +
        'Ejecuta en la consola: localStorage.setItem("replicate_api_key", "r8_...")',
      );
    }

    const t0     = Date.now();
    const prompt = this.buildPrompt(request);
    console.log('[STEP 7] Prompt construido:', prompt.slice(0, 80) + '…');

    // ── 1. Resize image to 768 px max (avoid payload-too-large errors) ───────
    onProgress({ status: 'uploading', percent: 8, message: 'Preparando imagen…', estimatedSecondsLeft: 30 });
    const image = await this.resizeToJpeg(request.imageBase64, 768);

    // ── 2. Create prediction ─────────────────────────────────────────────────
    onProgress({ status: 'uploading', percent: 18, message: 'Enviando a Replicate…', estimatedSecondsLeft: 25 });
    console.log('[STEP 8] Llamando createPrediction…');
    const predictionId = await this.createPrediction(apiKey, image, prompt);
    console.log('[STEP 9] Prediction creada. ID:', predictionId);

    onProgress({ status: 'queued', percent: 25, message: 'En cola de generación…', estimatedSecondsLeft: 22 });

    // ── 3. Poll until done ───────────────────────────────────────────────────
    const outputUrl = await this.poll(apiKey, predictionId, onProgress);
    console.log('[FLUX Kontext] output url:', outputUrl);

    // ── 4. Return the output URL directly — no CORS fetch needed ────────────
    onProgress({ status: 'done', percent: 100, message: '¡Imagen generada!' });

    return {
      generatedImage: outputUrl,   // URL de Replicate CDN, funciona como src de <img>
      prompt,
      negativePrompt: '',
      provider: 'FLUX Kontext Pro · Replicate',
      durationMs: Date.now() - t0,
    };
  }

  // ─── Create prediction ─────────────────────────────────────────────────────

  private async createPrediction(
    apiKey: string,
    imageBase64: string,
    prompt: string,
  ): Promise<string> {
    const res = await fetch(`${this.API_BASE}/models/${this.MODEL}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
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
      const detail = (err as { detail?: string }).detail ?? JSON.stringify(err);
      throw new Error(`Replicate ${res.status}: ${detail}`);
    }

    const data = await res.json() as { id: string; status: string };
    return data.id;
  }

  // ─── Poll until succeeded / failed ────────────────────────────────────────

  private async poll(
    apiKey: string,
    id: string,
    onProgress: (p: GenerationProgress) => void,
  ): Promise<string> {
    for (let i = 0; i < 90; i++) {
      await this.delay(2000);

      const res = await fetch(`${this.API_BASE}/predictions/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(`Poll error ${res.status}`);

      const data = await res.json() as {
        status: string;
        output?: string | string[];
        error?: string;
      };

      console.log(`[FLUX Kontext] poll ${i + 1} → ${data.status}`);

      if (data.status === 'succeeded') {
        const out = data.output;
        const url = Array.isArray(out) ? out[0] : out;
        if (!url) throw new Error('Respuesta vacía de FLUX Kontext');
        return url;
      }

      if (data.status === 'failed')   throw new Error(`FLUX falló: ${data.error ?? 'error desconocido'}`);
      if (data.status === 'canceled') throw new Error('Predicción cancelada');

      const elapsed  = (i + 1) * 2;
      const percent  = Math.min(90, 26 + (i / 90) * 64);
      onProgress({
        status: 'generating',
        percent,
        message: `Generando con FLUX Kontext… (${elapsed}s)`,
        estimatedSecondsLeft: Math.max(1, (90 - i) * 2),
      });
    }

    throw new Error('Tiempo agotado después de 3 minutos');
  }

  // ─── Resize image before sending ──────────────────────────────────────────

  private resizeToJpeg(dataUrl: string, maxPx: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale  = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.naturalWidth  * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  // ─── Prompt ───────────────────────────────────────────────────────────────

  private buildPrompt(req: HairstyleGenerationRequest): string {
    return [
      `Change the hairstyle to ${req.hairstyleLabel}.`,
      `Hair color: ${req.hairColorName}.`,
      'Keep all facial features exactly the same: eyes, nose, mouth, skin tone, face shape, jawline.',
      'Keep background, clothing, and pose identical.',
      'Only modify the hair: cut, length, volume, texture, and color.',
      'Photorealistic, professional salon photography quality.',
    ].join(' ');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
