/**
 * Configuracion de Playwright para las pruebas E2E del frontend.
 *
 * Responsable: Eduardo
 * Actividad 3 — Pruebas de Integración Frontend
 *
 * Levanta automaticamente:
 *  - Backend Spring Boot con perfil e2e (H2 en memoria, sin Docker)
 *  - Servidor estatico del frontend en el puerto 3000
 *
 * Ejecutar: npx playwright test
 */
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './e2e',
    // Los specs comparten la misma base de datos H2: se ejecutan en serie
    // para que los flujos no interfieran entre si
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 60000,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://localhost:3000',
        screenshot: 'on',
        trace: 'retain-on-failure',
        ...devices['Desktop Chrome'],
    },
    expect: {
        timeout: 10000,
    },
    webServer: [
        {
            // Backend con H2 en memoria (goal test-run usa el classpath de test).
            // Nota: el repo no incluye el Maven Wrapper (mvnw) aunque el README
            // lo menciona, por eso se usa mvn del sistema.
            command: 'mvn -q spring-boot:test-run',
            cwd: '../backend',
            url: 'http://localhost:8080/api/pacientes',
            reuseExistingServer: true,
            timeout: 240000,
            env: { SPRING_PROFILES_ACTIVE: 'e2e' },
        },
        {
            // Servidor estatico del frontend
            command: 'python3 -m http.server 3000',
            url: 'http://localhost:3000',
            reuseExistingServer: true,
            timeout: 30000,
        },
    ],
});