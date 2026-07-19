package com.hospital.service;

import com.hospital.dto.CitaDTO;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.model.Cita;
import com.hospital.model.Doctor;
import com.hospital.model.Paciente;
import com.hospital.repository.CitaRepository;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.PacienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.time.Month;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias de CitaService (JUnit 5 + Mockito).
 *
 * Responsable: Eduardo
 * Actividad 1 — Pruebas Unitarias Backend (CitaService)
 *
 * Cobertura:
 *  - Casos felices (happy path): listar, buscar, crear, actualizar, eliminar, filtros
 *  - Casos límite (boundary): listas vacías, estado nulo
 *  - Manejo de errores: cita no encontrada, paciente/doctor no encontrados,
 *    fecha inválida, doble booking, rango de fechas invertido
 */
@ExtendWith(MockitoExtension.class)
class CitaServiceTest {

    @Mock
    private CitaRepository citaRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PacienteRepository pacienteRepository;

    @InjectMocks
    private CitaService citaService;

    private Paciente paciente;
    private Doctor doctor;
    private Cita cita;
    private CitaDTO citaDTO;
    private LocalDateTime fechaFutura;

    @BeforeEach
    void setUp() {
        paciente = new Paciente();
        paciente.setId(1L);
        paciente.setNombre("Juan");
        paciente.setApellido("Perez");

        doctor = new Doctor();
        doctor.setId(1L);
        doctor.setNombre("Elena");
        doctor.setApellido("Rodriguez");
        doctor.setEspecialidad("Cardiologia");

        // Fecha relativa al día de ejecución para que la validación
        // "la cita debe ser futura" no dependa de la fecha del build
        fechaFutura = LocalDateTime.now().plusDays(30).withNano(0);

        cita = new Cita(1L, doctor, fechaFutura,
                "Control cardiaco de rutina", "PROGRAMADA");
        cita.setId(10L);

        citaDTO = new CitaDTO();
        citaDTO.setPacienteId(1L);
        citaDTO.setDoctorId(1L);
        citaDTO.setFechaHora(fechaFutura);
        citaDTO.setMotivo("Control cardiaco de rutina");
        citaDTO.setEstado("PROGRAMADA");
    }

    // ==================== CASOS FELICES ====================

    @Nested
    @DisplayName("Casos felices :D")
    class CasosFelices {

        @Test
        @DisplayName("listarTodas retorna la página de citas del repositorio")
        void listarTodas_conCitas_retornaPagina() {
            when(citaRepository.findAll(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(cita)));

            Page<Cita> resultado = citaService.listarTodas(PageRequest.of(0, 10));

            assertThat(resultado.getContent()).hasSize(1);
            assertThat(resultado.getContent().get(0).getMotivo())
                    .isEqualTo("Control cardiaco de rutina");
            verify(citaRepository).findAll(any(Pageable.class));
        }

        @Test
        @DisplayName("buscarPorId retorna la cita cuando existe")
        void buscarPorId_existente_retornaCita() {
            when(citaRepository.findById(10L)).thenReturn(Optional.of(cita));

            Cita resultado = citaService.buscarPorId(10L);

            assertThat(resultado.getId()).isEqualTo(10L);
            assertThat(resultado.getEstado()).isEqualTo("PROGRAMADA");
        }

        @Test
        @DisplayName("crear guarda la cita con los datos del DTO cuando el doctor existe")
        void crear_conDoctorExistente_guardaCita() {
            when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(citaRepository.save(any(Cita.class))).thenAnswer(inv -> inv.getArgument(0));

            Cita resultado = citaService.crear(citaDTO);

            ArgumentCaptor<Cita> captor = ArgumentCaptor.forClass(Cita.class);
            verify(citaRepository).save(captor.capture());
            Cita guardada = captor.getValue();

            assertThat(guardada.getPacienteId()).isEqualTo(1L);
            assertThat(guardada.getDoctor()).isEqualTo(doctor);
            assertThat(guardada.getFechaHora()).isEqualTo(fechaFutura);
            assertThat(guardada.getMotivo()).isEqualTo("Control cardiaco de rutina");
            assertThat(resultado.getEstado()).isEqualTo("PROGRAMADA");
        }

        @Test
        @DisplayName("actualizar modifica fecha, motivo y estado de una cita existente")
        void actualizar_citaExistente_actualizaCampos() {
            when(citaRepository.findById(10L)).thenReturn(Optional.of(cita));
            when(citaRepository.save(any(Cita.class))).thenAnswer(inv -> inv.getArgument(0));

            CitaDTO cambios = new CitaDTO();
            cambios.setFechaHora(LocalDateTime.of(2026, Month.SEPTEMBER, 1, 15, 30));
            cambios.setMotivo("Reagendada por el paciente");
            cambios.setEstado("COMPLETADA");

            Cita resultado = citaService.actualizar(10L, cambios);

            assertThat(resultado.getFechaHora()).isEqualTo(LocalDateTime.of(2026, Month.SEPTEMBER, 1, 15, 30));
            assertThat(resultado.getMotivo()).isEqualTo("Reagendada por el paciente");
            assertThat(resultado.getEstado()).isEqualTo("COMPLETADA");
        }

        @Test
        @DisplayName("eliminar delega en el repositorio")
        void eliminar_invocaDeleteById() {
            citaService.eliminar(10L);

            verify(citaRepository).deleteById(10L);
        }

        @Test
        @DisplayName("listarPorPaciente retorna las citas del paciente")
        void listarPorPaciente_retornaCitasDelPaciente() {
            when(citaRepository.findByPacienteId(1L)).thenReturn(List.of(cita));

            List<Cita> resultado = citaService.listarPorPaciente(1L);

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getPacienteId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("listarPorDoctor retorna las citas del doctor")
        void listarPorDoctor_retornaCitasDelDoctor() {
            when(citaRepository.findByDoctorId(1L)).thenReturn(List.of(cita));

            List<Cita> resultado = citaService.listarPorDoctor(1L);

            assertThat(resultado).hasSize(1);
            verify(citaRepository).findByDoctorId(1L);
        }

        @Test
        @DisplayName("listarPorEstado usa la consulta ordenada del repositorio")
        void listarPorEstado_retornaCitasFiltradas() {
            when(citaRepository.findCitasByEstadoOrdered("PROGRAMADA")).thenReturn(List.of(cita));

            List<Cita> resultado = citaService.listarPorEstado("PROGRAMADA");

            assertThat(resultado).extracting(Cita::getEstado).containsOnly("PROGRAMADA");
        }

        @Test
        @DisplayName("listarPorRangoFechas retorna citas dentro del rango")
        void listarPorRangoFechas_rangoValido_retornaCitas() {
            LocalDateTime inicio = LocalDateTime.of(2026, Month.AUGUST, 1, 0, 0);
            LocalDateTime fin = LocalDateTime.of(2026, Month.SEPTEMBER, 31, 23, 59);
            when(citaRepository.findByFechaHoraBetween(inicio, fin)).thenReturn(List.of(cita));

            List<Cita> resultado = citaService.listarPorRangoFechas(inicio, fin);

            assertThat(resultado).hasSize(1);
        }
    }

    // ==================== CASOS LÍMITE ====================

    @Nested
    @DisplayName("Casos límite (boundary)")
    class CasosLimite {

        @Test
        @DisplayName("listarTodas retorna página vacía cuando no hay citas")
        void listarTodas_sinCitas_retornaPaginaVacia() {
            when(citaRepository.findAll(any(Pageable.class))).thenReturn(Page.empty());

            Page<Cita> resultado = citaService.listarTodas(PageRequest.of(0, 10));

            assertThat(resultado.getContent()).isEmpty();
        }

        @Test
        @DisplayName("crear asigna estado PROGRAMADA por defecto cuando el DTO no trae estado")
        void crear_estadoNulo_asignaProgramadaPorDefecto() {
            citaDTO.setEstado(null);
            when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(citaRepository.save(any(Cita.class))).thenAnswer(inv -> inv.getArgument(0));

            Cita resultado = citaService.crear(citaDTO);

            assertThat(resultado.getEstado()).isEqualTo("PROGRAMADA");
        }

        @Test
        @DisplayName("actualizar conserva el estado actual cuando el DTO trae estado nulo")
        void actualizar_estadoNulo_conservaEstadoAnterior() {
            cita.setEstado("COMPLETADA");
            when(citaRepository.findById(10L)).thenReturn(Optional.of(cita));
            when(citaRepository.save(any(Cita.class))).thenAnswer(inv -> inv.getArgument(0));

            CitaDTO cambios = new CitaDTO();
            cambios.setFechaHora(LocalDateTime.of(2026, Month.SEPTEMBER, 1, 15, 30));
            cambios.setMotivo("Sin cambio de estado");
            cambios.setEstado(null);

            Cita resultado = citaService.actualizar(10L, cambios);

            assertThat(resultado.getEstado()).isEqualTo("COMPLETADA");
        }

        @Test
        @DisplayName("BUG CORREGIDO: listarPorRangoFechas rechaza inicio > fin")
        void listarPorRangoFechas_inicioMayorQueFin_lanzaExcepcion() {
            // Antes el servicio pasaba el rango invertido directo al
            // repositorio; ahora lo valida y lanza IllegalArgumentException.
            LocalDateTime inicio = LocalDateTime.of(2026, Month.DECEMBER, 31, 0, 0);
            LocalDateTime fin = LocalDateTime.of(2026, Month.JANUARY, 1, 0, 0);

            assertThatThrownBy(() -> citaService.listarPorRangoFechas(inicio, fin))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("rango de fechas");

            verify(citaRepository, never()).findByFechaHoraBetween(any(), any());
        }

        @Test
        @DisplayName("BUG CORREGIDO: crear rechaza citas con paciente inexistente")
        void crear_pacienteInexistente_lanzaExcepcion() {
            // Antes el servicio nunca consultaba el repositorio de pacientes;
            // ahora valida la existencia y rechaza la cita.
            citaDTO.setPacienteId(999L);
            when(pacienteRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> citaService.crear(citaDTO))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Paciente no encontrado");

            verify(citaRepository, never()).save(any(Cita.class));
        }

        @Test
        @DisplayName("BUG CORREGIDO: crear rechaza doble booking del doctor")
        void crear_mismoDoctorMismaHora_rechazaConflicto() {
            // Antes dos citas con el mismo doctor a la misma hora se guardaban;
            // ahora el servicio consulta la agenda y rechaza el conflicto.
            when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(citaRepository.existsByDoctorIdAndFechaHora(1L, fechaFutura))
                    .thenReturn(true);

            assertThatThrownBy(() -> citaService.crear(citaDTO))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Ya existe una cita");

            verify(citaRepository, never()).save(any(Cita.class));
        }
    }

    // ==================== MANEJO DE ERRORES ====================

    @Nested
    @DisplayName("Manejo de errores")
    class ManejoDeErrores {

        @Test
        @DisplayName("buscarPorId lanza ResourceNotFoundException si la cita no existe")
        void buscarPorId_inexistente_lanzaExcepcion() {
            when(citaRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> citaService.buscarPorId(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("99");
        }

        @Test
        @DisplayName("crear lanza ResourceNotFoundException si el doctor no existe")
        void crear_doctorInexistente_lanzaExcepcion() {
            citaDTO.setDoctorId(77L);
            when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
            when(doctorRepository.findById(77L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> citaService.crear(citaDTO))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Doctor no encontrado");

            verify(citaRepository, never()).save(any(Cita.class));
        }

        @Test
        @DisplayName("crear lanza IllegalArgumentException si la fecha es pasada o nula")
        void crear_fechaPasadaONula_lanzaExcepcion() {
            when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

            citaDTO.setFechaHora(LocalDateTime.now().minusDays(1));
            assertThatThrownBy(() -> citaService.crear(citaDTO))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("fecha");

            citaDTO.setFechaHora(null);
            assertThatThrownBy(() -> citaService.crear(citaDTO))
                    .isInstanceOf(IllegalArgumentException.class);

            verify(citaRepository, never()).save(any(Cita.class));
        }

        @Test
        @DisplayName("actualizar lanza ResourceNotFoundException si la cita no existe")
        void actualizar_citaInexistente_lanzaExcepcion() {
            when(citaRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> citaService.actualizar(99L, citaDTO))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(citaRepository, never()).save(any(Cita.class));
        }
    }
}