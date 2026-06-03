import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAdmin()) {
    router.navigate(['/']);
    return false;
  }
  return true;
};

export const barberGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isBarber() && !auth.isAdmin()) {
    router.navigate(['/']);
    return false;
  }
  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    const user = auth.currentUser();
    if (user?.role === 'admin') router.navigate(['/admin']);
    else if (user?.role === 'barber') router.navigate(['/barber']);
    else router.navigate(['/appointments']);
    return false;
  }
  return true;
};
