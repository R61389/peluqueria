import { InjectionToken } from '@angular/core';
import { ImageGenerationProvider } from '../../models/hairstyle-ai.model';

/**
 * Angular DI token for the active image-generation provider.
 * Swap the provider in app.config.ts without touching any feature code.
 *
 * Usage in app.config.ts:
 *   { provide: IMAGE_GENERATION_PROVIDER, useClass: ReplicateProvider }
 *   { provide: IMAGE_GENERATION_PROVIDER, useClass: MockProvider }
 */
export const IMAGE_GENERATION_PROVIDER =
  new InjectionToken<ImageGenerationProvider>('IMAGE_GENERATION_PROVIDER');
