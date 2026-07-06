import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Odontologo } from '../interfaces/odontologo.interface';

export interface OdontologosResponse {
  data: Odontologo[];
  total: number;
  activos: number;
  inactivos: number;
}

@Injectable({
  providedIn: 'root',
})
export class OdontologoService {
  private http = inject(HttpClient);
  private API  = 'http://localhost:3001/api/odontologos';

  // Obtener paginado (búsqueda, filtro estado, página)
  obtenerOdontologos(
    opts: { busqueda?: string; pagina?: number; limite?: number; estado?: string } = {}
  ): Observable<OdontologosResponse> {
    let params = new HttpParams();
    if (opts.busqueda) params = params.set('busqueda', opts.busqueda);
    if (opts.pagina)   params = params.set('pagina',   opts.pagina.toString());
    if (opts.limite)   params = params.set('limite',   opts.limite.toString());
    if (opts.estado)   params = params.set('estado',   opts.estado);
    return this.http.get<OdontologosResponse>(this.API, { params });
  }

 // Obtener por ID
  obtenerOdontologo(id: number): Observable<Odontologo> {
    return this.http.get<Odontologo>(`${this.API}/${id}`);
  }

  // Crear
  crearOdontologo(data: Odontologo): Observable<Odontologo> {
    return this.http.post<Odontologo>(this.API, data);
  }

  // Actualizar
actualizarOdontologo(id: number, data: Partial<Odontologo> ): Observable<Odontologo> {
   return this.http.put<Odontologo>(`${this.API}/${id}`, data);
  }

  // Eliminar
  eliminarOdontologo(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }

  // Cambiar estado ACTIVO <-> INACTIVO
  cambiarEstado(id: number): Observable<{ id_odontologo: number; estado: string }> {
    return this.http.patch<{ id_odontologo: number; estado: string }>(`${this.API}/${id}/estado`, {});
  }

  // Buscar por documento
  buscarPorDocumento(documento: string): Observable<Odontologo> {
    return this.http.get<Odontologo>(
      `${this.API}/documento/${documento}`
    );
  }
}