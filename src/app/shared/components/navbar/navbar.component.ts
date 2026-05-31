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
    <!-- Brand -->
    <a class="brand" routerLink="/">
      <div class="brand-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 2 L6 22 M6 9 Q10 6 14 9 Q18 6 18 2" stroke="#080810" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="brand-name">BarberAI</span>
    </a>

    <!-- Links desktop -->
    <div class="nav-links">
      @if (auth.isAdmin()) {
        <a routerLink="/admin" routerLinkActive="active">Panel Admin</a>
        <a routerLink="/appointments" routerLinkActive="active">Citas</a>
        <a routerLink="/advisor" routerLinkActive="active">Asesoría IA</a>
        <a routerLink="/try-on" routerLinkActive="active">Try-On</a>
      } @else if (auth.isBarber()) {
        <a routerLink="/barber" routerLinkActive="active">Dashboard</a>
        <a routerLink="/appointments" routerLinkActive="active">Mis Citas</a>
        <a routerLink="/try-on" routerLinkActive="active">Try-On</a>
      } @else {
        <a routerLink="/advisor" routerLinkActive="active">Asesoría IA</a>
        <a routerLink="/appointments" routerLinkActive="active">Mis Citas</a>
        <a routerLink="/history" routerLinkActive="active">Historial</a>
        <a routerLink="/try-on" routerLinkActive="active">Try-On</a>
      }
    </div>

    <!-- User -->
    <div class="nav-right">
      <div class="user-btn" (click)="dropdownOpen.set(!dropdownOpen())">
        <div class="avatar">{{ initial() }}</div>
        <span class="user-name">{{ firstName() }}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" [style.transform]="dropdownOpen() ? 'rotate(180deg)' : ''" style="transition:transform 0.2s; color: #9997b0;"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5"/></svg>

        @if (dropdownOpen()) {
          <div class="dropdown">
            <div class="dropdown-info">
              <span class="d-name">{{ auth.currentUser()?.name }}</span>
              <span class="d-role">{{ roleLabel() }}</span>
            </div>
            <div class="dropdown-divider"></div>
            <button class="d-item logout" (click)="logout()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.5"/></svg>
              Cerrar sesión
            </button>
          </div>
        }
      </div>

      <!-- Hamburger -->
      <button class="hamburger" (click)="menuOpen.set(!menuOpen())" aria-label="Menu">
        @if (menuOpen()) {
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.5"/></svg>
        } @else {
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="1.5"/></svg>
        }
      </button>
    </div>
  </div>

  <!-- Mobile menu -->
  @if (menuOpen()) {
    <div class="mobile-menu">
      @if (auth.isAdmin()) {
        <a routerLink="/admin" routerLinkActive="active" (click)="menuOpen.set(false)">Panel Admin</a>
        <a routerLink="/appointments" routerLinkActive="active" (click)="menuOpen.set(false)">Citas</a>
        <a routerLink="/advisor" routerLinkActive="active" (click)="menuOpen.set(false)">Asesoría IA</a>
        <a routerLink="/try-on" routerLinkActive="active" (click)="menuOpen.set(false)">Try-On</a>
      } @else if (auth.isBarber()) {
        <a routerLink="/barber" routerLinkActive="active" (click)="menuOpen.set(false)">Dashboard</a>
        <a routerLink="/appointments" routerLinkActive="active" (click)="menuOpen.set(false)">Mis Citas</a>
        <a routerLink="/try-on" routerLinkActive="active" (click)="menuOpen.set(false)">Try-On</a>
      } @else {
        <a routerLink="/advisor" routerLinkActive="active" (click)="menuOpen.set(false)">Asesoría IA</a>
        <a routerLink="/appointments" routerLinkActive="active" (click)="menuOpen.set(false)">Mis Citas</a>
        <a routerLink="/history" routerLinkActive="active" (click)="menuOpen.set(false)">Historial</a>
        <a routerLink="/try-on" routerLinkActive="active" (click)="menuOpen.set(false)">Try-On</a>
      }
      <button class="logout-mobile" (click)="logout()">Cerrar sesión</button>
    </div>
  }
</nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 48px);
      max-width: 1200px;
      background: rgba(8,8,16,0.8);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      z-index: 1000;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
    }
    .nav-inner {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      gap: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      flex-shrink: 0;
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      font-weight: 700;
      color: #c9a96e;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 2px;
      flex: 1;
    }
    .nav-links a {
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #9997b0;
      text-decoration: none;
      transition: all 0.2s;
    }
    .nav-links a:hover { color: #f0eff4; background: rgba(255,255,255,0.05); }
    .nav-links a.active { color: #c9a96e; background: rgba(201,169,110,0.1); }
    .nav-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .user-btn {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 6px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s;
      color: #9997b0;
    }
    .user-btn:hover { background: rgba(255,255,255,0.05); color: #f0eff4; }
    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #080810;
      font-weight: 700;
      font-size: 13px;
    }
    .user-name { font-size: 13px; font-weight: 500; color: #f0eff4; }
    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #12121e;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      min-width: 200px;
      padding: 8px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.6);
      z-index: 100;
      animation: dropdown-in 0.15s ease;
    }
    @keyframes dropdown-in { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
    .dropdown-info { padding: 8px 10px 10px; }
    .d-name { display: block; font-size: 13px; font-weight: 600; color: #f0eff4; }
    .d-role { display: block; font-size: 11px; color: #9997b0; margin-top: 2px; }
    .dropdown-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }
    .d-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 9px 10px;
      background: transparent;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
      color: #9997b0;
    }
    .d-item:hover { background: rgba(255,255,255,0.05); color: #f0eff4; }
    .d-item.logout { color: #f87171; }
    .d-item.logout:hover { background: rgba(239,68,68,0.08); }
    .hamburger {
      display: none;
      background: transparent;
      border: none;
      color: #9997b0;
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      transition: all 0.2s;
      align-items: center;
      justify-content: center;
    }
    .hamburger:hover { background: rgba(255,255,255,0.05); color: #f0eff4; }
    .mobile-menu {
      padding: 8px 12px 12px;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .mobile-menu a {
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 14px;
      color: #9997b0;
      text-decoration: none;
      transition: all 0.2s;
    }
    .mobile-menu a:hover { background: rgba(255,255,255,0.05); color: #f0eff4; }
    .mobile-menu a.active { color: #c9a96e; background: rgba(201,169,110,0.08); }
    .logout-mobile {
      margin-top: 8px;
      padding: 10px 12px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: #f87171;
      font-size: 14px;
      cursor: pointer;
      text-align: left;
      transition: background 0.2s;
    }
    .logout-mobile:hover { background: rgba(239,68,68,0.08); }
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .user-name { display: none; }
      .hamburger { display: flex; }
      .navbar { width: calc(100% - 24px); top: 8px; }
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

  firstName() {
    const parts = this.auth.currentUser()?.name?.split(' ');
    return parts?.[0] ?? '';
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
