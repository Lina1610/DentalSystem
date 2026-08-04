import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PacienteService, PacientesResponse } from '../../pages/pacientes/services/patient.service';
import { Paciente } from '../../pages/pacientes/interfaces/patient.interface';
import { environment } from '../../../environments/environment';
// ─── Constantes ───────────────────────────────────────────────────────────────
const PAGINA_DEFAULT  = 1;
const LIMITE_DEFAULT  = 10;
const LIMITE_MAXIMO   = 100;

// ─── Helpers reutilizables ────────────────────────────────────────────────────

function parsePositiveInt(value: string | null, fallback: number, max = Infinity): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function parseBusqueda(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseEstado(value: string | null): 'ACTIVO' | 'INACTIVO' | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'ACTIVO' || normalized === 'INACTIVO') return normalized;
  return undefined;
}

// ─── Resolver: Lista de pacientes ─────────────────────────────────────────────

export const pacientesResolver: ResolveFn<PacientesResponse> = (route) => {
  const pacienteService = inject(PacienteService);

  const busqueda = parseBusqueda(route.queryParamMap.get('busqueda'));
  const pagina   = parsePositiveInt(route.queryParamMap.get('pagina'), PAGINA_DEFAULT);
  const limite   = parsePositiveInt(route.queryParamMap.get('limite'), LIMITE_DEFAULT, LIMITE_MAXIMO);
  const estado   = parseEstado(route.queryParamMap.get('estado'));

  return pacienteService.obtenerPacientes({ busqueda, pagina, limite, estado }).pipe(
    tap((response) => {
      if (!environment.production) {
        console.debug('[pacientesResolver] Datos cargados:', {
          busqueda, pagina, limite, estado,
          total: response.total,
        });
      }
    }),
    catchError((error: unknown) => {
      console.error('[pacientesResolver] Error al obtener pacientes:', error);
      return of<PacientesResponse>({
        data:      [],
        total:     0,
        activos:   0,
        inactivos: 0,
      });
    })
  );
};

// ─── Resolver: Detalle de paciente ────────────────────────────────────────────

export const pacienteDetalleResolver: ResolveFn<Paciente> = (route) => {
  const pacienteService = inject(PacienteService);
  const router          = inject(Router);

  //  Valida que el ID sea un entero positivo antes de llamar al backend
  const id = parsePositiveInt(route.paramMap.get('id'), 0);

  if (id === 0) {
    console.warn('[pacienteDetalleResolver] ID inválido, redirigiendo...');
    router.navigate(['/pacientes']);
    return EMPTY;
  }

  return pacienteService.obtenerPaciente(id).pipe(
    tap((paciente) => {
      if (!environment.production) {
        console.debug('[pacienteDetalleResolver] Paciente cargado:', paciente);
      }
    }),
    catchError((error: unknown) => {
      // ✅ Si no existe o falla, redirige en vez de devolver null
      console.error('[pacienteDetalleResolver] Error al obtener paciente:', error);
      router.navigate(['/pacientes']);
      return EMPTY;
    })
  );
};