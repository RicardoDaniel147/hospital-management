# Informe de Análisis Estático — Frontend (ESLint)

**Proyecto:** Hospital Management System — Validación y Verificación de Software (EPN 2026A)
**Responsable:** Eduardo (Actividad 4 — Análisis Estático Frontend)
**Herramienta:** ESLint 9 (flat config) con `@eslint/js` recommended + reglas adicionales
**Alcance:** `frontend/js/*.js` (app.js, api.js, utils.js, pacientes.js, doctores.js, citas.js, historias.js)

---

## 1. Configuración de la herramienta

- **Archivo:** `frontend/eslint.config.js`
- **Base:** `js.configs.recommended` (reglas recomendadas oficiales)
- **Reglas adicionales activadas** por su relevancia para los defectos de este proyecto:
  - `no-console` — logging de diagnóstico dejado en producción
  - `no-alert` — uso de `alert()` que bloquea el hilo de UI
  - `eqeqeq` — comparaciones no estrictas
  - `no-var` / `prefer-const` — declaraciones obsoletas
  - `no-unused-vars` con `caughtErrors: 'all'` — detecta capturas de excepción ignoradas
- **Entornos:** globals de navegador para `js/*.js`; globals de Node/Jest para pruebas y configuración.
- Los módulos del proyecto se exponen como globals implícitos entre `<script>` (sin sistema de módulos), por lo que se declararon en la configuración para evitar falsos positivos de `no-undef`.

**Ejecución:**

```bash
cd frontend
npm install
npx eslint js/*.js
```

## 2. Resumen de resultados

| Métrica | Valor |
|---|---|
| Archivos analizados | 7 |
| Problemas totales | **30** (24 errores, 6 warnings) |
| Reglas disparadas | `no-unused-vars` (24), `no-console` (5), `no-alert` (1) |

### Clasificación por severidad

| Severidad | Cant. | Hallazgos |
|---|---|---|
| **Critical** | 22 | Bloques `catch` que ignoran la excepción capturada (`no-unused-vars` sobre `error`/`e` en catch): el error se traga y el usuario no recibe información |
| **Major** | 6 | `no-console` (5): logging de diagnóstico con `console.log` en flujo de errores; `no-alert` (1): `alert()` bloqueante en `pacientes.js` |
| **Minor** | 2 | Parámetros `e` sin uso en callbacks no relacionados con manejo de errores |

*(Nota: ESLint reporta severidad error/warning; la clasificación Blocker/Critical/Major/Minor se asigna según el impacto en el usuario final y el riesgo de ocultar defectos.)*

## 3. Detalle de hallazgos por archivo

| Archivo | Línea | Regla | Descripción |
|---|---|---|---|
| app.js | 97 | no-unused-vars | `catch (e)` ignora el error de `edadPromedio()` (división por cero en backend queda oculta) |
| app.js | 100 | no-unused-vars | `catch (error)` del dashboard ignorado |
| app.js | 102 | no-console | `console.log('Error al cargar dashboard')` en vez de `console.error` + aviso al usuario |
| citas.js | 30, 164, 174, 184 | no-unused-vars | Errores de cargar/guardar/editar/eliminar citas ignorados |
| citas.js | 31 | no-console | `console.log` como único registro del fallo de carga (oculta el 500 de `/api/citas`) |
| citas.js | 38, 44, 90 | no-unused-vars | Catch silencioso al cargar doctores/pacientes y al filtrar |
| doctores.js | 23, 121, 130, 141 | no-unused-vars | Errores CRUD de doctores ignorados |
| doctores.js | 24 | no-console | `console.log` en flujo de error |
| historias.js | 29, 130, 165 | no-unused-vars | Errores de historias clínicas ignorados |
| historias.js | 30 | no-console | `console.log` en flujo de error |
| historias.js | 37, 43 | no-unused-vars | Catch silencioso al precargar pacientes/doctores |
| pacientes.js | 25, 143, 162, 171, 182 | no-unused-vars | Errores CRUD de pacientes ignorados |
| pacientes.js | 27 | no-console | `console.log('Error al cargar pacientes')` |
| pacientes.js | 161 | no-alert | `alert(info)` bloquea el hilo de UI para mostrar el detalle del paciente |

## 4. Análisis de hallazgos relevantes (mínimo 5)

### H1 — Manejo de errores silencioso generalizado (Critical)
**Ubicación:** 22 bloques `catch` en los 7 módulos (p. ej. `citas.js:30`, `pacientes.js:25`).
Todos los módulos capturan las excepciones de red/API y las descartan o muestran un mensaje genérico. **Consecuencia real detectada:** el error 500 de `GET /api/citas` (proxies lazy no serializables) pasa completamente inadvertido: la tabla queda vacía y ni el usuario ni el desarrollador reciben señal del fallo (verificado por las pruebas E2E `citas.spec.js`). Un `catch` vacío es el hallazgo con mayor impacto de este análisis porque **oculta todos los demás defectos del sistema**.
**Recomendación:** propagar el error a `showAlert(...)` con el detalle, registrar con `console.error(error)` y monitorear.

### H2 — `console.log` como mecanismo de reporte de errores (Major)
**Ubicación:** `app.js:102`, `citas.js:31`, `doctores.js:24`, `historias.js:30`, `pacientes.js:27`.
Se usa `console.log` (nivel informativo) en rutas de error, en lugar de `console.error` con el objeto de la excepción. En producción no hay consola visible para el usuario, así que equivale a no reportar nada.
**Recomendación:** `console.error('Contexto', error)` + notificación en UI.

### H3 — `alert()` bloqueante para mostrar datos (Major)
**Ubicación:** `pacientes.js:161` (`verPaciente`).
`alert()` congela el hilo principal y no permite formatear la información; además el contenido se construye con template strings sin escape (relacionado con XSS, ver informe OWASP).
**Recomendación:** usar el modal existente en el HTML, con contenido escapado.

### H4 — Búsquedas sin debounce disparan una petición por tecla (Major, detectado por revisión asistida)
**Ubicación:** `pacientes.js:75-84`, `doctores.js:56-66`.
El evento `oninput` invoca directamente a la API. Escribir "Cardiologia" genera 11 peticiones HTTP; combinado con el endpoint vulnerable `buscar-especialidad` amplifica el riesgo (cada tecla ejecuta SQL concatenado).
**Recomendación:** debounce de 300 ms y cancelación con `AbortController`.

### H5 — Captura de excepciones que enmascara defectos del backend (Critical)
**Ubicación:** `app.js:93-99`.
El cálculo de edad promedio (`PacientesAPI.edadPromedio()`) lanza división por cero en el backend cuando no hay pacientes; el `catch (e)` de `app.js` lo convierte en un "—" sin registro alguno. La combinación "bug de backend + catch silencioso en frontend" hace el defecto indetectable sin pruebas automatizadas.
**Recomendación:** distinguir "sin datos" de "error del servidor" en la UI.

### H6 — Riesgos que ESLint básico no detecta (complemento)
La revisión manual asistida por las reglas de seguridad identifica además: uso extensivo de `innerHTML` con datos sin sanitizar (XSS, 8 ubicaciones), validación de email con regex incorrecta (`utils.js:88`), conversión de zona horaria defectuosa (`utils.js:125`) y `fetch` sin timeout (`api.js:31`). Estos hallazgos se desarrollan en el **informe OWASP** (`informes/analisis-owasp.md`) y se cubren con pruebas en `utils.test.js` (Ricardo) y `api.test.js` (Eduardo).

## 5. Conclusiones

1. El patrón dominante de deuda es el **manejo de errores silencioso** (73 % de los hallazgos): oculta fallas reales del backend, incluida una que deja inutilizable el módulo de citas.
2. Ninguno de los hallazgos requiere refactor mayor: todos se corrigen con cambios locales (los fixes propuestos están en la rama de puntos extra).
3. Se recomienda integrar `npx eslint js/*.js` al CI para impedir regresiones (incluido en `.github/workflows/` en la rama de puntos extra).
