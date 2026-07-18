/**
 * pacientes.js - Gestion de pacientes en el frontend
 *
 * BUGS INTENCIONALES:
 * 1. No valida campos antes de enviar al backend
 * 2. Elimina sin confirmacion
 * 3. renderPacientes no maneja tabla vacia
 * 4. usar innerHTML con datos sin escapar completamente (XSS)
 */

const PacientesModule = {
    pacientesCache: [],

    async init() {
        await this.cargarPacientes();
        this.setupListeners();
        await this.cargarEstadisticas();
    },

    async cargarPacientes() {
        try {
            const pacientes = await PacientesAPI.listar();
            this.pacientesCache = pacientes;
            this.renderTabla(pacientes);
        } catch (error) {
            // BUG INTENCIONAL: No muestra el error al usuario
            console.error('Error al cargar pacientes', error);
        }
    },

    async cargarEstadisticas() {
        try {
            const promedio = await PacientesAPI.edadPromedio();
            document.getElementById('stat-edad-promedio').textContent =
                promedio ? promedio.toFixed(1) + ' años' : 'N/D';
        } catch {
            document.getElementById('stat-edad-promedio').textContent = '—';
        }
    },

    renderTabla(pacientes) {
        const tbody = document.querySelector('#pacientes-table tbody');
        if (!pacientes || pacientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No hay pacientes registrados</td></tr>';
            return;
        }

        // CORREGIDO: se escapan todos los datos del usuario para prevenir XSS
        tbody.innerHTML = pacientes.map(p => `
            <tr>
                <td>${escapeHTML(p.nombre)} ${escapeHTML(p.apellido)}</td>
                <td>${escapeHTML(p.email) || '—'}</td>
                <td>${escapeHTML(p.telefono) || '—'}</td>
                <td>${formatDate(p.fechaNacimiento)}</td>
                <td><span class="badge ${p.activo ? 'badge-activo' : 'badge-inactivo'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td class="actions">
                    <button class="btn-view" onclick="PacientesModule.verPaciente(${p.id})">Ver</button>
                    <button class="btn-edit" onclick="PacientesModule.editarPaciente(${p.id})">Editar</button>
                    <button class="btn-delete" onclick="PacientesModule.eliminarPaciente(${p.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    },

    setupListeners() {
        document.getElementById('btn-nuevo-paciente').onclick = () => this.mostrarFormulario();
        document.getElementById('paciente-form').onsubmit = (e) => this.guardarPaciente(e);

        const searchInput = document.getElementById('search-pacientes');
        if (searchInput) {
            // BUG INTENCIONAL: busqueda en tiempo real sin debounce
            // Cada tecla dispara una peticion HTTP
            searchInput.oninput = async (e) => {
                const query = e.target.value.trim();
                if (query.length > 0) {
                    const resultados = await PacientesAPI.buscarPorNombre(query);
                    this.renderTabla(resultados);
                } else {
                    this.renderTabla(this.pacientesCache);
                }
            };
        }
    },

    mostrarFormulario(paciente = null) {
        const modal = document.getElementById('modal-paciente');
        const form = document.getElementById('paciente-form');
        form.reset();

        if (paciente) {
            document.getElementById('paciente-id').value = paciente.id;
            document.getElementById('paciente-nombre').value = paciente.nombre || '';
            document.getElementById('paciente-apellido').value = paciente.apellido || '';
            document.getElementById('paciente-email').value = paciente.email || '';
            document.getElementById('paciente-telefono').value = paciente.telefono || '';
            document.getElementById('paciente-direccion').value = paciente.direccion || '';
            document.getElementById('paciente-fecha-nacimiento').value = paciente.fechaNacimiento || '';
        } else {
            document.getElementById('paciente-id').value = '';
        }

        modal.classList.add('show');
    },

    cerrarFormulario() {
        document.getElementById('modal-paciente').classList.remove('show');
    },

    async guardarPaciente(e) {
        e.preventDefault();

        const id = document.getElementById('paciente-id').value;

        const pacienteData = {
            nombre: document.getElementById('paciente-nombre').value,
            apellido: document.getElementById('paciente-apellido').value,
            email: document.getElementById('paciente-email').value,
            telefono: document.getElementById('paciente-telefono').value,
            direccion: document.getElementById('paciente-direccion').value,
            fechaNacimiento: document.getElementById('paciente-fecha-nacimiento').value,
            activo: true,
        };

        // BUG INTENCIONAL: No valida datos antes de enviar
        // - No verifica que nombre no este vacio
        // - No valida formato de email
        // - No valida formato de telefono
        // - No valida que fecha de nacimiento no sea futura

        try {
            if (id) {
                await PacientesAPI.actualizar(parseInt(id), pacienteData);
                showAlert('Paciente actualizado exitosamente', 'success');
            } else {
                await PacientesAPI.crear(pacienteData);
                showAlert('Paciente creado exitosamente', 'success');
            }
            this.cerrarFormulario();
            await this.cargarPacientes();
            await this.cargarEstadisticas();
        } catch (error) {
            // CORREGIDO: se muestra el detalle del error al usuario
            showAlert(`Error al guardar el paciente: ${error.message}`, 'error');
        }
    },

    async verPaciente(id) {
        try {
            const paciente = await PacientesAPI.buscar(id);
            // BUG: Muestra datos directamente en innerHTML sin escapar
            const info = `
                <strong>Nombre:</strong> ${paciente.nombre} ${paciente.apellido}<br>
                <strong>Email:</strong> ${paciente.email}<br>
                <strong>Telefono:</strong> ${paciente.telefono}<br>
                <strong>Direccion:</strong> ${paciente.direccion || 'N/A'}<br>
                <strong>Fecha Nacimiento:</strong> ${formatDate(paciente.fechaNacimiento)}<br>
                <strong>Estado:</strong> ${paciente.activo ? 'Activo' : 'Inactivo'}
            `;
            alert(info); // BUG: usa alert() que bloquea el UI thread
        } catch {
            showAlert('Error al cargar paciente', 'error');
        }
    },

    async editarPaciente(id) {
        try {
            const paciente = await PacientesAPI.buscar(id);
            this.mostrarFormulario(paciente);
        } catch {
            showAlert('Error al cargar datos del paciente', 'error');
        }
    },

    // CORREGIDO: pide confirmacion antes de eliminar y explica el error real
    async eliminarPaciente(id) {
        if (!confirm('¿Está seguro de que desea eliminar este paciente?')) return;
        try {
            await PacientesAPI.eliminar(id);
            showAlert('Paciente eliminado exitosamente', 'success');
            await this.cargarPacientes();
        } catch (error) {
            showAlert(`Error al eliminar paciente: ${error.message}`, 'error');
        }
    },
};