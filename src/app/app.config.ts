import {
  ApplicationConfig, provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { IMAGE_GENERATION_PROVIDER } from './core/services/providers/image-generation.token';
import { FluxKontextProvider } from './core/services/providers/flux-kontext.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    { provide: IMAGE_GENERATION_PROVIDER, useClass: FluxKontextProvider },
  ],
};
