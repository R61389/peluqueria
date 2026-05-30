import { Component, signal, inject, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { animate } from 'motion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="login-wrap">
  <!-- Orbs background -->
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>

  <!-- Noise texture -->
  <div class="noise"></div>

  <!-- Card -->
  <div class="card" #card>
    <!-- Light beams -->
    <div class="beam beam-top"></div>
    <div class="beam beam-bottom"></div>
    <div class="beam beam-left"></div>
    <div class="beam beam-right"></div>

    <!-- Header -->
    <div class="card-header">
      <div class="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M6 2 L6 22 M6 9 Q10 6 14 9 Q18 6 18 2" stroke="#c9a96e" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <h1>{{ mode() === 'login' ? 'Bienvenido' : 'Crear cuenta' }}</h1>
      <p>{{ mode() === 'login' ? 'Accede a tu cuenta BarberAI' : 'Únete a BarberAI Premium' }}</p>
    </div>

    <!-- Tabs -->
    <div class="mode-tabs">
      <button [class.active]="mode() === 'login'" (click)="mode.set('login')">Iniciar sesión</button>
      <button [class.active]="mode() === 'register'" (click)="mode.set('register')">Registrarse</button>
    </div>

    <!-- Login Form -->
    @if (mode() === 'login') {
      <form [formGroup]="loginForm" (ngSubmit)="submit()" class="form">
        <div class="field">
          <label>Correo electrónico</label>
          <div class="input-wrap">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5"/><path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5"/></svg>
            <input type="email" formControlName="email" placeholder="tu@email.com">
          </div>
        </div>
        <div class="field">
          <label>Contraseña</label>
          <div class="input-wrap">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="1.5"/></svg>
            <input [type]="showPass() ? 'text' : 'password'" formControlName="password" placeholder="••••••••">
            <button type="button" class="eye-btn" (click)="showPass.set(!showPass())" aria-label="Toggle password visibility">
              @if (showPass()) {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.5"/></svg>
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
              }
            </button>
          </div>
        </div>

        @if (error()) {
          <div class="error-msg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="1.5"/></svg>
            {{ error() }}
          </div>
        }

        <button type="submit" class="btn-submit" [disabled]="loading()">
          @if (loading()) {
            <span class="spinner"></span>
          } @else {
            Iniciar sesión
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          }
        </button>
      </form>
    }

    <!-- Register Form -->
    @if (mode() === 'register') {
      <form [formGroup]="registerForm" (ngSubmit)="submit()" class="form">
        <div class="field">
          <label>Nombre completo</label>
          <div class="input-wrap">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/></svg>
            <input type="text" formControlName="name" placeholder="Tu nombre">
          </div>
        </div>
        <div class="field">
          <label>Correo electrónico</label>
          <div class="input-wrap">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5"/><path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5"/></svg>
            <input type="email" formControlName="email" placeholder="tu@email.com">
          </div>
        </div>
        <div class="field">
          <label>Contraseña</label>
          <div class="input-wrap">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="1.5"/></svg>
            <input [type]="showPass() ? 'text' : 'password'" formControlName="password" placeholder="Mínimo 6 caracteres">
          </div>
        </div>
        <div class="field">
          <label>Confirmar contraseña</label>
          <div class="input-wrap">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="1.5"/></svg>
            <input [type]="showPass() ? 'text' : 'password'" formControlName="confirmPassword" placeholder="Repetir contraseña">
          </div>
        </div>

        @if (error()) {
          <div class="error-msg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="1.5"/></svg>
            {{ error() }}
          </div>
        }

        <button type="submit" class="btn-submit" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> }
          @else {
            Crear cuenta
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          }
        </button>
      </form>
    }

    <!-- Demo credentials -->
    <div class="demo-box">
      <p class="demo-label">Credenciales demo</p>
      <div class="demo-items">
        <button class="demo-item" (click)="fillDemo('admin@peluqueria.com','admin123')">
          <span class="role-dot admin"></span>
          <span>Admin</span>
          <span class="demo-cred">admin&#64;peluqueria.com</span>
        </button>
        <button class="demo-item" (click)="fillDemo('carlos@peluqueria.com','barber123')">
          <span class="role-dot barber"></span>
          <span>Barbero</span>
          <span class="demo-cred">carlos&#64;peluqueria.com</span>
        </button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .login-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #080810;
      position: relative;
      overflow: hidden;
      padding: 24px;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      animation: pulse-glow 6s ease-in-out infinite;
    }
    .orb-1 { width: 500px; height: 500px; background: rgba(201,169,110,0.1); top: -150px; left: -150px; animation-delay: 0s; }
    .orb-2 { width: 400px; height: 400px; background: rgba(139,92,246,0.08); bottom: -100px; right: -100px; animation-delay: 2s; }
    .orb-3 { width: 300px; height: 300px; background: rgba(59,130,246,0.06); top: 50%; left: 60%; animation-delay: 4s; }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }

    .noise {
      position: absolute;
      inset: 0;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 200px;
      pointer-events: none;
    }

    .card {
      position: relative;
      width: 100%;
      max-width: 440px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      padding: 40px;
      overflow: hidden;
      z-index: 1;
      opacity: 0;
      transform: translateY(20px);
    }

    .beam {
      position: absolute;
      pointer-events: none;
    }
    .beam-top { top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,169,110,0.3), transparent); }
    .beam-bottom { bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); }
    .beam-left { left: 0; top: 0; bottom: 0; width: 1px; background: linear-gradient(180deg, transparent, rgba(255,255,255,0.06), transparent); }
    .beam-right { right: 0; top: 0; bottom: 0; width: 1px; background: linear-gradient(180deg, transparent, rgba(255,255,255,0.04), transparent); }

    .card-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .logo {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(201,169,110,0.1);
      border: 1px solid rgba(201,169,110,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .card-header h1 {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      font-weight: 600;
      color: #f0eff4;
      margin-bottom: 6px;
    }
    .card-header p {
      font-size: 14px;
      color: #9997b0;
    }

    .mode-tabs {
      display: flex;
      gap: 4px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 4px;
      margin-bottom: 28px;
    }
    .mode-tabs button {
      flex: 1;
      padding: 9px;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: #9997b0;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.25s;
    }
    .mode-tabs button.active {
      background: rgba(201,169,110,0.12);
      color: #c9a96e;
      border: 1px solid rgba(201,169,110,0.2);
    }
    .mode-tabs button:hover:not(.active) { color: #f0eff4; }

    .form { display: flex; flex-direction: column; gap: 18px; }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field label { font-size: 13px; font-weight: 500; color: #9997b0; }
    .input-wrap {
      position: relative;
    }
    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #4a4860;
      pointer-events: none;
      transition: color 0.2s;
    }
    .input-wrap:focus-within .input-icon { color: #c9a96e; }
    .input-wrap input {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 12px 44px;
      color: #f0eff4;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: all 0.2s;
    }
    .input-wrap input:focus {
      border-color: rgba(201,169,110,0.4);
      background: rgba(201,169,110,0.04);
    }
    .input-wrap input::placeholder { color: rgba(153,151,176,0.4); }
    .eye-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #4a4860;
      cursor: pointer;
      padding: 4px;
      transition: color 0.2s;
      display: flex;
      align-items: center;
    }
    .eye-btn:hover { color: #9997b0; }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px;
      color: #f87171;
      font-size: 13px;
    }

    .btn-submit {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      color: #080810;
      font-weight: 600;
      font-size: 14px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 4px;
      position: relative;
      overflow: hidden;
    }
    .btn-submit::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(201,169,110,0.3); }
    .btn-submit:hover::after { opacity: 1; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    .spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(8,8,16,0.3);
      border-top-color: #080810;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .demo-box {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .demo-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #4a4860;
      margin-bottom: 12px;
      text-align: center;
    }
    .demo-items { display: flex; gap: 8px; }
    .demo-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px 8px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 12px;
      font-weight: 500;
      color: #9997b0;
    }
    .demo-item:hover { border-color: rgba(201,169,110,0.2); background: rgba(201,169,110,0.04); color: #c9a96e; }
    .role-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
    }
    .role-dot.admin { background: #c9a96e; }
    .role-dot.barber { background: #10b981; }
    .demo-cred { font-size: 10px; color: #4a4860; font-family: monospace; }
  `]
})
export class LoginComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  @ViewChild('card') cardRef!: ElementRef;

  mode = signal<'login' | 'register'>('login');
  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  ngAfterViewInit(): void {
    if (this.cardRef?.nativeElement) {
      animate(this.cardRef.nativeElement,
        { opacity: [0, 1], y: [30, 0] },
        { duration: 0.7, easing: [0.16, 1, 0.3, 1] }
      );
    }
  }

  fillDemo(email: string, password: string): void {
    this.mode.set('login');
    this.loginForm.patchValue({ email, password });
  }

  submit(): void {
    this.error.set('');
    this.loading.set(true);

    if (this.mode() === 'login') {
      const { email, password } = this.loginForm.value;
      const result = this.auth.login(email!, password!);
      this.loading.set(false);
      if (result.success) {
        const role = this.auth.currentUser()?.role;
        if (role === 'admin') this.router.navigate(['/admin']);
        else if (role === 'barber') this.router.navigate(['/barber']);
        else this.router.navigate(['/advisor']);
      } else {
        this.error.set(result.error!);
      }
    } else {
      const { name, email, password, confirmPassword } = this.registerForm.value;
      if (password !== confirmPassword) { this.error.set('Las contraseñas no coinciden'); this.loading.set(false); return; }
      const result = this.auth.register(name!, email!, password!);
      this.loading.set(false);
      if (result.success) this.router.navigate(['/advisor']);
      else this.error.set(result.error!);
    }
  }
}
