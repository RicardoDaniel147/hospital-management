/**
 * citas.js - Gestion de citas medicas en el frontend
 *
 * BUGS INTENCIONALES:
 * 1. No valida conflicto de horarios (doble booking)
 * 2. La conversion de hora local a ISO pierde la zona horaria de Ecuador (GMT-5)
 * 3. No verifica que la fecha no sea en el pasado antes de enviar
 * 4. El formulario permite seleccionar doctores sin especialidad
 */

const CitasModule = {
    citasCache: [],
    doctoresCache: [],
    pacientesCache: [],

    async init() {
        await Promise.all([
            this.cargarCitas(),
            this.cargarDoctores(),
            this.cargarPacientes(),
        ]);
        this.setupListeners();
    },

    async cargarCitas() {
        try {
            const citas = await CitasAPI.listar();
            this.citasCache = citas;
            this.renderTabla(citas);
        } catch (error) {
            console.error('Error al cargar citas', error);
        }
    },

    async cargarDoctores() {
        this.doctoresCache = await cargarListaSilenciosa(() => DoctoresAPI.listar());
    },

    async cargarPacientes() {
        this.pacientesCache = await cargarListaSilenciosa(() => PacientesAPI.listar());
    },

    renderTabla(citas) {
        const tbody = document.querySelector('#citas-table tbody');
        if (!citas || citas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No hay citas registradas</td></tr>';
            return;
        }

        tbody.innerHTML = citas.map(c => {
            // BUG INTENCIONAL: doctor puede ser null y causa error en render
            const doctorNombre = c.doctor
                ? `${c.doctor.nombre} ${c.doctor.apellido}`
                : 'No asignado';

            // CORREGIDO: se escapan los datos del usuario para prevenir XSS
            return `
                <tr>
                    <td>Paciente #${escapeHTML(c.pacienteId)}</td>
                    <td>${escapeHTML(doctorNombre)}</td>
                    <td>${formatDateTime(c.fechaHora)}</td>
                    <td>${escapeHTML(c.motivo) || '—'}</td>
                    <td><span class="badge badge-${escapeHTML((c.estado || '').toLowerCase())}">${escapeHTML(c.estado)}</span></td>
                    <td class="actions">
                        <button class="btn-edit" onclick="CitasModule.editarCita(${c.id})">Editar</button>
                        <button class="btn-delete" onclick="CitasModule.eliminarCita(${c.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    setupListeners() {
        document.getElementById('btn-nueva-cita').onclick = () => this.mostrarFormulario();
        document.getElementById('cita-form').onsubmit = (e) => this.guardarCita(e);
        document.getElementById('filter-estado-citas').onchange = (e) => this.filtrarPorEstado(e.target.value);
    },

    async filtrarPorEstado(estado) {
        if (!estado) {
            this.renderTabla(this.citasCache);
            return;
        }
        try {
            const citas = await CitasAPI.porEstado(estado);
            this.renderTabla(citas);
        } catch {
            showAlert('Error al filtrar citas', 'error');
        }
    },

    mostrarFormulario(cita = null) {
        const modal = document.getElementById('modal-cita');
        const form = document.getElementById('cita-form');
        form.reset();

        // Llenar selects
        const selectDoctor = document.getElementById('cita-doctor');
        selectDoctor.innerHTML = '<option value="">Seleccione un doctor</option>' +
            this.doctoresCache.map(d =>
                `<option value="${d.id}">${d.nombre} ${d.apellido} (${d.especialidad || 'Sin esp.'})</option>`
            ).join('');

        const selectPaciente = document.getElementById('cita-paciente');
        selectPaciente.innerHTML = '<option value="">Seleccione un paciente</option>' +
            this.pacientesCache
                .filter(p => p.activo)
                .map(p => `<option value="${p.id}">${p.nombre} ${p.apellido}</option>`)
                .join('');

        if (cita) {
            document.getElementById('cita-id').value = cita.id;
            document.getElementById('cita-paciente').value = cita.pacienteId;
            document.getElementById('cita-doctor').value = cita.doctor?.id || '';
            document.getElementById('cita-fecha-hora').value = cita.fechaHora || '';
            document.getElementById('cita-motivo').value = cita.motivo || '';
            document.getElementById('cita-estado').value = cita.estado || 'PROGRAMADA';
        } else {
            document.getElementById('cita-id').value = '';
        }

        modal.classList.add('show');
    },

    cerrarFormulario() {
        document.getElementById('modal-cita').classList.remove('show');
    },

    async guardarCita(e) {
        e.preventDefault();

        const id = document.getElementById('cita-id').value;
        const fechaLocal = document.getElementById('cita-fecha-hora').value;

        // BUG INTENCIONAL: usa localToISO que no maneja timezone correctamente
        // En Ecuador (GMT-5), la hora se desplaza 5 horas
        const fechaISO = localToISO(fechaLocal);

        const citaData = {
            pacienteId: Number.parseInt(document.getElementById('cita-paciente').value),
            doctorId: Number.parseInt(document.getElementById('cita-doctor').value),
            fechaHora: fechaISO,
            motivo: document.getElementById('cita-motivo').value,
            estado: document.getElementById('cita-estado').value || 'PROGRAMADA',
        };

        // BUG: No verifica conflicto de horarios (doble booking)
        // BUG: No valida que pacienteId y doctorId sean validos
        // BUG: No valida que la fecha sea futura

        try {
            if (id) {
                await CitasAPI.actualizar(Number.parseInt(id), citaData);
                showAlert('Cita actualizada exitosamente', 'success');
            } else {
                await CitasAPI.crear(citaData);
                showAlert('Cita creada exitosamente', 'success');
            }
            this.cerrarFormulario();
            await this.cargarCitas();
        } catch (error) {
            showAlert(`Error al guardar la cita: ${error.message}`, 'error');
        }
    },

    async editarCita(id) {
        try {
            const cita = await CitasAPI.buscar(id);
            this.mostrarFormulario(cita);
        } catch {
            showAlert('Error al cargar datos de la cita', 'error');
        }
    },

    async eliminarCita(id) {
        // CORREGIDO: pide confirmacion antes de eliminar
        if (!confirm('¿Está seguro de que desea eliminar esta cita?')) return;
        try {
            await CitasAPI.eliminar(id);
            showAlert('Cita eliminada exitosamente', 'success');
            await this.cargarCitas();
        } catch (error) {
            showAlert(`Error al eliminar cita: ${error.message}`, 'error');
        }
    },
};