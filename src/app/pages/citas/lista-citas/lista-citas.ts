import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CitaStore } from '../store/citas.store';
import { Cita } from '../interfaces/cita.interface';

@Component({
  selector: 'app-lista-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-citas.html',
  styleUrl: './lista-citas.scss',
})
export class ListaCitasComponent implements OnInit, OnDestroy {
  readonly store = inject(CitaStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private busqueda$ = new Subject<string>();
  private sub!: Subscription;

  busqueda = '';
  filtro: 'todos' | 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA' = 'todos';
  citas: Cita[] = [];

  readonly limite = 10;
  paginaActual = 1;
  totalRegistros = 0;
  totalPendientes = 0;
  totalConfirmadas = 0;
  totalCanceladas = 0;
  totalFinalizadas = 0;

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
