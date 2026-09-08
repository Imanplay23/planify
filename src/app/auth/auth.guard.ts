import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';

/**
 * Protege las rutas de la app: si no hay sesión iniciada, redirige a /login
 * en vez de dejar entrar a las tabs.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    map((user) => (user ? true : router.parseUrl('/login')))
  );
};
