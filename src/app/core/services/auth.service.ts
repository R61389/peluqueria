import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'pq_users';
  private readonly SESSION_KEY = 'pq_session';
  private readonly router = inject(Router);

  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  readonly isBarber = computed(() => this._currentUser()?.role === 'barber');
  readonly isUser = computed(() => this._currentUser()?.role === 'user');

  constructor() {
    this.restoreSession();
    this.seedDefaultData();
  }

  private seedDefaultData(): void {
    const users = this.getUsers();
    if (users.length === 0) {
      const defaultUsers: User[] = [
        {
          id: 'admin-1',
          name: 'Administrador',
          email: 'admin@peluqueria.com',
          passwordHash: btoa('admin123'),
          role: 'admin',
          createdAt: new Date().toISOString()
        },
        {
          id: 'barber-1',
          name: 'Carlos Rodríguez',
          email: 'carlos@peluqueria.com',
          passwordHash: btoa('barber123'),
          role: 'barber',
          phone: '+1234567890',
          createdAt: new Date().toISOString()
        },
        {
          id: 'barber-2',
          name: 'Miguel Torres',
          email: 'miguel@peluqueria.com',
          passwordHash: btoa('barber123'),
          role: 'barber',
          phone: '+0987654321',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultUsers));
    }
  }

  private getUsers(): User[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  }

  private restoreSession(): void {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (session) {
      try {
        this._currentUser.set(JSON.parse(session));
      } catch { /* ignore */ }
    }
  }

  login(email: string, password: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.passwordHash === btoa(password));
    if (!user) return { success: false, error: 'Email o contraseña incorrectos' };
    this._currentUser.set(user);
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    return { success: true };
  }

  register(name: string, email: string, password: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Este email ya está registrado' };
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      passwordHash: btoa(password),
      role: 'user',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    this._currentUser.set(newUser);
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(newUser));
    return { success: true };
  }

  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem(this.SESSION_KEY);
    this.router.navigate(['/login']);
  }

  getAllUsers(): User[] {
    return this.getUsers();
  }

  updateUser(updated: User): void {
    const users = this.getUsers().map(u => u.id === updated.id ? updated : u);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    if (this._currentUser()?.id === updated.id) {
      this._currentUser.set(updated);
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(updated));
    }
  }

  deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  }
}
