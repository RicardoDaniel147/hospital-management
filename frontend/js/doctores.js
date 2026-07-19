/**
 * doctores.js - Gestion de doctores en el frontend
 *
 * BUGS INTENCIONALES:
 * 1. No valida que especialidad no este vacia
 * 2. La busqueda por especialidad usa endpoint vulnerable (SQLi en backend)
 * 3. No maneja correctamente el caso de doctor sin especialidad en la UI
 */

const DoctoresModule = {
    doctoresCache: [],

    async init() {
        await this.cargarDoctores();
        this.setupListeners();
    },

    async cargarDoctores() {
        try {
            const doctores = await DoctoresAPI.listar();
            this.doctoresCache = doctores;
            this.renderTabla(doctores);
        } catch (error) {
            console.error('Error al cargar doctores', error);
        }
    },

    renderTabla(doctores) {
        const tbody = document.querySelector('#doctores-table tbody');
        if (!doctores || doctores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay doctores registrados</td></tr>';
            return;
        }

        // CORREGIDO: se escapan los datos del usuario para prevenir XSS
        tbody.innerHTML = doctores.map(d => `
            <tr>
                <td>${escapeHTML(d.nombre)} ${escapeHTML(d.apellido)}</td>
                <td>${d.especialidad ? escapeHTML(d.especialidad) : '<em>Sin especialidad</em>'}</td>
                <td>${escapeHTML(d.email) || '—'}</td>
                <td>${escapeHTML(d.consultorio) || '—'}</td>
                <td class="actions">
                    <button class="btn-edit" onclick="DoctoresModule.editarDoctor(${d.id})">Editar</button>
                    <button class="btn-delete" onclick="DoctoresModule.eliminarDoctor(${d.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    },

    setupListeners() {
        document.getElementById('btn-nuevo-doctor').onclick = () => this.mostrarFormulario();
        document.getElementById('doctor-form').onsubmit = (e) => this.guardarDoctor(e);

        const searchInput = document.getElementById('search-doctores');
        if (searchInput) {
            // BUG: busqueda sin debounce, igual que pacientes
            searchInput.oninput = async (e) => {
                const query = e.target.value.trim();
                if (query.length > 0) {
                    // BUG: usa el endpoint vulnerable a SQLi sin advertir al usuario
                    const resultados = await DoctoresAPI.buscarPorEspecialidad(query);
                    this.renderTabla(resultados);
                } else {
                    this.renderTabla(this.doctoresCache);
                }
            };
        }
    },

    mostrarFormulario(doctor = null) {
        const modal = document.getElementById('modal-doctor');
        const form = document.getElementById('doctor-form');
        form.reset();

        if (doctor) {
            document.getElementById('doctor-id').value = doctor.id;
            document.getElementById('doctor-nombre').value = doctor.nombre || '';
            document.getElementById('doctor-apellido').value = doctor.apellido || '';
            document.getElementById('doctor-especialidad').value = doctor.especialidad || '';
            document.getElementById('doctor-email').value = doctor.email || '';
            document.getElementById('doctor-telefono').value = doctor.telefono || '';
            document.getElementById('doctor-consultorio').value = doctor.consultorio || '';
        } else {
            document.getElementById('doctor-id').value = '';
        }

        modal.classList.add('show');
    },

    cerrarFormulario() {
        document.getElementById('modal-doctor').classList.remove('show');
    },

    async guardarDoctor(e) {
        e.preventDefault();

        const id = document.getElementById('doctor-id').value;

        const doctorData = {
            nombre: document.getElementById('doctor-nombre').value,
            apellido: document.getElementById('doctor-apellido').value,
            especialidad: document.getElementById('doctor-especialidad').value,
            email: document.getElementById('doctor-email').value,
            telefono: document.getElementById('doctor-telefono').value,
            consultorio: document.getElementById('doctor-consultorio').value,
        };

        // BUG: No valida especialidad (puede guardar vacio)
        // BUG: No valida email
        // BUG: No valida nombre/apellido no vacios

        try {
            if (id) {
                await DoctoresAPI.actualizar(Number.parseInt(id), doctorData);
                showAlert('Doctor actualizado exitosamente', 'success');
            } else {
                await DoctoresAPI.crear(doctorData);
                showAlert('Doctor creado exitosamente', 'success');
            }
            this.cerrarFormulario();
            await this.cargarDoctores();
        } catch (error) {
            showAlert(`Error al guardar el doctor: ${error.message}`, 'error');
        }
    },

    async editarDoctor(id) {
        try {
            const doctor = await DoctoresAPI.buscar(id);
            this.mostrarFormulario(doctor);
        } catch {
            showAlert('Error al cargar datos del doctor', 'error');
        }
    },

    async eliminarDoctor(id) {
        // CORREGIDO: pide confirmacion antes de eliminar
        if (!confirm('¿Está seguro de que desea eliminar este doctor?')) return;
        try {
            await DoctoresAPI.eliminar(id);
            showAlert('Doctor eliminado exitosamente', 'success');
            await this.cargarDoctores();
        } catch (error) {
            showAlert(`Error al eliminar doctor: ${error.message}`, 'error');
        }
    },
};