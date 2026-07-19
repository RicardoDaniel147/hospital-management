/**
 * utils.js - Funciones de utilidad para el frontend
 *
 * CORRECCIONES: se subsanan los bugs de frontend
 * documentados en el proyecto:
 * 1. formatDate/formatDateTime ahora validan fechas nulas/invalidas
 * 2. escapeHTML escapa tambien comillas simples y backticks (XSS)
 * 3. showAlert usa textContent, ya no inyecta HTML sin sanitizar (XSS)
 * 4. validateEmail usa una regex correcta (exige TLD de 2+ caracteres)
 * 5. localToISO conserva la hora local sin desplazamiento de zona horaria
 */

/**
 * Formatea una fecha ISO a formato legible en español
 * @param {string} dateStr - Fecha en formato ISO
 * @returns {string} - Fecha formateada o '—' si la entrada es invalida
 */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Formatea fecha y hora
 * @param {string} dateStr - Fecha ISO
 * @returns {string} - Fecha y hora formateada o '—' si la entrada es invalida
 */
function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} str - Texto a escapar
 * @returns {string} - Texto escapado
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
        .replaceAll('`', '&#96;');
}

/**
 * Muestra una alerta en la interfaz
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success' o 'error'
 */
function showAlert(message, type = 'success') {
    const container = document.getElementById('alert-container');
    if (!container) return;

    // CORREGIDO: se construye el nodo y se usa textContent para evitar XSS
    container.innerHTML = '';
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.textContent = message;
    container.appendChild(div);

    // Auto-ocultar despues de 4 segundos
    setTimeout(() => {
        container.innerHTML = '';
    }, 4000);
}

/**
 * Valida un email con expresion regular
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail(email) {
    if (!email) return false;
    // CORREGIDO: exige un TLD de al menos 2 caracteres y no admite dobles puntos
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

/**
 * Valida un numero de telefono ecuatoriano (10 digitos)
 * @param {string} telefono
 * @returns {boolean}
 */
function validateTelefono(telefono) {
    const regex = /^\d{10}$/;
    return regex.test(telefono);
}

/**
 * Valida que una fecha no este en el pasado
 * @param {string} dateStr
 * @returns {boolean}
 */
function isFutureDate(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() > Date.now();
}

/**
 * Convierte una fecha de input datetime-local a ISO string conservando
 * la hora local (sin desplazamiento por zona horaria).
 * @param {string} localDateTime - Valor de input datetime-local
 * @returns {string} - ISO string local (sin sufijo Z)
 */
function localToISO(localDateTime) {
    if (!localDateTime) return '';
    // CORREGIDO: se envia la hora tal cual la ingreso el usuario. Los inputs
    // datetime-local ya entregan 'YYYY-MM-DDTHH:mm'; se asegura el formato de
    // segundos sin convertir a UTC (que restaba/sumaba la diferencia horaria).
    return localDateTime.length === 16 ? `${localDateTime}:00` : localDateTime;
}

/**
 * Ejecuta una funcion que retorna una promesa (tipicamente un listado
 * auxiliar como doctores o pacientes para llenar un select) y, si falla,
 * devuelve un arreglo vacio en lugar de propagar el error. Evita que una
 * cache secundaria bloquee la carga principal de un modulo.
 * @param {() => Promise<Array>} fetchFn
 * @returns {Promise<Array>}
 */
async function cargarListaSilenciosa(fetchFn) {
    try {
        return await fetchFn();
    } catch {
        return [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatDate,
        formatDateTime,
        escapeHTML,
        showAlert,
        validateEmail,
        validateTelefono,
        isFutureDate,
        localToISO,
        cargarListaSilenciosa
    };
}