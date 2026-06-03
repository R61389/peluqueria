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
          <div class="header-label">Panel de Control</div>
          <h1>Administración</h1>
          <p>Gestiona todo el sistema BarberAI</p>
        </div>

        <!-- Tabs -->
        <div class="tabs-bar">
          @for (t of tabs; track t.id) {
            <button class="tab-btn" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
              <span class="tab-icon" [innerHTML]="t.icon"></span> {{ t.label }}
            </button>
          }
        </div>

        <!-- DASHBOARD TAB -->
        @if (activeTab() === 'dashboard') {

          <!-- Bento stats grid -->
          <div class="bento-grid">
            <!-- Appointments card — large, gold glow -->
            <div class="stat-card stat-gold">
              <div class="stat-bg-deco">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" opacity="0.08">
                  <circle cx="60" cy="60" r="55" stroke="#c9a96e" stroke-width="1"/>
                  <circle cx="60" cy="60" r="40" stroke="#c9a96e" stroke-width="1"/>
                  <circle cx="60" cy="60" r="25" stroke="#c9a96e" stroke-width="1"/>
                </svg>
              </div>
              <div class="stat-header">
                <div class="stat-icon-wrap gold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#c9a96e" stroke-width="1.5"/><line x1="16" y1="2" x2="16" y2="6" stroke="#c9a96e" stroke-width="1.5"/><line x1="8" y1="2" x2="8" y2="6" stroke="#c9a96e" stroke-width="1.5"/><line x1="3" y1="10" x2="21" y2="10" stroke="#c9a96e" stroke-width="1.5"/></svg>
                </div>
                <div class="stat-trend">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 17l5-5 5 5M7 11l5-5 5 5" stroke="#10b981" stroke-width="2"/></svg>
                  <span>Hoy</span>
                </div>
              </div>
              <div class="stat-num">{{ todayAppointments().length }}</div>
              <div class="stat-label">Citas hoy</div>
            </div>

            <!-- Revenue card — purple tint -->
            <div class="stat-card stat-purple">
              <div class="stat-bg-deco">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" opacity="0.08">
                  <circle cx="60" cy="60" r="55" stroke="#a78bfa" stroke-width="1"/>
                  <circle cx="60" cy="60" r="35" stroke="#a78bfa" stroke-width="1"/>
                </svg>
              </div>
              <div class="stat-header">
                <div class="stat-icon-wrap purple">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="12" y1="1" x2="12" y2="23" stroke="#a78bfa" stroke-width="1.5"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#a78bfa" stroke-width="1.5"/></svg>
                </div>
                <div class="stat-trend">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 17l5-5 5 5M7 11l5-5 5 5" stroke="#10b981" stroke-width="2"/></svg>
                  <span>Hoy</span>
                </div>
              </div>
              <div class="stat-num">\${{ todayRevenue() }}</div>
              <div class="stat-label">Ingresos hoy</div>
            </div>

            <!-- Barbers card — green tint -->
            <div class="stat-card stat-green">
              <div class="stat-bg-deco">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" opacity="0.08">
                  <circle cx="60" cy="60" r="55" stroke="#10b981" stroke-width="1"/>
                  <circle cx="60" cy="60" r="35" stroke="#10b981" stroke-width="1"/>
                </svg>
              </div>
              <div class="stat-header">
                <div class="stat-icon-wrap green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 2 L6 22 M6 9 Q10 6 14 9 Q18 6 18 2" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/></svg>
                </div>
                <div class="stat-trend">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 17l5-5 5 5M7 11l5-5 5 5" stroke="#10b981" stroke-width="2"/></svg>
                  <span>Activos</span>
                </div>
              </div>
              <div class="stat-num">{{ activeBarbers() }}</div>
              <div class="stat-label">Barberos activos</div>
            </div>

            <!-- Clients card — blue tint -->
            <div class="stat-card stat-blue">
              <div class="stat-bg-deco">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" opacity="0.08">
                  <circle cx="60" cy="60" r="55" stroke="#60a5fa" stroke-width="1"/>
                  <circle cx="60" cy="60" r="35" stroke="#60a5fa" stroke-width="1"/>
                </svg>
              </div>
              <div class="stat-header">
                <div class="stat-icon-wrap blue">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#60a5fa" stroke-width="1.5"/><circle cx="9" cy="7" r="4" stroke="#60a5fa" stroke-width="1.5"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#60a5fa" stroke-width="1.5"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#60a5fa" stroke-width="1.5"/></svg>
                </div>
                <div class="stat-trend">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 17l5-5 5 5M7 11l5-5 5 5" stroke="#10b981" stroke-width="2"/></svg>
                  <span>Total</span>
                </div>
              </div>
              <div class="stat-num">{{ totalClients() }}</div>
              <div class="stat-label">Clientes</div>
            </div>

            <!-- Pending + Completed — smaller -->
            <div class="stat-card stat-amber stat-sm">
              <div class="stat-header">
                <div class="stat-icon-wrap amber">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="1.5"/><line x1="12" y1="6" x2="12" y2="12" stroke="#f59e0b" stroke-width="1.5"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="#f59e0b" stroke-width="1.5"/></svg>
                </div>
              </div>
              <div class="stat-num amber-text">{{ pendingCount() }}</div>
              <div class="stat-label">Pendientes</div>
            </div>

            <div class="stat-card stat-emerald stat-sm">
              <div class="stat-header">
                <div class="stat-icon-wrap emerald">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#10b981" stroke-width="1.5"/><polyline points="22,4 12,14.01 9,11.01" stroke="#10b981" stroke-width="1.5"/></svg>
                </div>
              </div>
              <div class="stat-num emerald-text">{{ completedCount() }}</div>
              <div class="stat-label">Completadas</div>
            </div>
          </div>

          <div class="recent-section">
            <div class="recent-header">
              <h2>Citas recientes</h2>
              <div class="header-line"></div>
            </div>
            <div class="appts-list">
              @for (appt of recentAppointments(); track appt.id) {
                <div class="appt-row">
                  <span class="gold-text">{{ appt.time }}</span>
                  <span>{{ appt.userName }}</span>
                  <span>{{ appt.barberName }}</span>
                  <span>{{ appt.serviceName }}</span>
                  <span><span class="status-badge status-{{ appt.status }}">{{ statusLabel(appt.status) }}</span></span>
                  <span class="gold-text">\${{ appt.price }}</span>
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
                  <span class="gold-text">{{ appt.time }}</span>
                  <span>{{ appt.userName }}</span>
                  <span>{{ appt.barberName }}</span>
                  <span>{{ appt.serviceName }}</span>
                  <span><span class="status-badge status-{{ appt.status }}">{{ statusLabel(appt.status) }}</span></span>
                  <span class="gold-text">\${{ appt.price }}</span>
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
              <button class="btn-gold-sm" (click)="openBarberForm()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2"/></svg>
                Nuevo barbero
              </button>
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
                  <button class="btn-outline-sm" (click)="showBarberForm.set(false)">Cancelar</button>
                  <button class="btn-gold-sm" (click)="saveBarber()">Guardar</button>
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
                    <button class="action-icon" (click)="editBarber(barber)" title="Editar">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="1.5"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5"/></svg>
                    </button>
                    <button class="action-icon" (click)="toggleBarber(barber)" title="Toggle">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="15" x2="10" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="14" y1="15" x2="14" y2="9" stroke="currentColor" stroke-width="1.5"/></svg>
                    </button>
                    <button class="action-icon action-del" (click)="deleteBarber(barber.id)" title="Eliminar">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="1.5"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.5"/></svg>
                    </button>
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
              <button class="btn-gold-sm" (click)="openServiceForm()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2"/></svg>
                Nuevo servicio
              </button>
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
                  <button class="btn-outline-sm" (click)="showServiceForm.set(false)">Cancelar</button>
                  <button class="btn-gold-sm" (click)="saveService()">Guardar</button>
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
                  <span class="gold-text">\${{ svc.price }}</span>
                  <span><span class="category-tag">{{ svc.category }}</span></span>
                  <span>
                    <span class="status-badge" [class.status-confirmed]="svc.active" [class.status-cancelled]="!svc.active">
                      {{ svc.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </span>
                  <span class="row-actions">
                    <button class="action-icon" (click)="editService(svc)" title="Editar">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="1.5"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5"/></svg>
                    </button>
                    <button class="action-icon" (click)="toggleService(svc)" title="Toggle">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="15" x2="10" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="14" y1="15" x2="14" y2="9" stroke="currentColor" stroke-width="1.5"/></svg>
                    </button>
                    <button class="action-icon action-del" (click)="deleteService(svc.id)" title="Eliminar">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="1.5"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.5"/></svg>
                    </button>
                  </span>
                </div>
              }
            </div>
          </div>
        }

        <!-- USERS TAB -->
        @if (activeTab() === 'users') {
          <div class="section">
            <div class="section-header">
              <h2>Usuarios</h2>
            </div>
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
                      <button class="action-icon action-del" (click)="deleteUser(user.id)" title="Eliminar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="1.5"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.5"/></svg>
                      </button>
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
    .page { min-height: 100vh; background: #080810; padding: 32px 0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

    .page-header { margin-bottom: 32px; }
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
      font-size: 32px;
      margin: 0 0 6px;
      background: linear-gradient(135deg, #f0eff4 0%, #9997b0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .page-header p { color: #9997b0; margin: 0; }

    .tabs-bar {
      display: flex;
      gap: 4px;
      margin-bottom: 32px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
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
    .tab-btn.active { background: rgba(201,169,110,0.12); color: #c9a96e; border: 1px solid rgba(201,169,110,0.2); }
    .tab-icon { font-size: 14px; }

    /* Bento grid */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: auto auto;
      gap: 16px;
      margin-bottom: 40px;
    }
    .stat-card {
      position: relative;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 24px;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: default;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255,255,255,0.1);
    }
    .stat-card.stat-sm {
      padding: 20px;
    }
    .stat-gold {
      border-color: rgba(201,169,110,0.15);
      background: linear-gradient(135deg, rgba(201,169,110,0.06) 0%, rgba(255,255,255,0.02) 100%);
    }
    .stat-gold:hover { border-color: rgba(201,169,110,0.3); box-shadow: 0 8px 32px rgba(201,169,110,0.1); }
    .stat-purple {
      border-color: rgba(167,139,250,0.12);
      background: linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(255,255,255,0.02) 100%);
    }
    .stat-purple:hover { border-color: rgba(167,139,250,0.25); box-shadow: 0 8px 32px rgba(167,139,250,0.08); }
    .stat-green {
      border-color: rgba(16,185,129,0.12);
      background: linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(255,255,255,0.02) 100%);
    }
    .stat-green:hover { border-color: rgba(16,185,129,0.25); box-shadow: 0 8px 32px rgba(16,185,129,0.08); }
    .stat-blue {
      border-color: rgba(96,165,250,0.12);
      background: linear-gradient(135deg, rgba(96,165,250,0.06) 0%, rgba(255,255,255,0.02) 100%);
    }
    .stat-blue:hover { border-color: rgba(96,165,250,0.25); box-shadow: 0 8px 32px rgba(96,165,250,0.08); }
    .stat-amber {
      border-color: rgba(245,158,11,0.12);
      background: linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(255,255,255,0.02) 100%);
    }
    .stat-amber:hover { border-color: rgba(245,158,11,0.25); }
    .stat-emerald {
      border-color: rgba(16,185,129,0.12);
      background: linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(255,255,255,0.02) 100%);
    }
    .stat-emerald:hover { border-color: rgba(16,185,129,0.25); }

    .stat-bg-deco {
      position: absolute;
      right: -10px;
      bottom: -10px;
      pointer-events: none;
    }
    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .stat-icon-wrap {
      width: 36px; height: 36px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon-wrap.gold { background: rgba(201,169,110,0.12); border: 1px solid rgba(201,169,110,0.2); }
    .stat-icon-wrap.purple { background: rgba(167,139,250,0.12); border: 1px solid rgba(167,139,250,0.2); }
    .stat-icon-wrap.green { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.2); }
    .stat-icon-wrap.blue { background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.2); }
    .stat-icon-wrap.amber { background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.2); }
    .stat-icon-wrap.emerald { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.2); }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #10b981;
      background: rgba(16,185,129,0.1);
      padding: 3px 8px;
      border-radius: 100px;
    }
    .stat-num {
      font-size: 36px;
      font-weight: 700;
      color: #f0eff4;
      font-family: 'Playfair Display', serif;
      line-height: 1;
      margin-bottom: 6px;
    }
    .stat-card.stat-sm .stat-num { font-size: 28px; }
    .amber-text { color: #f59e0b; }
    .emerald-text { color: #10b981; }
    .stat-label { color: #9997b0; font-size: 13px; }

    /* Recent section */
    .recent-section { margin-bottom: 32px; }
    .recent-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .recent-header h2 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 20px; margin: 0; white-space: nowrap; }
    .header-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
    .appts-list { display: flex; flex-direction: column; gap: 8px; }
    .appt-row {
      display: grid;
      grid-template-columns: 60px 1fr 1fr 1fr 130px 60px;
      gap: 12px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 13px;
      color: #f0eff4;
      align-items: center;
      transition: border-color 0.2s;
    }
    .appt-row:hover { border-color: rgba(255,255,255,0.1); }

    .gold-text { color: #c9a96e; font-weight: 600; }

    .section { margin-bottom: 32px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .section-header h2 { font-family: 'Playfair Display', serif; color: #f0eff4; font-size: 20px; margin: 0; }

    .filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-input, .filter-select {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      color: #f0eff4;
      padding: 9px 14px;
      border-radius: 10px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .filter-input:focus, .filter-select:focus { border-color: rgba(201,169,110,0.3); }
    .filter-input { min-width: 240px; }

    .data-table {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      overflow: hidden;
    }
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
      background: rgba(255,255,255,0.02);
      color: #9997b0;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .table-row { color: #f0eff4; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s; }
    .table-row:last-child { border-bottom: none; }
    .table-row:hover { background: rgba(255,255,255,0.02); }
    .muted { color: #9997b0; }

    .status-badge {
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    .status-pending { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
    .status-confirmed { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
    .status-completed { background: rgba(139,92,246,0.12); color: #a78bfa; border: 1px solid rgba(139,92,246,0.2); }
    .status-cancelled { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

    .role-badge {
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 600;
    }
    .role-badge.role-admin { background: rgba(201,169,110,0.12); color: #c9a96e; border: 1px solid rgba(201,169,110,0.2); }
    .role-badge.role-barber { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
    .role-badge.role-user { background: rgba(139,92,246,0.12); color: #a78bfa; border: 1px solid rgba(139,92,246,0.2); }

    .category-tag {
      background: rgba(255,255,255,0.05);
      color: #9997b0;
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 11px;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .row-actions { display: flex; gap: 6px; }
    .action-icon {
      width: 28px; height: 28px;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
      background: rgba(255,255,255,0.03);
      cursor: pointer;
      color: #9997b0;
      transition: all 0.2s;
      display: flex; align-items: center; justify-content: center;
    }
    .action-icon:hover { background: rgba(255,255,255,0.08); color: #f0eff4; border-color: rgba(255,255,255,0.15); }
    .action-icon.action-del:hover { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.2); }
    .mini-select {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      color: #f0eff4;
      padding: 4px 8px;
      border-radius: 7px;
      font-size: 11px;
      font-family: 'Inter', sans-serif;
    }

    .form-card {
      background: rgba(201,169,110,0.03);
      border: 1px solid rgba(201,169,110,0.15);
      border-radius: 18px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .form-card h3 { color: #c9a96e; font-family: 'Playfair Display', serif; font-size: 16px; margin: 0 0 20px; }
    .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { display: block; color: #9997b0; font-size: 12px; margin-bottom: 0; font-weight: 500; }
    .field input, .field select {
      width: 100%;
      padding: 10px 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      color: #f0eff4;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
    }
    .field input:focus, .field select:focus { border-color: rgba(201,169,110,0.4); }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

    .btn-gold-sm {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 18px;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      color: #080810;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-gold-sm:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(201,169,110,0.3); }

    .btn-outline-sm {
      padding: 9px 18px;
      background: transparent;
      color: #9997b0;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-outline-sm:hover { color: #f0eff4; border-color: rgba(255,255,255,0.2); }

    @media (max-width: 900px) {
      .bento-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .page { padding: 20px 0; }
      .container { padding: 0 16px; }
      .page-header h1 { font-size: 26px; }
      .bento-grid { grid-template-columns: repeat(2, 1fr); }
      .form-grid { grid-template-columns: 1fr; }
      .tabs-bar { gap: 2px; }
      .tab-btn { padding: 8px 12px; font-size: 12px; }
      .data-table { overflow-x: auto; }
      .table-header, .table-row {
        min-width: 600px;
        font-size: 12px;
      }
      .appt-row { min-width: 700px; }
      .filters { flex-direction: column; }
      .filter-input { min-width: unset; width: 100%; }
      .filter-select { width: 100%; }
      .form-actions { flex-direction: column; }
      .btn-gold-sm, .btn-outline-sm { width: 100%; justify-content: center; }
    }
    @media (max-width: 480px) {
      .bento-grid { grid-template-columns: 1fr; }
      .stat-num { font-size: 28px; }
      .stat-card.stat-sm .stat-num { font-size: 22px; }
      .tabs-bar { flex-wrap: nowrap; overflow-x: auto; }
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
    { id: 'dashboard' as Tab, icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="1.5" rx="1"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="1.5" rx="1"/><rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="1.5" rx="1"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="1.5" rx="1"/></svg>', label: 'Dashboard' },
    { id: 'appointments' as Tab, icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>', label: 'Citas' },
    { id: 'barbers' as Tab, icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 2 L6 22 M6 9 Q10 6 14 9 Q18 6 18 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>', label: 'Barberos' },
    { id: 'services' as Tab, icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0" stroke="currentColor" stroke-width="1.5"/></svg>', label: 'Servicios' },
    { id: 'users' as Tab, icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="1.5"/></svg>', label: 'Usuarios' },
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
    const newId = editing?.id ?? `barber-${Date.now()}`;
    const data: Barber = {
      id: newId,
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
    if (editing) {
      this.barberSvc.update(data.id, data);
    } else {
      this.barberSvc.create(data);
      // Create matching user account so the barber can log in
      const result = this.auth.createBarberUser(newId, data.name, data.email, data.phone);
      if (!result.success) {
        alert(`Barbero creado pero no se pudo crear la cuenta: ${result.error}`);
      }
    }
    this.showBarberForm.set(false);
  }
  toggleBarber(barber: Barber): void {
    this.barberSvc.update(barber.id, { active: !barber.active });
  }
  deleteBarber(id: string): void {
    if (confirm('¿Eliminar barbero? También se eliminará su cuenta de acceso.')) {
      this.barberSvc.delete(id);
      this.auth.removeBarberUser(id);
    }
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
