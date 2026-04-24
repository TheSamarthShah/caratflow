import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

export const authGuard: CanActivateFn = (route, state) => {
  //injecting router to reidrect to login page
  const router = inject(Router);
  const cookieService = inject(CookieService);

  //token stored in cookies at login time
  const token = cookieService.get('seira_jwttoken');

  //token not found means login is not done then redirect to login screen
  if (token) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
