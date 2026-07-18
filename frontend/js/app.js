/**
 * app.js - Modulo principal de la aplicacion
 * Orquesta la navegacion y la carga inicial
 *
 * BUGS INTENCIONALES:
 * 1. Las llamadas del dashboard no manejan errores individualmente
 * 2. addEventListener usa funciones anonimas sin posibilidad de remover (memory leak)
 * 3. Carga todos los modulos al inicio (podria ser lazy loading)
 */

const App = {
    currentSection: 'dashboard',

    async init() {
        this.setupNavigation();
        await this.cargarDashboard();

        // Precarga los demas modulos solo cuando se navega a ellos
        // BUG INTENCIONAL: no remueve event listeners antiguos al cambiar seccion
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const section = e.target.dataset.section;
                await this.navegarA(section);
            });
        });
    },

    setupNavigation() {
        // Navegacion por botones del header
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.navegarA(section);
            });
        });
    },

    async navegarA(section) {
        // Actualizar botones de navegacion
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });

        // Mostrar/ocultar secciones
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `section-${section}`);
        });

        this.currentSection = section;

        // BUG INTENCIONAL: recarga el modulo cada vez que se navega,
        // incluso si los datos no cambiaron (ineficiente)
        switch (section) {
            case 'dashboard':
                await this.cargarDashboard();
                break;
            case 'pacientes':
                await PacientesModule.init();
                break;
            case 'doctores':
                await DoctoresModule.init();
                break;
            case 'citas':
                await CitasModule.init();
                break;
            case 'historias':
                await HistoriasModule.init();
                break;
        }
    },

    async cargarDashboard() {
        try {
            // Cargar resumenes para el dashboard
            const [pacientes, doctores, citas] = await Promise.all([
                PacientesAPI.listar().catch(() => []),
                DoctoresAPI.listar().catch(() => []),
                CitasAPI.listar().catch(() => []),
            ]);

            document.getElementById('stat-total-pacientes').textContent = pacientes.length || '0';
            document.getElementById('stat-total-doctores').textContent = doctores.length || '0';

            // BUG INTENCIONAL: No calcula bien "citas de hoy" — compara fechas como strings
            // sin considerar la zona horaria correctamente
            const hoy = new Date().toISOString().split('T')[0]; // BUG: timezone-naive
            const citasHoy = citas.filter(c => {
                return c.fechaHora && c.fechaHora.startsWith(hoy);
            });
            document.getElementById('stat-citas-hoy').textContent = citasHoy.length || '0';

            // BUG: si no hay pacientes, edadPromedio() lanza division por 0
            try {
                const promedio = await PacientesAPI.edadPromedio();
                document.getElementById('stat-edad-promedio').textContent =
                    promedio ? promedio.toFixed(1) + ' años' : '—';
            } catch {
                document.getElementById('stat-edad-promedio').textContent = '—';
            }
        } catch (error) {
            // BUG: error generico, no informa que fallo
            console.error('Error al cargar dashboard', error);
        }
    },
};

// Inicializar la aplicacion cuando el DOM este listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});