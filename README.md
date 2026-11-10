# Dental System — Frontend

Panel administrativo de un consultorio odontológico: dashboard con indicadores, pacientes, odontólogos, servicios, agenda de horarios y citas.

Necesita la API, que está en la rama [`api`](https://github.com/Lina1610/DentalSystem/tree/api) de este mismo repositorio. **Instala y arranca la API primero**: sus instrucciones crean también la base de datos.

**Tecnologías:** Angular 21 (componentes standalone, signals) · PrimeNG · SCSS

---

## Requisitos

- [Node.js](https://nodejs.org/) 20.19 o superior
- La API corriendo en `http://localhost:3002`

## Instalación

```bash
git clone -b app https://github.com/Lina1610/DentalSystem.git app
cd app
npm install
npm start
```

Abre `http://localhost:4000` en el navegador.

### Iniciar sesión

| Correo | Contraseña |
|---|---|
| `admin@consultorio.com` | `admin123` |

Por ahora solo los usuarios con rol **administrador** pueden entrar.

## Problemas comunes

**"No se pudo conectar con el servidor"**
- Revisa que la API esté encendida: `http://localhost:3002` debe responder `API funcionando`.
- Si la API está encendida, es CORS: la dirección donde abriste el frontend (por ejemplo `http://localhost:4000`) debe estar en `CORS_ORIGIN` del `.env` de la API. Después de cambiarlo, reinicia la API.

**"Demasiados intentos de inicio de sesión"**
- Se superó el límite de intentos fallidos. Espera 15 minutos o reinicia la API.

---

## Estructura

```
src/app/
├── core/
│   ├── guards/          # Protege las rutas de /admin (requiere sesión de administrador)
│   └── interceptors/    # Agrega el token a cada petición; si expira, vuelve al login
├── layouts/
│   └── admin-layout/    # Menú lateral y estructura del panel
├── pages/
│   ├── login/
│   ├── dashboard/
│   ├── pacientes/
│   ├── odontologos/
│   ├── servicios/
│   ├── agendas/
│   └── citas/
└── shared/utils/        # Funciones y tipos comunes a los listados
```

Cada módulo de `pages/` sigue la misma organización:

```
citas/
├── lista-citas/         # Pantalla principal (tabla, filtros, tarjetas de resumen)
├── components/modals/   # Formularios de crear y editar
├── services/            # Llamadas HTTP a la API
├── store/               # Estado de la pantalla con signals
└── interfaces/          # Tipos de datos
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo con recarga automática |
| `npm run build` | Compila para producción en `dist/` |
| `npm test` | Ejecuta las pruebas (Vitest) |
