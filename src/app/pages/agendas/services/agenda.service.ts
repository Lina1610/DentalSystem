import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Agenda, EstadoAgenda } from '../interfaces/agenda.interface';

export interface AgendaResponse {
  data: Agenda[];
  total: number;
  disponibles: number;
  ocupados: number;
  bloqueados: number;
  no_disponibles: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgendaService {

  private http = inject(HttpClient);

  private API = 'http://localhost:3002/api/agenda';

  // Obtener paginado
  obtenerAgendas(opts: {
    busqueda?: string;
    pagina?: number;
    limite?: number;
    id_odontologo?: number;
    fecha?: string;
    estado?: string;
  } = {}): Observable<AgendaResponse> {

    let params = new HttpParams();

    if (opts.busqueda)      params = params.set('busqueda', opts.busqueda);
    if (opts.pagina)        params = params.set('pagina', opts.pagina.toString());
    if (opts.limite)        params = params.set('limite', opts.limite.toString());
    if (opts.id_odontologo) params = params.set('id_odontologo', opts.id_odontologo.toString());
    if (opts.fecha)         params = params.set('fecha', opts.fecha);
    if (opts.estado)        params = params.set('estado', opts.estado);

    return this.http.get<AgendaResponse>(this.API, { params });
  }

  // Horarios disponibles para agendar una cita (filtrado por odontólogo/fecha)
  obtenerDisponibles(opts: { id_odontologo?: number; fecha?: string } = {}): Observable<Agenda[]> {
    let params = new HttpParams();
    if (opts.id_odontologo) params = params.set('id_odontologo', opts.id_odontologo.toString());
    if (opts.fecha)         params = params.set('fecha', opts.fecha);
    return this.http.get<Agenda[]>(`${this.API}/disponibles`, { params });
  }

  // Obtener por ID
  obtenerAgenda(id: number): Observable<Agenda> {
    return this.http.get<Agenda>(`${this.API}/${id}`);
  }

  // Crear
  crearAgenda(data: Agenda): Observable<Agenda> {
    return this.http.post<Agenda>(this.API, data);
  }

  // Actualizar
  actualizarAgenda(id: number, data: Partial<Agenda>): Observable<Agenda> {
    return this.http.put<Agenda>(`${this.API}/${id}`, data);
  }

  // Cambiar estado
  cambiarEstado(id: number, estado: EstadoAgenda): Observable<Agenda> {
    return this.http.patch<Agenda>(`${this.API}/${id}/estado`, { estado });
  }
}
