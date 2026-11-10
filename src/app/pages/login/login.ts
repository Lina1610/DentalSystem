import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  correo = '';
  password = '';
  mensaje = '';
  esError = false; 

  constructor(
    private http: HttpClient, 
    private router: Router
  ) {}

  iniciarSesion() {
    if (!this.correo || !this.password) {
      this.mensaje = 'Por favor, completa todos los campos.';
      this.esError = true;
      return;
    }
    const body = {
      correo: this.correo,
      password: this.password
    };

    this.http.post('http://localhost:3002/api/auth/login', body)
      .subscribe({
        next: (response: any) => {
          if (response.rol !== 1) {
            this.esError = true;
            this.mensaje = 'Tu usuario aún no tiene acceso al sistema. Contacta al administrador.';
            return;
          }

          this.esError = false;
          localStorage.setItem('token', response.token);
          this.mensaje = 'Inicio de sesión correctamente';

          setTimeout(() => {
            this.router.navigate(['/admin/dashboard']);
          }, 1500);
        },
        error: (error) => {
          this.esError = true;
          if (error.status === 0) {
            this.mensaje = 'No se pudo conectar con el servidor. Verifica que la API esté encendida.';
          } else if (error.error && error.error.message) {
            this.mensaje = error.error.message;
          } else {
            this.mensaje = `Error inesperado del servidor (${error.status}).`;
          }
          console.error(error);
        }
      });
  }
}
