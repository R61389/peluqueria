import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../core/models/appointment.model';

@Component({
  selector: 'app-barber-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="container">
        <div class="page-header">
          <div>
            <h1>Bienvenido, {{ auth.currentUser()?.name }}</h1>
            <p>Panel de barbero — Gestiona tus citas</p>
          </div>
          <div class="today-badge">{{ todayStr() }}</div>
        </div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-num">{{ todayAppointments().length }}</div>
            <div class="stat-label">Hoy</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">{{ weekAppointments().length }}</div>
            <div class="stat-label">Esta semana</div>
          </div>
          <div class="stat-card">
            <div class="stat-num pending">{{ pendingCount() }}</div>
            <div class="stat-label">Pendientes</div>
          </div>
          <div class="stat-card">
            <div class="stat-num completed">{{ completedCount() }}</div>
            <div class="stat-label">Completadas</div>
          </div>
        </div>

        <!-- Today's appointments -->
        <div class="section">
          <h2>Citas de hoy</h2>
          @if (todayAppointments().length === 0) {
            <div class="empty-state">
              <span>📅</span>
              <p>No tienes citas programadas para hoy</p>
            </div>
          } @else {
            <div class="appts-list">
              @for (appt of todayAppointments(); track appt.id) {
                <div class="appt-card">
                  <div class="appt-time">{{ appt.time }}</div>
                  <div class="appt-info">
                    <strong>{{ appt.userName }}</strong>
                    <span>{{ appt.serviceName }}</span>
                  </div>
                  <span class="status-badge status-{{ appt.status }}">{{ statusLabel(appt.status) }}</span>
                  <div class="appt-actions">
                    @if (appt.status === 'pending') {
                      <button class="action-btn confirm" (click)="updateStatus(appt.id, 'confirmed')">Confirmar</button>
                    }
                    @if (appt.status === 'confirmed') {
                      <button class="action-btn complete" (click)="updateStatus(appt.id, 'completed')">Completar</button>
                    }
                    @if (appt.status !== 'completed' && appt.status !== 'cancelled') {
                      <button class="action-btn cancel" (click)="updateStatus(appt.id, 'cancelled')">Cancelar</button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Upcoming -->
        <div class="section">
          <h2>Próximas citas (7 días)</h2>
          @if (upcomingAppointments().length === 0) {
            <div class="empty-state">
              <span>📆</span>
              <p>No tienes citas próximas</p>
            </div>
          } @else {
            <div class="appts-list">
              @for (appt of upcomingAppointments(); track appt.id) {
                <div class="appt-card">
                  <div class="appt-datetime">
                    <span class="appt-date-label">{{ appt.date }}</span>
                    <span class="appt-time">{{ appt.time }}</span>
                  </div>
                  <div class="appt-info">
                    <strong>{{ appt.userName }}</strong>
                    <span>{{ appt.serviceName }}</span>
                  </div>
                  <span class="status-badge status-{{ appt.status }}">{{ statusLabel(appt.status) }}</span>
                  <div class="appt-actions">
                    @if (appt.status === 'pending') {
                      <button class="action-btn confirm" (click)="updateStatus(appt.id, 'confirmed')">Confirmar</button>
                      <button class="action-btn cancel" (click)="updateStatus(appt.id, 'cancelled')">Cancelar</button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- All appointments -->
        <div class="section">
          <h2>Historial completo</h2>
          <div class="filter-row">
            <select class="filter-select" [value]="statusFilter()" (change)="statusFilter.set($any($event.target).value)">
              <option value="">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          <div class="appts-table">
            <div class="table-header">
              <span>Fecha</span><span>Hora</span><span>Cliente</span><span>Servicio</span><span>Estado</span><span>Acciones</span>
            </div>
            @for (appt of filteredHistory(); track appt.id) {
              <div class="table-row">
                <span>{{ appt.date }}</span>
                <span class="gold">{{ appt.time }}</span>
                <span>{{ appt.userName }}</span>
                <span>{{ appt.serviceName }}</span>
                <span><span class="status-badge status-{{ appt.status }}">{{ statusLabel(appt.status) }}</span></span>
                <span class="table-actions">
                  @if (appt.status === 'pending') {
                    <button class="mini-btn confirm" (click)="updateStatus(appt.id, 'confirmed')">✓</button>
                    <button class="mini-btn cancel" (click)="updateStatus(appt.id, 'cancelled')">✕</button>
                  }
                  @if (appt.status === 'confirmed') {
                    <button class="mini-btn complete" (click)="updateStatus(appt.id, 'completed')">✓ Completar</button>
                  }
                </span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #0a0a0f; padding: 32px 0; }
    .container { max-width: 1000px; margin: 0 auto; padding: 0 24px; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }
    .page-header h1 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 28px; margin: 0 0 6px; }
    .page-header p { color: #9997b0; margin: 0; font-size: 14px; }
    .today-badge {
      background: rgba(201,169,110,0.1);
      border: 1px solid rgba(201,169,110,0.2);
      color: #c9a96e;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
    }
    .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 40px; }
    .stat-card {
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
    }
    .stat-num { font-size: 36px; font-weight: 700; color: #f0eff4; }
    .stat-num.pending { color: #f59e0b; }
    .stat-num.completed { color: #10b981; }
    .stat-label { color: #9997b0; font-size: 13px; margin-top: 4px; }
    .section { margin-bottom: 40px; }
    .section h2 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 20px; margin: 0 0 16px; }
    .empty-state {
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      padding: 40px;
      text-align: center;
    }
    .empty-state span { font-size: 32px; }
    .empty-state p { color: #9997b0; margin: 10px 0 0; }
    .appts-list { display: flex; flex-direction: column; gap: 10px; }
    .appt-card {
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .appt-datetime { display: flex; flex-direction: column; min-width: 90px; }
    .appt-date-label { color: #9997b0; font-size: 12px; }
    .appt-time { color: #c9a96e; font-size: 18px; font-weight: 700; min-width: 50px; }
    .appt-info { flex: 1; }
    .appt-info strong { display: block; color: #f0eff4; font-size: 14px; font-weight: 600; }
    .appt-info span { color: #9997b0; font-size: 13px; }
    .appt-actions { display: flex; gap: 8px; }
    .action-btn {
      padding: 6px 14px;
      border-radius: 8px;
      border: none;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .action-btn:hover { opacity: 0.8; }
    .action-btn.confirm { background: rgba(16,185,129,0.15); color: #10b981; }
    .action-btn.complete { background: rgba(99,102,241,0.15); color: #818cf8; }
    .action-btn.cancel { background: rgba(239,68,68,0.1); color: #ef4444; }
    .status-badge {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .status-pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-confirmed { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-completed { background: rgba(99,102,241,0.15); color: #818cf8; }
    .status-cancelled { background: rgba(239,68,68,0.15); color: #ef4444; }
    .filter-row { margin-bottom: 12px; }
    .filter-select {
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.1);
      color: #f0eff4;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 13px;
    }
    .appts-table { background: #1a1a26; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
    .table-header, .table-row {
      display: grid;
      grid-template-columns: 100px 60px 1fr 1fr 120px 1fr;
      gap: 12px;
      padding: 12px 20px;
      align-items: center;
      font-size: 13px;
    }
    .table-header {
      background: rgba(255,255,255,0.03);
      color: #9997b0;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .table-row { color: #f0eff4; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .table-row:last-child { border-bottom: none; }
    .gold { color: #c9a96e; font-weight: 600; }
    .table-actions { display: flex; gap: 6px; }
    .mini-btn {
      padding: 4px 8px;
      border-radius: 6px;
      border: none;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    .mini-btn.confirm { background: rgba(16,185,129,0.15); color: #10b981; }
    .mini-btn.complete { background: rgba(99,102,241,0.15); color: #818cf8; }
    .mini-btn.cancel { background: rgba(239,68,68,0.1); color: #ef4444; }
    @media (max-width: 640px) {
      .stats-row { grid-template-columns: repeat(2,1fr); }
      .table-header, .table-row { grid-template-columns: 80px 1fr 1fr; }
    }

    @media (max-width: 768px) {
      .page { padding: 20px 0; }
      .container { padding: 0 16px; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .page-header h1 { font-size: 22px; }
      .appts-table { overflow-x: auto; }
      .appt-card { flex-wrap: wrap; gap: 10px; }
      .appt-actions { width: 100%; }
      .action-btn { flex: 1; text-align: center; }
    }

    @media (max-width: 480px) {
      .stats-row { grid-template-columns: repeat(2,1fr); gap: 10px; }
      .stat-card { padding: 14px; border-radius: 12px; }
      .stat-num { font-size: 28px; }
      .today-badge { font-size: 11px; padding: 6px 12px; }
      .section h2 { font-size: 18px; }
    }
  `]
})
export class BarberDashboardComponent {
  auth = inject(AuthService);
  private apptService = inject(AppointmentService);
  statusFilter = signal('');

  private myAppts = computed(() => {
    const id = this.auth.currentUser()?.id;
    if (!id) return [];
    return this.apptService.getByBarber(id);
  });

  todayStr = computed(() => new Date().toISOString().split('T')[0]);

  todayAppointments = computed(() =>
    this.myAppts()
      .filter(a => a.date === this.todayStr() && a.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time))
  );

  weekAppointments = computed(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + 7);
    return this.myAppts().filter(a => {
      const d = new Date(a.date);
      return d >= today && d <= end && a.status !== 'cancelled';
    });
  });

  upcomingAppointments = computed(() => {
    const todayStr = this.todayStr();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return this.myAppts()
      .filter(a => a.date > todayStr && new Date(a.date) <= end && a.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  });

  pendingCount = computed(() => this.myAppts().filter(a => a.status === 'pending').length);
  completedCount = computed(() => this.myAppts().filter(a => a.status === 'completed').length);

  filteredHistory = computed(() => {
    const filter = this.statusFilter();
    return this.myAppts()
      .filter(a => !filter || a.status === filter)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  });

  updateStatus(id: string, status: AppointmentStatus): void {
    this.apptService.update(id, { status });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada'
    };
    return map[status] ?? status;
  }
}
