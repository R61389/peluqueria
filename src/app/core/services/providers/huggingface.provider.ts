import { Injectable } from '@angular/core';
import {
  ImageGenerationProvider,
  HairstyleGenerationRequest,
  HairstyleGenerationResult,
  GenerationProgress,
} from '../../models/hairstyle-ai.model';

/**
 * HuggingFaceProvider — uses the HuggingFace Inference API.
 *
 * Default model: stabilityai/stable-diffusion-xl-base-1.0 (text-guided img2img)
 *
 * Configure API key:
 *   localStorage.setItem('hf_api_key', 'hf_...');
 *
 * Optional — override model:
 *   localStorage.setItem('hf_model_id', 'your-org/your-model');
 *
 * Note: HF Inference API has cold-start times (first request can take 20–60s).
 */
@Injectable()
export class HuggingFaceProvider implements ImageGenerationProvider {
  readonly providerName = 'huggingface' as const;

  private readonly DEFAULT_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';
  private readonly HF_API = 'https://api-inference.huggingface.co/models';

  async generate(
    request: HairstyleGenerationRequest,
    onProgress: (p: GenerationProgress) => void,
  ): Promise<HairstyleGenerationResult> {
    const apiKey = localStorage.getItem('hf_api_key') ?? '';
    if (!apiKey) {
      throw new Error(
        'HuggingFace API key not configured. ' +
        'Set it via: localStorage.setItem("hf_api_key", "hf_...")',
      );
    }

    const t0 = Date.now();
    const modelId = localStorage.getItem('hf_model_id') ?? this.DEFAULT_MODEL;
    const { prompt, negativePrompt } = this.buildPrompt(request);

    onProgress({ status: 'uploading',   percent: 10, message: 'Enviando solicitud…',    estimatedSecondsLeft: 30 });

    const imageBlob = await this.callInferenceApi(apiKey, modelId, request.imageBase64, prompt, negativePrompt, onProgress);

    onProgress({ status: 'processing', percent: 92, message: 'Procesando respuesta…',   estimatedSecondsLeft: 2 });
    const generatedImage = await this.blobToDataUrl(imageBlob);

    onProgress({ status: 'done', percent: 100, message: '¡Listo!' });

    return {
      generatedImage,
      prompt,
      negativePrompt,
      provider: `HuggingFace / ${modelId}`,
      durationMs: Date.now() - t0,
    };
  }

  // ─── API call ──────────────────────────────────────────────────────────────

  private async callInferenceApi(
    apiKey: string,
    modelId: string,
    imageBase64: string,
    prompt: string,
    negativePrompt: string,
    onProgress: (p: GenerationProgress) => void,
  ): Promise<Blob> {
    // Convert base64 data URL to binary blob for the request body
    const imageBlob = this.base64ToBlob(imageBase64);

    const formData = new FormData();
    formData.append('inputs', imageBlob, 'photo.jpg');
    formData.append('parameters', JSON.stringify({
      prompt,
      negative_prompt: negativePrompt,
      strength: 0.62,
      guidance_scale: 7.5,
      num_inference_steps: 25,
    }));

    let attempt = 0;
    while (attempt < 3) {
      const res = await fetch(`${this.HF_API}/${modelId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      // Model loading (503) — wait and retry
      if (res.status === 503) {
        attempt++;
        const wait = 20 + attempt * 10;
        onProgress({
          status: 'queued',
          percent: 15 + attempt * 8,
          message: `Modelo cargando… esperando ${wait}s`,
          estimatedSecondsLeft: wait + 10,
        });
        await this.delay(wait * 1000);
        continue;
      }

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        throw new Error(`HuggingFace error ${res.status}: ${err}`);
      }

      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        throw new Error(`Unexpected JSON response: ${JSON.stringify(json)}`);
      }

      onProgress({ status: 'generating', percent: 80, message: 'Generando imagen…', estimatedSecondsLeft: 5 });
      return res.blob();
    }

    throw new Error('HuggingFace model failed to load after 3 attempts');
  }

  // ─── Prompt construction ──────────────────────────────────────────────────

  private buildPrompt(req: HairstyleGenerationRequest): { prompt: string; negativePrompt: string } {
    const prompt = [
      'Portrait of a person with new hairstyle.',
      `${req.hairstyleLabel} haircut with ${req.hairColorName} color.`,
      'Same face, same eyes, same nose, same mouth, same skin tone.',
      'Professional salon photo, natural lighting, photorealistic, highly detailed.',
    ].join(' ');

    const negativePrompt = [
      'different face, changed facial features, altered skin tone',
      'cartoon, anime, illustration, low quality, blurry',
    ].join(', ');

    return { prompt, negativePrompt };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private base64ToBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const bytes = atob(data);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
