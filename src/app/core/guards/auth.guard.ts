import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  // Cualquier token inválido, expirado o sin rol admin se descarta y se vuelve al login
  const denegar = () => {
    localStorage.removeItem('token');
    return router.createUrlTree(['/login']);
  };

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Validar expiración
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return denegar();
    }

    // Validar rol admin (id_rol = 1)
    if (payload.rol !== 1) {
      return denegar();
    }

    return true;
  } catch {
    return denegar();
  }
};
