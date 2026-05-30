import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-bg">
      <div class="login-card">
        <div class="brand">
          <span class="brand-icon">✂</span>
          <span class="brand-name">BarberAI</span>
        </div>
        <p class="brand-sub">La experiencia premium que mereces</p>

        <div class="tabs">
          <button class="tab" [class.active]="mode() === 'login'" (click)="mode.set('login')">Iniciar Sesión</button>
          <button class="tab" [class.active]="mode() === 'register'" (click)="mode.set('register')">Registro</button>
        </div>

        @if (mode() === 'login') {
          <form [formGroup]="loginForm" (ngSubmit)="submit()">
            <div class="field">
              <label>Email</label>
              <input type="email" formControlName="email" placeholder="tu@email.com" autocomplete="email" />
              @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                <span class="field-error">Email inválido</span>
              }
            </div>
            <div class="field">
              <label>Contraseña</label>
              <input type="password" formControlName="password" placeholder="••••••••" autocomplete="current-password" />
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <span class="field-error">Mínimo 6 caracteres</span>
              }
            </div>
            @if (error()) {
              <div class="error-box">{{ error() }}</div>
            }
            <button type="submit" class="btn-gold" [disabled]="loginForm.invalid || loading()">
              @if (loading()) { Ingresando... } @else { Ingresar }
            </button>
          </form>
        } @else {
          <form [formGroup]="registerForm" (ngSubmit)="submit()">
            <div class="field">
              <label>Nombre completo</label>
              <input type="text" formControlName="name" placeholder="Tu nombre" />
              @if (registerForm.get('name')?.invalid && registerForm.get('name')?.touched) {
                <span class="field-error">Nombre requerido (mín. 2 caracteres)</span>
              }
            </div>
            <div class="field">
              <label>Email</label>
              <input type="email" formControlName="email" placeholder="tu@email.com" autocomplete="email" />
              @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                <span class="field-error">Email inválido</span>
              }
            </div>
            <div class="field">
              <label>Contraseña</label>
              <input type="password" formControlName="password" placeholder="••••••••" autocomplete="new-password" />
              @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                <span class="field-error">Mínimo 6 caracteres</span>
              }
            </div>
            <div class="field">
              <label>Confirmar contraseña</label>
              <input type="password" formControlName="confirmPassword" placeholder="••••••••" autocomplete="new-password" />
            </div>
            @if (error()) {
              <div class="error-box">{{ error() }}</div>
            }
            <button type="submit" class="btn-gold" [disabled]="registerForm.invalid || loading()">
              @if (loading()) { Registrando... } @else { Crear cuenta }
            </button>
          </form>
        }

        <div class="demo-box">
          <p class="demo-title">Credenciales de demostración</p>
          <div class="demo-row">
            <span class="role-badge admin">Admin</span>
            <span>admin&#64;peluqueria.com / admin123</span>
          </div>
          <div class="demo-row">
            <span class="role-badge barber">Barbero</span>
            <span>carlos&#64;peluqueria.com / barber123</span>
          </div>
          <div class="demo-row">
            <span class="role-badge user">Usuario</span>
            <span>Regístrate para probar</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-bg {
      min-height: 100vh;
      background: #0a0a0f;
      background-image: radial-gradient(ellipse at 20% 50%, rgba(201,169,110,0.08) 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 20%, rgba(201,169,110,0.05) 0%, transparent 50%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .login-card {
      width: 100%;
      max-width: 440px;
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.6);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: center;
      margin-bottom: 6px;
    }
    .brand-icon {
      font-size: 28px;
      color: #c9a96e;
    }
    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: #c9a96e;
      letter-spacing: 1px;
    }
    .brand-sub {
      text-align: center;
      color: #9997b0;
      font-size: 13px;
      margin: 0 0 28px;
    }
    .tabs {
      display: flex;
      background: rgba(255,255,255,0.04);
      border-radius: 12px;
      padding: 4px;
      margin-bottom: 28px;
    }
    .tab {
      flex: 1;
      padding: 10px;
      border: none;
      background: transparent;
      color: #9997b0;
      font-size: 14px;
      font-weight: 500;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab.active {
      background: rgba(201,169,110,0.15);
      color: #c9a96e;
    }
    .field {
      margin-bottom: 18px;
    }
    .field label {
      display: block;
      color: #9997b0;
      font-size: 13px;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .field input {
      width: 100%;
      padding: 12px 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      color: #f0eff4;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .field input:focus {
      border-color: rgba(201,169,110,0.5);
    }
    .field-error {
      display: block;
      color: #ef4444;
      font-size: 12px;
      margin-top: 4px;
    }
    .error-box {
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.3);
      color: #ef4444;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .btn-gold {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      color: #0a0a0f;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
    .btn-gold:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }
    .demo-box {
      margin-top: 28px;
      padding: 16px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
    }
    .demo-title {
      color: #9997b0;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 12px;
    }
    .demo-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      color: #9997b0;
      font-size: 12px;
    }
    .demo-row:last-child { margin-bottom: 0; }
    .role-badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    .role-badge.admin { background: rgba(201,169,110,0.2); color: #c9a96e; }
    .role-badge.barber { background: rgba(16,185,129,0.15); color: #10b981; }
    .role-badge.user { background: rgba(99,102,241,0.15); color: #818cf8; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = signal<'login' | 'register'>('login');
  loading = signal(false);
  error = signal('');

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

  submit(): void {
    this.error.set('');
    this.loading.set(true);

    if (this.mode() === 'login') {
      const { email, password } = this.loginForm.value;
      const result = this.auth.login(email!, password!);
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
      if (password !== confirmPassword) {
        this.error.set('Las contraseñas no coinciden');
        this.loading.set(false);
        return;
      }
      const result = this.auth.register(name!, email!, password!);
      if (result.success) this.router.navigate(['/advisor']);
      else this.error.set(result.error!);
    }
    this.loading.set(false);
  }
}
