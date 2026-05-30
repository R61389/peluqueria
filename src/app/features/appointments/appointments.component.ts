import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { BarberService } from '../../core/services/barber.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Barber } from '../../core/models/barber.model';
import { BarberService as BarberServiceModel } from '../../core/models/service.model';
import { Appointment } from '../../core/models/appointment.model';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="container">
        @if (!bookedAppointment()) {
          <div class="page-header">
            <h1>Reservar Cita</h1>
            <p>Elige tu barbero, servicio y horario</p>
          </div>

          <!-- Steps indicator -->
          <div class="steps">
            @for (s of stepLabels; track s.num) {
              <div class="step" [class.active]="step() === s.num" [class.done]="step() > s.num">
                <div class="step-circle">{{ step() > s.num ? '✓' : s.num }}</div>
                <span>{{ s.label }}</span>
              </div>
              @if (!$last) { <div class="step-line" [class.done]="step() > s.num"></div> }
            }
          </div>

          <!-- Step 1: Choose Barber -->
          @if (step() === 1) {
            <div class="section">
              <h2>Elige tu barbero</h2>
              <div class="barbers-grid">
                @for (barber of activeBarbers(); track barber.id) {
                  <div class="barber-card" [class.selected]="selectedBarber()?.id === barber.id" (click)="selectBarber(barber)">
                    <div class="barber-avatar">{{ barber.name.charAt(0) }}</div>
                    <div class="barber-info">
                      <h3>{{ barber.name }}</h3>
                      <div class="stars">
                        @for (i of starsArray(barber.rating); track $index) {
                          <span [class.filled]="i <= barber.rating">★</span>
                        }
                        <span class="rating-num">{{ barber.rating }} ({{ barber.reviewCount }})</span>
                      </div>
                      <div class="specialties">
                        @for (s of barber.specialties; track s) {
                          <span class="tag">{{ s }}</span>
                        }
                      </div>
                      <p class="hours">Horario: {{ barber.workingHours.start }} - {{ barber.workingHours.end }}</p>
                    </div>
                    @if (selectedBarber()?.id === barber.id) {
                      <div class="check-badge">✓</div>
                    }
                  </div>
                }
              </div>
              <div class="step-actions">
                <button class="btn-gold" [disabled]="!selectedBarber()" (click)="step.set(2)">Continuar</button>
              </div>
            </div>
          }

          <!-- Step 2: Choose Service -->
          @if (step() === 2) {
            <div class="section">
              <h2>Elige el servicio</h2>
              <div class="services-grid">
                @for (svc of activeServices(); track svc.id) {
                  <div class="service-card" [class.selected]="selectedService()?.id === svc.id" (click)="selectService(svc)">
                    <div class="svc-icon">{{ categoryIcon(svc.category) }}</div>
                    <div class="svc-info">
                      <h3>{{ svc.name }}</h3>
                      <p>{{ svc.description }}</p>
                      <div class="svc-meta">
                        <span class="svc-duration">⏱ {{ svc.duration }} min</span>
                        <span class="svc-price">\${{ svc.price }}</span>
                      </div>
                    </div>
                    @if (selectedService()?.id === svc.id) {
                      <div class="check-badge">✓</div>
                    }
                  </div>
                }
              </div>
              <div class="step-actions">
                <button class="btn-outline" (click)="step.set(1)">Atrás</button>
                <button class="btn-gold" [disabled]="!selectedService()" (click)="step.set(3)">Continuar</button>
              </div>
            </div>
          }

          <!-- Step 3: Choose Date & Time -->
          @if (step() === 3) {
            <div class="section">
              <h2>Elige fecha y hora</h2>
              <div class="datetime-layout">
                <div>
                  <h3 class="sub-title">Fecha disponible</h3>
                  <div class="dates-grid">
                    @for (d of next14Days(); track d.value) {
                      <button
                        class="date-btn"
                        [class.available]="d.available"
                        [class.unavailable]="!d.available"
                        [class.selected]="selectedDate() === d.value"
                        [disabled]="!d.available"
                        (click)="selectDate(d.value)">
                        <span class="date-day">{{ d.dayName }}</span>
                        <span class="date-num">{{ d.dayNum }}</span>
                        <span class="date-month">{{ d.monthName }}</span>
                      </button>
                    }
                  </div>
                </div>

                @if (selectedDate()) {
                  <div>
                    <h3 class="sub-title">Horario disponible</h3>
                    <div class="slots-grid">
                      @for (slot of availableSlots(); track slot.time) {
                        <button
                          class="slot-btn"
                          [class.available]="slot.available"
                          [class.booked]="!slot.available"
                          [class.selected]="selectedTime() === slot.time"
                          [disabled]="!slot.available"
                          (click)="selectedTime.set(slot.time)">
                          {{ slot.time }}
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>

              @if (selectedDate() && selectedTime()) {
                <div class="summary-box">
                  <h3>Resumen de tu cita</h3>
                  <div class="summary-row"><span>Barbero</span><strong>{{ selectedBarber()?.name }}</strong></div>
                  <div class="summary-row"><span>Servicio</span><strong>{{ selectedService()?.name }}</strong></div>
                  <div class="summary-row"><span>Fecha</span><strong>{{ selectedDate() }}</strong></div>
                  <div class="summary-row"><span>Hora</span><strong>{{ selectedTime() }}</strong></div>
                  <div class="summary-row"><span>Precio</span><strong class="price">\${{ selectedService()?.price }}</strong></div>
                </div>
              }

              <div class="step-actions">
                <button class="btn-outline" (click)="step.set(2)">Atrás</button>
                <button class="btn-gold" [disabled]="!selectedDate() || !selectedTime()" (click)="confirmBooking()">
                  Confirmar Reserva
                </button>
              </div>
            </div>
          }
        } @else {
          <!-- Success Screen -->
          <div class="success-screen">
            <div class="success-icon">✓</div>
            <h2>¡Cita reservada!</h2>
            <p>Tu cita ha sido confirmada exitosamente</p>
            <div class="appt-details">
              <div class="detail-row"><span>Barbero</span><strong>{{ bookedAppointment()!.barberName }}</strong></div>
              <div class="detail-row"><span>Servicio</span><strong>{{ bookedAppointment()!.serviceName }}</strong></div>
              <div class="detail-row"><span>Fecha</span><strong>{{ bookedAppointment()!.date }}</strong></div>
              <div class="detail-row"><span>Hora</span><strong>{{ bookedAppointment()!.time }}</strong></div>
              <div class="detail-row"><span>Precio</span><strong>\${{ bookedAppointment()!.price }}</strong></div>
              <div class="detail-row"><span>Estado</span>
                <span class="status-badge status-pending">Pendiente</span>
              </div>
            </div>
            <div class="success-actions">
              <button class="btn-gold" (click)="resetBooking()">Reservar otra cita</button>
            </div>
          </div>
        }

        <!-- My appointments -->
        @if (myAppointments().length > 0) {
          <div class="my-appts">
            <h2>Mis citas</h2>
            <div class="appts-list">
              @for (appt of myAppointments(); track appt.id) {
                <div class="appt-card">
                  <div class="appt-time">
                    <span class="appt-date">{{ appt.date }}</span>
                    <span class="appt-hour">{{ appt.time }}</span>
                  </div>
                  <div class="appt-info">
                    <strong>{{ appt.barberName }}</strong>
                    <span>{{ appt.serviceName }}</span>
                  </div>
                  <div class="appt-right">
                    <span class="status-badge status-{{ appt.status }}">{{ statusLabel(appt.status) }}</span>
                    <span class="appt-price">\${{ appt.price }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #0a0a0f; padding: 32px 0; }
    .container { max-width: 900px; margin: 0 auto; padding: 0 24px; }
    .page-header { margin-bottom: 32px; }
    .page-header h1 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 32px; margin: 0 0 6px; }
    .page-header p { color: #9997b0; margin: 0; }

    .steps {
      display: flex;
      align-items: center;
      margin-bottom: 40px;
      gap: 0;
    }
    .step {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .step-circle {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
      border: 2px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #9997b0;
      transition: all 0.3s;
    }
    .step.active .step-circle {
      background: rgba(201,169,110,0.2);
      border-color: #c9a96e;
      color: #c9a96e;
    }
    .step.done .step-circle {
      background: #c9a96e;
      border-color: #c9a96e;
      color: #0a0a0f;
    }
    .step span { color: #9997b0; font-size: 13px; font-weight: 500; }
    .step.active span { color: #f0eff4; }
    .step-line { flex: 1; height: 1px; background: rgba(255,255,255,0.1); margin: 0 12px; }
    .step-line.done { background: #c9a96e; }

    .section h2 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 24px; margin: 0 0 24px; }
    .sub-title { color: #f0eff4; font-size: 16px; font-weight: 600; margin: 0 0 16px; }

    .barbers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .barber-card {
      position: relative;
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      gap: 16px;
    }
    .barber-card:hover { border-color: rgba(201,169,110,0.3); transform: translateY(-2px); }
    .barber-card.selected { border-color: #c9a96e; background: rgba(201,169,110,0.05); }
    .barber-avatar {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 700; color: #0a0a0f;
      flex-shrink: 0;
    }
    .barber-info h3 { color: #f0eff4; font-size: 16px; font-weight: 600; margin: 0 0 6px; }
    .stars { display: flex; align-items: center; gap: 2px; margin-bottom: 8px; }
    .stars span { color: rgba(255,255,255,0.2); font-size: 14px; }
    .stars span.filled { color: #c9a96e; }
    .rating-num { color: #9997b0; font-size: 12px; margin-left: 4px; }
    .specialties { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
    .tag { background: rgba(255,255,255,0.06); color: #9997b0; padding: 2px 8px; border-radius: 6px; font-size: 11px; }
    .hours { color: #9997b0; font-size: 12px; margin: 0; }

    .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .service-card {
      position: relative;
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      gap: 14px;
    }
    .service-card:hover { border-color: rgba(201,169,110,0.3); transform: translateY(-2px); }
    .service-card.selected { border-color: #c9a96e; background: rgba(201,169,110,0.05); }
    .svc-icon { font-size: 28px; flex-shrink: 0; }
    .svc-info h3 { color: #f0eff4; font-size: 15px; font-weight: 600; margin: 0 0 4px; }
    .svc-info p { color: #9997b0; font-size: 12px; margin: 0 0 10px; }
    .svc-meta { display: flex; gap: 12px; align-items: center; }
    .svc-duration { color: #9997b0; font-size: 12px; }
    .svc-price { color: #c9a96e; font-size: 16px; font-weight: 700; }

    .check-badge {
      position: absolute;
      top: 12px; right: 12px;
      width: 22px; height: 22px;
      background: #c9a96e;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #0a0a0f; font-size: 12px; font-weight: 700;
    }

    .datetime-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 24px; }
    .dates-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    .date-btn {
      display: flex; flex-direction: column; align-items: center;
      padding: 8px 4px;
      border-radius: 10px;
      border: 1px solid transparent;
      background: rgba(255,255,255,0.04);
      cursor: pointer;
      transition: all 0.2s;
    }
    .date-btn.available { border-color: rgba(255,255,255,0.1); }
    .date-btn.available:hover { border-color: rgba(201,169,110,0.4); }
    .date-btn.selected { background: rgba(201,169,110,0.15); border-color: #c9a96e; }
    .date-btn.unavailable { opacity: 0.35; cursor: not-allowed; }
    .date-day { font-size: 10px; color: #9997b0; text-transform: uppercase; }
    .date-num { font-size: 16px; font-weight: 700; color: #f0eff4; margin: 2px 0; }
    .date-month { font-size: 10px; color: #9997b0; }
    .date-btn.selected .date-day,
    .date-btn.selected .date-num,
    .date-btn.selected .date-month { color: #c9a96e; }

    .slots-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .slot-btn {
      padding: 10px 8px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.04);
      color: #f0eff4;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .slot-btn.available:hover { border-color: rgba(201,169,110,0.4); }
    .slot-btn.selected { background: rgba(201,169,110,0.15); border-color: #c9a96e; color: #c9a96e; }
    .slot-btn.booked { opacity: 0.3; cursor: not-allowed; text-decoration: line-through; }

    .summary-box {
      background: #1a1a26;
      border: 1px solid rgba(201,169,110,0.2);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .summary-box h3 { color: #c9a96e; font-size: 15px; font-weight: 600; margin: 0 0 16px; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 14px;
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-row span { color: #9997b0; }
    .summary-row strong { color: #f0eff4; }
    .summary-row .price { color: #c9a96e; font-size: 16px; }

    .step-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .btn-gold {
      padding: 12px 28px;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      color: #0a0a0f;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-gold:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-outline {
      padding: 12px 24px;
      background: transparent;
      color: #9997b0;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-outline:hover { color: #f0eff4; border-color: rgba(255,255,255,0.25); }

    /* Success */
    .success-screen {
      text-align: center;
      padding: 60px 0;
    }
    .success-icon {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: rgba(16,185,129,0.15);
      border: 2px solid #10b981;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; color: #10b981;
      margin: 0 auto 24px;
    }
    .success-screen h2 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 28px; margin: 0 0 8px; }
    .success-screen p { color: #9997b0; margin: 0 0 32px; }
    .appt-details {
      max-width: 400px;
      margin: 0 auto 32px;
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 20px;
      text-align: left;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 14px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-row span { color: #9997b0; }
    .detail-row strong { color: #f0eff4; }
    .success-actions { display: flex; justify-content: center; }

    /* My appointments */
    .my-appts { margin-top: 48px; }
    .my-appts h2 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 22px; margin: 0 0 20px; }
    .appts-list { display: flex; flex-direction: column; gap: 12px; }
    .appt-card {
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .appt-time { min-width: 80px; }
    .appt-date { display: block; color: #9997b0; font-size: 12px; }
    .appt-hour { display: block; color: #c9a96e; font-size: 18px; font-weight: 700; }
    .appt-info { flex: 1; }
    .appt-info strong { display: block; color: #f0eff4; font-size: 14px; }
    .appt-info span { color: #9997b0; font-size: 13px; }
    .appt-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
    .appt-price { color: #c9a96e; font-size: 15px; font-weight: 600; }
    .status-badge {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-confirmed { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-completed { background: rgba(99,102,241,0.15); color: #818cf8; }
    .status-cancelled { background: rgba(239,68,68,0.15); color: #ef4444; }

    @media (max-width: 640px) {
      .datetime-layout { grid-template-columns: 1fr; }
      .dates-grid { grid-template-columns: repeat(7, 1fr); }
      .barbers-grid, .services-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AppointmentsComponent {
  private auth = inject(AuthService);
  private apptService = inject(AppointmentService);
  private barberSvc = inject(BarberService);
  private catalogSvc = inject(CatalogService);

  step = signal(1);
  selectedBarber = signal<Barber | null>(null);
  selectedService = signal<BarberServiceModel | null>(null);
  selectedDate = signal('');
  selectedTime = signal('');
  bookedAppointment = signal<Appointment | null>(null);

  stepLabels = [
    { num: 1, label: 'Barbero' },
    { num: 2, label: 'Servicio' },
    { num: 3, label: 'Fecha & Hora' }
  ];

  activeBarbers = computed(() => this.barberSvc.barbers().filter(b => b.active));
  activeServices = computed(() => this.catalogSvc.services().filter(s => s.active));
  myAppointments = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    return this.apptService.getByUser(user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  availableSlots = computed(() => {
    const barber = this.selectedBarber();
    const date = this.selectedDate();
    if (!barber || !date) return [];
    return this.apptService.getAvailableSlots(barber.id, date);
  });

  next14Days = computed(() => {
    const barber = this.selectedBarber();
    const days: { value: string; dayName: string; dayNum: string; monthName: string; available: boolean }[] = [];
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayOfWeek = d.getDay();
      const available = barber ? barber.workingDays.includes(dayOfWeek) : false;
      days.push({
        value: d.toISOString().split('T')[0],
        dayName: dayNames[dayOfWeek],
        dayNum: String(d.getDate()),
        monthName: months[d.getMonth()],
        available
      });
    }
    return days;
  });

  starsArray(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  categoryIcon(category: string): string {
    const icons: Record<string, string> = {
      haircut: '💈', beard: '🪒', color: '🎨', treatment: '✨', combo: '⭐'
    };
    return icons[category] ?? '✂';
  }

  selectBarber(barber: Barber): void {
    this.selectedBarber.set(barber);
    this.selectedDate.set('');
    this.selectedTime.set('');
  }

  selectService(svc: BarberServiceModel): void {
    this.selectedService.set(svc);
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.selectedTime.set('');
  }

  confirmBooking(): void {
    const user = this.auth.currentUser();
    const barber = this.selectedBarber();
    const service = this.selectedService();
    if (!user || !barber || !service || !this.selectedDate() || !this.selectedTime()) return;

    const appt = this.apptService.create({
      userId: user.id,
      userName: user.name,
      barberId: barber.id,
      barberName: barber.name,
      serviceId: service.id,
      serviceName: service.name,
      date: this.selectedDate(),
      time: this.selectedTime(),
      status: 'pending',
      price: service.price
    });
    this.bookedAppointment.set(appt);
  }

  resetBooking(): void {
    this.step.set(1);
    this.selectedBarber.set(null);
    this.selectedService.set(null);
    this.selectedDate.set('');
    this.selectedTime.set('');
    this.bookedAppointment.set(null);
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada'
    };
    return labels[status] ?? status;
  }
}
