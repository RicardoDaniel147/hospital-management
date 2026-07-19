/**
 * api.js - Modulo de comunicacion con la API REST
 * Contiene funciones para interactuar con el backend del hospital
 *
 * CORRECCIONES: apiFetch ahora:
 * 1. Configura un timeout con AbortController (la peticion ya no se cuelga)
 * 2. Propaga los errores HTTP (response.ok = false lanza una excepcion con detalle)
 * 3. Maneja respuestas sin cuerpo (204/200 vacio) devolviendo null
 * 4. Conserva el Content-Type por defecto al fusionar headers personalizados
 * 5. Los listados principales del backend ahora son paginados (Spring Page):
 *    unwrapPage extrae content para que los modulos sigan recibiendo arrays
 */

const API_BASE = 'http://localhost:8080/api';
const API_TIMEOUT_MS = 10000;

/**
 * Realiza una peticion HTTP generica a la API
 * @param {string} endpoint - Ruta relativa del endpoint
 * @param {object} options - Opciones de fetch (method, body, headers)
 * @returns {Promise<object|null>} - Respuesta parseada como JSON, o null si no hay cuerpo
 * @throws {Error} - Si la respuesta HTTP no es exitosa (error.status y error.body disponibles)
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const { headers, ...rest } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const config = {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        signal: rest.signal || controller.signal,
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            let errorBody = null;
            try {
                errorBody = await response.json();
            } catch {
                /* respuesta de error sin cuerpo JSON */
            }
            const message = errorBody?.message || `Error HTTP ${response.status}`;
            const error = new Error(message);
            error.status = response.status;
            error.body = errorBody;
            throw error;
        }

        // 204 No Content o cuerpo vacio (p. ej. DELETE): no hay JSON que parsear
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Extrae el array de resultados de una respuesta paginada de Spring Data
 * ({ content: [...], totalElements, ... }). Si la respuesta ya es un array
 * (endpoints sin paginar) se devuelve tal cual.
 * @param {object|Array|null} data - Respuesta parseada de la API
 * @returns {Array}
 */
function unwrapPage(data) {
    if (Array.isArray(data)) return data;
    return data?.content || [];
}

// ================== PACIENTES ==================

const PacientesAPI = {
    listar: () => apiFetch('/pacientes').then(unwrapPage),

    buscar: (id) => apiFetch(`/pacientes/${id}`),

    crear: (paciente) => apiFetch('/pacientes', {
        method: 'POST',
        body: JSON.stringify(paciente),
    }),

    actualizar: (id, paciente) => apiFetch(`/pacientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(paciente),
    }),

    eliminar: (id) => apiFetch(`/pacientes/${id}`, {
        method: 'DELETE',
    }),

    // BUG INTENCIONAL: No sanitiza el parametro de busqueda (XSS reflejado)
    buscarPorNombre: (nombre) => apiFetch(`/pacientes/buscar?nombre=${encodeURIComponent(nombre)}`),

    // BUG: si no hay pacientes, division por 0
    edadPromedio: () => apiFetch('/pacientes/estadisticas/edad-promedio'),
};

// ================== DOCTORES ==================

const DoctoresAPI = {
    listar: () => apiFetch('/doctores').then(unwrapPage),

    buscar: (id) => apiFetch(`/doctores/${id}`),

    crear: (doctor) => apiFetch('/doctores', {
        method: 'POST',
        body: JSON.stringify(doctor),
    }),

    actualizar: (id, doctor) => apiFetch(`/doctores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(doctor),
    }),

    eliminar: (id) => apiFetch(`/doctores/${id}`, {
        method: 'DELETE',
    }),

    // BUG INTENCIONAL: Este endpoint usa busqueda vulnerable (SQL Injection en backend)
    buscarPorEspecialidad: (especialidad) =>
        apiFetch(`/doctores/buscar-especialidad?q=${encodeURIComponent(especialidad)}`),

    // BUG: Sin validacion de parametros vacios
    buscarPorNombre: (nombre, apellido) =>
        apiFetch(`/doctores/buscar-nombre?nombre=${encodeURIComponent(nombre)}&apellido=${encodeURIComponent(apellido)}`),
};

// ================== CITAS ==================

const CitasAPI = {
    listar: () => apiFetch('/citas').then(unwrapPage),

    buscar: (id) => apiFetch(`/citas/${id}`),

    crear: (cita) => apiFetch('/citas', {
        method: 'POST',
        body: JSON.stringify(cita),
    }),

    actualizar: (id, cita) => apiFetch(`/citas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(cita),
    }),

    eliminar: (id) => apiFetch(`/citas/${id}`, {
        method: 'DELETE',
    }),

    porPaciente: (pacienteId) => apiFetch(`/citas/paciente/${pacienteId}`),

    porDoctor: (doctorId) => apiFetch(`/citas/doctor/${doctorId}`),

    porEstado: (estado) => apiFetch(`/citas/estado/${estado}`),

    // BUG: No valida que inicio < fin
    porRangoFechas: (inicio, fin) =>
        apiFetch(`/citas/rango-fechas?inicio=${inicio}&fin=${fin}`),
};

// ================== HISTORIAS CLINICAS ==================

const HistoriasAPI = {
    listar: () => apiFetch('/historias-clinicas').then(unwrapPage),

    buscar: (id) => apiFetch(`/historias-clinicas/${id}`),

    crear: (historia) => apiFetch('/historias-clinicas', {
        method: 'POST',
        body: JSON.stringify(historia),
    }),

    porPaciente: (pacienteId) => apiFetch(`/historias-clinicas/paciente/${pacienteId}`),

    porDoctor: (doctorId) => apiFetch(`/historias-clinicas/doctor/${doctorId}`),
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiFetch,
        unwrapPage,
        PacientesAPI,
        DoctoresAPI,
        CitasAPI,
        HistoriasAPI
    };
}