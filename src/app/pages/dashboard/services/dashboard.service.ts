import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PeriodoDashboard, ResumenDashboard } from '../interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private API  = 'http://localhost:3002/api/dashboard';

  // Resumen por periodo predefinido o por rango (desde + hasta, 'YYYY-MM-DD')
  obtenerResumen(
    opts: { periodo?: PeriodoDashboard; desde?: string; hasta?: string } = {}
  ): Observable<ResumenDashboard> {
    let params = new HttpParams();
    if (opts.desde && opts.hasta) {
      params = params.set('desde', opts.desde).set('hasta', opts.hasta);
    } else if (opts.periodo) {
      params = params.set('periodo', opts.periodo);
    }
    return this.http.get<ResumenDashboard>(this.API, { params });
  }
}
