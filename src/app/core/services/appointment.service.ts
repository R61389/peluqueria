import { Injectable, signal } from '@angular/core';
import { Appointment, TimeSlot } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly STORAGE_KEY = 'pq_appointments';
  private _appointments = signal<Appointment[]>([]);
  readonly appointments = this._appointments.asReadonly();

  constructor() {
    this.load();
  }

  private load(): void {
    this._appointments.set(JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]'));
  }

  private save(appointments: Appointment[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(appointments));
    this._appointments.set(appointments);
  }

  create(appointment: Omit<Appointment, 'id' | 'createdAt'>): Appointment {
    const newAppt: Appointment = {
      ...appointment,
      id: `appt-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.save([...this._appointments(), newAppt]);
    return newAppt;
  }

  update(id: string, changes: Partial<Appointment>): void {
    this.save(this._appointments().map(a => a.id === id ? { ...a, ...changes } : a));
  }

  delete(id: string): void {
    this.save(this._appointments().filter(a => a.id !== id));
  }

  getByUser(userId: string): Appointment[] {
    return this._appointments().filter(a => a.userId === userId);
  }

  getByBarber(barberId: string): Appointment[] {
    return this._appointments().filter(a => a.barberId === barberId);
  }

  getAll(): Appointment[] {
    return this._appointments();
  }

  getAvailableSlots(barberId: string, date: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const bookedTimes = this._appointments()
      .filter(a => a.barberId === barberId && a.date === date && a.status !== 'cancelled')
      .map(a => a.time);

    for (let h = 9; h < 19; h++) {
      for (const m of [0, 30]) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        slots.push({ time, available: !bookedTimes.includes(time) });
      }
    }
    return slots;
  }
}
