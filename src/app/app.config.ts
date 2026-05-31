import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { IMAGE_GENERATION_PROVIDER } from './core/services/providers/image-generation.token';
import { MockProvider } from './core/services/providers/mock.provider';
// ── To switch AI provider, replace MockProvider with one of: ─────────────────
// import { ReplicateProvider }   from './core/services/providers/replicate.provider';
// import { HuggingFaceProvider } from './core/services/providers/huggingface.provider';
// import { FluxKontextProvider } from './core/services/providers/flux-kontext.provider';
// ─────────────────────────────────────────────────────────────────────────────

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    // ── AI Image Generation Provider (Strategy Pattern) ───────────────────
    // Change the useClass value to swap providers without modifying any
    // feature component or service.
    { provide: IMAGE_GENERATION_PROVIDER, useClass: MockProvider },
  ],
};
