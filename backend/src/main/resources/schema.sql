-- ============================================
-- Hospital Management System - DDL
-- ============================================

-- CORRECCION: se subsanan las dos imperfecciones de
-- diseño de la base de datos documentadas en el proyecto:
--   #1  doctores.especialidad ahora es NOT NULL (era nullable)
--   #2  citas.paciente_id ahora tiene FOREIGN KEY hacia pacientes(id)

DROP TABLE IF EXISTS historias_clinicas CASCADE;
DROP TABLE IF EXISTS citas CASCADE;
DROP TABLE IF EXISTS doctores CASCADE;
DROP TABLE IF EXISTS pacientes CASCADE;

-- Tabla: pacientes
CREATE TABLE pacientes (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    email VARCHAR(150),
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla: doctores
CREATE TABLE doctores (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    especialidad VARCHAR(100) NOT NULL,   -- CORREGIDO: la especialidad es obligatoria (HU-02)
    email VARCHAR(150),
    telefono VARCHAR(20),
    consultorio VARCHAR(50)
);

-- Tabla: citas
CREATE TABLE citas (
    id BIGSERIAL PRIMARY KEY,
    paciente_id BIGINT NOT NULL,     -- CORREGIDO: ahora con FOREIGN KEY a pacientes(id)
    doctor_id BIGINT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    motivo VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'PROGRAMADA',
    CONSTRAINT fk_citas_doctor FOREIGN KEY (doctor_id) REFERENCES doctores(id),
    CONSTRAINT fk_citas_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
);

-- Tabla: historias_clinicas
CREATE TABLE historias_clinicas (
    id BIGSERIAL PRIMARY KEY,
    paciente_id BIGINT NOT NULL,
    doctor_id BIGINT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT,
    observaciones TEXT,
    CONSTRAINT fk_historia_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    CONSTRAINT fk_historia_doctor FOREIGN KEY (doctor_id) REFERENCES doctores(id)
);