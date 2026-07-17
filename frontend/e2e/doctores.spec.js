/**
 * doctores.spec.js - Flujo CRUD de doctores (E2E)
 *
 * Responsable: Eduardo
 * Actividad 3 — Pruebas de Integración Frontend (Playwright)
 *
 * Cubre: crear, listar, editar y eliminar doctores desde la interfaz.
 */
const { test, expect } = require('@playwright/test');

const suffix = Date.now().toString().slice(-6);
const NOMBRE = `DocE2E${suffix}`;
const APELLIDO = 'Playwright';

test.describe('Flujo CRUD de doctores', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.click('button.nav-btn[data-section="doctores"]');
        await expect(page.locator('#section-doctores')).toHaveClass(/active/);
        await expect(page.locator('#doctores-table tbody tr').first()).toBeVisible();
    });

    test('lista los doctores precargados del backend', async ({ page }) => {
        await expect(page.locator('#doctores-table tbody tr')).not.toHaveCount(0);
        await expect(page.locator('#doctores-table')).toContainText('Elena Rodriguez');
        await expect(page.locator('#doctores-table')).toContainText('Cardiologia');
        // Caso conocido: el doctor Diego Morales no tiene especialidad (NULL en BD)
        await expect(page.locator('#doctores-table tbody tr', { hasText: 'Diego Morales' }))
            .toContainText('Sin especialidad');
        await page.screenshot({ path: 'e2e/evidencias/doctores-01-listado.png', fullPage: true });
    });

    test('crea un doctor nuevo y aparece en la tabla', async ({ page }) => {
        await page.click('#btn-nuevo-doctor');
        await expect(page.locator('#modal-doctor')).toHaveClass(/show/);

        await page.fill('#doctor-nombre', NOMBRE);
        await page.fill('#doctor-apellido', APELLIDO);
        await page.fill('#doctor-especialidad', 'Neurologia');
        await page.fill('#doctor-email', `${NOMBRE.toLowerCase()}@hospital.com`);
        await page.fill('#doctor-telefono', '0977777777');
        await page.fill('#doctor-consultorio', 'CONS-777');
        await page.screenshot({ path: 'e2e/evidencias/doctores-02-formulario.png' });

        await page.click('#doctor-form button[type="submit"]');

        await expect(page.locator('#alert-container')).toContainText('Doctor creado exitosamente');
        const fila = page.locator('#doctores-table tbody tr', { hasText: NOMBRE });
        await expect(fila).toContainText('Neurologia');
        await expect(fila).toContainText('CONS-777');
        await page.screenshot({ path: 'e2e/evidencias/doctores-03-creado.png', fullPage: true });
    });

    test('edita el doctor creado y refleja los cambios', async ({ page }) => {
        const fila = page.locator('#doctores-table tbody tr', { hasText: NOMBRE });
        await fila.locator('button.btn-edit').click();
        await expect(page.locator('#modal-doctor')).toHaveClass(/show/);
        await expect(page.locator('#doctor-nombre')).toHaveValue(NOMBRE);

        await page.fill('#doctor-especialidad', 'Neurocirugia');
        await page.fill('#doctor-consultorio', 'CONS-888');
        await page.click('#doctor-form button[type="submit"]');

        await expect(page.locator('#alert-container'))
            .toContainText('Doctor actualizado exitosamente');
        const filaEditada = page.locator('#doctores-table tbody tr', { hasText: NOMBRE });
        await expect(filaEditada).toContainText('Neurocirugia');
        await expect(filaEditada).toContainText('CONS-888');
        await page.screenshot({ path: 'e2e/evidencias/doctores-04-editado.png', fullPage: true });
    });

    test('elimina el doctor creado (documenta bugs de confirmacion y del 200 vacio)', async ({ page }) => {
        const fila = page.locator('#doctores-table tbody tr', { hasText: NOMBRE });
        await expect(fila).toHaveCount(1);

        // BUG conocido #1: elimina sin confirmacion
        await fila.locator('button.btn-delete').click();

        // BUG conocido #2: DELETE retorna 200 sin cuerpo, apiFetch falla al
        // parsear JSON y la UI reporta error aunque el doctor si se elimino
        await expect(page.locator('#alert-container'))
            .toContainText('Error al eliminar doctor');

        // Recargando la seccion se verifica que el doctor ya no existe
        await page.reload();
        await page.click('button.nav-btn[data-section="doctores"]');
        await expect(page.locator('#doctores-table tbody tr').first()).toBeVisible();
        await expect(page.locator('#doctores-table tbody tr', { hasText: NOMBRE }))
            .toHaveCount(0);
        await page.screenshot({ path: 'e2e/evidencias/doctores-05-eliminado.png', fullPage: true });
    });
});