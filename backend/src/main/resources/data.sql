-- ============================================
-- Hospital Management System - DML Inicial
-- ============================================

-- Datos semilla para pacientes
INSERT INTO pacientes (nombre, apellido, fecha_nacimiento, email, telefono, direccion, activo) VALUES
('Juan', 'Perez', '1985-03-15', 'juan.perez@email.com', '0991234567', 'Av. Amazonas N45-123', TRUE),
('Maria', 'Garcia', '1990-07-22', 'maria.garcia@email.com', '0987654321', 'Calle Loja E4-56', TRUE),
('Carlos', 'Lopez', '1978-11-30', 'carlos.lopez@email.com', '0976543210', 'Av. 6 de Diciembre N34-78', TRUE),
('Ana', 'Martinez', '2000-01-10', 'ana.martinez@email.com', '0965432109', 'Calle Cuenca E2-14', TRUE),
('Pedro', 'Ramirez', '1965-06-05', 'pedro.ramirez@email.com', '0954321098', 'Av. Colon O3-45', FALSE);

-- Datos semilla para doctores
INSERT INTO doctores (nombre, apellido, especialidad, email, telefono, consultorio) VALUES
('Elena', 'Rodriguez', 'Cardiologia', 'elena.rodriguez@hospital.com', '0943210987', 'CONS-101'),
('Miguel', 'Torres', 'Pediatria', 'miguel.torres@hospital.com', '0932109876', 'CONS-205'),
('Sofia', 'Castillo', 'Dermatologia', 'sofia.castillo@hospital.com', '0921098765', 'CONS-304'),
('Diego', 'Morales', 'Medicina General', 'diego.morales@hospital.com', '0910987654', 'CONS-150');

-- Datos semilla para citas
INSERT INTO citas (paciente_id, doctor_id, fecha_hora, motivo, estado) VALUES
(1, 1, '2026-06-20 09:00:00', 'Control cardiaco de rutina', 'PROGRAMADA'),
(2, 2, '2026-06-20 10:30:00', 'Revision pediatrica hijo', 'PROGRAMADA'),
(3, 3, '2026-06-21 14:00:00', 'Consulta dermatologica', 'PROGRAMADA'),
(1, 4, '2026-06-19 08:00:00', 'Chequeo general', 'COMPLETADA'),
(4, 1, '2026-06-22 11:00:00', 'Dolor en el pecho', 'PROGRAMADA');

-- Datos semilla para historias clinicas
INSERT INTO historias_clinicas (paciente_id, doctor_id, fecha_creacion, diagnostico, tratamiento, observaciones) VALUES
(1, 1, '2026-06-19 08:30:00', 'Hipertension arterial controlada', 'Losartan 50mg diario', 'Paciente responde bien al tratamiento'),
(1, 4, '2026-06-19 08:45:00', 'Obesidad grado I', 'Plan alimenticio y ejercicio', 'IMC: 31.2'),
(3, 3, '2026-06-21 14:30:00', 'Dermatitis atopica', 'Crema de hidrocortisona 1%', 'Evitar exposicion solar prolongada');
