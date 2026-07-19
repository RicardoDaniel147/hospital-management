const test = require('node:test');
const assert = require('node:assert/strict');

global.document = {
  getElementById(id) {
    return this.elements?.[id] || null;
  },
  elements: {}
};

const {
  formatDate,
  formatDateTime,
  escapeHTML,
  showAlert,
  validateEmail,
  validateTelefono,
  isFutureDate
} = require('./js/utils.js');

test('formatDate convierte una fecha ISO a texto legible', () => {
  assert.match(formatDate('2024-03-15'), /2024/);
  assert.match(formatDate('2024-03-15'), /marzo/i);
});

test('formatDateTime devuelve fecha y hora formateada', () => {
  const value = formatDateTime('2024-03-15T14:30:00');
  assert.match(value, /2024/);
  assert.match(value, /14/i);
});

test('escapeHTML protege caracteres especiales', () => {
  assert.equal(escapeHTML('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(escapeHTML("O'Brien"), 'O&#39;Brien');
});

test('showAlert inserta contenido en el contenedor y lo limpia', () => {
  const container = { innerHTML: '' };
  global.document.elements['alert-container'] = container;

  showAlert('Hola', 'success');
  assert.match(container.innerHTML, /Hola/);
  assert.match(container.innerHTML, /alert-success/);
});

test('validateEmail acepta correos válidos y rechaza inválidos', () => {
  assert.equal(validateEmail('usuario@example.com'), true);
  assert.equal(validateEmail('usuario@dominio'), false);
  assert.equal(validateEmail('correo@dominio.com'), true);
});

test('validateTelefono valida el formato básico', () => {
  assert.equal(validateTelefono('0999999999'), true);
  assert.equal(validateTelefono('12345'), false);
});

test('isFutureDate compara fechas correctamente', () => {
  const future = new Date();
  future.setDate(future.getDate() + 1);
  const past = new Date();
  past.setDate(past.getDate() - 1);

  assert.equal(isFutureDate(future.toISOString()), true);
  assert.equal(isFutureDate(past.toISOString()), false);
});