/**
 * api.test.js - Pruebas unitarias del modulo api.js con Jest
 *
 * Responsable: Eduardo
 * Actividad 2 — Pruebas Unitarias Frontend (api.js)
 *
 * Estrategia:
 *  - api.js es un script de navegador sin exports, por lo que se carga con
 *    fs + new Function para no modificar el codigo fuente (el enunciado
 *    prohibe modificarlo salvo en el punto extra de correcciones).
 *  - global.fetch se reemplaza por un mock de Jest en cada prueba.
 *  - Se prueban: construccion de URLs, metodos HTTP, headers, cuerpo JSON,
 *    entradas invalidas y el comportamiento ante errores HTTP.
 *  - Las pruebas marcadas "BUG DETECTADO" documentan defectos intencionales
 *    del modulo sin corregirlos.
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:8080/api';

/**
 * Carga api.js en un scope aislado y devuelve sus objetos publicos.
 * Las llamadas a fetch dentro del modulo resuelven al global mockeado.
 */
function loadApiModule() {
    const code = fs.readFileSync(path.join(__dirname, '..', 'api.js'), 'utf8');
    const factory = new Function(
        `${code}; return { apiFetch, PacientesAPI, DoctoresAPI, CitasAPI, HistoriasAPI };`
    );
    return factory();
}

/** Crea una respuesta simulada de fetch */
function mockResponse(body, { ok = true, status = 200 } = {}) {
    return {
        ok,
        status,
        json: jest.fn().mockResolvedValue(body),
        text: jest.fn().mockResolvedValue(body === undefined ? '' : JSON.stringify(body)),
    };
}

let api;

beforeEach(() => {
    api = loadApiModule();
    global.fetch = jest.fn();
});

afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
});

// ==================== apiFetch (funcion base) ====================

describe('apiFetch', () => {
    test('construye la URL con API_BASE y envia Content-Type application/json', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.apiFetch('/pacientes');

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, config] = global.fetch.mock.calls[0];
        expect(url).toBe(`${API_BASE}/pacientes`);
        expect(config.headers['Content-Type']).toBe('application/json');
    });

    test('retorna el JSON parseado de la respuesta', async () => {
        const payload = [{ id: 1, nombre: 'Juan' }];
        global.fetch.mockResolvedValue(mockResponse(payload));

        const data = await api.apiFetch('/pacientes');

        expect(data).toEqual(payload);
    });

    test('CORREGIDO: conserva el Content-Type por defecto al añadir headers personalizados', async () => {
        global.fetch.mockResolvedValue(mockResponse({}));

        await api.apiFetch('/pacientes', { headers: { Authorization: 'Bearer abc' } });

        const [, config] = global.fetch.mock.calls[0];
        expect(config.headers.Authorization).toBe('Bearer abc');
        expect(config.headers['Content-Type']).toBe('application/json');
    });

    test('propaga el error cuando fetch rechaza (fallo de red)', async () => {
        global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(api.apiFetch('/pacientes')).rejects.toThrow('Failed to fetch');
    });

    test('CORREGIDO: lanza un error con status y body cuando response.ok es false', async () => {
        const errorBody = { message: 'Recurso no encontrado', status: 404 };
        global.fetch.mockResolvedValue(mockResponse(errorBody, { ok: false, status: 404 }));

        await expect(api.apiFetch('/pacientes/999')).rejects.toMatchObject({
            message: 'Recurso no encontrado',
            status: 404,
            body: errorBody,
        });
    });

    test('CORREGIDO: maneja respuestas 204 sin cuerpo devolviendo null', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 204,
            json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON input')),
            text: jest.fn().mockResolvedValue(''),
        });

        const data = await api.apiFetch('/pacientes/1', { method: 'DELETE' });

        expect(data).toBeNull();
    });

    test('CORREGIDO: maneja respuestas 200 con cuerpo vacio (DELETE) devolviendo null', async () => {
        global.fetch.mockResolvedValue(mockResponse(undefined, { ok: true, status: 200 }));

        const data = await api.apiFetch('/pacientes/1', { method: 'DELETE' });

        expect(data).toBeNull();
    });

    test('CORREGIDO: configura un AbortSignal (timeout) en la peticion fetch', async () => {
        global.fetch.mockResolvedValue(mockResponse({}));

        await api.apiFetch('/pacientes');

        const [, config] = global.fetch.mock.calls[0];
        expect(config.signal).toBeDefined();
    });
});

// ==================== PacientesAPI ====================

describe('PacientesAPI', () => {
    test('listar hace GET a /pacientes', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.PacientesAPI.listar();

        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/pacientes`);
    });

    test('buscar hace GET a /pacientes/{id}', async () => {
        global.fetch.mockResolvedValue(mockResponse({ id: 3 }));

        const data = await api.PacientesAPI.buscar(3);

        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/pacientes/3`);
        expect(data).toEqual({ id: 3 });
    });

    test('crear hace POST con el paciente serializado en el body', async () => {
        const paciente = { nombre: 'Ana', apellido: 'Martinez' };
        global.fetch.mockResolvedValue(mockResponse({ id: 6, ...paciente }));

        await api.PacientesAPI.crear(paciente);

        const [url, config] = global.fetch.mock.calls[0];
        expect(url).toBe(`${API_BASE}/pacientes`);
        expect(config.method).toBe('POST');
        expect(JSON.parse(config.body)).toEqual(paciente);
    });

    test('actualizar hace PUT a /pacientes/{id}', async () => {
        const cambios = { nombre: 'Ana Maria' };
        global.fetch.mockResolvedValue(mockResponse({ id: 6, ...cambios }));

        await api.PacientesAPI.actualizar(6, cambios);

        const [url, config] = global.fetch.mock.calls[0];
        expect(url).toBe(`${API_BASE}/pacientes/6`);
        expect(config.method).toBe('PUT');
        expect(JSON.parse(config.body)).toEqual(cambios);
    });

    test('eliminar hace DELETE a /pacientes/{id}', async () => {
        global.fetch.mockResolvedValue(mockResponse({}));

        await api.PacientesAPI.eliminar(6);

        const [url, config] = global.fetch.mock.calls[0];
        expect(url).toBe(`${API_BASE}/pacientes/6`);
        expect(config.method).toBe('DELETE');
    });

    test('buscarPorNombre codifica el parametro de busqueda en la URL', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.PacientesAPI.buscarPorNombre('María José & <script>');

        const url = global.fetch.mock.calls[0][0];
        expect(url).toBe(
            `${API_BASE}/pacientes/buscar?nombre=${encodeURIComponent('María José & <script>')}`
        );
        expect(url).not.toContain('<script>');
    });

    test('edadPromedio hace GET al endpoint de estadisticas', async () => {
        global.fetch.mockResolvedValue(mockResponse(42.5));

        const data = await api.PacientesAPI.edadPromedio();

        expect(global.fetch.mock.calls[0][0])
            .toBe(`${API_BASE}/pacientes/estadisticas/edad-promedio`);
        expect(data).toBe(42.5);
    });

    // Casos limite: entradas invalidas
    test('CASO LIMITE: buscar con id undefined genera URL invalida sin validar', async () => {
        global.fetch.mockResolvedValue(mockResponse({}));

        await api.PacientesAPI.buscar(undefined);

        // El modulo no valida el parametro: la URL termina en /undefined
        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/pacientes/undefined`);
    });

    test('CASO LIMITE: buscarPorNombre con string vacio consulta sin filtro', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.PacientesAPI.buscarPorNombre('');

        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/pacientes/buscar?nombre=`);
    });
});

// ==================== DoctoresAPI ====================

describe('DoctoresAPI', () => {
    test('listar hace GET a /doctores', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.DoctoresAPI.listar();

        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/doctores`);
    });

    test('crear hace POST con el doctor en el body', async () => {
        const doctor = { nombre: 'Luis', apellido: 'Vega', especialidad: 'Neurologia' };
        global.fetch.mockResolvedValue(mockResponse({ id: 5, ...doctor }));

        await api.DoctoresAPI.crear(doctor);

        const [url, config] = global.fetch.mock.calls[0];
        expect(url).toBe(`${API_BASE}/doctores`);
        expect(config.method).toBe('POST');
        expect(JSON.parse(config.body)).toEqual(doctor);
    });

    test('actualizar y eliminar usan PUT y DELETE con el id en la URL', async () => {
        global.fetch.mockResolvedValue(mockResponse({}));

        await api.DoctoresAPI.actualizar(2, { consultorio: 'CONS-999' });
        await api.DoctoresAPI.eliminar(2);

        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/doctores/2`);
        expect(global.fetch.mock.calls[0][1].method).toBe('PUT');
        expect(global.fetch.mock.calls[1][0]).toBe(`${API_BASE}/doctores/2`);
        expect(global.fetch.mock.calls[1][1].method).toBe('DELETE');
    });

    test('buscarPorEspecialidad codifica el parametro q', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.DoctoresAPI.buscarPorEspecialidad("Cardiologia' OR '1'='1");

        const url = global.fetch.mock.calls[0][0];
        // encodeURIComponent protege la URL, pero el backend concatena el
        // valor en SQL sin parametrizar (SQL Injection, ver informe OWASP)
        expect(url).toBe(
            `${API_BASE}/doctores/buscar-especialidad?q=${encodeURIComponent("Cardiologia' OR '1'='1")}`
        );
    });

    test('CASO LIMITE: buscarPorNombre con parametros vacios no valida entradas', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.DoctoresAPI.buscarPorNombre('', '');

        expect(global.fetch.mock.calls[0][0])
            .toBe(`${API_BASE}/doctores/buscar-nombre?nombre=&apellido=`);
    });

    test('CASO LIMITE: buscarPorNombre con undefined serializa "undefined" en la URL', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.DoctoresAPI.buscarPorNombre(undefined, undefined);

        expect(global.fetch.mock.calls[0][0])
            .toBe(`${API_BASE}/doctores/buscar-nombre?nombre=undefined&apellido=undefined`);
    });
});

// ==================== CitasAPI ====================

describe('CitasAPI', () => {
    test('listar hace GET a /citas', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.CitasAPI.listar();

        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/citas`);
    });

    test('crear hace POST con la cita en el body', async () => {
        const cita = { pacienteId: 1, doctorId: 2, fechaHora: '2026-08-20T09:00:00' };
        global.fetch.mockResolvedValue(mockResponse({ id: 9, ...cita }));

        await api.CitasAPI.crear(cita);

        const [url, config] = global.fetch.mock.calls[0];
        expect(url).toBe(`${API_BASE}/citas`);
        expect(config.method).toBe('POST');
        expect(JSON.parse(config.body)).toEqual(cita);
    });

    test('porPaciente, porDoctor y porEstado construyen las rutas de filtro', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.CitasAPI.porPaciente(1);
        await api.CitasAPI.porDoctor(2);
        await api.CitasAPI.porEstado('PROGRAMADA');

        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/citas/paciente/1`);
        expect(global.fetch.mock.calls[1][0]).toBe(`${API_BASE}/citas/doctor/2`);
        expect(global.fetch.mock.calls[2][0]).toBe(`${API_BASE}/citas/estado/PROGRAMADA`);
    });

    test('BUG DETECTADO: porRangoFechas no codifica ni valida los parametros', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        // inicio > fin: rango invertido aceptado sin validacion
        await api.CitasAPI.porRangoFechas('2026-12-31T00:00', '2026-01-01T00:00');

        expect(global.fetch.mock.calls[0][0])
            .toBe(`${API_BASE}/citas/rango-fechas?inicio=2026-12-31T00:00&fin=2026-01-01T00:00`);
    });

    test('CASO LIMITE: porEstado con string vacio genera ruta incompleta', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.CitasAPI.porEstado('');

        // Sin validacion, la URL resultante apunta a /citas/estado/
        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/citas/estado/`);
    });
});

// ==================== HistoriasAPI ====================

describe('HistoriasAPI', () => {
    test('listar hace GET a /historias-clinicas', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.HistoriasAPI.listar();

        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/historias-clinicas`);
    });

    test('crear hace POST con la historia en el body', async () => {
        const historia = { pacienteId: 1, diagnostico: 'Gripe comun' };
        global.fetch.mockResolvedValue(mockResponse({ id: 4, ...historia }));

        const data = await api.HistoriasAPI.crear(historia);

        const [url, config] = global.fetch.mock.calls[0];
        expect(url).toBe(`${API_BASE}/historias-clinicas`);
        expect(config.method).toBe('POST');
        expect(JSON.parse(config.body)).toEqual(historia);
        expect(data.id).toBe(4);
    });

    test('porPaciente y porDoctor construyen las rutas de filtro', async () => {
        global.fetch.mockResolvedValue(mockResponse([]));

        await api.HistoriasAPI.porPaciente(1);
        await api.HistoriasAPI.porDoctor(2);

        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/historias-clinicas/paciente/1`);
        expect(global.fetch.mock.calls[1][0]).toBe(`${API_BASE}/historias-clinicas/doctor/2`);
    });

    test('CASO LIMITE: buscar con null genera URL /historias-clinicas/null', async () => {
        global.fetch.mockResolvedValue(mockResponse({}));

        await api.HistoriasAPI.buscar(null);

        expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/historias-clinicas/null`);
    });

    test('el error de red se propaga al llamador', async () => {
        global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(api.HistoriasAPI.listar()).rejects.toThrow('Failed to fetch');
    });
});