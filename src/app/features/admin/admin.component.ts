import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { BarberService } from '../../core/services/barber.service';
import { CatalogService } from '../../core/services/catalog.service';
import { AppointmentStatus } from '../../core/models/appointment.model';
import { Barber } from '../../core/models/barber.model';
import { BarberService as BarberServiceModel } from '../../core/models/service.model';

type Tab = 'dashboard' | 'appointments' | 'barbers' | 'services' | 'users';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="container">
        <div class="page-header">
          <h1>Panel de Administración</h1>
          <p>Gestiona todo el sistema</p>
        </div>

        <!-- Tabs -->
        <div class="tabs-bar">
          @for (t of tabs; track t.id) {
            <button class="tab-btn" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
              <span>{{ t.icon }}</span> {{ t.label }}
            </button>
          }
        </div>

        <!-- DASHBOARD TAB -->
        @if (activeTab() === 'dashboard') {
          <div class="stats-grid">
            <div class="stat-card gold">
              <div class="stat-icon">📅</div>
              <div class="stat-num">{{ todayAppointments().length }}</div>
              <div class="stat-label">Citas hoy</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <div class="stat-num">\${{ todayRevenue() }}</div>
              <div class="stat-label">Ingresos hoy</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">✂</div>
              <div class="stat-num">{{ activeBarbers() }}</div>
              <div class="stat-label">Barberos activos</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-num">{{ totalClients() }}</div>
              <div class="stat-label">Clientes</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏳</div>
              <div class="stat-num pending">{{ pendingCount() }}</div>
              <div class="stat-label">Pendientes</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-num completed">{{ completedCount() }}</div>
              <div class="stat-label">Completadas</div>
            </div>
          </div>

          <div class="recent-section">
            <h2>Citas recientes</h2>
            <div class="appts-list">
              @for (appt of recentAppointments(); track appt.id) {
                <div class="appt-row">
                  <span class="gold">{{ appt.time }}</span>
                  <span>{{ appt.userName }}</span>
                  <span>{{ appt.barberName }}</span>
                  <span>{{ appt.serviceName }}</span>
                  <span><span class="status-badge status-{{ appt.status }}">{{ statusLabel(appt.status) }}</span></span>
                  <span class="gold">\${{ appt.price }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- APPOINTMENTS TAB -->
        @if (activeTab() === 'appointments') {
          <div class="section">
            <div class="filters">
              <input class="filter-input" placeholder="Buscar cliente o barbero..." [(ngModel)]="apptSearch" />
              <select class="filter-select" [(ngModel)]="apptStatusFilter">
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div class="data-table">
              <div class="table-header appt-cols">
                <span>Fecha</span><span>Hora</span><span>Cliente</span><span>Barbero</span><span>Servicio</span><span>Estado</span><span>Precio</span><span>Acción</span>
              </div>
              @for (appt of filteredAppts(); track appt.id) {
                <div class="table-row appt-cols">
                  <span>{{ appt.date }}</span>
                  <span class="gold">{{ appt.time }}</span>
                  <span>{{ appt.userName }}</span>
                  <span>{{ appt.barberName }}</span>
                  <span>{{ appt.serviceName }}</span>
                  <span><span class="status-badge status-{{ appt.status }}">{{ statusLabel(appt.status) }}</span></span>
                  <span class="gold">\${{ appt.price }}</span>
                  <span>
                    <select class="mini-select" [value]="appt.status" (change)="changeApptStatus(appt.id, $any($event.target).value)">
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </span>
                </div>
              }
            </div>
          </div>
        }

        <!-- BARBERS TAB -->
        @if (activeTab() === 'barbers') {
          <div class="section">
            <div class="section-header">
              <h2>Barberos</h2>
              <button class="btn-gold" (click)="openBarberForm()">+ Nuevo barbero</button>
            </div>

            @if (showBarberForm()) {
              <div class="form-card">
                <h3>{{ editingBarber() ? 'Editar barbero' : 'Nuevo barbero' }}</h3>
                <div class="form-grid">
                  <div class="field">
                    <label>Nombre</label>
                    <input [(ngModel)]="barberForm.name" placeholder="Nombre completo" />
                  </div>
                  <div class="field">
                    <label>Email</label>
                    <input [(ngModel)]="barberForm.email" placeholder="email@ejemplo.com" />
                  </div>
                  <div class="field">
                    <label>Teléfono</label>
                    <input [(ngModel)]="barberForm.phone" placeholder="+1234567890" />
                  </div>
                  <div class="field">
                    <label>Especialidades (separadas por coma)</label>
                    <input [(ngModel)]="barberForm.specialties" placeholder="Fade, Barba, Color" />
                  </div>
                  <div class="field">
                    <label>Hora inicio</label>
                    <input [(ngModel)]="barberForm.startHour" placeholder="09:00" />
                  </div>
                  <div class="field">
                    <label>Hora fin</label>
                    <input [(ngModel)]="barberForm.endHour" placeholder="18:00" />
                  </div>
                </div>
                <div class="form-actions">
                  <button class="btn-outline" (click)="showBarberForm.set(false)">Cancelar</button>
                  <button class="btn-gold" (click)="saveBarber()">Guardar</button>
                </div>
              </div>
            }

            <div class="data-table">
              <div class="table-header barber-cols">
                <span>Nombre</span><span>Email</span><span>Teléfono</span><span>Especialidades</span><span>Estado</span><span>Acciones</span>
              </div>
              @for (barber of barberSvc.barbers(); track barber.id) {
                <div class="table-row barber-cols">
                  <span>{{ barber.name }}</span>
                  <span>{{ barber.email }}</span>
                  <span>{{ barber.phone }}</span>
                  <span>{{ barber.specialties.join(', ') }}</span>
                  <span>
                    <span class="status-badge" [class.status-confirmed]="barber.active" [class.status-cancelled]="!barber.active">
                      {{ barber.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </span>
                  <span class="row-actions">
                    <button class="action-icon edit" (click)="editBarber(barber)">✏</button>
                    <button class="action-icon toggle" (click)="toggleBarber(barber)">{{ barber.active ? '⏸' : '▶' }}</button>
                    <button class="action-icon del" (click)="deleteBarber(barber.id)">🗑</button>
                  </span>
                </div>
              }
            </div>
          </div>
        }

        <!-- SERVICES TAB -->
        @if (activeTab() === 'services') {
          <div class="section">
            <div class="section-header">
              <h2>Servicios</h2>
              <button class="btn-gold" (click)="openServiceForm()">+ Nuevo servicio</button>
            </div>

            @if (showServiceForm()) {
              <div class="form-card">
                <h3>{{ editingService() ? 'Editar servicio' : 'Nuevo servicio' }}</h3>
                <div class="form-grid">
                  <div class="field">
                    <label>Nombre</label>
                    <input [(ngModel)]="serviceForm.name" placeholder="Nombre del servicio" />
                  </div>
                  <div class="field">
                    <label>Descripción</label>
                    <input [(ngModel)]="serviceForm.description" placeholder="Descripción breve" />
                  </div>
                  <div class="field">
                    <label>Duración (minutos)</label>
                    <input type="number" [(ngModel)]="serviceForm.duration" placeholder="30" />
                  </div>
                  <div class="field">
                    <label>Precio</label>
                    <input type="number" [(ngModel)]="serviceForm.price" placeholder="20" />
                  </div>
                  <div class="field">
                    <label>Categoría</label>
                    <select [(ngModel)]="serviceForm.category">
                      <option value="haircut">Corte</option>
                      <option value="beard">Barba</option>
                      <option value="color">Color</option>
                      <option value="treatment">Tratamiento</option>
                      <option value="combo">Combo</option>
                    </select>
                  </div>
                </div>
                <div class="form-actions">
                  <button class="btn-outline" (click)="showServiceForm.set(false)">Cancelar</button>
                  <button class="btn-gold" (click)="saveService()">Guardar</button>
                </div>
              </div>
            }

            <div class="data-table">
              <div class="table-header service-cols">
                <span>Nombre</span><span>Descripción</span><span>Duración</span><span>Precio</span><span>Categoría</span><span>Estado</span><span>Acciones</span>
              </div>
              @for (svc of catalogSvc.services(); track svc.id) {
                <div class="table-row service-cols">
                  <span>{{ svc.name }}</span>
                  <span class="muted">{{ svc.description }}</span>
                  <span>{{ svc.duration }} min</span>
                  <span class="gold">\${{ svc.price }}</span>
                  <span><span class="category-tag">{{ svc.category }}</span></span>
                  <span>
                    <span class="status-badge" [class.status-confirmed]="svc.active" [class.status-cancelled]="!svc.active">
                      {{ svc.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </span>
                  <span class="row-actions">
                    <button class="action-icon edit" (click)="editService(svc)">✏</button>
                    <button class="action-icon toggle" (click)="toggleService(svc)">{{ svc.active ? '⏸' : '▶' }}</button>
                    <button class="action-icon del" (click)="deleteService(svc.id)">🗑</button>
                  </span>
                </div>
              }
            </div>
          </div>
        }

        <!-- USERS TAB -->
        @if (activeTab() === 'users') {
          <div class="section">
            <h2>Usuarios</h2>
            <div class="data-table">
              <div class="table-header user-cols">
                <span>Nombre</span><span>Email</span><span>Rol</span><span>Creado</span><span>Acciones</span>
              </div>
              @for (user of allUsers(); track user.id) {
                <div class="table-row user-cols">
                  <span>{{ user.name }}</span>
                  <span class="muted">{{ user.email }}</span>
                  <span><span class="role-badge role-{{ user.role }}">{{ roleLabel(user.role) }}</span></span>
                  <span class="muted">{{ user.createdAt | date:'dd/MM/yy' }}</span>
                  <span>
                    @if (user.id !== currentUserId()) {
                      <button class="action-icon del" (click)="deleteUser(user.id)">🗑</button>
                    }
                  </span>
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
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .page-header { margin-bottom: 28px; }
    .page-header h1 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 28px; margin: 0 0 6px; }
    .page-header p { color: #9997b0; margin: 0; }
    .tabs-bar {
      display: flex;
      gap: 4px;
      margin-bottom: 32px;
      background: rgba(255,255,255,0.03);
      padding: 4px;
      border-radius: 14px;
      overflow-x: auto;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border: none;
      background: transparent;
      color: #9997b0;
      font-size: 13px;
      font-weight: 500;
      border-radius: 10px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: #f0eff4; background: rgba(255,255,255,0.05); }
    .tab-btn.active { background: rgba(201,169,110,0.15); color: #c9a96e; }

    .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 40px; }
    .stat-card {
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .stat-card.gold { border-color: rgba(201,169,110,0.3); }
    .stat-icon { font-size: 24px; }
    .stat-num { font-size: 32px; font-weight: 700; color: #f0eff4; }
    .stat-num.pending { color: #f59e0b; }
    .stat-num.completed { color: #10b981; }
    .stat-label { color: #9997b0; font-size: 13px; }

    .recent-section h2 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 18px; margin: 0 0 14px; }
    .appts-list { display: flex; flex-direction: column; gap: 8px; }
    .appt-row {
      display: grid;
      grid-template-columns: 60px 1fr 1fr 1fr 130px 60px;
      gap: 12px;
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 13px;
      color: #f0eff4;
      align-items: center;
    }

    .section { margin-bottom: 32px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .section-header h2 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 20px; margin: 0; }

    .filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-input, .filter-select {
      background: #1a1a26;
      border: 1px solid rgba(255,255,255,0.1);
      color: #f0eff4;
      padding: 9px 14px;
      border-radius: 10px;
      font-size: 13px;
      outline: none;
    }
    .filter-input { min-width: 240px; }

    .data-table { background: #1a1a26; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
    .table-header, .table-row {
      display: grid;
      gap: 12px;
      padding: 12px 20px;
      align-items: center;
      font-size: 13px;
    }
    .appt-cols { grid-template-columns: 90px 60px 1fr 1fr 1fr 120px 60px 120px; }
    .barber-cols { grid-template-columns: 1fr 1fr 120px 1fr 100px 100px; }
    .service-cols { grid-template-columns: 1fr 1fr 90px 70px 100px 90px 100px; }
    .user-cols { grid-template-columns: 1fr 1fr 100px 100px 60px; }
    .table-header {
      background: rgba(255,255,255,0.03);
      color: #9997b0;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .table-row { color: #f0eff4; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .table-row:last-child { border-bottom: none; }
    .gold { color: #c9a96e; font-weight: 600; }
    .muted { color: #9997b0; }

    .status-badge {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    .status-pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-confirmed { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-completed { background: rgba(99,102,241,0.15); color: #818cf8; }
    .status-cancelled { background: rgba(239,68,68,0.15); color: #ef4444; }

    .role-badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .role-badge.role-admin { background: rgba(201,169,110,0.2); color: #c9a96e; }
    .role-badge.role-barber { background: rgba(16,185,129,0.15); color: #10b981; }
    .role-badge.role-user { background: rgba(99,102,241,0.15); color: #818cf8; }

    .category-tag {
      background: rgba(255,255,255,0.06);
      color: #9997b0;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
    }

    .row-actions { display: flex; gap: 6px; }
    .action-icon {
      width: 28px; height: 28px;
      border: none;
      border-radius: 7px;
      background: rgba(255,255,255,0.06);
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
      display: flex; align-items: center; justify-content: center;
    }
    .action-icon:hover { background: rgba(255,255,255,0.12); }
    .action-icon.del:hover { background: rgba(239,68,68,0.15); }
    .mini-select {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #f0eff4;
      padding: 4px 8px;
      border-radius: 7px;
      font-size: 11px;
    }

    .form-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(201,169,110,0.2);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .form-card h3 { color: #c9a96e; font-size: 16px; margin: 0 0 20px; }
    .form-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
    .field label { display: block; color: #9997b0; font-size: 12px; margin-bottom: 6px; font-weight: 600; }
    .field input, .field select {
      width: 100%;
      padding: 10px 14px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #f0eff4;
      font-size: 13px;
      box-sizing: border-box;
    }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
    .btn-gold {
      padding: 10px 24px;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      color: #0a0a0f;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-gold:hover { opacity: 0.9; }
    .btn-outline {
      padding: 10px 20px;
      background: transparent;
      color: #9997b0;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      font-size: 13px;
      cursor: pointer;
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2,1fr); }
      .form-grid { grid-template-columns: 1fr; }
      .tabs-bar { gap: 2px; }
    }
  `]
})
export class AdminComponent {
  auth = inject(AuthService);
  private apptService = inject(AppointmentService);
  barberSvc = inject(BarberService);
  catalogSvc = inject(CatalogService);

  activeTab = signal<Tab>('dashboard');
  tabs = [
    { id: 'dashboard' as Tab, icon: '📊', label: 'Dashboard' },
    { id: 'appointments' as Tab, icon: '📅', label: 'Citas' },
    { id: 'barbers' as Tab, icon: '✂', label: 'Barberos' },
    { id: 'services' as Tab, icon: '💈', label: 'Servicios' },
    { id: 'users' as Tab, icon: '👥', label: 'Usuarios' }
  ];

  apptSearch = '';
  apptStatusFilter = '';

  showBarberForm = signal(false);
  editingBarber = signal<Barber | null>(null);
  barberForm = { name: '', email: '', phone: '', specialties: '', startHour: '09:00', endHour: '18:00' };

  showServiceForm = signal(false);
  editingService = signal<BarberServiceModel | null>(null);
  serviceForm: { name: string; description: string; duration: number; price: number; category: BarberServiceModel['category'] } =
    { name: '', description: '', duration: 30, price: 15, category: 'haircut' };

  todayStr = computed(() => new Date().toISOString().split('T')[0]);
  allAppts = computed(() => this.apptService.getAll());
  todayAppointments = computed(() => this.allAppts().filter(a => a.date === this.todayStr()));
  todayRevenue = computed(() =>
    this.todayAppointments()
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + a.price, 0)
  );
  activeBarbers = computed(() => this.barberSvc.barbers().filter(b => b.active).length);
  totalClients = computed(() => this.auth.getAllUsers().filter(u => u.role === 'user').length);
  pendingCount = computed(() => this.allAppts().filter(a => a.status === 'pending').length);
  completedCount = computed(() => this.allAppts().filter(a => a.status === 'completed').length);
  recentAppointments = computed(() =>
    [...this.allAppts()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  );
  filteredAppts = computed(() => {
    let list = this.allAppts();
    if (this.apptSearch) {
      const q = this.apptSearch.toLowerCase();
      list = list.filter(a => a.userName.toLowerCase().includes(q) || a.barberName.toLowerCase().includes(q));
    }
    if (this.apptStatusFilter) list = list.filter(a => a.status === this.apptStatusFilter);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  });
  allUsers = computed(() => this.auth.getAllUsers());
  currentUserId = computed(() => this.auth.currentUser()?.id);

  statusLabel(status: string): string {
    const map: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' };
    return map[status] ?? status;
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = { admin: 'Admin', barber: 'Barbero', user: 'Usuario' };
    return map[role] ?? role;
  }

  changeApptStatus(id: string, status: AppointmentStatus): void {
    this.apptService.update(id, { status });
  }

  deleteUser(id: string): void {
    if (confirm('¿Eliminar usuario?')) this.auth.deleteUser(id);
  }

  // Barbers
  openBarberForm(): void {
    this.editingBarber.set(null);
    this.barberForm = { name: '', email: '', phone: '', specialties: '', startHour: '09:00', endHour: '18:00' };
    this.showBarberForm.set(true);
  }
  editBarber(barber: Barber): void {
    this.editingBarber.set(barber);
    this.barberForm = {
      name: barber.name,
      email: barber.email,
      phone: barber.phone,
      specialties: barber.specialties.join(', '),
      startHour: barber.workingHours.start,
      endHour: barber.workingHours.end
    };
    this.showBarberForm.set(true);
  }
  saveBarber(): void {
    const editing = this.editingBarber();
    const data: Barber = {
      id: editing?.id ?? `barber-${Date.now()}`,
      name: this.barberForm.name,
      email: this.barberForm.email,
      phone: this.barberForm.phone,
      specialties: this.barberForm.specialties.split(',').map(s => s.trim()).filter(Boolean),
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: this.barberForm.startHour, end: this.barberForm.endHour },
      active: editing?.active ?? true,
      rating: editing?.rating ?? 5,
      reviewCount: editing?.reviewCount ?? 0
    };
    if (editing) this.barberSvc.update(data.id, data);
    else this.barberSvc.create(data);
    this.showBarberForm.set(false);
  }
  toggleBarber(barber: Barber): void {
    this.barberSvc.update(barber.id, { active: !barber.active });
  }
  deleteBarber(id: string): void {
    if (confirm('¿Eliminar barbero?')) this.barberSvc.delete(id);
  }

  // Services
  openServiceForm(): void {
    this.editingService.set(null);
    this.serviceForm = { name: '', description: '', duration: 30, price: 15, category: 'haircut' };
    this.showServiceForm.set(true);
  }
  editService(svc: BarberServiceModel): void {
    this.editingService.set(svc);
    this.serviceForm = { name: svc.name, description: svc.description, duration: svc.duration, price: svc.price, category: svc.category };
    this.showServiceForm.set(true);
  }
  saveService(): void {
    const editing = this.editingService();
    const data: BarberServiceModel = {
      id: editing?.id ?? `svc-${Date.now()}`,
      name: this.serviceForm.name,
      description: this.serviceForm.description,
      duration: +this.serviceForm.duration,
      price: +this.serviceForm.price,
      category: this.serviceForm.category,
      active: editing?.active ?? true
    };
    if (editing) this.catalogSvc.update(data.id, data);
    else this.catalogSvc.create(data);
    this.showServiceForm.set(false);
  }
  toggleService(svc: BarberServiceModel): void {
    this.catalogSvc.update(svc.id, { active: !svc.active });
  }
  deleteService(id: string): void {
    if (confirm('¿Eliminar servicio?')) this.catalogSvc.delete(id);
  }
}
