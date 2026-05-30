import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (auth.isAuthenticated()) {
      <app-navbar></app-navbar>
    }
    <main [class.with-navbar]="auth.isAuthenticated()">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    main { min-height: 100vh; background: var(--bg-primary, #0a0a0f); }
    main.with-navbar { padding-top: 64px; }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
}
