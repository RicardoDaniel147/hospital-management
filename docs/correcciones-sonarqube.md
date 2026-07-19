# Correcciones de Cobertura y Duplicación — SonarQube

**Proyecto:** Hospital Management System — Validación y Verificación de Software (EPN 2026A)
**Rama:** `claude/sonarqube-tests-coverage-rp85yq`
**Motivo:** El *Quality Gate* de SonarQube (análisis "New Code", código nuevo desde el
18 de julio de 2026) reportaba 2 condiciones en rojo:

| Métrica | Valor reportado | Requerido | Estado |
|---|---|---|---|
| Coverage (New Code) | 13.6 % sobre 42 líneas nuevas a cubrir | ≥ 80.0 % | ❌ Failed |
| Duplicated Lines (%) (New Code) | 9.84 % sobre 122 líneas nuevas | ≤ 3.0 % | ❌ Failed |

> **Nota sobre el alcance de esta corrección:** esta sesión no tuvo acceso directo a la
> instancia de SonarQube del usuario (corre en un Codespace/navegador aparte). El
> diagnóstico se hizo ejecutando las mismas herramientas que alimentan a SonarQube
> (`mvn test jacoco:report` y `jest --coverage`) e inspeccionando sus reportes
> (`backend/target/site/jacoco/jacoco.xml`, `frontend/coverage/lcov.info`) línea por
> línea. Se recomienda volver a ejecutar el análisis de SonarQube sobre esta rama para
> confirmar que las 2 condiciones pasan a verde.

---

## 1. Resumen ejecutivo

Antes de poder hablar de cobertura, el backend **ni siquiera compilaba**: el último
commit (`fix(sonarqube)`) quedó con tres archivos usando `ZoneId` sin importarlo. Un
build roto explica por sí solo un número de cobertura bajo y poco confiable — JaCoCo no
puede reportar sobre clases que no compilan. A eso se sumaba un test con una fecha
inválida y dos defectos en la configuración de Jest/ESLint que impedían que las pruebas
del frontend contaran para la cobertura aunque se ejecutaran correctamente.

| Componente | Antes | Después |
|---|---|---|
| Backend: `mvn test` | **BUILD FAILURE** (error de compilación) | 60/60 pruebas verdes |
| Backend: cobertura de líneas del proyecto (JaCoCo) | No medible (build roto) | **80.5 %** (306/380) |
| Backend: `GlobalExceptionHandler` | 4.8 % (1/21 líneas) | **100 %** (21/21) |
| Backend: `PacienteService` | 44.0 % (22/50 líneas) | **100 %** (50/50) |
| Frontend: `npm test` (Jest) | 33/33 verdes, pero **0 % de cobertura real** (ver causa raíz abajo) | 68/68 verdes |
| Frontend: cobertura `api.js` + `utils.js` (Jest) | 0 % (ningún archivo instrumentado) | **99.0 % stmts / 100 % líneas** |
| Frontend: `npm run lint` (ESLint) | 2 errores, 9 warnings | **0 errores**, 9 warnings (pre-existentes, documentados como bugs intencionales) |
| Duplicación `cargarDoctores`/`cargarPacientes` | Idéntica letra por letra en `citas.js` e `historias.js` | Extraída a un helper único en `utils.js` |

---

## 2. Errores bloqueantes encontrados al ejecutar las pruebas

Estos defectos se detectaron simplemente corriendo `mvn test` y `npm test`/`npm run
lint` — el primer paso pedido. Sin corregirlos, ninguna medición de cobertura o
duplicación posterior es confiable.

### 2.1 Backend no compilaba: `ZoneId` sin importar (Bloqueante)

El commit `fix(sonarqube)` introdujo `ZoneId.of("America/Guayaquil")` en tres archivos
para fijar la zona horaria de Ecuador, pero olvidó el `import java.time.ZoneId;` en
todos ellos:

- `backend/src/main/java/com/hospital/service/CitaService.java`
- `backend/src/main/java/com/hospital/service/PacienteService.java`
- `backend/src/main/java/com/hospital/model/HistoriaClinica.java`

```
[ERROR] .../CitaService.java:[23,26] cannot find symbol
  symbol:   class ZoneId
[ERROR] .../HistoriaClinica.java:[10,26] cannot find symbol
  symbol:   class ZoneId
[ERROR] .../PacienteService.java:[16,26] cannot find symbol
  symbol:   class ZoneId
```

**Corrección:** se agregó `import java.time.ZoneId;` en los tres archivos. Esto por sí
solo explica gran parte del "13.6 % de cobertura": si el proyecto no compila, JaCoCo no
puede generar un reporte actualizado de las clases modificadas.

### 2.2 Fecha inválida en una prueba existente (Bloqueante)

`CitaServiceTest.listarPorRangoFechas_rangoValido_retornaCitas` construía
`LocalDateTime.of(2026, Month.SEPTEMBER, 31, 23, 59)`. Septiembre tiene 30 días, así que
la propia construcción del objeto lanzaba `DateTimeException: Invalid date 'SEPTEMBER
31'` antes de que la prueba pudiera ejecutarse.

**Corrección:** se cambió el día a `30` (el último día válido de septiembre).

### 2.3 Errores de ESLint en `utils.js` (Bloqueante para CI)

`npm run lint` fallaba con 2 errores `no-undef` sobre la referencia a `module` dentro
del bloque `if (typeof module !== 'undefined' && module.exports) { module.exports =
{...} }` de `utils.js`. La configuración de ESLint solo declaraba globals de navegador
para `js/*.js`, y `module` es un global de Node/CommonJS.

**Corrección:** se agregó `module: 'readonly'` a los globals de `frontend/eslint.config.js`
(mismo patrón ya usado para declarar `escapeHTML`, `formatDate`, etc.).

---

## 3. Por qué la cobertura marcaba 13.6 % pese a existir pruebas

Con el build ya arreglado, se identificaron dos causas raíz independientes: una en
backend y otra en frontend.

### 3.1 Backend — `GlobalExceptionHandler` nunca se ejecutaba (0 % → 100 %)

El mismo commit `fix(sonarqube)` reescribió las tres funciones de
`GlobalExceptionHandler` (extrajo las constantes `TIMESTAMP`/`STATUS` y cambió
`LocalDateTime.now()` por `LocalDateTime.now(ZoneOffset.UTC)`), por lo que **todo el
archivo cuenta como código nuevo**. Sin embargo, ninguna prueba existente disparaba una
excepción real:

- `PacienteControllerIntegrationTest` y `DoctorControllerIntegrationTest` (los únicos
  tests de controlador que existen) solo prueban el camino feliz: `listar()` devuelve
  200 y `crear()` devuelve 201.
- Ninguna prueba provoca un `ResourceNotFoundException` (404), una validación fallida
  de `@Valid` (400) ni una excepción genérica (500).

El reporte de JaCoCo confirmó 1/21 líneas cubiertas (4.8 %) en ese archivo.

**Corrección:** se creó `backend/src/test/java/com/hospital/exception/GlobalExceptionHandlerTest.java`,
una prueba unitaria directa (sin levantar contexto de Spring) que ejercita las tres
ramas: `handleNotFound` (404), `handleValidation` (400, con un `FieldError` simulado) y
`handleGeneral` (500, verificando además que **no** filtra el mensaje interno de la
excepción). Resultado: 21/21 líneas cubiertas.

### 3.2 Backend — `PacienteService` con la cobertura más baja de los 4 servicios (44 % → 100 %)

A diferencia de `CitaService` e `HistoriaClinicaService` (ya al 100 %, con baterías de
pruebas "Casos Felices / Casos Límite / Manejo de Errores"), `PacienteServiceTest` solo
tenía 5 pruebas y dejaba sin cubrir: `actualizar()`, `eliminar()`, `buscarPorNombre()`,
`buscarPorEmail()`, el email duplicado en `crear()`, la rama con pacientes de
`calcularEdadPromedio()` y el valor por defecto de `activo` en `toEntity()` — esta
última es exactamente la línea que tocó el commit `fix(sonarqube)`
(`p.setActivo(dto.getActivo() == null || dto.getActivo())`).

**Corrección:** se amplió `PacienteServiceTest` de 5 a 17 pruebas, cubriendo todas las
ramas anteriores. Las pruebas de `calcularEdadPromedio` usan `LocalDate.now(ZoneId.of("America/Guayaquil"))` —
la misma zona horaria fija que ahora usa el servicio — en vez de `LocalDate.now()` del
sistema, para no depender de la zona horaria local de la máquina que ejecuta la prueba.

### 3.3 Frontend — `utils.js` tenía una prueba escrita que Jest nunca ejecutaba (0 % real)

`frontend/utils.test.js` existía y probaba 7 de las 8 funciones de `utils.js`, pero:

1. **Vivía en `frontend/utils.test.js`** (raíz del frontend), no en
   `frontend/js/__tests__/`. El `testMatch` de Jest en `package.json` es
   `"**/js/__tests__/**/*.test.js"`, así que ese archivo **nunca se descubría** al
   correr `npm test`.
2. Estaba escrito con el runner nativo de Node (`require('node:test')`,
   `require('node:assert/strict')`), no con Jest — aunque se hubiera movido de carpeta,
   `jest` lo habría ignorado igual por no usar su API.
3. Incluso ejecutado manualmente con `node --test`, la prueba de `showAlert` habría
   fallado: mockeaba `document` sin `createElement`, pero la versión actual de
   `showAlert` ya no arma el HTML por concatenación de string (corrección de XSS) sino
   que llama a `document.createElement('div')`.
4. No probaba `localToISO`, la octava función exportada.

**Corrección:** se reescribió como `frontend/js/__tests__/utils.test.js` en sintaxis
Jest (`describe`/`test`/`expect`), con un `document` simulado que sí implementa
`createElement`, cubriendo las 8 funciones (incluida `localToISO`) más casos límite
(`null`/`undefined`/cadena vacía/fecha inválida). Se eliminó el archivo viejo.

### 3.4 Frontend — `api.js` tenía 33 pruebas pero cobertura **cero** (causa raíz más impactante)

`frontend/js/__tests__/api.test.js` (32-33 pruebas, todas pasando) cargaba `api.js` así:

```js
const code = fs.readFileSync(path.join(__dirname, '..', 'api.js'), 'utf8');
const factory = new Function(`${code}; return { apiFetch, ... };`);
```

Esto evitaba "modificar el código fuente" (restricción original del enunciado), pero
`new Function(...)` ejecuta el código **fuera del sistema de módulos de Node**. Jest
instrumenta para cobertura únicamente los archivos que pasan por `require()`; un
archivo leído con `fs` y evaluado con `new Function` es invisible para Istanbul. Por
eso `jest --coverage` mostraba la tabla vacía (`All files | 0 | 0 | 0 | 0`) pese a que
las 32 pruebas sí ejercitaban la lógica real.

Dado que la rama actual (`fix(extra)`, `fix(ci)`, `fix(sonarqube)`) ya modifica
`api.js` directamente para corregir bugs (timeout, manejo de errores HTTP, `unwrapPage`
para respuestas paginadas), la restricción de "no tocar el código fuente" ya no aplica
igual que en la entrega original.

**Corrección:** se agregó a `api.js` el mismo patrón UMD que ya usaba `utils.js`:

```js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiFetch, unwrapPage, PacientesAPI, DoctoresAPI, CitasAPI, HistoriasAPI };
}
```

Este bloque no afecta el uso como `<script>` en el navegador (`module` no existe ahí),
pero permite que `api.test.js` haga `require('../api.js')` en vez del *hack* de
`fs`/`new Function`. Se simplificó `api.test.js` en consecuencia
(`jest.resetModules()` + `require` en `beforeEach`, preservando el aislamiento entre
pruebas que antes daba la recarga manual). Resultado: `api.js` pasó de 0 % a 98.36 %
statements / 100 % líneas. También se agregaron pruebas para `unwrapPage` (la función
que desempaqueta `Page<T>` de Spring Data, tocada por el commit `fix(ci)`) y para tres
métodos de API que quedaban sin probar (`DoctoresAPI.buscar`, `CitasAPI.buscar`,
`CitasAPI.actualizar`/`eliminar`).

---

## 4. Duplicación de código

Se comparó el contenido de los 4 módulos CRUD del frontend
(`pacientes.js`, `doctores.js`, `citas.js`, `historias.js`) buscando bloques
idénticos. La mayoría de los métodos (`guardarX`, `editarX`, `eliminarX`) tienen forma
parecida pero usan identificadores distintos (`DoctoresAPI` vs. `CitasAPI`, nombres de
campos, mensajes) y no son duplicados literales.

Sí se encontró un duplicado exacto, letra por letra, entre `citas.js` e `historias.js`:

```js
// citas.js e historias.js — código idéntico
async cargarDoctores() {
    try {
        this.doctoresCache = await DoctoresAPI.listar();
    } catch { /* silencioso */ }
},

async cargarPacientes() {
    try {
        this.pacientesCache = await PacientesAPI.listar();
    } catch { /* silencioso */ }
},
```

**Corrección:** se extrajo un helper compartido en `utils.js`:

```js
async function cargarListaSilenciosa(fetchFn) {
    try {
        return await fetchFn();
    } catch {
        return [];
    }
}
```

y ambos módulos ahora lo reutilizan:

```js
async cargarDoctores() {
    this.doctoresCache = await cargarListaSilenciosa(() => DoctoresAPI.listar());
},
async cargarPacientes() {
    this.pacientesCache = await cargarListaSilenciosa(() => PacientesAPI.listar());
},
```

Se agregaron pruebas para `cargarListaSilenciosa` (camino feliz y camino de error) en
`utils.test.js`, y se registró el nuevo global en `eslint.config.js` (globals +
`no-unused-vars`) siguiendo el mismo patrón que el resto de los módulos.

Como SonarQube no fue accesible desde esta sesión para confirmar el % exacto de
duplicación restante, se recomienda volver a correr el análisis tras este cambio; si
todavía marca duplicación por encima del 3 %, es probable que provenga de similitudes
estructurales entre los 4 módulos CRUD que SonarQube normaliza de forma distinta a una
comparación literal (ver sección 6).

---

## 5. Archivos modificados

| Archivo | Cambio |
|---|---|
| `backend/.../service/CitaService.java` | + `import java.time.ZoneId;` |
| `backend/.../service/PacienteService.java` | + `import java.time.ZoneId;` |
| `backend/.../model/HistoriaClinica.java` | + `import java.time.ZoneId;` |
| `backend/.../service/CitaServiceTest.java` | Fecha inválida `SEPTEMBER 31` → `SEPTEMBER 30` |
| `backend/.../service/PacienteServiceTest.java` | 5 → 17 pruebas (actualizar, eliminar, búsquedas, email duplicado, edad promedio, `activo` por defecto) |
| `backend/.../exception/GlobalExceptionHandlerTest.java` | **Nuevo** — cubre `handleNotFound`/`handleValidation`/`handleGeneral` |
| `frontend/js/api.js` | + guardia UMD `module.exports` (sin cambios de comportamiento en navegador) |
| `frontend/js/utils.js` | + `cargarListaSilenciosa`, agregada a `module.exports` |
| `frontend/js/citas.js` | `cargarDoctores`/`cargarPacientes` usan el helper compartido |
| `frontend/js/historias.js` | `cargarDoctores`/`cargarPacientes` usan el helper compartido |
| `frontend/js/__tests__/api.test.js` | Carga `api.js` con `require` en vez de `fs`+`new Function`; + pruebas de `unwrapPage`, `buscar`/`actualizar`/`eliminar` faltantes |
| `frontend/js/__tests__/utils.test.js` | **Nuevo** (reemplaza a `frontend/utils.test.js`) — reescrito en Jest, cubre las 8 funciones + `cargarListaSilenciosa` |
| `frontend/utils.test.js` | **Eliminado** (mal ubicado, con runner incorrecto) |
| `frontend/eslint.config.js` | + global `module`, + global `cargarListaSilenciosa` |

---

## 6. Fuera de alcance / recomendaciones futuras

Estos puntos **no** forman parte del código nuevo evaluado por el Quality Gate actual
(no fueron tocados por los commits desde el 18 de julio), por lo que no afectan el
resultado de esta corrección, pero quedan documentados para una futura iteración del
proyecto:

- `CitaController` (0 %) y `HistoriaClinicaController` (0 %) no tienen pruebas de
  integración propias — `DOCUMENTACION.md` los pedía originalmente
  (`CitaControllerIntegrationTest`, `HistoriaClinicaControllerIntegrationTest`).
- `DoctorService` (58.6 %) y los controladores de Paciente/Doctor (50 % cada uno) solo
  cubren el camino feliz de `listar`/`crear` vía `MockMvc`.
- Los módulos con manipulación de DOM (`app.js`, `citas.js`, `doctores.js`,
  `historias.js`, `pacientes.js`) siguen sin pruebas unitarias Jest — su cobertura
  proviene de las pruebas E2E de Playwright (`frontend/e2e/`), que SonarQube excluye
  explícitamente de `sonar.sources` (`sonar.exclusions`).

## 7. Cómo verificar

```bash
# Backend: 60 pruebas, cobertura en backend/target/site/jacoco/index.html
cd backend && mvn test jacoco:report

# Frontend: 68 pruebas, cobertura en frontend/coverage/lcov-report/index.html
cd frontend && npm ci && npm run lint && npm test -- --coverage

# E2E (opcional, no afecta el Quality Gate — frontend/e2e/ esta excluido del analisis)
cd frontend && npx playwright install --with-deps chromium && npx playwright test
```

Después, volver a ejecutar el análisis de SonarQube sobre esta rama para confirmar que
"Coverage on New Code" y "Duplicated Lines on New Code" pasan a verde.
