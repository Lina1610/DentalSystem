import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AgendaService, AgendaResponse } from '../../pages/agendas/services/agenda.service';
import { environment } from '../../../environments/environment';

const PAGINA_DEFAULT = 1;
const LIMITE_DEFAULT = 10;
const LIMITE_MAXIMO  = 100;

function parsePositiveInt(value: string | null, fallback: number, max = Infinity): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function parseBusqueda(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const agendaResolver: ResolveFn<AgendaResponse> = (route) => {
  const agendaService = inject(AgendaService);

  const busqueda = parseBusqueda(route.queryParamMap.get('busqueda'));
  const pagina   = parsePositiveInt(route.queryParamMap.get('pagina'), PAGINA_DEFAULT);
  const limite   = parsePositiveInt(route.queryParamMap.get('limite'), LIMITE_DEFAULT, LIMITE_MAXIMO);

  return agendaService.obtenerAgendas({ busqueda, pagina, limite }).pipe(
    tap((response) => {
      if (!environment.production) {
        console.debug('[agendaResolver] Datos cargados:', { busqueda, pagina, limite, total: response.total });
      }
    }),
    catchError((error: unknown) => {
      console.error('[agendaResolver] Error al obtener horarios:', error);
      return of<AgendaResponse>({
        data: [],
        total: 0,
        disponibles: 0,
        ocupados: 0,
        bloqueados: 0,
        no_disponibles: 0,
      });
    })
  );
};
