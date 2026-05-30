import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="shell-main">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .shell-main {
      padding-top: 80px;
      min-height: 100vh;
      background: #080810;
    }
  `]
})
export class ShellComponent {}
