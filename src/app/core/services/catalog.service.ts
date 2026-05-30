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
        { id: 's1', name: 'Corte Clásico', description: 'Corte tradicional con tijera', duration: 30, price: 15, category: 'haircut', active: true },
        { id: 's2', name: 'Corte + Barba', description: 'Corte completo y arreglo de barba', duration: 60, price: 25, category: 'combo', active: true },
        { id: 's3', name: 'Fade Premium', description: 'Degradado con máquina y acabado perfecto', duration: 45, price: 20, category: 'haircut', active: true },
        { id: 's4', name: 'Arreglo de Barba', description: 'Perfilado y arreglo de barba', duration: 20, price: 10, category: 'beard', active: true },
        { id: 's5', name: 'Coloración', description: 'Tinte completo con productos premium', duration: 90, price: 45, category: 'color', active: true },
        { id: 's6', name: 'Tratamiento Capilar', description: 'Hidratación profunda', duration: 60, price: 35, category: 'treatment', active: true },
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
