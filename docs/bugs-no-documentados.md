# Bugs NO documentados encontrados

**Proyecto:** Hospital Management System — Validación y Verificación de Software (EPN 2026A)
**Responsable:** Eduardo
**Contexto:** Punto extra — «Identificar bugs NO documentados (+5%)». Estos defectos
**no** aparecen en la lista de "Bugs Intencionales Incluidos" del `README.md`
(sección 8) y fueron detectados durante la implementación de las pruebas.

---

## BUG-ND-01 — HTTP 500 al listar/consultar citas e historias clínicas (serialización de proxies lazy) — **Severidad: Alta**

- **Ubicación:**
  - `backend/.../model/Cita.java:20-22` (`@ManyToOne(fetch = FetchType.LAZY) private Doctor doctor;`)
  - `backend/.../model/HistoriaClinica.java:14-20` (`paciente` y `doctor` LAZY)
  - Controladores que devuelven la **entidad JPA directamente** en lugar de un DTO:
    `CitaController` (`GET /api/citas`, `/api/citas/{id}`, `/api/citas/doctor/{id}`,
    `/api/citas/estado/{estado}`, `/api/citas/rango-fechas`) y todos los `GET` de
    `HistoriaClinicaController`.
- **Descripción:** Al serializar la respuesta, Jackson recibe un proxy lazy de
  Hibernate (`ByteBuddyInterceptor`) sin inicializar y sin el módulo
  `jackson-datatype-hibernate` registrado. La serialización falla y el
  `GlobalExceptionHandler` responde **HTTP 500**. El `POST` sí funciona porque la
  entidad asociada (doctor/paciente) se carga como objeto real antes de guardar.
- **Impacto:** Las tablas de **Citas** e **Historias Clínicas** del frontend quedan
  **siempre vacías**; combinado con el manejo de errores silencioso del frontend,
  el fallo es invisible para el usuario. Es el defecto más grave del sistema porque
  inutiliza dos de los cuatro módulos y no está en la lista oficial de bugs.
- **Verificación:**
  ```bash
  curl -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/citas              # 500
  curl -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/historias-clinicas # 500
  # En cambio el POST funciona:
  curl -X POST http://localhost:8080/api/citas -H 'Content-Type: application/json' \
       -d '{"pacienteId":1,"doctorId":1,"fechaHora":"2027-05-01T10:00:00","estado":"PROGRAMADA"}' # 200
  ```
  Cubierto por las pruebas E2E `frontend/e2e/citas.spec.js` e `historias.spec.js`
  (aserciones `status === 500` y tabla vacía).
- **Corrección sugerida (backend — Ricardo):** exponer DTOs en los controladores en
  lugar de entidades, o registrar `com.fasterxml.jackson.datatype:jackson-datatype-hibernate6`
  con `Hibernate6Module`, o usar `JOIN FETCH` en las consultas. *(No se corrige en
  esta rama por pertenecer al dominio de backend; se deja documentado para el equipo.)*

## BUG-ND-02 — `apiFetch` pierde el `Content-Type` al pasar headers personalizados — **Severidad: Media**

- **Ubicación:** `frontend/js/api.js` (versión original de `apiFetch`).
- **Descripción:** El objeto de configuración se construía como
  `{ headers: { 'Content-Type': ..., ...options.headers }, ...options }`. Como
  `...options` se expande **después** de `headers`, cualquier llamada que pase
  `options.headers` **reemplaza** el merge completo y elimina el `Content-Type`
  por defecto. El README menciona "falta de timeout" y "manejo de errores", pero
  no este defecto de precedencia en el spread.
- **Impacto:** Peticiones con headers personalizados enviadas sin `Content-Type`,
  provocando que el backend no interprete el cuerpo como JSON.
- **Verificación:** prueba `api.test.js` (documentada en la rama principal como
  "BUG NO DOCUMENTADO" y **corregida** en esta rama).
- **Corrección:** implementada en esta rama — `apiFetch` desestructura `headers` y
  los fusiona sobre el `Content-Type` por defecto.

## BUG-ND-03 — El Maven Wrapper (`mvnw`) referenciado en la documentación no existe — **Severidad: Baja**

- **Ubicación:** `README.md` (§5.2) y `PROYECTO_ESTUDIANTES.pdf` (§6.2) indican
  ejecutar `./mvnw spring-boot:run`, pero el repositorio **no incluye** `mvnw`,
  `mvnw.cmd` ni el directorio `.mvn/wrapper`.
- **Descripción:** Inconsistencia entre documentación y contenido del repositorio;
  quien siga la guía al pie de la letra obtiene `No such file or directory`.
- **Impacto:** Falla la puesta en marcha para quien no tenga Maven instalado
  globalmente (la guía asume que el wrapper está presente).
- **Verificación:** `ls backend/mvnw` → no existe. Se usó `mvn` del sistema.
- **Corrección sugerida:** ejecutar `mvn -N wrapper:wrapper` en `backend/` y versionar
  el wrapper, o corregir la documentación para usar `mvn`.

## BUG-ND-04 — La eliminación (DELETE) reporta error en la UI aunque se ejecuta — **Severidad: Media**

- **Ubicación:** `frontend/js/api.js` (`apiFetch`) + `PacienteController.java:49`,
  `DoctorController.java:46`, `CitaController.java:47` (DELETE devuelve `200 OK`
  con cuerpo vacío).
- **Descripción:** El README documenta que el DELETE devuelve `200` en lugar de
  `204` como bug de *status HTTP*. El efecto **secundario no documentado** es que
  `apiFetch` hacía `response.json()` sobre un cuerpo vacío, lanzando `SyntaxError`;
  la UI mostraba "Error al eliminar" **aunque el registro sí se eliminaba** en el
  backend. Es un defecto de interacción distinto al status HTTP en sí.
- **Impacto:** Confusión del usuario (mensaje de error tras una operación exitosa).
- **Verificación:** documentado por las pruebas E2E de la rama principal
  (`pacientes.spec.js`, `doctores.spec.js`) y **corregido** en esta rama.
- **Corrección:** implementada — `apiFetch` maneja respuestas `204`/`200` con cuerpo
  vacío devolviendo `null` en lugar de fallar.

---

## Resumen

| ID | Bug | Severidad | Estado |
|----|-----|-----------|--------|
| BUG-ND-01 | HTTP 500 por serialización de proxies lazy (citas/historias) | Alta | Documentado (fix backend pendiente — Ricardo) |
| BUG-ND-02 | `apiFetch` pierde Content-Type con headers custom | Media | Corregido en esta rama |
| BUG-ND-03 | `mvnw` referenciado pero ausente | Baja | Documentado |
| BUG-ND-04 | DELETE reporta error en UI pese a ejecutarse | Media | Corregido en esta rama |
