/**
 * Configuracion de ESLint para el frontend (flat config, ESLint 9).
 *
 * Responsable: Eduardo
 * Actividad 4 — Análisis Estático Frontend
 *
 * Ejecutar: npx eslint js/*.js
 */
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    js.configs.recommended,
    {
        files: ['js/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                // Los modulos son scripts globales que se referencian entre si
                // (se declaran como readonly para detectar reasignaciones)
                apiFetch: 'readonly',
                PacientesAPI: 'readonly',
                DoctoresAPI: 'readonly',
                CitasAPI: 'readonly',
                HistoriasAPI: 'readonly',
                PacientesModule: 'readonly',
                DoctoresModule: 'readonly',
                CitasModule: 'readonly',
                HistoriasModule: 'readonly',
                App: 'readonly',
                formatDate: 'readonly',
                formatDateTime: 'readonly',
                escapeHTML: 'readonly',
                showAlert: 'readonly',
                validateEmail: 'readonly',
                validateTelefono: 'readonly',
                isFutureDate: 'readonly',
                localToISO: 'readonly',
                 cargarListaSilenciosa: 'readonly',
                // utils.js y api.js exponen sus funciones via module.exports
                // (guardado con un typeof check) para que Jest pueda
                // requerirlas; module no existe en el navegador, pero debe
                // declararse aqui para que ESLint no lo marque como no
                // definido en ese bloque condicional.
                module: 'readonly',
            },
        },
        rules: {
            // Reglas adicionales relevantes para los defectos de este proyecto
            'no-console': 'warn',
            'eqeqeq': 'warn',
            'no-alert': 'warn',
            'no-var': 'warn',
            'prefer-const': 'warn',
            // Los scripts exponen sus modulos como globals implicitos del
            // navegador: no es una redeclaracion ni una variable sin uso
            'no-redeclare': ['error', { builtinGlobals: false }],
            'no-unused-vars': ['error', {
                varsIgnorePattern: '^(apiFetch|PacientesAPI|DoctoresAPI|CitasAPI|HistoriasAPI|PacientesModule|DoctoresModule|CitasModule|HistoriasModule|App|formatDate|formatDateTime|escapeHTML|showAlert|validateEmail|validateTelefono|isFutureDate|localToISO|cargarListaSilenciosa|API_BASE)$',
                caughtErrors: 'all',
            }],
        },
    },
    {
        files: ['js/__tests__/**/*.js', 'e2e/**/*.js', '*.config.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        rules: {},
    },
];