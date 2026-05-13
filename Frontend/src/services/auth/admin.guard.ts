import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  
  const currentUser = authService.getCurrentUser();
  console.log('AdminGuard Check: Current user object is ->', currentUser);
  

  
  if (authService.isAdmin()) {
    return true;
  }

  
  router.navigate(['/']);
  return false;
};
