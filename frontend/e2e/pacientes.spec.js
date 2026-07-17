/**
 * pacientes.spec.js - Flujo CRUD de pacientes (E2E)
 *
 * Responsable: Eduardo
 * Actividad 3 — Pruebas de Integración Frontend (Playwright)
 *
 * Cubre: crear, listar, ver, editar, buscar y eliminar pacientes
 * a traves de la interfaz real contra el backend.
 */
const { test, expect } = require('@playwright/test');

// Sufijo unico para que las corridas no interfieran entre si
const suffix = Date.now().toString().slice(-6);
const NOMBRE = `PacE2E${suffix}`;
const APELLIDO = 'Playwright';

test.describe('Flujo CRUD de pacientes', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.click('button.nav-btn[data-section="pacientes"]');
        await expect(page.locator('#section-pacientes')).toHaveClass(/active/);
        // Espera a que la tabla cargue datos del backend
        await expect(page.locator('#pacientes-table tbody tr').first()).toBeVisible();
    });

    test('lista los pacientes precargados del backend', async ({ page }) => {
        const filas = page.locator('#pacientes-table tbody tr');
        await expect(filas).not.toHaveCount(0);
        await expect(page.locator('#pacientes-table')).toContainText('Juan Perez');
        await page.screenshot({ path: 'e2e/evidencias/pacientes-01-listado.png', fullPage: true });
    });

    test('crea un paciente nuevo y aparece en la tabla', async ({ page }) => {
        await page.click('#btn-nuevo-paciente');
        await expect(page.locator('#modal-paciente')).toHaveClass(/show/);

        await page.fill('#paciente-nombre', NOMBRE);
        await page.fill('#paciente-apellido', APELLIDO);
        await page.fill('#paciente-email', `${NOMBRE.toLowerCase()}@test.com`);
        await page.fill('#paciente-telefono', '0999999999');
        await page.fill('#paciente-direccion', 'Av. E2E 123');
        await page.fill('#paciente-fecha-nacimiento', '1995-05-05');
        await page.screenshot({ path: 'e2e/evidencias/pacientes-02-formulario.png' });

        await page.click('#paciente-form button[type="submit"]');

        await expect(page.locator('#alert-container')).toContainText('Paciente creado exitosamente');
        await expect(page.locator('#pacientes-table tbody'))
            .toContainText(`${NOMBRE} ${APELLIDO}`);
        await page.screenshot({ path: 'e2e/evidencias/pacientes-03-creado.png', fullPage: true });
    });

    test('busca un paciente por nombre', async ({ page }) => {
        await page.fill('#search-pacientes', NOMBRE);
        // La busqueda dispara una peticion por tecla (sin debounce, bug conocido);
        // se espera a que la tabla quede filtrada
        await expect(page.locator('#pacientes-table tbody tr')).toHaveCount(1);
        await expect(page.locator('#pacientes-table tbody')).toContainText(NOMBRE);
        await page.screenshot({ path: 'e2e/evidencias/pacientes-04-busqueda.png' });
    });

    test('edita el paciente creado y refleja los cambios', async ({ page }) => {
        const fila = page.locator('#pacientes-table tbody tr', { hasText: NOMBRE });
        await fila.locator('button.btn-edit').click();
        await expect(page.locator('#modal-paciente')).toHaveClass(/show/);
        await expect(page.locator('#paciente-nombre')).toHaveValue(NOMBRE);

        await page.fill('#paciente-direccion', 'Av. Editada 456');
        await page.fill('#paciente-telefono', '0988888888');
        await page.click('#paciente-form button[type="submit"]');

        await expect(page.locator('#alert-container'))
            .toContainText('Paciente actualizado exitosamente');
        await expect(page.locator('#pacientes-table tbody tr', { hasText: NOMBRE }))
            .toContainText('0988888888');
        await page.screenshot({ path: 'e2e/evidencias/pacientes-05-editado.png', fullPage: true });
    });

    test('muestra el detalle del paciente con el boton Ver', async ({ page }) => {
        // El detalle se muestra con window.alert() (bug de usabilidad conocido):
        // se captura el dialogo para verificar su contenido
        let dialogMessage = '';
        page.on('dialog', async (dialog) => {
            dialogMessage = dialog.message();
            await dialog.accept();
        });

        const fila = page.locator('#pacientes-table tbody tr', { hasText: NOMBRE });
        await fila.locator('button.btn-view').click();

        await expect.poll(() => dialogMessage).toContain(NOMBRE);
        expect(dialogMessage).toContain('0988888888');
    });

    test('elimina el paciente (documenta bugs de confirmacion y de manejo del 200 vacio)', async ({ page }) => {
        const fila = page.locator('#pacientes-table tbody tr', { hasText: NOMBRE });
        await expect(fila).toHaveCount(1);

        // BUG conocido #1: elimina sin pedir confirmacion (no hay dialogo que aceptar)
        await fila.locator('button.btn-delete').click();

        // BUG conocido #2: el DELETE retorna 200 con cuerpo vacio y apiFetch
        // intenta parsearlo como JSON, por lo que la UI muestra un error
        // aunque la eliminacion en el backend SI se ejecuto
        await expect(page.locator('#alert-container'))
            .toContainText('Error al eliminar paciente');
        await page.screenshot({ path: 'e2e/evidencias/pacientes-06-alerta-eliminar.png' });

        // Al recargar la seccion se comprueba que el paciente ya no existe
        await page.reload();
        await page.click('button.nav-btn[data-section="pacientes"]');
        await expect(page.locator('#pacientes-table tbody tr').first()).toBeVisible();
        await expect(page.locator('#pacientes-table tbody tr', { hasText: NOMBRE }))
            .toHaveCount(0);
        await page.screenshot({ path: 'e2e/evidencias/pacientes-07-eliminado.png', fullPage: true });
    });
});