import {
  Component, signal, inject, ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhatsAppService, WaStatus } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-whatsapp-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="wa-settings">
  <div class="wa-header">
    <div class="wa-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.137.562 4.14 1.542 5.877L0 24l6.317-1.518A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.68-.503-5.218-1.381l-.374-.22-3.749.901.927-3.65-.243-.388A9.946 9.946 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    </div>
    <div>
      <h3 class="wa-title">WhatsApp Automático</h3>
      <p class="wa-subtitle">Confirmaciones, recordatorios y notificaciones via OpenWA</p>
    </div>
    <div class="status-pill" [class]="'status-' + status()">
      <span class="status-dot"></span>
      {{ statusLabel() }}
    </div>
  </div>

  <!-- Connection form -->
  <div class="form-section">
    <div class="form-row">
      <label class="form-label">ID de sesión</label>
      <input
        class="form-input"
        type="text"
        [(ngModel)]="configSession"
        placeholder="peluqueria"
      />
    </div>
    <div class="form-row">
      <label class="form-label">API Key</label>
      <div class="input-group">
        <input
          class="form-input"
          type="password"
          [(ngModel)]="configApiKey"
          placeholder="owa_k1_..."
        />
        <span class="input-hint">Aparece en los logs de Docker al arrancar OpenWA</span>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn-save" (click)="saveConfig()">Guardar configuración</button>
      <button class="btn-test" (click)="testConnection()" [disabled]="testing()">
        @if (testing()) {
          <span class="btn-spinner"></span> Conectando…
        } @else {
          Verificar conexión
        }
      </button>
      @if (configApiKey) {
        <button class="btn-clear" (click)="clearConfig()">Desconectar</button>
      }
    </div>

    @if (testResult()) {
      <div class="test-result" [class.success]="testResult() === 'ok'" [class.error]="testResult() !== 'ok'">
        @if (testResult() === 'ok') {
          ✅ Conexión exitosa — WhatsApp listo para enviar mensajes
        } @else {
          ❌ {{ testResult() }}
        }
      </div>
    }
  </div>

  <!-- QR Code section -->
  <!-- QR section — visible whenever a URL is configured and not yet ready -->
  @if (configApiKey && status() !== 'ready') {
    <div class="qr-section">
      <h4 class="qr-title">Vincular WhatsApp</h4>
      <p class="qr-hint">1 · Guarda la configuración &nbsp;·&nbsp; 2 · Carga el QR &nbsp;·&nbsp; 3 · Escanéalo con tu celular</p>
      <p class="qr-hint">En WhatsApp: <strong>⋮ → Dispositivos vinculados → Vincular dispositivo</strong></p>
      @if (qrCode()) {
        <div class="qr-container">
          <img [src]="qrCode()!" alt="QR Code WhatsApp" class="qr-img"/>
          <button class="btn-qr btn-refresh" (click)="loadQr()">🔄 Actualizar QR</button>
        </div>
      } @else {
        <button class="btn-qr" (click)="loadQr()">
          📱 Cargar código QR automáticamente
        </button>
        @if (qrError()) {
          <p class="qr-error">{{ qrError() }}</p>
          <details class="manual-qr-details">
            <summary class="manual-qr-summary">📋 Pegar QR manualmente (alternativa)</summary>
            <div class="manual-qr-body">
              <p class="manual-qr-hint">Ejecuta este comando en tu terminal y pega el valor de <code>qrCode</code> aquí:</p>
              <pre class="code-block">curl http://localhost:3000/api/sessions/{{ configSession || 'TU_SESSION_ID' }}/qr -H "x-api-key: {{ configApiKey }}"</pre>
              <textarea
                class="qr-paste-input"
                rows="3"
                placeholder="Pega aquí el valor de qrCode (empieza con data:image/png;base64,... o iVBOR...)"
                (input)="onQrPaste($event)"
              ></textarea>
            </div>
          </details>
        }
        <p class="qr-pre-hint">Asegúrate de haber ejecutado <code>docker compose up -d openwa</code> primero</p>
      }
    </div>
  }

  @if (status() === 'ready') {
    <div class="connected-banner">
      ✅ WhatsApp conectado y listo para enviar mensajes automáticos
    </div>
  }

  <!-- Features list -->
  <div class="features-grid">
    @for (f of features; track f.label) {
      <div class="feature-item">
        <span class="feature-icon">{{ f.icon }}</span>
        <div>
          <div class="feature-label">{{ f.label }}</div>
          <div class="feature-desc">{{ f.desc }}</div>
        </div>
      </div>
    }
  </div>

  <!-- Docker setup instructions -->
  <details class="setup-details">
    <summary class="setup-summary">¿Cómo instalar OpenWA? Ver instrucciones</summary>
    <div class="setup-content">
      <p><strong>Opción 1 — Docker (recomendado):</strong></p>
      <pre class="code-block">docker compose up -d openwa</pre>
      <p>Luego abre <code>http://localhost:3000/api/docs</code> para ver la documentación.</p>

      <p><strong>Opción 2 — Manual:</strong></p>
      <pre class="code-block">git clone https://github.com/rmyndharis/OpenWA.git
cd OpenWA
npm install
npm run start</pre>

      <p><strong>Crear sesión:</strong></p>
      <pre class="code-block">POST http://localhost:3000/api/sessions
{{ '{' }} "name": "peluqueria" {{ '}' }}

POST http://localhost:3000/api/sessions/peluqueria/start</pre>
    </div>
  </details>
</div>
  `,
  styles: [`
    :host { display: block; }
    .wa-settings {
      padding: 20px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(37,211,102,0.15);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .wa-header {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .wa-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.2);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .wa-title { margin: 0; font-size: 15px; font-weight: 700; color: #f0eff4; }
    .wa-subtitle { margin: 2px 0 0; font-size: 12px; color: #9997b0; }
    .status-pill {
      margin-left: auto; display: flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; }
    .status-ready   { background: rgba(74,222,128,0.1);  color: #4ade80; border: 1px solid rgba(74,222,128,0.25); }
    .status-ready .status-dot   { background: #4ade80; }
    .status-offline  { background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.25); }
    .status-offline .status-dot { background: #f87171; }
    .status-connecting { background: rgba(251,191,36,0.1); color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); }
    .status-connecting .status-dot { background: #fbbf24; animation: pulse 1s infinite; }
    .status-disabled { background: rgba(153,151,176,0.1); color: #9997b0; border: 1px solid rgba(153,151,176,0.2); }
    .status-disabled .status-dot { background: #9997b0; }
    .status-unknown  { background: rgba(153,151,176,0.1); color: #9997b0; border: 1px solid rgba(153,151,176,0.2); }
    .status-unknown .status-dot  { background: #9997b0; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

    .form-section { display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 12px; font-weight: 600; color: #9997b0; text-transform: uppercase; letter-spacing: .05em; }
    .input-group { display: flex; flex-direction: column; gap: 4px; }
    .input-hint { font-size: 11px; color: #6b6980; }
    .form-input {
      padding: 10px 14px; border-radius: 10px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      color: #f0eff4; font-size: 13px; outline: none; width: 100%;
    }
    .form-input:focus { border-color: rgba(37,211,102,0.4); }
    .form-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-save {
      padding: 9px 20px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #25D366, #128C7E);
      color: white; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .btn-test {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 20px; border-radius: 10px;
      border: 1px solid rgba(37,211,102,0.3);
      background: transparent; color: #25D366; font-size: 13px; cursor: pointer;
    }
    .btn-test:disabled { opacity: .5; cursor: not-allowed; }
    .btn-clear {
      padding: 9px 16px; border-radius: 10px;
      border: 1px solid rgba(248,113,113,0.3);
      background: transparent; color: #f87171; font-size: 13px; cursor: pointer;
    }
    .btn-spinner {
      width: 12px; height: 12px; border: 2px solid rgba(37,211,102,.3);
      border-top-color: #25D366; border-radius: 50%; animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .test-result {
      padding: 10px 14px; border-radius: 10px; font-size: 13px;
    }
    .test-result.success { background: rgba(74,222,128,0.08); color: #4ade80; border: 1px solid rgba(74,222,128,0.2); }
    .test-result.error   { background: rgba(248,113,113,0.08); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }

    .qr-section { text-align: center; padding: 20px; background: rgba(37,211,102,0.04); border: 1px solid rgba(37,211,102,0.15); border-radius: 12px; }
    .qr-title { margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #f0eff4; }
    .qr-hint  { margin: 0 0 6px; font-size: 12px; color: #9997b0; line-height: 1.5; }
    .qr-hint strong { color: #f0eff4; }
    .qr-pre-hint { margin: 10px 0 0; font-size: 11px; color: #6b6980; }
    .qr-pre-hint code { background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 4px; color: #c9a96e; }
    .qr-container { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 14px; }
    .qr-img   { width: 220px; height: 220px; border-radius: 12px; background: white; padding: 10px; box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
    .btn-qr   { margin-top: 14px; padding: 12px 28px; border-radius: 10px; background: rgba(37,211,102,0.12); border: 1px solid rgba(37,211,102,0.35); color: #25D366; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .2s; }
    .btn-qr:hover { background: rgba(37,211,102,0.2); }
    .qr-error { margin: 10px 0 0; font-size: 12px; color: #f87171; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 8px; padding: 8px 12px; }
    .manual-qr-details { margin-top: 12px; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; overflow: hidden; text-align: left; }
    .manual-qr-summary { padding: 10px 14px; font-size: 12px; color: #c9a96e; cursor: pointer; background: rgba(201,169,110,0.05); list-style: none; }
    .manual-qr-summary::-webkit-details-marker { display: none; }
    .manual-qr-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .manual-qr-hint { margin: 0; font-size: 12px; color: #9997b0; }
    .manual-qr-hint code { background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 4px; color: #c9a96e; }
    .qr-paste-input {
      width: 100%; padding: 10px 12px; border-radius: 8px; font-size: 11px;
      background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
      color: #f0eff4; resize: vertical; font-family: monospace;
    }
    .qr-paste-input:focus { outline: none; border-color: rgba(37,211,102,0.4); }
    .btn-refresh { margin-top: 0; padding: 8px 18px; font-size: 12px; }
    .connected-banner { padding: 14px 18px; border-radius: 12px; background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.25); color: #4ade80; font-size: 14px; font-weight: 600; text-align: center; }

    .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .feature-item {
      display: flex; gap: 10px; align-items: flex-start;
      padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
    }
    .feature-icon { font-size: 18px; flex-shrink: 0; }
    .feature-label { font-size: 12px; font-weight: 600; color: #f0eff4; }
    .feature-desc  { font-size: 11px; color: #9997b0; margin-top: 2px; }

    .setup-details { border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); }
    .setup-summary {
      padding: 12px 16px; font-size: 13px; color: #c9a96e; cursor: pointer;
      background: rgba(201,169,110,0.05); list-style: none; user-select: none;
    }
    .setup-summary::-webkit-details-marker { display: none; }
    .setup-content { padding: 16px; display: flex; flex-direction: column; gap: 10px; font-size: 12px; color: #9997b0; line-height: 1.6; }
    .setup-content p { margin: 0; }
    .setup-content strong { color: #f0eff4; }
    .setup-content code { background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 4px; color: #c9a96e; }
    .code-block {
      background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px; padding: 10px 14px; color: #c9a96e; font-size: 11px;
      white-space: pre; overflow-x: auto; margin: 4px 0;
    }

    @media (max-width: 600px) {
      .features-grid { grid-template-columns: 1fr; }
      .wa-header { gap: 10px; }
      .status-pill { margin-left: 0; }
      .form-actions { flex-direction: column; }
      .btn-save, .btn-test, .btn-clear { width: 100%; justify-content: center; }
    }
  `],
})
export class WhatsAppSettingsComponent implements OnInit {
  readonly wa = inject(WhatsAppService);
  readonly status = this.wa.status;

  configUrl     = localStorage.getItem('openwa_url')     ?? '';
  configSession = localStorage.getItem('openwa_session') ?? 'peluqueria';
  configApiKey  = localStorage.getItem('openwa_api_key') ?? '';

  testing    = signal(false);
  testResult = signal<string | null>(null);
  qrCode     = signal<string | null>(null);
  qrError    = signal<string | null>(null);
  showQr     = signal(false);

  readonly features = [
    { icon: '✅', label: 'Confirmación de cita',   desc: 'Al reservar, el cliente recibe confirmación inmediata' },
    { icon: '🔔', label: 'Recordatorio 24h',        desc: 'Aviso automático un día antes de la cita' },
    { icon: '⏰', label: 'Recordatorio 1h',          desc: 'Aviso una hora antes para reducir no-shows' },
    { icon: '❌', label: 'Aviso de cancelación',     desc: 'Cliente y barbero notificados al cancelar' },
    { icon: '✏️', label: 'Cambio de cita',           desc: 'Notificación al modificar fecha u hora' },
    { icon: '💈', label: 'Notificación al barbero',  desc: 'El barbero recibe cada nueva reserva' },
  ];

  ngOnInit(): void {
    if (this.configApiKey) this.wa.checkStatus();
  }

  saveConfig(): void {
    localStorage.setItem('openwa_url', this.configUrl.trim());
    localStorage.setItem('openwa_session', this.configSession.trim() || 'peluqueria');
    if (this.configApiKey.trim()) localStorage.setItem('openwa_api_key', this.configApiKey.trim());
    this.testResult.set(null);
  }

  async testConnection(): Promise<void> {
    this.saveConfig();
    this.testing.set(true);
    this.testResult.set(null);
    try {
      const st = await this.wa.checkStatus();
      this.testResult.set(st === 'ready' || st === 'connecting' ? 'ok' : 'No se pudo conectar. Verifica que OpenWA está corriendo.');
    } catch {
      this.testResult.set('Error de conexión. Revisa la URL del servidor.');
    } finally {
      this.testing.set(false);
    }
  }

  onQrPaste(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value.trim();
    if (!val) return;
    const src = val.startsWith('data:') ? val : `data:image/png;base64,${val}`;
    this.qrCode.set(src);
    this.qrError.set(null);
  }

  async loadQr(): Promise<void> {
    this.qrError.set(null);
    this.qrCode.set(null);
    const qr = await this.wa.getQrCode();
    if (qr) {
      this.qrCode.set(qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`);
    } else {
      this.qrError.set('No se pudo obtener el QR. Verifica que OpenWA está corriendo y que la API Key y el ID de sesión son correctos.');
    }
    this.showQr.set(true);
  }

  clearConfig(): void {
    localStorage.removeItem('openwa_url');
    localStorage.removeItem('openwa_session');
    localStorage.removeItem('openwa_api_key');
    this.configUrl = '';
    this.configApiKey = '';
    this.wa.status.set('disabled');
    this.testResult.set(null);
    this.qrCode.set(null);
    this.qrError.set(null);
  }

  statusLabel(): string {
    const map: Record<string, string> = {
      ready: 'Conectado', connecting: 'Conectando', offline: 'Sin conexión',
      disabled: 'No configurado', unknown: 'Desconocido',
    };
    return map[this.status()] ?? 'Desconocido';
  }
}
