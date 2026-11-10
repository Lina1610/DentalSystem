import { Component, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

// Íconos estilo Lucide: cada uno es una lista de trazos SVG (viewBox 24x24)
const ICONOS: Record<string, string[]> = {
  dashboard: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  odontologos: [
    'M11 2v2', 'M5 2v2',
    'M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1',
    'M8 15a6 6 0 0 0 12 0v-3',
    'M18 10a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  ],
  pacientes: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
    'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  citas: [
    'M8 2v4', 'M16 2v4',
    'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    'M3 10h18', 'm9 16 2 2 4-4',
  ],
  agenda: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M12 6v6l4 2'],
  servicios: [
    'M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z',
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
    'M12 11h4', 'M12 16h4', 'M8 11h.01', 'M8 16h.01',
  ],
  facturacion: [
    'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z',
    'M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8', 'M12 17.5v-11',
  ],
  reportes: ['M3 3v18h18', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  configuracion: [
    'M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3',
    'M1 14h6', 'M9 8h6', 'M17 16h6',
  ],
  salir: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  panel: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 3v18'],
  mas: ['M12 5v14', 'M5 12h14'],
  chevron: ['m6 9 6 6 6-6'],
  calendario: [
    'M8 2v4', 'M16 2v4',
    'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M3 10h18',
  ],
  diente: [
    'M12 5.5C10.5 4.5 9 4 7.5 4 5 4 3.5 6 3.5 8.5c0 2 .7 3.5 1.3 5 .6 1.6.9 3.5 1.2 5.3.2 1.2.7 2.2 1.6 2.2 1.1 0 1.4-1.2 1.7-2.6.3-1.5.6-3.4 2.7-3.4s2.4 1.9 2.7 3.4c.3 1.4.6 2.6 1.7 2.6.9 0 1.4-1 1.6-2.2.3-1.8.6-3.7 1.2-5.3.6-1.5 1.3-3 1.3-5C20.5 6 19 4 16.5 4c-1.5 0-3 .5-4.5 1.5Z',
  ],
};

interface ItemMenu {
  ruta: string;
  label: string;
  icono: string;
}

interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.scss'],
})
export class AdminLayout implements OnInit {
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);

  readonly iconos = ICONOS;

  readonly menu: GrupoMenu[] = [
    {
      titulo: 'Principal',
      items: [
        { ruta: 'dashboard', label: 'Dashboard', icono: 'dashboard' },
        { ruta: 'agenda', label: 'Agenda', icono: 'agenda' },
        { ruta: 'citas', label: 'Citas', icono: 'citas' },
      ],
    },
    {
      titulo: 'Gestión',
      items: [
        { ruta: 'pacientes', label: 'Pacientes', icono: 'pacientes' },
        { ruta: 'odontologos', label: 'Odontólogos', icono: 'odontologos' },
        { ruta: 'servicios', label: 'Servicios', icono: 'servicios' },
      ],
    },
    {
      titulo: 'Finanzas',
      items: [
        { ruta: 'facturacion', label: 'Facturación', icono: 'facturacion' },
        { ruta: 'reportes', label: 'Reportes', icono: 'reportes' },
      ],
    },
    {
      titulo: 'Sistema',
      items: [{ ruta: 'configuracion', label: 'Configuración', icono: 'configuracion' }],
    },
  ];

  readonly fechaHoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  nombreUsuario = '';
  menuAbierto = true;
  menuUsuarioAbierto = false;

  get iniciales(): string {
    const base = this.nombreUsuario.split('@')[0].replace(/[^a-zA-Z]/g, '');
    return (base.slice(0, 2) || 'AD').toUpperCase();
  }

  // Título de la sección actual según la URL (/admin/<ruta>/...)
  get tituloSeccion(): string {
    const segmento = this.router.url.split('?')[0].split('/')[2] ?? '';
    const item = this.menu.flatMap((g) => g.items).find((i) => i.ruta === segmento);
    return item?.label ?? 'Panel';
  }

  ngOnInit() {
    const token = localStorage.getItem('token')!;
    const payload = JSON.parse(atob(token.split('.')[1]));
    this.nombreUsuario = payload.email ?? 'Administrador';
  }

  // Cierra el menú de usuario al hacer clic fuera de él
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const menu = this.host.nativeElement.querySelector('.admin__user-menu');
    if (this.menuUsuarioAbierto && menu && !menu.contains(event.target as Node)) {
      this.menuUsuarioAbierto = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.menuUsuarioAbierto = false;
  }

  nuevaCita() {
    this.router.navigate(['/admin/citas'], { queryParams: { nuevo: 1 } });
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  toggleMenuUsuario() {
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
  }
}
