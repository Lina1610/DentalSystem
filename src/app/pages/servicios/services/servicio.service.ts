import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Servicio } from '../interfaces/servicio.interface';

export interface ServiciosResponse {
  data: Servicio[];
  total: number;
  activos: number;
  inactivos: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioService {

  private http = inject(HttpClient);

  private API = 'http://localhost:3002/api/services';

  // Obtener paginado (búsqueda, filtro estado, página)
  obtenerServicios(opts: { busqueda?: string; pagina?: number; limite?: number; estado?: string } = {}): Observable<ServiciosResponse> {
    let params = new HttpParams();
    if (opts.busqueda) params = params.set('busqueda', opts.busqueda);
    if (opts.pagina)   params = params.set('pagina', opts.pagina.toString());
    if (opts.limite)   params = params.set('limite', opts.limite.toString());
    if (opts.estado)   params = params.set('estado', opts.estado);
    return this.http.get<ServiciosResponse>(this.API, { params });
  }

  // Obtener por ID
  obtenerServicio(id: number): Observable<Servicio> {
    return this.http.get<Servicio>(`${this.API}/${id}`);
  }

  // Crear
  crearServicio(data: Servicio): Observable<Servicio> {
    return this.http.post<Servicio>(this.API, data);
  }

  // Actualizar
  actualizarServicio(id: number, data: Partial<Servicio>): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.API}/${id}`, data);
  }

  // Cambiar estado ACTIVO <-> INACTIVO
  cambiarEstado(id: number): Observable<Servicio> {
    return this.http.patch<Servicio>(`${this.API}/${id}/estado`, {});
  }
}
