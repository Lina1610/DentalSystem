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

  obtenerServicios(opts: { busqueda?: string; pagina?: number; limite?: number; estado?: string } = {}): Observable<ServiciosResponse> {
    let params = new HttpParams();
    if (opts.busqueda) params = params.set('busqueda', opts.busqueda);
    if (opts.pagina)   params = params.set('pagina', opts.pagina.toString());
    if (opts.limite)   params = params.set('limite', opts.limite.toString());
    if (opts.estado)   params = params.set('estado', opts.estado);
    return this.http.get<ServiciosResponse>(this.API, { params });
  }
}
