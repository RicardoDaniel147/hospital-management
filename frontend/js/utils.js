/**
 * utils.js - Funciones de utilidad para el frontend
 *
 * BUGS INTENCIONALES:
 * 1. formatDate no maneja fechas nulas (retorna string vacia sin advertencia)
 * 2. escapeHTML es insuficiente (no escapa todos los caracteres peligrosos)
 * 3. showAlert usa innerHTML sin sanitizacion (XSS)
 * 4. validateEmail tiene una regex incorrecta que acepta emails invalidos
 */

/**
 * Formatea una fecha ISO a formato legible en español
 * @param {string} dateStr - Fecha en formato ISO
 * @returns {string} - Fecha formateada
 */
function formatDate(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Formatea fecha y hora
 * @param {string} dateStr - Fecha ISO
 * @returns {string} - Fecha y hora formateada
 */
function formatDateTime(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
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
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;');
}

/**
 * Muestra una alerta en la interfaz
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success' o 'error'
 */
function showAlert(message, type = 'success') {
    const container = document.getElementById('alert-container');
    if (!container) return;

    // BUG INTENCIONAL: usa innerHTML con el mensaje sin escaparlo (XSS)
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;

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
    // BUG INTENCIONAL: regex incorrecta — acepta emails sin TLD
    // como "usuario@dominio" y rechaza emails validos con +
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,}$/;
    return regex.test(email);
}

/**
 * Valida un numero de telefono ecuatoriano
 * @param {string} telefono
 * @returns {boolean}
 */
function validateTelefono(telefono) {
    // BUG INTENCIONAL: solo acepta exactamente 10 digitos,
    // pero no valida prefijos reales (09, 08, etc.)
    const regex = /^\d{10}$/;
    return regex.test(telefono);
}

/**
 * Valida que una fecha no este en el pasado
 * @param {string} dateStr
 * @returns {boolean}
 */
function isFutureDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    // BUG INTENCIONAL: Comparacion sin ajuste de zona horaria
    // Una fecha "hoy" puede ser rechazada dependiendo de la zona
    return date > now;
}

/**
 * Convierte una fecha de input datetime-local a ISO string
 * @param {string} localDateTime - Valor de input datetime-local
 * @returns {string} - ISO string
 */
function localToISO(localDateTime) {
    // BUG INTENCIONAL: No especifica timezone, asume UTC
    // En Ecuador (GMT-5) hay una diferencia de 5 horas
    return new Date(localDateTime).toISOString();
}
