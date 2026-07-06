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

    // 1. AJUSTE: Tu Backend desestructura { correo, password }. Debe decir 'correo' aquí.
    const body = {
      correo: this.correo,
      password: this.password
    };

    this.http.post('http://localhost:3001/api/auth/login', body)
      .subscribe({
        next: (response: any) => {
          this.esError = false;
          
          localStorage.setItem('token', response.token);
          
          // Obtener el rol del backend
          const rol = response.rol;

          this.mensaje = 'Inicio de sesión correctamente';

          setTimeout(() => {
            // 2. AJUSTE: Tu backend devuelve el id_rol de la BD (1 = ADMIN, 2 = ODONTOLOGO)
            if (rol === 1) {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          }, 1500);
        },
        error: (error) => {
          this.esError = true;
          
          // Muestra el error real del backend ("Usuario no encontrado" / "Contraseña incorrecta")
          if (error.error && error.error.message) {
            this.mensaje = error.error.message;
          } else {
            this.mensaje = 'Credenciales incorrectas';
          }
          console.error(error);
        }
      });
  }
}
