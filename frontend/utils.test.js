const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const utilsPath = path.join(__dirname, 'js', 'utils.js');
const source = fs.readFileSync(utilsPath, 'utf8');

const context = {
  document: {
    getElementById(id) {
      return this.elements?.[id] || null;
    },
    elements: {}
  },
  setTimeout,
  console,
};
context.window = context;
context.global = context;
vm.createContext(context);
vm.runInContext(source, context);

test('formatDate convierte una fecha ISO a texto legible', () => {
  assert.match(context.formatDate('2024-03-15'), /2024/);
  assert.match(context.formatDate('2024-03-15'), /marzo/i);
});

test('formatDateTime devuelve fecha y hora formateada', () => {
  const value = context.formatDateTime('2024-03-15T14:30:00');
  assert.match(value, /2024/);
  assert.match(value, /14/i);
});

test('escapeHTML protege caracteres especiales', () => {
  assert.equal(context.escapeHTML('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(context.escapeHTML("O'Brien"), 'O&#39;Brien');
});

test('showAlert inserta contenido en el contenedor y lo limpia', () => {
  const container = { innerHTML: '' };
  context.document.elements['alert-container'] = container;

  context.showAlert('Hola', 'success');
  assert.match(container.innerHTML, /Hola/);
  assert.match(container.innerHTML, /alert-success/);
});

test('validateEmail acepta correos válidos y rechaza inválidos', () => {
  assert.equal(context.validateEmail('usuario@example.com'), true);
  assert.equal(context.validateEmail('usuario@dominio'), false);
  assert.equal(context.validateEmail('correo@dominio.com'), true);
});

test('validateTelefono valida el formato básico', () => {
  assert.equal(context.validateTelefono('0999999999'), true);
  assert.equal(context.validateTelefono('12345'), false);
});

test('isFutureDate compara fechas correctamente', () => {
  const future = new Date();
  future.setDate(future.getDate() + 1);
  const past = new Date();
  past.setDate(past.getDate() - 1);

  assert.equal(context.isFutureDate(future.toISOString()), true);
  assert.equal(context.isFutureDate(past.toISOString()), false);
});
