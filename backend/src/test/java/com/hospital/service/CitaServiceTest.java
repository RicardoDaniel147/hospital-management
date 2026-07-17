package com.hospital.service;

import com.hospital.dto.CitaDTO;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.model.Cita;
import com.hospital.model.Doctor;
import com.hospital.repository.CitaRepository;
import com.hospital.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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
 *  - Casos límite (boundary): listas vacías, estado nulo, rango de fechas invertido
 *  - Manejo de errores: cita no encontrada, doctor no encontrado
 *  - Documentación de bugs detectados: no valida existencia del paciente,
 *    no valida doble booking, no valida inicio < fin
 */
@ExtendWith(MockitoExtension.class)
class CitaServiceTest {

    @Mock
    private CitaRepository citaRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private CitaService citaService;

    private Doctor doctor;
    private Cita cita;
    private CitaDTO citaDTO;

    @BeforeEach
    void setUp() {
        doctor = new Doctor();
        doctor.setId(1L);
        doctor.setNombre("Elena");
        doctor.setApellido("Rodriguez");
        doctor.setEspecialidad("Cardiologia");

        cita = new Cita(1L, doctor, LocalDateTime.of(2026, 8, 20, 9, 0),
                "Control cardiaco de rutina", "PROGRAMADA");
        cita.setId(10L);

        citaDTO = new CitaDTO();
        citaDTO.setPacienteId(1L);
        citaDTO.setDoctorId(1L);
        citaDTO.setFechaHora(LocalDateTime.of(2026, 8, 20, 9, 0));
        citaDTO.setMotivo("Control cardiaco de rutina");
        citaDTO.setEstado("PROGRAMADA");
    }

    // ==================== CASOS FELICES ====================

    @Nested
    @DisplayName("Casos felices :D")
    class CasosFelices {

        @Test
        @DisplayName("listarTodas retorna todas las citas del repositorio")
        void listarTodas_conCitas_retornaLista() {
            when(citaRepository.findAll()).thenReturn(List.of(cita));

            List<Cita> resultado = citaService.listarTodas();

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getMotivo()).isEqualTo("Control cardiaco de rutina");
            verify(citaRepository).findAll();
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
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(citaRepository.save(any(Cita.class))).thenAnswer(inv -> inv.getArgument(0));

            Cita resultado = citaService.crear(citaDTO);

            ArgumentCaptor<Cita> captor = ArgumentCaptor.forClass(Cita.class);
            verify(citaRepository).save(captor.capture());
            Cita guardada = captor.getValue();

            assertThat(guardada.getPacienteId()).isEqualTo(1L);
            assertThat(guardada.getDoctor()).isEqualTo(doctor);
            assertThat(guardada.getFechaHora()).isEqualTo(LocalDateTime.of(2026, 8, 20, 9, 0));
            assertThat(guardada.getMotivo()).isEqualTo("Control cardiaco de rutina");
            assertThat(resultado.getEstado()).isEqualTo("PROGRAMADA");
        }

        @Test
        @DisplayName("actualizar modifica fecha, motivo y estado de una cita existente")
        void actualizar_citaExistente_actualizaCampos() {
            when(citaRepository.findById(10L)).thenReturn(Optional.of(cita));
            when(citaRepository.save(any(Cita.class))).thenAnswer(inv -> inv.getArgument(0));

            CitaDTO cambios = new CitaDTO();
            cambios.setFechaHora(LocalDateTime.of(2026, 9, 1, 15, 30));
            cambios.setMotivo("Reagendada por el paciente");
            cambios.setEstado("COMPLETADA");

            Cita resultado = citaService.actualizar(10L, cambios);

            assertThat(resultado.getFechaHora()).isEqualTo(LocalDateTime.of(2026, 9, 1, 15, 30));
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
            LocalDateTime inicio = LocalDateTime.of(2026, 8, 1, 0, 0);
            LocalDateTime fin = LocalDateTime.of(2026, 8, 31, 23, 59);
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
        @DisplayName("listarTodas retorna lista vacía cuando no hay citas")
        void listarTodas_sinCitas_retornaListaVacia() {
            when(citaRepository.findAll()).thenReturn(Collections.emptyList());

            List<Cita> resultado = citaService.listarTodas();

            assertThat(resultado).isEmpty();
        }

        @Test
        @DisplayName("crear asigna estado PROGRAMADA por defecto cuando el DTO no trae estado")
        void crear_estadoNulo_asignaProgramadaPorDefecto() {
            citaDTO.setEstado(null);
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
            cambios.setFechaHora(LocalDateTime.of(2026, 9, 1, 15, 30));
            cambios.setMotivo("Sin cambio de estado");
            cambios.setEstado(null);

            Cita resultado = citaService.actualizar(10L, cambios);

            assertThat(resultado.getEstado()).isEqualTo("COMPLETADA");
        }

        @Test
        @DisplayName("BUG DETECTADO: listarPorRangoFechas acepta inicio > fin sin validar")
        void listarPorRangoFechas_inicioMayorQueFin_noValida() {
            // El servicio deberia rechazar un rango invertido, pero lo pasa
            // directamente al repositorio. Esta prueba documenta el defecto.
            LocalDateTime inicio = LocalDateTime.of(2026, 12, 31, 0, 0);
            LocalDateTime fin = LocalDateTime.of(2026, 1, 1, 0, 0);
            when(citaRepository.findByFechaHoraBetween(inicio, fin))
                    .thenReturn(Collections.emptyList());

            List<Cita> resultado = citaService.listarPorRangoFechas(inicio, fin);

            assertThat(resultado).isEmpty();
            verify(citaRepository).findByFechaHoraBetween(inicio, fin);
        }

        @Test
        @DisplayName("BUG DETECTADO: crear no valida que el paciente exista")
        void crear_pacienteInexistente_noValidaExistencia() {
            // pacienteId 999 no existe, pero el servicio nunca consulta el
            // repositorio de pacientes (y la BD tampoco tiene FK). La cita se
            // guarda igual: esta prueba documenta el defecto de integridad.
            citaDTO.setPacienteId(999L);
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(citaRepository.save(any(Cita.class))).thenAnswer(inv -> inv.getArgument(0));

            Cita resultado = citaService.crear(citaDTO);

            assertThat(resultado.getPacienteId()).isEqualTo(999L);
        }

        @Test
        @DisplayName("BUG DETECTADO: crear no verifica doble booking del doctor")
        void crear_mismoDoctorMismaHora_noVerificaConflicto() {
            // Dos citas con el mismo doctor a la misma hora deberian rechazarse.
            // El servicio nunca consulta las citas existentes del doctor.
            when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
            when(citaRepository.save(any(Cita.class))).thenAnswer(inv -> inv.getArgument(0));

            citaService.crear(citaDTO);
            citaService.crear(citaDTO); // misma fecha/hora y mismo doctor

            // Nunca se consulta la agenda del doctor para detectar el conflicto
            verify(citaRepository, never()).findByDoctorId(anyLong());
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
            when(doctorRepository.findById(77L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> citaService.crear(citaDTO))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Doctor no encontrado");

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