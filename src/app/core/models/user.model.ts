export type UserRole = 'user' | 'barber' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
}
