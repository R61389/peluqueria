import { Injectable, signal } from '@angular/core';
import { Barber } from '../models/barber.model';

@Injectable({ providedIn: 'root' })
export class BarberService {
  private readonly STORAGE_KEY = 'pq_barbers';
  private _barbers = signal<Barber[]>([]);
  readonly barbers = this._barbers.asReadonly();

  constructor() {
    this.load();
    this.seedDefault();
  }

  private seedDefault(): void {
    if (this._barbers().length === 0) {
      const defaults: Barber[] = [
        {
          id: 'barber-1',
          name: 'Carlos Rodríguez',
          email: 'carlos@peluqueria.com',
          phone: '+1234567890',
          specialties: ['Fade', 'Barba', 'Coloración'],
          workingDays: [1, 2, 3, 4, 5],
          workingHours: { start: '09:00', end: '18:00' },
          active: true,
          rating: 4.8,
          reviewCount: 127
        },
        {
          id: 'barber-2',
          name: 'Miguel Torres',
          email: 'miguel@peluqueria.com',
          phone: '+0987654321',
          specialties: ['Clásico', 'Moderno', 'Alisado'],
          workingDays: [1, 2, 3, 4, 6],
          workingHours: { start: '10:00', end: '19:00' },
          active: true,
          rating: 4.6,
          reviewCount: 89
        }
      ];
      this.save(defaults);
    }
  }

  private load(): void {
    this._barbers.set(JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]'));
  }

  private save(barbers: Barber[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(barbers));
    this._barbers.set(barbers);
  }

  getAll(): Barber[] { return this._barbers(); }
  getById(id: string): Barber | undefined { return this._barbers().find(b => b.id === id); }

  create(barber: Barber): void { this.save([...this._barbers(), barber]); }
  update(id: string, changes: Partial<Barber>): void {
    this.save(this._barbers().map(b => b.id === id ? { ...b, ...changes } : b));
  }
  delete(id: string): void { this.save(this._barbers().filter(b => b.id !== id)); }
}
