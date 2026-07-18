# Informe de Análisis de Seguridad — OWASP Top 10 (2021)

**Proyecto:** Hospital Management System — Validación y Verificación de Software (EPN 2026A)
**Actividad:** 5 — Análisis de Seguridad OWASP 
**Autores del borrador:** pendiente de revisión conjunta con Ricardo
**Estándar de referencia:** OWASP Top 10:2021

> **Estado:** BORRADOR COMPLETO para revisión del equipo. Cubre backend,
> frontend y base de datos. Es la fuente del entregable `informes/analisis-owasp.pdf`
> (exportar a PDF para la entrega). 

---

## Resumen ejecutivo

Se identificaron **10 vulnerabilidades** mapeadas a 6 categorías del OWASP Top 10:2021.
La más grave es una **inyección SQL** real en el endpoint de búsqueda de doctores,
seguida de **XSS almacenado y reflejado** en varios puntos del frontend y de una
**configuración CORS totalmente permisiva**.

| # | Vulnerabilidad | Categoría OWASP | Riesgo |
|---|---|---|---|
| V1 | Inyección SQL en búsqueda de doctores | A03:2021 – Injection | **Alto** |
| V2 | XSS almacenado en diagnóstico de historias clínicas | A03:2021 – Injection | **Alto** |
| V3 | XSS reflejado / DOM en render de tablas y detalle | A03:2021 – Injection | **Alto** |
| V4 | Escape HTML incompleto en `escapeHTML` | A03:2021 – Injection | Medio |
| V5 | CORS permisivo (`origins = "*"`) | A05:2021 – Security Misconfiguration | **Alto** |
| V6 | Exposición de stack trace en respuestas de error | A05 / A04:2021 | Medio |
| V7 | Credenciales de BD embebidas en el repositorio | A07:2021 – Auth Failures / A05 | Medio |
| V8 | Ausencia total de autenticación/autorización | A01:2021 – Broken Access Control | **Alto** |
| V9 | Falta de FOREIGN KEY e integridad (citas.paciente_id) | A04:2021 – Insecure Design | Medio |
| V10 | Sin control de recursos: fetch sin timeout, sin paginación | A04 / A05 | Bajo |

---

## Detalle de vulnerabilidades

### V1 — Inyección SQL en búsqueda por especialidad
- **Categoría:** A03:2021 – Injection
- **Riesgo:** Alto
- **Ubicación:** `backend/.../service/DoctorService.java:57-61` (`buscarPorEspecialidadInsegura`), expuesto por `DoctorController.java:50-53` (`GET /api/doctores/buscar-especialidad?q=`).
- **Descripción:** La consulta se arma concatenando el parámetro del usuario directamente en SQL nativo:
  ```java
  String sql = "SELECT * FROM doctores WHERE especialidad ILIKE '%" + especialidad + "%'";
  entityManager.createNativeQuery(sql, Doctor.class);
  ```
- **Impacto potencial:** Extracción de datos de otras tablas (pacientes, historias clínicas), unión de resultados (`UNION SELECT`), y potencial modificación/borrado según los privilegios del usuario `admin` de la BD.
- **Evidencia / Verificación:**
  ```bash
  # Payload que rompe la sintaxis -> 500 con error SQL (confirma concatenación)
  curl "http://localhost:8080/api/doctores/buscar-especialidad?q=x%27"
  # Payload de tautología -> ignora el filtro y devuelve múltiples doctores
  # (verificado: búsqueda de "Cardiologia" devuelve 1 fila; la tautología
  #  devuelve todas las coincidencias del OR, evidenciando el bypass del WHERE)
  curl "http://localhost:8080/api/doctores/buscar-especialidad?q=%25%27%20OR%20%271%27%3D%271"
  ```
  El frontend llega a este endpoint desde el buscador de doctores (`doctores.js:60`).
- **Mitigación:** Usar consultas parametrizadas / Spring Data (ya existe la versión segura `buscarPorEspecialidad` en la línea 64 que usa `findByEspecialidadContainingIgnoreCase`). Eliminar el método inseguro y apuntar el controlador al seguro.

### V2 — XSS almacenado en diagnóstico de historias clínicas
- **Categoría:** A03:2021 – Injection (Cross-Site Scripting)
- **Riesgo:** Alto
- **Ubicación:** entrada en `frontend/historias.js:116` (sin sanitizar) y `HistoriaClinicaService.java:57` (persiste sin sanitizar); salida en `historias.js:68` y `historias.js:144` (`innerHTML` con `h.diagnostico`).
- **Descripción:** El diagnóstico se guarda tal cual y luego se inyecta con `innerHTML`. Un `<script>`/`<img onerror>` en el diagnóstico se ejecuta al listar o ver la historia.
- **Impacto:** Robo de sesión (si existiera), keylogging, pivote hacia otras cuentas; en un sistema hospitalario, manipulación de datos clínicos mostrados.
- **Verificación:** Crear una historia con diagnóstico `<img src=x onerror=alert(document.domain)>` y abrir la sección Historias. La prueba unitaria `HistoriaClinicaServiceTest.crear_diagnosticoConScript_noSanitiza` confirma que el backend no sanitiza.
- **Mitigación:** Escapar en salida (usar `textContent` o `escapeHTML` corregido) y sanitizar en entrada del backend (p. ej. con OWASP Java HTML Sanitizer). Política CSP restrictiva.

### V3 — XSS reflejado / basado en DOM en render de tablas y detalle
- **Categoría:** A03:2021 – Injection
- **Riesgo:** Alto
- **Ubicación:** `pacientes.js:51-64` y `:153-160`, `doctores.js:35-46`, `citas.js:54-73`, `historias.js:62-74` — todas construyen filas con `innerHTML` interpolando datos sin escapar.
- **Descripción:** Cualquier campo controlable por el usuario (nombre, apellido, motivo, etc.) se refleja sin escape. Combinado con que el backend no sanitiza, cualquier registro con HTML ejecuta código al renderizarse.
- **Impacto:** Igual que V2, extendido a todos los módulos.
- **Verificación:** Registrar un paciente con apellido `<script>alert(1)</script>` y navegar a Pacientes.
- **Mitigación:** Renderizar con `textContent`/`createElement`, o escapar todos los valores con un `escapeHTML` completo antes de interpolar.

### V4 — Escape HTML incompleto (`escapeHTML`)
- **Categoría:** A03:2021 – Injection
- **Riesgo:** Medio
- **Ubicación:** `frontend/utils.js:49-59`.
- **Descripción:** `escapeHTML` no escapa comillas simples (`'`) ni backticks (`` ` ``), permitiendo escapar de atributos delimitados por comilla simple.
- **Impacto:** XSS en contextos de atributo aunque se use la función de escape (falsa sensación de seguridad).
- **Verificación:** `escapeHTML("' onmouseover='alert(1)")` no neutraliza la comilla simple. Cubierto por las pruebas de `utils.test.js` (Ricardo).
- **Mitigación:** Añadir `.replace(/'/g,'&#39;').replace(/`/g,'&#96;')` y aplicar la función consistentemente.

### V5 — CORS totalmente permisivo
- **Categoría:** A05:2021 – Security Misconfiguration
- **Riesgo:** Alto
- **Ubicación:** `@CrossOrigin(origins = "*")` en los 4 controladores (`PacienteController.java:14`, `DoctorController.java:14`, `CitaController.java:15`, `HistoriaClinicaController.java:14`).
- **Descripción:** Cualquier origen puede invocar la API desde el navegador de una víctima.
- **Impacto:** Un sitio malicioso puede leer/escribir datos de la API en nombre del usuario. Sin autenticación (ver V8), el impacto es total.
- **Verificación:** `curl -H "Origin: http://evil.com" -I http://localhost:8080/api/pacientes` devuelve `Access-Control-Allow-Origin: *`.
- **Mitigación:** Configurar una lista blanca de orígenes (`allowedOrigins` con el dominio del frontend) en una configuración central de CORS.

### V6 — Exposición de stack trace e información de depuración
- **Categoría:** A05:2021 – Security Misconfiguration (fuga de información)
- **Riesgo:** Medio
- **Ubicación:** `backend/.../exception/GlobalExceptionHandler.java:54` (`body.put("stackTrace", ex.getStackTrace())`) y `:41` (`body.put("debug", ex.getMessage())`).
- **Descripción:** Las respuestas 500/400 devuelven el stack trace completo y mensajes internos al cliente.
- **Impacto:** Revela rutas de clases, versiones, estructura interna y consultas — facilita otros ataques. Confirmado en la práctica: los 500 de `/api/citas` y `/api/historias-clinicas` devuelven 49 frames de stack trace (ver pruebas E2E).
- **Verificación:** `curl http://localhost:8080/api/citas` → JSON con campo `stackTrace`.
- **Mitigación:** Registrar el detalle en el servidor y devolver un mensaje genérico con un id de correlación. Nunca `stackTrace` ni `debug` al cliente.

### V7 — Credenciales de base de datos embebidas en el repositorio
- **Categoría:** A07:2021 – Identification and Authentication Failures / A05
- **Riesgo:** Medio
- **Ubicación:** `application.properties:7-8` (`admin` / `hospital123`) y `docker-compose.yml` (mismas credenciales).
- **Descripción:** Credenciales en texto plano versionadas en Git.
- **Impacto:** Cualquiera con acceso al repositorio obtiene acceso completo a la BD; las credenciales quedan en el historial aunque se borren después.
- **Verificación:** Inspección directa de los archivos.
- **Mitigación:** Externalizar a variables de entorno (`${DB_PASSWORD}`), usar secretos del entorno de despliegue y rotar las credenciales expuestas.

### V8 — Ausencia total de autenticación y control de acceso
- **Categoría:** A01:2021 – Broken Access Control
- **Riesgo:** Alto
- **Ubicación:** Toda la API (`/api/**`) — no hay Spring Security ni verificación de identidad/rol.
- **Descripción:** Todos los endpoints (incluidas historias clínicas, dato médico sensible) son accesibles sin autenticación.
- **Impacto:** Exposición y modificación de datos personales y clínicos por cualquier usuario de la red. Incumple confidencialidad de datos de salud.
- **Verificación:** `curl http://localhost:8080/api/historias-clinicas/paciente/1` responde sin credenciales.
- **Mitigación:** Introducir autenticación (p. ej. Spring Security + JWT/OAuth2) y autorización por rol (administrador, doctor), aplicando mínimo privilegio.

### V9 — Diseño inseguro: falta de integridad referencial
- **Categoría:** A04:2021 – Insecure Design
- **Riesgo:** Medio
- **Ubicación:** `backend/.../resources/schema.sql:39` (`citas.paciente_id` sin FK) y `:30` (`doctores.especialidad` sin NOT NULL); reforzado en `CitaService.java:36` (crea citas sin verificar que el paciente exista).
- **Descripción:** Se pueden crear citas apuntando a pacientes inexistentes; la especialidad puede quedar nula.
- **Impacto:** Corrupción de datos, inconsistencias no detectables por la BD, decisiones erróneas sobre datos inválidos.
- **Verificación:** `POST /api/citas` con `pacienteId: 99999` (inexistente) se guarda con éxito. Cubierto por `CitaServiceTest.crear_pacienteInexistente_noValidaExistencia`.
- **Mitigación:** Añadir `FOREIGN KEY (paciente_id) REFERENCES pacientes(id)` y `NOT NULL` en especialidad; validar existencia en el servicio.

### V10 — Falta de control de recursos (DoS por diseño)
- **Categoría:** A04:2021 – Insecure Design / A05
- **Riesgo:** Bajo
- **Ubicación:** `api.js:31` (fetch sin timeout/AbortController), `HistoriaClinicaService.java:32` y listados sin paginación, búsquedas sin debounce (`pacientes.js`, `doctores.js`).
- **Descripción:** Sin límites de tamaño de respuesta, sin timeout de cliente ni debounce, la aplicación es vulnerable a agotamiento de recursos.
- **Impacto:** Degradación/denegación de servicio con volúmenes altos o clientes lentos.
- **Verificación:** Revisión de código; `api.js` no configura `signal`.
- **Mitigación:** Paginación (`Pageable`), `AbortController` con timeout en el cliente, límites de tamaño de payload.

---

## Recomendaciones prioritarias

1. **Inmediato (Alto):** Parametrizar la búsqueda SQL (V1), sanitizar/escapar salida para XSS (V2, V3), restringir CORS (V5), introducir autenticación (V8).
2. **Corto plazo (Medio):** Ocultar stack traces (V6), externalizar credenciales (V7), añadir FK y NOT NULL (V9), corregir `escapeHTML` (V4).
3. **Mejora continua (Bajo):** Paginación, timeouts y debounce (V10).

Las correcciones de la parte de base de datos y frontend (V2, V3, V4, V9 y otros)
están implementadas.

## Metodología

- Revisión manual de código (SAST) sobre backend y frontend.
- Verificación dinámica con `curl` y las pruebas automatizadas (unitarias y E2E) del propio proyecto.
- Mapeo de cada hallazgo a la categoría OWASP Top 10:2021 correspondiente.
