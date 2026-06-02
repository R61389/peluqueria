import { Injectable, inject } from '@angular/core';
import { AppointmentService } from './appointment.service';
import { WhatsAppService } from './whatsapp.service';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly appointments = inject(AppointmentService);
  private readonly wa = inject(WhatsAppService);

  private intervalId?: ReturnType<typeof setInterval>;

  start(): void {
    this.checkReminders();
    // Check every 15 minutes
    this.intervalId = setInterval(() => this.checkReminders(), 15 * 60 * 1000);
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private async checkReminders(): Promise<void> {
    if (!this.wa.isEnabled) return;

    const now = new Date();
    const upcoming = this.appointments.getAll().filter(a => a.status === 'confirmed' || a.status === 'pending');

    for (const appt of upcoming) {
      const apptDate = new Date(`${appt.date}T${appt.time}:00`);
      const diffMs = apptDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours >= 23 && diffHours <= 25 && !appt.reminderSent24h) {
        const sent = await this.wa.sendReminder24h(appt);
        if (sent) this.appointments.update(appt.id, { reminderSent24h: true });
      }

      if (diffHours >= 0.75 && diffHours <= 1.25 && !appt.reminderSent1h) {
        const sent = await this.wa.sendReminder1h(appt);
        if (sent) this.appointments.update(appt.id, { reminderSent1h: true });
      }
    }
  }
}
