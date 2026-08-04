import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.scss'],
})
export class AdminLayout implements OnInit {

  nombreUsuario = '';
  menuAbierto = true;

  constructor(private router: Router) {}

  ngOnInit() {
    const token = localStorage.getItem('token')!;
    const payload = JSON.parse(atob(token.split('.')[1]));
    this.nombreUsuario = payload.email ?? 'Administrador';
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }
}
