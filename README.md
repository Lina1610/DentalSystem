# Dental System — API

API REST para la gestión de un consultorio odontológico: pacientes, odontólogos, servicios, agenda de horarios, citas y un dashboard con indicadores.

El frontend (Angular) está en la rama [`app`](https://github.com/Lina1610/DentalSystem/tree/app) de este mismo repositorio.

**Tecnologías:** Node.js · Express 5 · MySQL 8 (mysql2) · JWT · bcrypt · express-validator

---

## Requisitos

- [Node.js](https://nodejs.org/) 20.19 o superior
- [MySQL](https://dev.mysql.com/downloads/) **8.0.23 o superior**. El esquema usa columnas generadas `INVISIBLE` y restricciones `CHECK`, que MariaDB (la base que trae XAMPP) no maneja igual.

## Instalación

### 1. Descargar el código

```bash
git clone -b api https://github.com/Lina1610/DentalSystem.git api
cd api
npm install
```

### 2. Crear la base de datos

El script crea la base `consultorio_odontologico` con todas sus tablas y los datos iniciales:

```bash
mysql -u root -p --default-character-set=utf8mb4 < database/schema.sql
```

También puedes abrir `database/schema.sql` en MySQL Workbench y ejecutarlo completo.

> El script falla si la base `consultorio_odontologico` ya existe. Es para instalar desde cero.

### 3. Configurar las variables de entorno

```bash
cp .env.example .env        # en Windows (cmd): copy .env.example .env
```

Completa `.env` con tu usuario y contraseña de MySQL, y genera un `JWT_SECRET` propio:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

El archivo `.env` **nunca** se sube al repositorio (está en `.gitignore`).

### 4. Arrancar

```bash
npm start          # o: npm run dev (se reinicia solo al guardar cambios)
```

La API queda en `http://localhost:3002`. Si abres esa dirección en el navegador debe responder `API funcionando`.

## Usuario inicial

| Correo | Contraseña |
|---|---|
| `admin@consultorio.com` | `admin123` |

**Cámbiala** si vas a usar el sistema con datos reales.

---

## Estructura

```
api/
├── server.js                 # Punto de entrada
├── database/
│   ├── schema.sql            # Esquema completo + datos iniciales (instalación nueva)
│   └── migrations/           # Cambios para bases creadas con versiones anteriores
└── src/
    ├── app.js                # Express: CORS, rutas, manejador de errores
    ├── config/               # Conexión a MySQL y configuración de JWT
    ├── routes/               # Definición de endpoints
    ├── middlewares/          # Autenticación, roles, límite de intentos, validaciones
    ├── controllers/          # Leen la petición y devuelven la respuesta
    ├── services/             # Reglas de negocio
    ├── models/               # Consultas SQL
    └── helpers/              # Errores, transacciones, contraseñas, filtros
```

Cada petición pasa por: **ruta → validación → controlador → servicio → modelo**.

## Endpoints

Todos, excepto el login, requieren el header `Authorization: Bearer <token>` y rol administrador.

| Recurso | Ruta base | Operaciones |
|---|---|---|
| Autenticación | `/api/auth` | `POST /login` |
| Pacientes | `/api/pacientes` | listar, crear, ver, editar, desactivar, buscar por documento, cambiar estado |
| Odontólogos | `/api/odontologos` | listar, crear, ver, editar, buscar por documento, cambiar estado |
| Servicios | `/api/services` | listar, crear, ver, editar, desactivar, cambiar estado |
| Agenda | `/api/agenda` | listar, horarios disponibles, crear, ver, editar, cambiar estado |
| Citas | `/api/quotes` | listar, crear, ver, editar, cancelar, cambiar estado |
| Dashboard | `/api/dashboard` | indicadores del periodo |
| Roles | `/api/roles` | listar |

Los listados aceptan `?pagina=1&limite=10&busqueda=...` y filtros propios de cada recurso.

## Seguridad

- Contraseñas con **bcrypt** (costo 12). Los hashes antiguos se actualizan solos al iniciar sesión.
- **Límite de intentos fallidos de login**: 20 por IP y 5 por cuenta cada 15 minutos (configurable en `.env`).
- El login responde igual y tarda lo mismo exista o no el correo, para no revelar qué cuentas existen.
- Tokens JWT con algoritmo fijo y expiración (8 h por defecto).
- Todas las consultas SQL usan parámetros (sin inyección SQL).
- Si la API corre detrás de un proxy (Nginx, balanceador), define `TRUST_PROXY` en `.env`. Si no hay proxy, déjalo vacío.

## Reglas de negocio importantes

- Un horario de agenda solo puede tener **una cita activa** (no cancelada). Lo garantiza la base de datos con un índice único, además de la validación de la API.
- La cita y su horario deben ser del mismo odontólogo (llave foránea compuesta).
- Al crear, mover o cancelar una cita, el horario pasa a `OCUPADO` o `DISPONIBLE` en la misma transacción.
- No se pueden crear horarios ni reservar citas en fechas que ya pasaron.
