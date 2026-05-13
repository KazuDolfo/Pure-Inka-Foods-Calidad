
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject<AuthService>(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticatedUser()) {
    return true;
  } else {
    router.navigate(['/auth']);
    return false;
  }
};
