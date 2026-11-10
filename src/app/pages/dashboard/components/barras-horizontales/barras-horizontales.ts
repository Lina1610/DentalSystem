import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ItemBarra {
  clave: string | number;
  etiqueta: string;
  valor: number;
}

// Gráfica de barras horizontales hecha con CSS: el largo es proporcional al mayor valor.
@Component({
  selector: 'app-barras-horizontales',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ul class="barras" *ngIf="hayDatos(); else vacio">
      <li
        class="barra"
        [class.barra--clicable]="clicable"
        *ngFor="let item of items(); trackBy: trackByClave"
        (click)="clicable && itemClick.emit(item)"
      >
        <span class="barra__etiqueta" [title]="item.etiqueta">{{ item.etiqueta }}</span>
        <span class="barra__pista">
          <span
            class="barra__relleno"
            [style.width.%]="ancho(item.valor)"
            [style.background]="color(item.clave)"
          ></span>
        </span>
        <span class="barra__valor">{{ item.valor }}</span>
      </li>
    </ul>
    <ng-template #vacio>
      <p class="barras__vacio">{{ mensajeVacio }}</p>
    </ng-template>
  `,
  styleUrl: './barras-horizontales.scss',
})
export class BarrasHorizontalesComponent {
  @Input({ required: true }) set datos(value: ItemBarra[]) { this.items.set(value ?? []); }
  // Color por clave (p. ej. por estado de cita); si no hay, usa colorDefecto
  @Input() colores: Partial<Record<string | number, string>> = {};
  @Input() colorDefecto = '#2563eb';
  @Input() mensajeVacio = 'Sin datos en este periodo.';
  // Si es true, cada barra se puede hacer clic (emite itemClick) para ir al listado filtrado
  @Input() clicable = false;

  @Output() itemClick = new EventEmitter<ItemBarra>();

  readonly items = signal<ItemBarra[]>([]);
  private readonly maximo = computed(() => Math.max(0, ...this.items().map(i => i.valor)));
  readonly hayDatos = computed(() => this.maximo() > 0);

  color(clave: string | number): string {
    return this.colores[clave] ?? this.colorDefecto;
  }

  // Una barra con valor > 0 siempre se ve (mínimo 2%)
  ancho(valor: number): number {
    const max = this.maximo();
    if (!max || !valor) return 0;
    return Math.max(2, (valor / max) * 100);
  }

  trackByClave(_i: number, item: ItemBarra): string | number {
    return item.clave;
  }
}
