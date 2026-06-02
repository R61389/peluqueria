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
            <div class="header-label">Nueva reserva</div>
            <h1>Reservar Cita</h1>
            <p>Elige tu barbero, servicio y horario preferido</p>
          </div>

          <!-- Premium step indicator -->
          <div class="steps-wrap">
            @for (s of stepLabels; track s.num) {
              <div class="step-item" [class.active]="step() === s.num" [class.done]="step() > s.num">
                <div class="step-circle">
                  @if (step() > s.num) {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  } @else {
                    <span>{{ s.num }}</span>
                  }
                </div>
                <div class="step-text">
                  <span class="step-num-label">Paso {{ s.num }}</span>
                  <span class="step-label">{{ s.label }}</span>
                </div>
              </div>
              @if (!$last) {
                <div class="step-connector" [class.done]="step() > s.num">
                  <div class="step-line"></div>
                </div>
              }
            }
          </div>

          <!-- Step 1: Choose Barber -->
          @if (step() === 1) {
            <div class="section">
              <div class="section-title">
                <h2>Elige tu barbero</h2>
                <p>Selecciona al profesional que atenderá tu cita</p>
              </div>
              <div class="barbers-grid">
                @for (barber of activeBarbers(); track barber.id) {
                  <div class="barber-card" [class.selected]="selectedBarber()?.id === barber.id" (click)="selectBarber(barber)">
                    @if (selectedBarber()?.id === barber.id) {
                      <div class="card-selected-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2.5"/></svg>
                      </div>
                    }
                    <div class="barber-avatar">{{ barber.name.charAt(0) }}</div>
                    <div class="barber-info">
                      <h3>{{ barber.name }}</h3>
                      <div class="stars">
                        @for (i of starsArray(barber.rating); track $index) {
                          <svg width="12" height="12" viewBox="0 0 24 24" [attr.fill]="(i + 1) <= barber.rating ? '#c9a96e' : 'none'" [attr.stroke]="(i + 1) <= barber.rating ? '#c9a96e' : '#4a4860'" stroke-width="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                        }
                        <span class="rating-text">{{ barber.rating }} ({{ barber.reviewCount }})</span>
                      </div>
                      <div class="specialties">
                        @for (s of barber.specialties; track s) {
                          <span class="specialty-chip">{{ s }}</span>
                        }
                      </div>
                      <div class="barber-hours">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="1.5"/></svg>
                        {{ barber.workingHours.start }} – {{ barber.workingHours.end }}
                      </div>
                    </div>
                  </div>
                }
              </div>
              <div class="step-actions">
                <button class="btn-gold" [disabled]="!selectedBarber()" (click)="step.set(2)">
                  Continuar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
            </div>
          }

          <!-- Step 2: Choose Service -->
          @if (step() === 2) {
            <div class="section">
              <div class="section-title">
                <h2>Elige el servicio</h2>
                <p>Selecciona el servicio que deseas</p>
              </div>
              <div class="services-grid">
                @for (svc of activeServices(); track svc.id) {
                  <div class="service-card" [class.selected]="selectedService()?.id === svc.id" (click)="selectService(svc)">
                    @if (selectedService()?.id === svc.id) {
                      <div class="card-selected-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2.5"/></svg>
                      </div>
                    }
                    <div class="svc-category-icon">{{ categoryIcon(svc.category) }}</div>
                    <div class="svc-info">
                      <h3>{{ svc.name }}</h3>
                      <p>{{ svc.description }}</p>
                      <div class="svc-meta">
                        <div class="svc-duration">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="1.5"/></svg>
                          {{ svc.duration }} min
                        </div>
                        <span class="svc-price">\${{ svc.price }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
              <div class="step-actions">
                <button class="btn-ghost-action" (click)="step.set(1)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Atrás
                </button>
                <button class="btn-gold" [disabled]="!selectedService()" (click)="step.set(3)">
                  Continuar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
            </div>
          }

          <!-- Step 3: Choose Date & Time -->
          @if (step() === 3) {
            <div class="section">
              <div class="section-title">
                <h2>Fecha y Hora</h2>
                <p>Elige el día y horario disponible</p>
              </div>
              <div class="datetime-layout">
                <div class="date-panel">
                  <div class="panel-label">Fecha disponible</div>
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
                  <div class="time-panel">
                    <div class="panel-label">Horario disponible</div>
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
                  <div class="summary-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#c9a96e" stroke-width="1.5"/><polyline points="22,4 12,14.01 9,11.01" stroke="#c9a96e" stroke-width="1.5"/></svg>
                    <h3>Resumen de tu cita</h3>
                  </div>
                  <div class="summary-rows">
                    <div class="summary-row"><span>Barbero</span><strong>{{ selectedBarber()?.name }}</strong></div>
                    <div class="summary-row"><span>Servicio</span><strong>{{ selectedService()?.name }}</strong></div>
                    <div class="summary-row"><span>Fecha</span><strong>{{ selectedDate() }}</strong></div>
                    <div class="summary-row"><span>Hora</span><strong>{{ selectedTime() }}</strong></div>
                    <div class="summary-row summary-price"><span>Total</span><strong class="price">\${{ selectedService()?.price }}</strong></div>
                  </div>
                </div>
              }

              <div class="step-actions">
                <button class="btn-ghost-action" (click)="step.set(2)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Atrás
                </button>
                <button class="btn-gold" [disabled]="!selectedDate() || !selectedTime()" (click)="confirmBooking()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="1.5"/><polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="1.5"/></svg>
                  Confirmar Reserva
                </button>
              </div>
            </div>
          }
        } @else {
          <!-- Success Screen -->
          <div class="success-screen">
            <div class="success-orb"></div>
            <div class="success-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h2>¡Cita reservada!</h2>
            <p>Tu cita ha sido confirmada exitosamente</p>
            <div class="appt-details">
              <div class="detail-row"><span>Barbero</span><strong>{{ bookedAppointment()!.barberName }}</strong></div>
              <div class="detail-row"><span>Servicio</span><strong>{{ bookedAppointment()!.serviceName }}</strong></div>
              <div class="detail-row"><span>Fecha</span><strong>{{ bookedAppointment()!.date }}</strong></div>
              <div class="detail-row"><span>Hora</span><strong>{{ bookedAppointment()!.time }}</strong></div>
              <div class="detail-row"><span>Precio</span><strong class="price">\${{ bookedAppointment()!.price }}</strong></div>
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
            <div class="my-appts-header">
              <h2>Mis citas</h2>
              <div class="header-line"></div>
            </div>
            <div class="appts-list">
              @for (appt of myAppointments(); track appt.id) {
                <div class="appt-card">
                  <div class="appt-time-block">
                    <span class="appt-date">{{ appt.date }}</span>
                    <span class="appt-hour">{{ appt.time }}</span>
                  </div>
                  <div class="appt-divider"></div>
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
    .page { min-height: 100vh; background: #080810; padding: 32px 0; }
    .container { max-width: 900px; margin: 0 auto; padding: 0 24px; }

    .page-header { margin-bottom: 36px; }
    .header-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #c9a96e;
      margin-bottom: 8px;
    }
    .page-header h1 {
      font-family: 'Playfair Display', serif;
      color: #f0eff4;
      font-size: 36px;
      margin: 0 0 8px;
    }
    .page-header p { color: #9997b0; margin: 0; }

    /* Steps */
    .steps-wrap {
      display: flex;
      align-items: center;
      margin-bottom: 48px;
      gap: 0;
    }
    .step-item {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .step-circle {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.03);
      border: 2px solid rgba(255,255,255,0.08);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; color: #4a4860;
      transition: all 0.3s;
      flex-shrink: 0;
    }
    .step-item.active .step-circle {
      background: rgba(201,169,110,0.12);
      border-color: #c9a96e;
      color: #c9a96e;
      box-shadow: 0 0 0 4px rgba(201,169,110,0.1);
    }
    .step-item.done .step-circle {
      background: linear-gradient(135deg, #c9a96e, #a07840);
      border-color: #c9a96e;
      color: #080810;
    }
    .step-text { display: flex; flex-direction: column; gap: 1px; }
    .step-num-label { font-size: 10px; color: #4a4860; text-transform: uppercase; letter-spacing: 0.5px; }
    .step-item.active .step-num-label { color: #c9a96e; }
    .step-item.done .step-num-label { color: #10b981; }
    .step-label { font-size: 13px; font-weight: 600; color: #4a4860; }
    .step-item.active .step-label { color: #f0eff4; }
    .step-item.done .step-label { color: #9997b0; }
    .step-connector {
      flex: 1;
      padding: 0 16px;
    }
    .step-line {
      height: 2px;
      background: rgba(255,255,255,0.06);
      border-radius: 2px;
      transition: background 0.4s;
    }
    .step-connector.done .step-line { background: linear-gradient(90deg, #c9a96e, rgba(201,169,110,0.4)); }

    /* Section */
    .section { margin-bottom: 32px; }
    .section-title { margin-bottom: 28px; }
    .section-title h2 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 24px; margin: 0 0 6px; }
    .section-title p { color: #9997b0; font-size: 14px; margin: 0; }

    /* Barber cards */
    .barbers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .barber-card {
      position: relative;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 24px;
      cursor: pointer;
      transition: all 0.25s;
      display: flex;
      gap: 18px;
      align-items: flex-start;
    }
    .barber-card:hover { border-color: rgba(201,169,110,0.25); background: rgba(255,255,255,0.03); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
    .barber-card.selected { border-color: #c9a96e; background: rgba(201,169,110,0.04); box-shadow: 0 0 0 1px rgba(201,169,110,0.3), 0 8px 32px rgba(201,169,110,0.1); }

    .card-selected-badge {
      position: absolute;
      top: 14px; right: 14px;
      width: 24px; height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      display: flex; align-items: center; justify-content: center;
      color: #080810;
    }

    .barber-avatar {
      width: 60px; height: 60px;
      border-radius: 16px;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Playfair Display', serif;
      font-size: 24px; font-weight: 700; color: #080810;
      flex-shrink: 0;
    }
    .barber-info h3 { color: #f0eff4; font-size: 16px; font-weight: 600; margin: 0 0 8px; }
    .stars { display: flex; align-items: center; gap: 3px; margin-bottom: 10px; }
    .rating-text { color: #9997b0; font-size: 11px; margin-left: 4px; }
    .specialties { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
    .specialty-chip {
      background: rgba(255,255,255,0.05);
      color: #9997b0;
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 11px;
      border: 1px solid rgba(255,255,255,0.07);
    }
    .barber-hours {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #9997b0;
      font-size: 12px;
    }

    /* Service cards */
    .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .service-card {
      position: relative;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 22px;
      cursor: pointer;
      transition: all 0.25s;
    }
    .service-card:hover { border-color: rgba(201,169,110,0.25); background: rgba(255,255,255,0.03); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
    .service-card.selected { border-color: #c9a96e; background: rgba(201,169,110,0.04); box-shadow: 0 0 0 1px rgba(201,169,110,0.3), 0 8px 32px rgba(201,169,110,0.1); }

    .svc-category-icon { font-size: 28px; margin-bottom: 12px; }
    .svc-info h3 { color: #f0eff4; font-size: 15px; font-weight: 600; margin: 0 0 6px; }
    .svc-info p { color: #9997b0; font-size: 13px; margin: 0 0 14px; line-height: 1.5; }
    .svc-meta { display: flex; align-items: center; justify-content: space-between; }
    .svc-duration { display: flex; align-items: center; gap: 5px; color: #9997b0; font-size: 12px; }
    .svc-price { color: #c9a96e; font-size: 20px; font-weight: 700; font-family: 'Playfair Display', serif; }

    /* Date & Time */
    .datetime-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; }
    .panel-label { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #9997b0; margin-bottom: 16px; }
    .dates-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    .date-btn {
      display: flex; flex-direction: column; align-items: center;
      padding: 8px 4px;
      border-radius: 12px;
      border: 1px solid transparent;
      background: rgba(255,255,255,0.03);
      cursor: pointer;
      transition: all 0.2s;
    }
    .date-btn.available { border-color: rgba(255,255,255,0.07); }
    .date-btn.available:hover { border-color: rgba(201,169,110,0.3); background: rgba(201,169,110,0.04); }
    .date-btn.selected { background: rgba(201,169,110,0.12); border-color: #c9a96e; box-shadow: 0 0 0 1px rgba(201,169,110,0.2); }
    .date-btn.unavailable { opacity: 0.2; cursor: not-allowed; }
    .date-day { font-size: 9px; color: #9997b0; text-transform: uppercase; letter-spacing: 0.5px; }
    .date-num { font-size: 15px; font-weight: 700; color: #f0eff4; margin: 3px 0; }
    .date-month { font-size: 9px; color: #9997b0; }
    .date-btn.selected .date-day,
    .date-btn.selected .date-num,
    .date-btn.selected .date-month { color: #c9a96e; }

    .slots-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .slot-btn {
      padding: 11px 8px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.07);
      background: rgba(255,255,255,0.03);
      color: #f0eff4;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .slot-btn.available:hover { border-color: rgba(201,169,110,0.3); background: rgba(201,169,110,0.04); }
    .slot-btn.selected { background: rgba(201,169,110,0.12); border-color: #c9a96e; color: #c9a96e; box-shadow: 0 0 0 1px rgba(201,169,110,0.2); }
    .slot-btn.booked { opacity: 0.2; cursor: not-allowed; text-decoration: line-through; }

    /* Summary */
    .summary-box {
      background: rgba(201,169,110,0.04);
      border: 1px solid rgba(201,169,110,0.15);
      border-radius: 18px;
      padding: 22px;
      margin-bottom: 28px;
    }
    .summary-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .summary-header h3 { color: #c9a96e; font-size: 14px; font-weight: 600; margin: 0; }
    .summary-rows { display: flex; flex-direction: column; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 14px;
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-row span { color: #9997b0; }
    .summary-row strong { color: #f0eff4; }
    .summary-price strong { color: #c9a96e; font-size: 18px; font-family: 'Playfair Display', serif; }

    /* Actions */
    .step-actions { display: flex; gap: 12px; justify-content: flex-end; }

    .btn-gold {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 13px 28px;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      color: #080810;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s;
      position: relative;
      overflow: hidden;
    }
    .btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(201,169,110,0.3); }
    .btn-gold:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

    .btn-ghost-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 13px 24px;
      background: transparent;
      color: #9997b0;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .btn-ghost-action:hover { color: #f0eff4; border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.03); }

    /* Success */
    .success-screen {
      text-align: center;
      padding: 60px 0 40px;
      position: relative;
    }
    .success-orb {
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 300px; height: 300px;
      border-radius: 50%;
      background: rgba(16,185,129,0.06);
      filter: blur(60px);
      pointer-events: none;
    }
    .success-icon {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: rgba(16,185,129,0.1);
      border: 2px solid rgba(16,185,129,0.3);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
      position: relative;
    }
    .success-screen h2 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 32px; margin: 0 0 10px; }
    .success-screen p { color: #9997b0; margin: 0 0 36px; }
    .appt-details {
      max-width: 400px;
      margin: 0 auto 36px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 18px;
      padding: 22px;
      text-align: left;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 14px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-row span { color: #9997b0; }
    .detail-row strong { color: #f0eff4; }
    .price { color: #c9a96e; font-family: 'Playfair Display', serif; font-size: 18px; }
    .success-actions { display: flex; justify-content: center; }

    /* My appointments */
    .my-appts { margin-top: 56px; }
    .my-appts-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
    .my-appts-header h2 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 22px; margin: 0; white-space: nowrap; }
    .header-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
    .appts-list { display: flex; flex-direction: column; gap: 12px; }
    .appt-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 18px 22px;
      display: flex;
      gap: 20px;
      align-items: center;
      transition: border-color 0.2s;
    }
    .appt-card:hover { border-color: rgba(255,255,255,0.1); }
    .appt-time-block { min-width: 70px; }
    .appt-date { display: block; color: #9997b0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .appt-hour { display: block; color: #c9a96e; font-size: 20px; font-weight: 700; font-family: 'Playfair Display', serif; }
    .appt-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.07); flex-shrink: 0; }
    .appt-info { flex: 1; }
    .appt-info strong { display: block; color: #f0eff4; font-size: 14px; font-weight: 600; margin-bottom: 3px; }
    .appt-info span { color: #9997b0; font-size: 13px; }
    .appt-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .appt-price { color: #c9a96e; font-size: 16px; font-weight: 700; font-family: 'Playfair Display', serif; }

    .status-badge {
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    .status-pending { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
    .status-confirmed { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
    .status-completed { background: rgba(139,92,246,0.12); color: #a78bfa; border: 1px solid rgba(139,92,246,0.2); }
    .status-cancelled { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

    @media (max-width: 640px) {
      .datetime-layout { grid-template-columns: 1fr; }
      .barbers-grid, .services-grid { grid-template-columns: 1fr; }
      .steps-wrap { gap: 4px; }
      .step-text { display: none; }
    }

    @media (max-width: 768px) {
      .page { padding: 20px 0; }
      .container { padding: 0 16px; }
      .page-header h1 { font-size: 28px; }
      .step-actions { flex-direction: column; }
      .btn-gold, .btn-ghost-action { width: 100%; justify-content: center; }
      .appt-card { flex-wrap: wrap; gap: 12px; }
      .appt-right { align-items: flex-start; }
      .summary-box { padding: 16px; }
    }

    @media (max-width: 480px) {
      .page-header h1 { font-size: 24px; }
      .section-title h2 { font-size: 20px; }
      .dates-grid { grid-template-columns: repeat(7, 1fr); gap: 4px; }
      .date-btn { padding: 6px 2px; }
      .date-num { font-size: 12px; }
      .date-day, .date-month { font-size: 8px; }
      .slots-grid { grid-template-columns: repeat(2, 1fr); }
      .barber-card { padding: 16px; border-radius: 16px; }
      .service-card { padding: 16px; border-radius: 16px; }
      .success-screen h2 { font-size: 26px; }
      .appt-details { padding: 16px; border-radius: 14px; }
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
    return [0, 1, 2, 3, 4];
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
