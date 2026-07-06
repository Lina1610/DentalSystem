import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente } from '../interfaces/patient.interface';

export interface PacientesResponse {
  data: Paciente[];
  total: number;
  activos: number;
  inactivos: number;
}

@Injectable({
  providedIn: 'root'
})
export class PacienteService {

  private http = inject(HttpClient);

  private API = 'http://localhost:3001/api/pacientes';

  // Obtener paginado (con búsqueda, filtro de estado y página)
  obtenerPacientes(opts: { busqueda?: string; pagina?: number; limite?: number; estado?: string } = {}): Observable<PacientesResponse> {
    let params = new HttpParams();
    if (opts.busqueda) params = params.set('busqueda', opts.busqueda);
    if (opts.pagina)   params = params.set('pagina',   opts.pagina.toString());
    if (opts.limite)   params = params.set('limite',   opts.limite.toString());
    if (opts.estado)   params = params.set('estado',   opts.estado);
    return this.http.get<PacientesResponse>(this.API, { params });
  }

  // Obtener por ID
  obtenerPaciente(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.API}/${id}`);
  }

  // Crear
  crearPaciente(data: Paciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.API, data);
  }

  // Actualizar
  actualizarPaciente(id: number, data: Partial<Paciente> ): Observable<Paciente> {
     return this.http.put<Paciente>(`${this.API}/${id}`, data);
    }

  // Eliminar
  eliminarPaciente(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }

  // Cambiar estado ACTIVO <-> INACTIVO
  cambiarEstado(id: number): Observable<{ id_paciente: number; estado: string }> {
    return this.http.patch<{ id_paciente: number; estado: string }>(`${this.API}/${id}/estado`, {});
  }

  // Buscar por documento
  buscarPorDocumento(documento: string): Observable<Paciente> {
    return this.http.get<Paciente>(
      `${this.API}/documento/${documento}`
    );
  }
}