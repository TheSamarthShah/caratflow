import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { confirmChangesGuardComponent } from '../models/confimChangesGuardsProps.type';
export const unsavedChangesGuardGuard: CanDeactivateFn<
  confirmChangesGuardComponent
> = async (component, currentRoute, currentState, nextState) => {
  const cookieService = inject(CookieService);
  const token = cookieService.get('seira_jwttoken');

  if (!token) return true; // if jwt token is expiered then dont show confirm dialog

  if (!component.confirmChanges) return true;

  const result = await component.confirmChanges();
  return result.proceed;
};
