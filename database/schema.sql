-- =========================================================
-- SISTEMA ADMINISTRATIVO
-- CONSULTORIO ODONTOLÓGICO
-- MySQL 8+
-- Diseño Profesional DBA Senior
-- =========================================================
-- El archivo está en UTF-8: evita que las tildes se guarden dañadas
SET NAMES utf8mb4;

CREATE DATABASE consultorio_odontologico
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE consultorio_odontologico;

-- =========================================================
-- TABLA: rol
-- Roles del sistema
-- =========================================================
CREATE TABLE rol (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    estado ENUM(
        'ACTIVO',
        'INACTIVO'
    ) DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_rol_nombre UNIQUE(nombre)
);

-- =========================================================
-- TABLA: ciudad
-- Catálogo de ciudades
-- =========================================================
CREATE TABLE ciudad (
    id_ciudad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    estado ENUM(
        'ACTIVO',
        'INACTIVO'
    ) DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_ciudad UNIQUE(nombre, departamento)
);
-- =========================================================
-- TABLA: consultorio
-- Información del consultorio
-- =========================================================
CREATE TABLE consultorio (
    id_consultorio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(30),
    direccion VARCHAR(200) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(120),
    id_ciudad INT NOT NULL,
    estado ENUM(
        'ACTIVO',
        'INACTIVO'
    ) DEFAULT 'ACTIVO',

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_consultorio_nit UNIQUE(nit),
    CONSTRAINT uq_consultorio_email UNIQUE(email),
    CONSTRAINT fk_consultorio_ciudad
        FOREIGN KEY(id_ciudad)
        REFERENCES ciudad(id_ciudad)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- TABLA: especialidad
-- Especialidades odontológicas
-- =========================================================
CREATE TABLE especialidad (
    id_especialidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    estado ENUM(
        'ACTIVO',
        'INACTIVO'
    ) DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_especialidad_nombre UNIQUE(nombre)
);

-- =========================================================
-- TABLA: usuario
-- Usuarios del sistema
-- =========================================================
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    documento VARCHAR(20) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(120) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
    COMMENT 'Hash bcrypt generado desde backend',
    ultimo_login DATETIME NULL,
    estado ENUM(
        'ACTIVO',
        'INACTIVO'
    ) DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_documento UNIQUE(documento),
    CONSTRAINT uq_usuario_email UNIQUE(email),
    CONSTRAINT uq_usuario_username UNIQUE(username),
    CONSTRAINT fk_usuario_rol
        FOREIGN KEY(id_rol)
        REFERENCES rol(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- TABLA: odontologo
-- Información profesional del odontólogo
-- =========================================================
CREATE TABLE odontologo (
    id_odontologo INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_especialidad INT NOT NULL,
    id_consultorio INT NOT NULL,
    tarjeta_profesional VARCHAR(50) NOT NULL,
    experiencia_anios INT DEFAULT 0,
    estado ENUM(
        'ACTIVO',
        'INACTIVO'
    ) DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_odontologo_usuario UNIQUE(id_usuario),
    CONSTRAINT uq_odontologo_tarjeta UNIQUE(tarjeta_profesional),
    CONSTRAINT fk_odontologo_usuario
        FOREIGN KEY(id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_odontologo_especialidad
        FOREIGN KEY(id_especialidad)
        REFERENCES especialidad(id_especialidad)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_odontologo_consultorio
        FOREIGN KEY(id_consultorio)
        REFERENCES consultorio(id_consultorio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- TABLA: paciente
-- Pacientes del consultorio
-- =========================================================
CREATE TABLE paciente (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    documento VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero ENUM(
        'MASCULINO',
        'FEMENINO',
        'OTRO'
    ) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(120),
    direccion VARCHAR(200),
    id_ciudad INT NOT NULL,
    alergias TEXT,
    observaciones TEXT,
    estado ENUM(
        'ACTIVO',
        'INACTIVO'
    ) DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_paciente_documento UNIQUE(documento),
    CONSTRAINT uq_paciente_email UNIQUE(email),
    CONSTRAINT fk_paciente_ciudad
        FOREIGN KEY(id_ciudad)
        REFERENCES ciudad(id_ciudad)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
-- =========================================================
-- TABLA: historia_clinica
-- Historial clínico del paciente
-- =========================================================
CREATE TABLE historia_clinica (
    id_historia_clinica INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    antecedentes_medicos TEXT,
    medicamentos TEXT,
    observaciones_generales TEXT,
    estado ENUM(
        'ACTIVA',
        'INACTIVA'
    ) DEFAULT 'ACTIVA',
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_historia_paciente UNIQUE(id_paciente),
    CONSTRAINT fk_historia_paciente
        FOREIGN KEY(id_paciente)
        REFERENCES paciente(id_paciente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- TABLA: servicio
-- Servicios odontológicos
-- =========================================================
CREATE TABLE servicio (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    duracion_minutos INT NOT NULL,
    estado ENUM(
        'ACTIVO',
        'INACTIVO'
    ) DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_servicio_nombre UNIQUE(nombre),
    CONSTRAINT chk_servicio_precio
        CHECK(precio >= 0),
    CONSTRAINT chk_servicio_duracion
        CHECK(duracion_minutos > 0)
);

-- =========================================================
-- TABLA: agenda
-- Disponibilidad del odontólogo
-- =========================================================
CREATE TABLE agenda (
    id_agenda INT AUTO_INCREMENT PRIMARY KEY,
    id_odontologo INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado ENUM(
        'DISPONIBLE',
        'OCUPADO',
        'BLOQUEADO',
        'NO_DISPONIBLE'
    ) DEFAULT 'DISPONIBLE',
    observacion VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_agenda_horas
        CHECK(hora_inicio < hora_fin),
    -- Permite que cita referencie (id_agenda, id_odontologo) juntos
    CONSTRAINT uq_agenda_id_odontologo
        UNIQUE(id_agenda, id_odontologo),
    CONSTRAINT fk_agenda_odontologo
        FOREIGN KEY(id_odontologo)
        REFERENCES odontologo(id_odontologo)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- TABLA: cita
-- Citas odontológicas
-- =========================================================
CREATE TABLE cita (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_odontologo INT NOT NULL,
    id_servicio INT NOT NULL,
    id_agenda INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    motivo_consulta VARCHAR(255),
    estado ENUM(
        'PENDIENTE',
        'CONFIRMADA',
        'CANCELADA',
        'FINALIZADA'
    ) DEFAULT 'PENDIENTE',
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    -- id_agenda mientras la cita no esté cancelada; NULL si lo está
    agenda_reservada INT
        GENERATED ALWAYS AS (IF(estado <> 'CANCELADA', id_agenda, NULL)) VIRTUAL INVISIBLE,
    CONSTRAINT chk_cita_fechas
        CHECK(fecha_inicio < fecha_fin),
    -- Un horario de agenda solo puede tener una cita no cancelada
    CONSTRAINT uq_cita_agenda_reservada
        UNIQUE(agenda_reservada),
    -- La cita y su horario deben ser del mismo odontólogo
    CONSTRAINT fk_cita_agenda_odontologo
        FOREIGN KEY(id_agenda, id_odontologo)
        REFERENCES agenda(id_agenda, id_odontologo)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    CONSTRAINT fk_cita_paciente
        FOREIGN KEY(id_paciente)
        REFERENCES paciente(id_paciente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_cita_odontologo
        FOREIGN KEY(id_odontologo)
        REFERENCES odontologo(id_odontologo)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_cita_servicio
        FOREIGN KEY(id_servicio)
        REFERENCES servicio(id_servicio)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_cita_agenda
        FOREIGN KEY(id_agenda)
        REFERENCES agenda(id_agenda)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- TABLA: tratamiento
-- Tratamientos odontológicos
-- =========================================================
CREATE TABLE tratamiento (
    id_tratamiento INT AUTO_INCREMENT PRIMARY KEY,
    id_historia_clinica INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    diagnostico TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    estado ENUM(
        'PLANIFICADO',
        'EN_PROCESO',
        'FINALIZADO',
        'CANCELADO'
    ) DEFAULT 'PLANIFICADO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tratamiento_historia
        FOREIGN KEY(id_historia_clinica)
        REFERENCES historia_clinica(id_historia_clinica)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- TABLA: cita_tratamiento
-- Relación muchos a muchos
-- entre citas y tratamientos
-- =========================================================
CREATE TABLE cita_tratamiento (
    id_cita_tratamiento INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL,
    id_tratamiento INT NOT NULL,
    observacion VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cita_tratamiento
        UNIQUE(id_cita, id_tratamiento),
    CONSTRAINT fk_ct_cita
        FOREIGN KEY(id_cita)
        REFERENCES cita(id_cita)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_ct_tratamiento
        FOREIGN KEY(id_tratamiento)
        REFERENCES tratamiento(id_tratamiento)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =========================================================
-- TABLA: procedimiento
-- Procedimientos realizados
-- =========================================================
CREATE TABLE procedimiento (
    id_procedimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_tratamiento INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    costo DECIMAL(10,2) NOT NULL,
    fecha_procedimiento DATE NOT NULL,
    estado ENUM(
        'PENDIENTE',
        'REALIZADO',
        'CANCELADO'
    ) DEFAULT 'PENDIENTE',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_procedimiento_costo
        CHECK(costo >= 0),
    CONSTRAINT fk_procedimiento_tratamiento
        FOREIGN KEY(id_tratamiento)
        REFERENCES tratamiento(id_tratamiento)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- TABLA: factura
-- Facturación
-- =========================================================
CREATE TABLE factura (
    id_factura INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_cita INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM(
        'PENDIENTE',
        'PAGADA',
        'ANULADA'
    ) DEFAULT 'PENDIENTE',
    fecha_factura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_factura_cita UNIQUE(id_cita),
    CONSTRAINT chk_factura_subtotal
        CHECK(subtotal >= 0),
    CONSTRAINT chk_factura_total
        CHECK(total >= 0),
    CONSTRAINT fk_factura_paciente
        FOREIGN KEY(id_paciente)
        REFERENCES paciente(id_paciente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_factura_cita
        FOREIGN KEY(id_cita)
        REFERENCES cita(id_cita)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- TABLA: detalle_factura
-- Detalle de facturación
-- =========================================================
CREATE TABLE detalle_factura (
    id_detalle_factura INT AUTO_INCREMENT PRIMARY KEY,
    id_factura INT NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_detalle_cantidad
        CHECK(cantidad > 0),
    CONSTRAINT chk_detalle_precio
        CHECK(precio_unitario >= 0),
    CONSTRAINT chk_detalle_subtotal
        CHECK(subtotal >= 0),
    CONSTRAINT fk_detalle_factura
        FOREIGN KEY(id_factura)
        REFERENCES factura(id_factura)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =========================================================
-- TABLA: pago
-- Registro de pagos
-- =========================================================
CREATE TABLE pago (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_factura INT NOT NULL,
    id_usuario INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM(
        'EFECTIVO',
        'TRANSFERENCIA',
        'TARJETA'
    ) NOT NULL,
    referencia VARCHAR(100),
    estado ENUM(
        'APROBADO',
        'PENDIENTE',
        'RECHAZADO'
    ) DEFAULT 'APROBADO',
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_pago_monto
        CHECK(monto > 0),
    CONSTRAINT fk_pago_factura
        FOREIGN KEY(id_factura)
        REFERENCES factura(id_factura)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_pago_usuario
        FOREIGN KEY(id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- ÍNDICES
-- =========================================================

CREATE INDEX idx_usuario_rol
ON usuario(id_rol);

CREATE INDEX idx_paciente_documento
ON paciente(documento);

CREATE INDEX idx_agenda_odontologo_fecha
ON agenda(id_odontologo, fecha);

CREATE INDEX idx_cita_odontologo_fecha
ON cita(id_odontologo, fecha_inicio);

CREATE INDEX idx_cita_estado
ON cita(estado);

CREATE INDEX idx_factura_fecha
ON factura(fecha_factura);

-- =========================================================
-- TRIGGER
-- Evita solapamiento de horarios
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_validar_agenda_insert
BEFORE INSERT ON agenda
FOR EACH ROW
BEGIN

    IF EXISTS (
        SELECT 1
        FROM agenda
        WHERE id_odontologo = NEW.id_odontologo
        AND fecha = NEW.fecha
        AND (
            NEW.hora_inicio < hora_fin
            AND NEW.hora_fin > hora_inicio
        )
    ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Existe solapamiento de horario para el odontologo';

    END IF;

END$$

DELIMITER ;

-- =========================================================
-- DATOS INICIALES
-- =========================================================

INSERT INTO rol(nombre)
VALUES
('ADMIN'),
('ODONTOLOGO'),
('AUXILIAR');

INSERT INTO ciudad(nombre, departamento)
VALUES
('Sogamoso', 'Boyacá'),
('Tunja', 'Boyacá');

INSERT INTO consultorio(
    nombre,
    nit,
    direccion,
    telefono,
    email,
    id_ciudad
)
VALUES(
    'Consultorio Sonrisa Perfecta',
    '900123456',
    'Carrera 10 #20-30',
    '3200000000',
    'contacto@consultorio.com',
    1
);
INSERT INTO especialidad(
    nombre,
    descripcion
)
VALUES
('Odontología General', 'Atención odontológica general'),
('Ortodoncia', 'Corrección dental'),
('Endodoncia', 'Tratamiento de conductos');

-- Usuario administrador inicial
-- El hash debe generarse desde backend con bcrypt

INSERT INTO usuario(
    id_rol,
    nombres,
    apellidos,
    documento,
    telefono,
    email,
    username,
    password_hash
)
VALUES(
    1,
    'Administrador',
    'Sistema',
    '1000000000',
    '3200000000',
    'admin@consultorio.com',
    'admin',
    '$2b$10$paD.XlwULb.BzjTY/KLMburEb1zcnY4hVS3.yz.K3F0TLPANAlMnK' -- contraseña: admin123
);