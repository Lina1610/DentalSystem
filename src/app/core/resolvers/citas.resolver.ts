import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CitaService, CitasResponse } from '../../pages/citas/services/cita.service';
import { Cita } from '../../pages/citas/interfaces/cita.interface';
import { environment } from '../../../environments/environment';

const PAGINA_DEFAULT  = 1;
const LIMITE_DEFAULT  = 10;
const LIMITE_MAXIMO   = 100;

function parsePositiveInt(value: string | null, fallback: number, max = Infinity): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function parseBusqueda(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseEstado(value: string | null): 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA' | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'PENDIENTE' || normalized === 'CONFIRMADA' || normalized === 'CANCELADA'
    || normalized === 'FINALIZADA'
  ) return normalized;
  return undefined;
}

export const citasResolver: ResolveFn<CitasResponse> = (route) => {
  const citaService = inject(CitaService);

  const busqueda = parseBusqueda(route.queryParamMap.get('busqueda'));
  const pagina   = parsePositiveInt(route.queryParamMap.get('pagina'), PAGINA_DEFAULT);
  const limite   = parsePositiveInt(route.queryParamMap.get('limite'), LIMITE_DEFAULT, LIMITE_MAXIMO);
  const estado   = parseEstado(route.queryParamMap.get('estado'));

  return citaService.obtenerCitas({ busqueda, pagina, limite, estado }).pipe(
    tap((response) => {
      if (!environment.production) {
        console.debug('[citasResolver] Datos cargados:', {
          busqueda, pagina, limite, estado,
          total: response.total,
        });
      }
    }),
    catchError((error: unknown) => {
      console.error('[citasResolver] Error al obtener citas:', error);
      return of<CitasResponse>({
        data:      [],
        total:     0,
        pendientes:   0,
        confirmadas: 0,
        canceladas : 0,
        finalizadas: 0

      });
    })
  );
};
export const citaDetalleResolver: ResolveFn<Cita> = (route) => {
  const citaService = inject(CitaService);
  const router          = inject(Router);

  //  Valida que el ID sea un entero positivo antes de llamar al backend
  const id = parsePositiveInt(route.paramMap.get('id'), 0);

  if (id === 0) {
    console.warn('[citaDetalleResolver] ID inválido, redirigiendo...');
    router.navigate(['/citas']);
    return EMPTY;
  }
  
  // Tap() Permite ejecutar algo sin modificar la respuesta.
  return citaService.obtenerCita(id).pipe(
    tap((cita) => {
      if (!environment.production) {
        console.debug('[citaDetalleResolver] Cita cargada:', cita);
      }
    }),
    catchError((error: unknown) => {
      console.error('[citaDetalleResolver] Error al obtener cita:', error);
      router.navigate(['/citas']);
      return EMPTY;
    })
  );
};