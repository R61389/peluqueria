export interface BarberService {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: 'haircut' | 'beard' | 'color' | 'treatment' | 'combo';
  targetGender?: 'male' | 'female' | 'unisex';
  active: boolean;
}
