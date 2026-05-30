export interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  specialties: string[];
  workingDays: number[];
  workingHours: { start: string; end: string };
  active: boolean;
  rating: number;
  reviewCount: number;
}
