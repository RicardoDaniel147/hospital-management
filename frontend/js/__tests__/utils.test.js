/**
 * utils.test.js - Pruebas unitarias del modulo utils.js con Jest
 *
 * Actividad 2 — Pruebas Unitarias Frontend (utils.js)
 *
 * Estrategia:
 *  - utils.js expone sus funciones via module.exports (guardado con un
 *    typeof check que no afecta su uso como script de navegador), por lo
 *    que se requiere normalmente y Jest/Istanbul lo instrumentan para el
 *    reporte de cobertura.
 *  - jest usa testEnvironment "node" (sin jsdom), asi que se define un
 *    "document" minimo con getElementById/createElement para las funciones
 *    que tocan el DOM (showAlert).
 */

const {
    formatDate,
    formatDateTime,
    escapeHTML,
    showAlert,
    validateEmail,
    validateTelefono,
    isFutureDate,
    localToISO,
    cargarListaSilenciosa,
} = require('../utils.js');

/** Contenedor falso que acumula lo que appendChild le agrega, como innerHTML */
function makeContainer() {
    return {
        innerHTML: '',
        appendChild(el) {
            this.innerHTML += `<div class="${el.className}">${el.textContent}</div>`;
        },
    };
}

/** document minimo: getElementById devuelve los elementos registrados */
function makeDocument(elements = {}) {
    return {
        getElementById: (id) => elements[id] || null,
        createElement: () => ({ className: '', textContent: '' }),
    };
}

// ==================== formatDate ====================

describe('formatDate', () => {
    test('convierte una fecha ISO a texto legible en espanol', () => {
        expect(formatDate('2024-03-15')).toMatch(/2024/);
        expect(formatDate('2024-03-15')).toMatch(/marzo/i);
    });

    test('CASO LIMITE: devuelve — cuando la fecha es null, undefined o cadena vacia', () => {
        expect(formatDate(null)).toBe('—');
        expect(formatDate(undefined)).toBe('—');
        expect(formatDate('')).toBe('—');
    });

    test('CASO LIMITE: devuelve — cuando la fecha no es valida', () => {
        expect(formatDate('no-es-una-fecha')).toBe('—');
    });
});

// ==================== formatDateTime ====================

describe('formatDateTime', () => {
    test('devuelve fecha y hora formateada', () => {
        // toLocaleString('es-EC', ...) usa formato de 12 horas (2:30 p. m.),
        // no 24 horas, para las 14:30.
        const value = formatDateTime('2024-03-15T14:30:00');
        expect(value).toMatch(/2024/);
        expect(value).toMatch(/2:30/);
    });

    test('CASO LIMITE: devuelve — cuando la fecha es null o invalida', () => {
        expect(formatDateTime(null)).toBe('—');
        expect(formatDateTime('no-es-una-fecha')).toBe('—');
    });
});

// ==================== escapeHTML ====================

describe('escapeHTML', () => {
    test('escapa las etiquetas HTML para prevenir XSS', () => {
        expect(escapeHTML('<script>alert(1)</script>'))
            .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    test('escapa comillas simples, dobles y backticks', () => {
        expect(escapeHTML("O'Brien")).toBe('O&#39;Brien');
        expect(escapeHTML('"cita"')).toBe('&quot;cita&quot;');
        expect(escapeHTML('`template`')).toBe('&#96;template&#96;');
    });

    test('CASO LIMITE: devuelve cadena vacia para null o undefined', () => {
        expect(escapeHTML(null)).toBe('');
        expect(escapeHTML(undefined)).toBe('');
    });

    test('CASO LIMITE: convierte valores no-string antes de escapar', () => {
        expect(escapeHTML(42)).toBe('42');
    });
});

// ==================== showAlert ====================

describe('showAlert', () => {
    // showAlert programa un setTimeout real de 4s para autoocultarse; se usan
    // fake timers en todas las pruebas para no dejar temporizadores reales
    // pendientes tras cada test (Jest los reporta como "open handles").
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        delete global.document;
    });

    test('inserta el mensaje dentro de un nodo del contenedor', () => {
        const container = makeContainer();
        global.document = makeDocument({ 'alert-container': container });

        showAlert('Hola', 'success');

        expect(container.innerHTML).toMatch(/Hola/);
        expect(container.innerHTML).toMatch(/alert-success/);
    });

    test('usa el tipo "success" por defecto cuando no se especifica', () => {
        const container = makeContainer();
        global.document = makeDocument({ 'alert-container': container });

        showAlert('Por defecto');

        expect(container.innerHTML).toMatch(/alert-success/);
    });

    test('CASO LIMITE: no lanza error si el contenedor no existe en el DOM', () => {
        global.document = makeDocument({});

        expect(() => showAlert('Hola')).not.toThrow();
    });

    test('oculta la alerta automaticamente despues de 4 segundos', () => {
        const container = makeContainer();
        global.document = makeDocument({ 'alert-container': container });

        showAlert('Temporal', 'error');
        expect(container.innerHTML).toMatch(/Temporal/);

        jest.advanceTimersByTime(4000);

        expect(container.innerHTML).toBe('');
    });
});

// ==================== validateEmail ====================

describe('validateEmail', () => {
    test('acepta correos con formato valido', () => {
        expect(validateEmail('usuario@example.com')).toBe(true);
        expect(validateEmail('correo@dominio.com')).toBe(true);
    });

    test('CORREGIDO: exige un TLD de al menos 2 caracteres', () => {
        expect(validateEmail('usuario@dominio')).toBe(false);
        expect(validateEmail('usuario@dominio.c')).toBe(false);
    });

    test('CASO LIMITE: rechaza null, undefined y cadena vacia', () => {
        expect(validateEmail(null)).toBe(false);
        expect(validateEmail(undefined)).toBe(false);
        expect(validateEmail('')).toBe(false);
    });

    test('CASO LIMITE: rechaza correos sin arroba o con espacios', () => {
        expect(validateEmail('sin-arroba.com')).toBe(false);
        expect(validateEmail('con espacio@dominio.com')).toBe(false);
    });
});

// ==================== validateTelefono ====================

describe('validateTelefono', () => {
    test('acepta un numero de 10 digitos', () => {
        expect(validateTelefono('0999999999')).toBe(true);
    });

    test('CASO LIMITE: rechaza numeros con menos o mas de 10 digitos', () => {
        expect(validateTelefono('12345')).toBe(false);
        expect(validateTelefono('099999999900')).toBe(false);
    });

    test('CASO LIMITE: rechaza valores no numericos o vacios', () => {
        expect(validateTelefono('abcdefghij')).toBe(false);
        expect(validateTelefono('')).toBe(false);
    });
});

// ==================== isFutureDate ====================

describe('isFutureDate', () => {
    test('reconoce fechas futuras y pasadas correctamente', () => {
        const future = new Date();
        future.setDate(future.getDate() + 1);
        const past = new Date();
        past.setDate(past.getDate() - 1);

        expect(isFutureDate(future.toISOString())).toBe(true);
        expect(isFutureDate(past.toISOString())).toBe(false);
    });

    test('CASO LIMITE: devuelve false para null, vacio o fecha invalida', () => {
        expect(isFutureDate(null)).toBe(false);
        expect(isFutureDate('')).toBe(false);
        expect(isFutureDate('no-es-una-fecha')).toBe(false);
    });
});

// ==================== localToISO ====================

describe('localToISO', () => {
    test('agrega segundos a un valor de input datetime-local (16 caracteres)', () => {
        expect(localToISO('2026-08-20T09:00')).toBe('2026-08-20T09:00:00');
    });

    test('conserva la hora local tal cual la ingreso el usuario (sin desplazar por zona horaria)', () => {
        // Un datetime-local de las 09:00 debe seguir siendo las 09:00, nunca
        // desplazarse a UTC o a otra zona horaria.
        const resultado = localToISO('2026-08-20T09:00');
        expect(resultado.startsWith('2026-08-20T09:00')).toBe(true);
    });

    test('CASO LIMITE: devuelve el valor sin cambios si ya trae segundos', () => {
        expect(localToISO('2026-08-20T09:00:00')).toBe('2026-08-20T09:00:00');
    });

    test('CASO LIMITE: devuelve cadena vacia para null, undefined o cadena vacia', () => {
        expect(localToISO(null)).toBe('');
        expect(localToISO(undefined)).toBe('');
        expect(localToISO('')).toBe('');
    });
});

// ==================== cargarListaSilenciosa ====================

describe('cargarListaSilenciosa', () => {
    test('devuelve el resultado de la funcion cuando esta resuelve', async () => {
        const fetchFn = jest.fn().mockResolvedValue([{ id: 1 }]);

        const resultado = await cargarListaSilenciosa(fetchFn);

        expect(resultado).toEqual([{ id: 1 }]);
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    test('CASO LIMITE: devuelve un arreglo vacio si la funcion falla, sin propagar el error', async () => {
        const fetchFn = jest.fn().mockRejectedValue(new Error('fallo de red'));

        const resultado = await cargarListaSilenciosa(fetchFn);

        expect(resultado).toEqual([]);
    });
});
