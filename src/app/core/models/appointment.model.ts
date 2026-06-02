export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  clientPhone?: string;
  barberId: string;
  barberName: string;
  barberPhone?: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  price: number;
  reminderSent24h?: boolean;
  reminderSent1h?: boolean;
}
