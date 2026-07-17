/**
 * historias.spec.js - Flujo de creacion y consulta de historias clinicas (E2E)
 *
 * Responsable: Eduardo
 * Actividad 3 — Pruebas de Integración Frontend (Playwright)
 *
 * HALLAZGO IMPORTANTE (bug NO documentado en el README):
 * GET /api/historias-clinicas responde 500 por el mismo defecto de
 * serializacion de proxies lazy que las citas (paciente y doctor son
 * FetchType.LAZY). La tabla de historias queda siempre vacia. El POST
 * funciona porque las entidades se cargan reales antes de guardar.
 *
 * Estas pruebas verifican el comportamiento REAL del sistema base;
 * el flujo completo se demuestra en la rama de puntos extra.
 */
const { test, expect } = require('@playwright/test');

const API = 'http://localhost:8080/api';
const DIAGNOSTICO = `Diagnostico E2E ${Date.now().toString().slice(-6)}`;

test.describe('Flujo de creacion y consulta de historias clinicas', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.click('button.nav-btn[data-section="historias"]');
        await expect(page.locator('#section-historias')).toHaveClass(/active/);
    });

    test('BUG DETECTADO: GET /api/historias-clinicas responde 500 por proxies lazy', async ({ page }) => {
        const response = await page.request.get(`${API}/historias-clinicas`);

        expect(response.status()).toBe(500);
        const body = await response.json();
        expect(body.error).toBe('Error interno del servidor');
        expect(body.stackTrace).toBeDefined(); // fuga de informacion documentada
    });

    test('BUG DETECTADO: la tabla de historias queda vacia sin informar al usuario', async ({ page }) => {
        await expect(page.locator('#historias-table tbody tr')).toHaveCount(0);
        await expect(page.locator('#alert-container')).toBeEmpty();
        await page.screenshot({ path: 'e2e/evidencias/historias-01-tabla-vacia-bug.png', fullPage: true });
    });

    test('crea una historia clinica con doctor asignado (POST funciona)', async ({ page }) => {
        await page.click('#btn-nueva-historia');
        await expect(page.locator('#modal-historia')).toHaveClass(/show/);

        await page.selectOption('#historia-paciente', { index: 1 });
        await page.selectOption('#historia-doctor', { index: 1 });
        await page.fill('#historia-diagnostico', DIAGNOSTICO);
        await page.fill('#historia-tratamiento', 'Reposo y control en 15 dias');
        await page.fill('#historia-observaciones', 'Creada por prueba E2E');
        await page.screenshot({ path: 'e2e/evidencias/historias-02-formulario.png' });

        await page.click('#historia-form button[type="submit"]');

        await expect(page.locator('#alert-container'))
            .toContainText('Historia clinica creada exitosamente');
        // BUG: la tabla no se refresca porque el GET posterior responde 500
        await expect(page.locator('#historias-table tbody tr')).toHaveCount(0);
        await page.screenshot({ path: 'e2e/evidencias/historias-03-creada-alerta.png', fullPage: true });
    });

    test('crea una historia clinica sin doctor (doctor es opcional segun HU-04)', async ({ page }) => {
        await page.click('#btn-nueva-historia');
        await expect(page.locator('#modal-historia')).toHaveClass(/show/);

        await page.selectOption('#historia-paciente', { index: 2 });
        // No se selecciona doctor: el campo es opcional
        await page.fill('#historia-diagnostico', `${DIAGNOSTICO} sin doctor`);
        await page.click('#historia-form button[type="submit"]');

        await expect(page.locator('#alert-container'))
            .toContainText('Historia clinica creada exitosamente');
    });

    test('BUG DETECTADO: consultar el detalle de una historia via API responde 500', async ({ page }) => {
        // La historia con id 1 existe en los datos semilla, pero su
        // serializacion falla por los proxies lazy de paciente/doctor
        const response = await page.request.get(`${API}/historias-clinicas/1`);
        expect(response.status()).toBe(500);
    });

    test('BUG DETECTADO: historias por paciente tambien responde 500 (mismo defecto)', async ({ page }) => {
        const response = await page.request.get(`${API}/historias-clinicas/paciente/1`);
        expect(response.status()).toBe(500);
    });
});