import {
  ApplicationConfig, provideZoneChangeDetection,
  APP_INITIALIZER, inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { IMAGE_GENERATION_PROVIDER } from './core/services/providers/image-generation.token';
import { FluxKontextProvider } from './core/services/providers/flux-kontext.provider';
import { ReminderService } from './core/services/reminder.service';
// import { MockProvider }        from './core/services/providers/mock.provider';
// import { ReplicateProvider }   from './core/services/providers/replicate.provider';
// import { HuggingFaceProvider } from './core/services/providers/huggingface.provider';

function startReminderService(): () => void {
  const reminder = inject(ReminderService);
  return () => reminder.start();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    // ── AI Image Generation Provider (Strategy Pattern) ───────────────────
    { provide: IMAGE_GENERATION_PROVIDER, useClass: FluxKontextProvider },
    // ── WhatsApp reminder scheduler ────────────────────────────────────────
    { provide: APP_INITIALIZER, useFactory: startReminderService, multi: true },
  ],
};
