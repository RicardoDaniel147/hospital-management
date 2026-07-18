/**
 * citas.spec.js - Flujo de creacion y consulta de citas (E2E)
 *
 * Responsable: Eduardo
 * Actividad 3 — Pruebas de Integración Frontend (Playwright)
 *
 * ACTUALIZADO (puntos extra): el HTTP 500 por serializacion de proxies lazy
 * en GET /api/citas (BUG-ND-01) fue corregido en el backend con @EntityGraph,
 * asi que las citas ahora se listan y la tabla se llena. Estas pruebas
 * verifican el comportamiento corregido.
 */
const { test, expect } = require('@playwright/test');

const API = 'http://localhost:8080/api';
const MOTIVO = `Consulta E2E ${Date.now().toString().slice(-6)}`;

/** Fecha futura (año siguiente) en formato datetime-local */
function fechaFutura() {
    const anio = new Date().getFullYear() + 1;
    return `${anio}-03-15T10:30`;
}

test.describe('Flujo de creacion y consulta de citas', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.click('button.nav-btn[data-section="citas"]');
        await expect(page.locator('#section-citas')).toHaveClass(/active/);
    });

    test('BUG CORREGIDO: GET /api/citas responde 200 y serializa las citas con su doctor', async ({ page }) => {
        const response = await page.request.get(`${API}/citas`);

        expect(response.status()).toBe(200);
        const body = await response.json();
        // Respuesta paginada de Spring Data: las citas vienen en content
        expect(Array.isArray(body.content)).toBe(true);
        expect(body.content.length).toBeGreaterThan(0);
        // El doctor ya no es un proxy lazy: se serializa completo
        expect(body.content[0].doctor).toBeDefined();
        expect(body.content[0].doctor.nombre).toBeDefined();
    });

    test('BUG CORREGIDO: la tabla de citas muestra las citas precargadas', async ({ page }) => {
        // Antes la tabla quedaba vacia por el 500 silencioso; ahora se llena
        await expect(page.locator('#citas-table tbody tr').first()).toBeVisible();
        await expect(page.locator('#citas-table tbody tr')).not.toHaveCount(0);
        await expect(page.locator('#citas-table tbody')).toContainText('PROGRAMADA');
        await page.screenshot({ path: 'e2e/evidencias/citas-01-listado.png', fullPage: true });
    });

    test('crea una cita nueva asociando paciente y doctor existentes y aparece en la tabla', async ({ page }) => {
        await page.click('#btn-nueva-cita');
        await expect(page.locator('#modal-cita')).toHaveClass(/show/);

        await page.selectOption('#cita-paciente', { index: 1 });
        await page.selectOption('#cita-doctor', { index: 1 });
        await page.fill('#cita-fecha-hora', fechaFutura());
        await page.fill('#cita-motivo', MOTIVO);
        await page.selectOption('#cita-estado', 'PROGRAMADA');
        await page.screenshot({ path: 'e2e/evidencias/citas-02-formulario.png' });

        await page.click('#cita-form button[type="submit"]');

        await expect(page.locator('#alert-container')).toContainText('Cita creada exitosamente');
        // CORREGIDO: tras crear, cargarCitas() vuelve a listar y la cita
        // recien creada si se muestra en la tabla
        await expect(page.locator('#citas-table tbody')).toContainText(MOTIVO);
        await page.screenshot({ path: 'e2e/evidencias/citas-03-creada.png', fullPage: true });
    });

    test('BUG CORREGIDO: filtrar por estado muestra solo las citas de ese estado', async ({ page }) => {
        await page.selectOption('#filter-estado-citas', 'COMPLETADA');

        // Solo la cita semilla COMPLETADA queda en la tabla
        await expect(page.locator('#citas-table tbody tr')).toHaveCount(1);
        await expect(page.locator('#citas-table tbody')).toContainText('COMPLETADA');
        await page.screenshot({ path: 'e2e/evidencias/citas-04-filtro.png' });
    });

    test('la consulta de citas por rango de fechas responde 200 (mismo defecto corregido)', async ({ page }) => {
        // Rango amplio que cubre las citas semilla (2026) en cualquier corrida
        const response = await page.request.get(
            `${API}/citas/rango-fechas?inicio=2020-01-01T00:00:00&fin=2099-12-31T23:59:59`
        );
        expect(response.status()).toBe(200);
        const citas = await response.json();
        expect(Array.isArray(citas)).toBe(true);
        expect(citas.length).toBeGreaterThan(0);
    });
});
