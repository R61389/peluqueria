import { Injectable, signal } from '@angular/core';
import { Appointment } from '../models/appointment.model';

export interface WaConfig {
  baseUrl: string;
  sessionId: string;
  apiKey: string;
}

export type WaStatus = 'unknown' | 'connecting' | 'ready' | 'offline' | 'disabled';

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  readonly status = signal<WaStatus>('unknown');

  private get config(): WaConfig {
    return {
      baseUrl: '/openwa-api',
      sessionId: localStorage.getItem('openwa_session') ?? 'peluqueria',
      apiKey: localStorage.getItem('openwa_api_key') ?? '',
    };
  }

  get isEnabled(): boolean {
    return !!localStorage.getItem('openwa_api_key');
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) h['x-api-key'] = this.config.apiKey;
    return h;
  }

  // ── Session management ────────────────────────────────────────────────────

  async checkStatus(): Promise<WaStatus> {
    if (!this.isEnabled) {
      this.status.set('disabled');
      return 'disabled';
    }
    try {
      this.status.set('connecting');
      const res = await fetch(
        `${this.config.baseUrl}/api/sessions/${this.config.sessionId}`,
        { headers: this.headers, signal: AbortSignal.timeout(5000) },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { status?: string };
      const ready = data.status === 'WORKING';
      this.status.set(ready ? 'ready' : 'connecting');
      return ready ? 'ready' : 'connecting';
    } catch {
      this.status.set('offline');
      return 'offline';
    }
  }

  async getQrCode(): Promise<string | null> {
    try {
      const res = await fetch(
        `${this.config.baseUrl}/api/sessions/${this.config.sessionId}/qr`,
        { headers: this.headers },
      );
      if (!res.ok) return null;
      const data = await res.json() as { qr?: string };
      return data.qr ?? null;
    } catch {
      return null;
    }
  }

  // ── Message senders ───────────────────────────────────────────────────────

  async sendAppointmentConfirmation(appt: Appointment): Promise<boolean> {
    if (!appt.clientPhone) return false;
    const msg = this.buildConfirmationMsg(appt);
    return this.sendText(appt.clientPhone, msg);
  }

  async sendBarberNotification(appt: Appointment): Promise<boolean> {
    if (!appt.barberPhone) return false;
    const msg = this.buildBarberNotifMsg(appt);
    return this.sendText(appt.barberPhone, msg);
  }

  async sendCancellationNotice(appt: Appointment): Promise<boolean> {
    const results: boolean[] = [];
    if (appt.clientPhone) {
      results.push(await this.sendText(appt.clientPhone, this.buildCancellationMsg(appt)));
    }
    if (appt.barberPhone) {
      results.push(await this.sendText(appt.barberPhone, this.buildBarberCancellationMsg(appt)));
    }
    return results.some(Boolean);
  }

  async sendModificationNotice(appt: Appointment): Promise<boolean> {
    const results: boolean[] = [];
    if (appt.clientPhone) {
      results.push(await this.sendText(appt.clientPhone, this.buildModificationMsg(appt)));
    }
    if (appt.barberPhone) {
      results.push(await this.sendText(appt.barberPhone, this.buildBarberModificationMsg(appt)));
    }
    return results.some(Boolean);
  }

  async sendReminder24h(appt: Appointment): Promise<boolean> {
    if (!appt.clientPhone) return false;
    const msg = this.buildReminder24hMsg(appt);
    return this.sendText(appt.clientPhone, msg);
  }

  async sendReminder1h(appt: Appointment): Promise<boolean> {
    if (!appt.clientPhone) return false;
    const msg = this.buildReminder1hMsg(appt);
    return this.sendText(appt.clientPhone, msg);
  }

  // ── Core sender ───────────────────────────────────────────────────────────

  private async sendText(phone: string, message: string): Promise<boolean> {
    if (!this.isEnabled) return false;
    const normalized = this.normalizePhone(phone);
    try {
      const res = await fetch(
        `${this.config.baseUrl}/api/sessions/${this.config.sessionId}/messages/send-text`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ chatId: `${normalized}@c.us`, contentType: 'string', content: message }),
        },
      );
      return res.ok;
    } catch (err) {
      console.warn('[WhatsApp] send failed:', err);
      return false;
    }
  }

  private normalizePhone(phone: string): string {
    // Strip non-digits, ensure country code
    return phone.replace(/\D/g, '');
  }

  // ── Message templates ─────────────────────────────────────────────────────

  private buildConfirmationMsg(a: Appointment): string {
    return (
      `✅ *Cita confirmada - BarberAI*\n\n` +
      `Hola ${a.userName}! Tu cita ha sido registrada correctamente.\n\n` +
      `📅 *Fecha:* ${this.formatDate(a.date)}\n` +
      `🕐 *Hora:* ${a.time}\n` +
      `💈 *Barbero:* ${a.barberName}\n` +
      `✂️ *Servicio:* ${a.serviceName}\n` +
      `💰 *Precio:* $${a.price}\n\n` +
      `Para cancelar o modificar tu cita responde *CANCELAR* o *MODIFICAR*.\n\n` +
      `_BarberAI — Tu estilo, nuestra pasión_`
    );
  }

  private buildBarberNotifMsg(a: Appointment): string {
    return (
      `📌 *Nueva cita - BarberAI*\n\n` +
      `Tienes una nueva reserva:\n\n` +
      `👤 *Cliente:* ${a.userName}\n` +
      `📅 *Fecha:* ${this.formatDate(a.date)}\n` +
      `🕐 *Hora:* ${a.time}\n` +
      `✂️ *Servicio:* ${a.serviceName}\n` +
      `💰 *Precio:* $${a.price}\n` +
      (a.notes ? `📝 *Notas:* ${a.notes}\n` : '') +
      `\n_Responde *CONFIRMAR ${a.id.slice(-6)}* para confirmar._`
    );
  }

  private buildCancellationMsg(a: Appointment): string {
    return (
      `❌ *Cita cancelada - BarberAI*\n\n` +
      `Hola ${a.userName}, tu cita ha sido cancelada.\n\n` +
      `📅 *Fecha cancelada:* ${this.formatDate(a.date)} a las ${a.time}\n` +
      `💈 *Barbero:* ${a.barberName}\n\n` +
      `Para reagendar visita nuestra app. ¡Te esperamos!\n\n` +
      `_BarberAI — Tu estilo, nuestra pasión_`
    );
  }

  private buildBarberCancellationMsg(a: Appointment): string {
    return (
      `❌ *Cita cancelada - BarberAI*\n\n` +
      `La cita de ${a.userName} del ${this.formatDate(a.date)} a las ${a.time} ha sido *cancelada*.\n\n` +
      `Tu agenda ha sido actualizada.`
    );
  }

  private buildModificationMsg(a: Appointment): string {
    return (
      `✏️ *Cita modificada - BarberAI*\n\n` +
      `Hola ${a.userName}, tu cita ha sido actualizada:\n\n` +
      `📅 *Nueva fecha:* ${this.formatDate(a.date)}\n` +
      `🕐 *Nueva hora:* ${a.time}\n` +
      `💈 *Barbero:* ${a.barberName}\n` +
      `✂️ *Servicio:* ${a.serviceName}\n\n` +
      `_BarberAI — Tu estilo, nuestra pasión_`
    );
  }

  private buildBarberModificationMsg(a: Appointment): string {
    return (
      `✏️ *Cita modificada - BarberAI*\n\n` +
      `La cita de ${a.userName} ha sido reprogramada para:\n\n` +
      `📅 *Nueva fecha:* ${this.formatDate(a.date)} a las ${a.time}\n` +
      `✂️ *Servicio:* ${a.serviceName}\n\n` +
      `Tu agenda ha sido actualizada.`
    );
  }

  private buildReminder24hMsg(a: Appointment): string {
    return (
      `🔔 *Recordatorio de cita - BarberAI*\n\n` +
      `Hola ${a.userName}! Te recordamos que mañana tienes cita:\n\n` +
      `📅 *Fecha:* ${this.formatDate(a.date)}\n` +
      `🕐 *Hora:* ${a.time}\n` +
      `💈 *Barbero:* ${a.barberName}\n\n` +
      `¿Necesitas cancelar? Responde *CANCELAR*.\n\n` +
      `_BarberAI — Te esperamos!_`
    );
  }

  private buildReminder1hMsg(a: Appointment): string {
    return (
      `⏰ *¡En 1 hora tienes cita! - BarberAI*\n\n` +
      `Hola ${a.userName}! En aproximadamente 1 hora tienes:\n\n` +
      `🕐 *Hora:* ${a.time}\n` +
      `💈 *Barbero:* ${a.barberName}\n` +
      `✂️ *Servicio:* ${a.serviceName}\n\n` +
      `_¡Te esperamos!_`
    );
  }

  private formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
  }
}
