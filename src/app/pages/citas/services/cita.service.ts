import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Cita } from '../interfaces/cita.interface';

export interface CitasResponse {
  data: Cita[];
  total: number;
  pendientes: number;
  confirmadas: number;
  canceladas: number;
  finalizadas: number;
}

@Injectable({
  providedIn: 'root'
})
export class CitaService {

  private http = inject(HttpClient);

  private API = 'http://localhost:3002/api/quotes';

  // Obtener paginado
  obtenerCitas(opts: {
    busqueda?: string;
    pagina?: number;
    limite?: number;
    estado?: string;
    id_paciente?: number;
    id_odontologo?: number;
  } = {}): Observable<CitasResponse> {

    let params = new HttpParams();

    if (opts.busqueda)      params = params.set('busqueda', opts.busqueda);
    if (opts.pagina)        params = params.set('pagina', opts.pagina.toString());
    if (opts.limite)        params = params.set('limite', opts.limite.toString());
    if (opts.estado)        params = params.set('estado', opts.estado);
    if (opts.id_paciente)   params = params.set('id_paciente', opts.id_paciente.toString());
    if (opts.id_odontologo) params = params.set('id_odontologo', opts.id_odontologo.toString());

    return this.http.get<CitasResponse>(this.API, { params });
  }

  // Obtener por ID
  obtenerCita(id: number): Observable<Cita> {
    return this.http.get<Cita>(`${this.API}/${id}`);
  }

  // Crear
  crearCita(data: Cita): Observable<Cita> {
    return this.http.post<Cita>(this.API, data);
  }

  // Actualizar
  actualizarCita(id: number, data: Partial<Cita>): Observable<Cita> {
    return this.http.put<Cita>(`${this.API}/${id}`, data);
  }

  // Cancelar (eliminación lógica)
  eliminarCita(id: number, observaciones?: string): Observable<any> {
    return this.http.delete(`${this.API}/${id}`, {
      body: { observaciones }
    });
  }

  // Cambiar estado
  cambiarEstado(id: number, estado: string): Observable<Cita> {
    return this.http.patch<Cita>(
      `${this.API}/${id}/estado`,
      { estado }
    );
  }
}