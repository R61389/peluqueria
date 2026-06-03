import { Injectable, signal } from '@angular/core';
import { BarberService as BarberServiceModel } from '../models/service.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly STORAGE_KEY = 'pq_services';
  private _services = signal<BarberServiceModel[]>([]);
  readonly services = this._services.asReadonly();

  constructor() {
    this.load();
    this.seedDefault();
  }

  private seedDefault(): void {
    if (this._services().length === 0) {
      const defaults: BarberServiceModel[] = [
        { id: 's1', name: 'Corte Clásico', description: 'Corte tradicional con tijera', duration: 30, price: 80, category: 'haircut', targetGender: 'male', active: true },
        { id: 's2', name: 'Corte + Barba', description: 'Corte completo y arreglo de barba', duration: 60, price: 130, category: 'combo', targetGender: 'male', active: true },
        { id: 's3', name: 'Fade Premium', description: 'Degradado con máquina y acabado perfecto', duration: 45, price: 100, category: 'haircut', targetGender: 'male', active: true },
        { id: 's4', name: 'Arreglo de Barba', description: 'Perfilado y arreglo de barba', duration: 20, price: 60, category: 'beard', targetGender: 'male', active: true },
        { id: 's5', name: 'Coloración', description: 'Tinte completo con productos premium', duration: 90, price: 220, category: 'color', targetGender: 'unisex', active: true },
        { id: 's6', name: 'Tratamiento Capilar', description: 'Hidratación profunda', duration: 60, price: 180, category: 'treatment', targetGender: 'unisex', active: true },
        { id: 's7', name: 'Corte Femenino', description: 'Corte y estilizado para mujer', duration: 45, price: 100, category: 'haircut', targetGender: 'female', active: true },
        { id: 's8', name: 'Corte + Puntas', description: 'Corte con puntas y terminado profesional', duration: 60, price: 130, category: 'combo', targetGender: 'female', active: true },
        { id: 's9', name: 'Peinado y Brushing', description: 'Lavado, secado y peinado con plancha o rulos', duration: 50, price: 120, category: 'treatment', targetGender: 'female', active: true },
      ];
      this.save(defaults);
    }
  }

  private load(): void {
    this._services.set(JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]'));
  }

  private save(services: BarberServiceModel[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(services));
    this._services.set(services);
  }

  create(service: BarberServiceModel): void { this.save([...this._services(), service]); }
  update(id: string, changes: Partial<BarberServiceModel>): void {
    this.save(this._services().map(s => s.id === id ? { ...s, ...changes } : s));
  }
  delete(id: string): void { this.save(this._services().filter(s => s.id !== id)); }
}
