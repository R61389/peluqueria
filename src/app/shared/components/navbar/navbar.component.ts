import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="navbar">
      <div class="nav-inner">
        <a class="nav-brand" routerLink="/">
          <span class="brand-icon">✂</span>
          <span class="brand-text">BarberAI</span>
        </a>

        <div class="nav-links" [class.open]="menuOpen()">
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" (click)="menuOpen.set(false)">Panel Admin</a>
            <a routerLink="/appointments" routerLinkActive="active" (click)="menuOpen.set(false)">Citas</a>
            <a routerLink="/advisor" routerLinkActive="active" (click)="menuOpen.set(false)">Asesoría IA</a>
          } @else if (auth.isBarber()) {
            <a routerLink="/barber" routerLinkActive="active" (click)="menuOpen.set(false)">Dashboard</a>
            <a routerLink="/appointments" routerLinkActive="active" (click)="menuOpen.set(false)">Mis Citas</a>
          } @else {
            <a routerLink="/advisor" routerLinkActive="active" (click)="menuOpen.set(false)">Asesoría IA</a>
            <a routerLink="/appointments" routerLinkActive="active" (click)="menuOpen.set(false)">Mis Citas</a>
            <a routerLink="/history" routerLinkActive="active" (click)="menuOpen.set(false)">Historial</a>
          }
        </div>

        <div class="nav-right">
          <div class="user-menu" (click)="dropdownOpen.set(!dropdownOpen())">
            <div class="avatar">{{ initial() }}</div>
            <span class="user-name">{{ auth.currentUser()?.name }}</span>
            <span class="chevron">▾</span>
            @if (dropdownOpen()) {
              <div class="dropdown">
                <div class="dropdown-header">
                  <span class="dropdown-name">{{ auth.currentUser()?.name }}</span>
                  <span class="dropdown-role">{{ roleLabel() }}</span>
                </div>
                <button class="dropdown-item logout" (click)="logout()">Cerrar sesión</button>
              </div>
            }
          </div>
          <button class="hamburger" (click)="menuOpen.set(!menuOpen())">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 64px;
      background: rgba(26,26,38,0.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      z-index: 1000;
    }
    .nav-inner {
      max-width: 1280px;
      margin: 0 auto;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 32px;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      flex-shrink: 0;
    }
    .brand-icon { color: #c9a96e; font-size: 20px; }
    .brand-text {
      font-family: 'Playfair Display', serif;
      color: #c9a96e;
      font-size: 20px;
      font-weight: 700;
    }
    .nav-links {
      display: flex;
      gap: 4px;
      flex: 1;
    }
    .nav-links a {
      color: #9997b0;
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .nav-links a:hover { color: #f0eff4; background: rgba(255,255,255,0.05); }
    .nav-links a.active { color: #c9a96e; background: rgba(201,169,110,0.1); }
    .nav-right {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: auto;
    }
    .user-menu {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 10px;
      transition: background 0.2s;
    }
    .user-menu:hover { background: rgba(255,255,255,0.05); }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0a0a0f;
      font-weight: 700;
      font-size: 14px;
    }
    .user-name { color: #f0eff4; font-size: 14px; font-weight: 500; }
    .chevron { color: #9997b0; font-size: 12px; }
    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      min-width: 200px;
      padding: 8px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      z-index: 100;
    }
    .dropdown-header {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      margin-bottom: 4px;
    }
    .dropdown-name {
      display: block;
      color: #f0eff4;
      font-size: 14px;
      font-weight: 600;
    }
    .dropdown-role {
      display: block;
      color: #9997b0;
      font-size: 12px;
      margin-top: 2px;
    }
    .dropdown-item {
      display: block;
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      background: transparent;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
      color: #9997b0;
    }
    .dropdown-item:hover { background: rgba(255,255,255,0.05); color: #f0eff4; }
    .dropdown-item.logout { color: #ef4444; }
    .dropdown-item.logout:hover { background: rgba(239,68,68,0.1); }
    .hamburger {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
    }
    .hamburger span {
      display: block;
      width: 20px;
      height: 2px;
      background: #f0eff4;
      border-radius: 2px;
    }
    @media (max-width: 768px) {
      .hamburger { display: flex; }
      .nav-links {
        display: none;
        position: fixed;
        top: 64px;
        left: 0;
        right: 0;
        background: #1a1a26;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        flex-direction: column;
        padding: 12px;
        gap: 4px;
      }
      .nav-links.open { display: flex; }
      .user-name { display: none; }
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  menuOpen = signal(false);
  dropdownOpen = signal(false);

  initial() {
    return this.auth.currentUser()?.name?.charAt(0)?.toUpperCase() ?? '?';
  }

  roleLabel() {
    const role = this.auth.currentUser()?.role;
    if (role === 'admin') return 'Administrador';
    if (role === 'barber') return 'Barbero';
    return 'Cliente';
  }

  logout() {
    this.dropdownOpen.set(false);
    this.auth.logout();
  }
}
