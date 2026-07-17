/**
 * citas.spec.js - Flujo de creacion y consulta de citas (E2E)
 *
 * Responsable: Eduardo
 * Actividad 3 — Pruebas de Integración Frontend (Playwright)
 *
 * HALLAZGO IMPORTANTE (bug NO documentado en el README):
 * GET /api/citas responde 500 porque Jackson no puede serializar el proxy
 * lazy de Hibernate (Cita.doctor con FetchType.LAZY expone la propiedad
 * hibernateLazyInitializer). El frontend traga el error silenciosamente y
 * la tabla de citas queda vacia. El POST si funciona porque el doctor se
 * carga real (no proxy) antes de guardar.
 *
 * Estas pruebas verifican el comportamiento REAL del sistema base y
 * documentan los defectos; el flujo completo se demuestra en la rama de
 * puntos extra donde el bug esta corregido.
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

    test('BUG DETECTADO: GET /api/citas responde 500 por proxies lazy no serializables', async ({ page }) => {
        const response = await page.request.get(`${API}/citas`);

        expect(response.status()).toBe(500);
        const body = await response.json();
        expect(body.error).toBe('Error interno del servidor');
        // BUG adicional (documentado): la respuesta expone el stack trace
        expect(body.stackTrace).toBeDefined();
    });

    test('BUG DETECTADO: la tabla de citas queda vacia y no se informa el error al usuario', async ({ page }) => {
        // El modulo captura el error con console.log y nunca renderiza filas
        // ni muestra una alerta: el usuario ve una tabla vacia sin explicacion
        await expect(page.locator('#citas-table tbody tr')).toHaveCount(0);
        await expect(page.locator('#alert-container')).toBeEmpty();
        await page.screenshot({ path: 'e2e/evidencias/citas-01-tabla-vacia-bug.png', fullPage: true });
    });

    test('crea una cita nueva asociando paciente y doctor existentes (POST funciona)', async ({ page }) => {
        await page.click('#btn-nueva-cita');
        await expect(page.locator('#modal-cita')).toHaveClass(/show/);

        // Los selects se llenan con datos reales del backend (esos GET si funcionan)
        await page.selectOption('#cita-paciente', { index: 1 });
        await page.selectOption('#cita-doctor', { index: 1 });
        await page.fill('#cita-fecha-hora', fechaFutura());
        await page.fill('#cita-motivo', MOTIVO);
        await page.selectOption('#cita-estado', 'PROGRAMADA');
        await page.screenshot({ path: 'e2e/evidencias/citas-02-formulario.png' });

        await page.click('#cita-form button[type="submit"]');

        await expect(page.locator('#alert-container')).toContainText('Cita creada exitosamente');
        // BUG: tras crear, cargarCitas() vuelve a fallar con 500 y la cita
        // recien creada tampoco se muestra en la tabla
        await expect(page.locator('#citas-table tbody tr')).toHaveCount(0);
        await page.screenshot({ path: 'e2e/evidencias/citas-03-creada-alerta.png', fullPage: true });
    });

    test('BUG DETECTADO: filtrar por estado muestra error generico por el 500 del backend', async ({ page }) => {
        await page.selectOption('#filter-estado-citas', 'COMPLETADA');

        // findCitasByEstadoOrdered tambien serializa proxies lazy -> 500
        await expect(page.locator('#alert-container')).toContainText('Error al filtrar citas');
        await page.screenshot({ path: 'e2e/evidencias/citas-04-filtro-error.png' });
    });

    test('la consulta de citas por rango de fechas tambien responde 500 (mismo defecto)', async ({ page }) => {
        const response = await page.request.get(
            `${API}/citas/rango-fechas?inicio=2026-01-01T00:00:00&fin=2026-12-31T23:59:59`
        );
        expect(response.status()).toBe(500);
    });
});