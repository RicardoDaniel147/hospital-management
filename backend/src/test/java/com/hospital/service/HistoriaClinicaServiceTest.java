package com.hospital.service;

import com.hospital.dto.HistoriaClinicaDTO;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.model.Doctor;
import com.hospital.model.HistoriaClinica;
import com.hospital.model.Paciente;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.HistoriaClinicaRepository;
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
 * Pruebas unitarias de HistoriaClinicaService (JUnit 5 + Mockito).
 *
 * Responsable: Eduardo
 * Actividad 1 — Pruebas Unitarias Backend (HistoriaClinicaService)
 *
 * Cobertura:
 *  - Casos felices: listar, buscar, crear (con y sin doctor), filtros
 *  - Casos límite: listas vacías, doctorId nulo (doctor opcional)
 *  - Manejo de errores: historia/paciente/doctor no encontrados
 *  - Documentación de bugs detectados: el diagnóstico se persiste sin
 *    sanitizar (XSS almacenado) y el listado no tiene paginación
 */
@ExtendWith(MockitoExtension.class)
class HistoriaClinicaServiceTest {

    @Mock
    private HistoriaClinicaRepository historiaRepository;

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private HistoriaClinicaService historiaService;

    private Paciente paciente;
    private Doctor doctor;
    private HistoriaClinica historia;
    private HistoriaClinicaDTO dto;

    @BeforeEach
    void setUp() {
        paciente = new Paciente();
        paciente.setId(1L);
        paciente.setNombre("Juan");
        paciente.setApellido("Perez");

        doctor = new Doctor();
        doctor.setId(2L);
        doctor.setNombre("Elena");
        doctor.setApellido("Rodriguez");

        historia = new HistoriaClinica(paciente, doctor,
                "Hipertension arterial controlada",
                "Losartan 50mg diario",
                "Paciente responde bien al tratamiento");
        historia.setId(5L);

        dto = new HistoriaClinicaDTO();
        dto.setPacienteId(1L);
        dto.setDoctorId(2L);
        dto.setDiagnostico("Hipertension arterial controlada");
        dto.setTratamiento("Losartan 50mg diario");
        dto.setObservaciones("Paciente responde bien al tratamiento");
    }

    // ==================== CASOS FELICES ====================

    @Nested
    @DisplayName("Casos felices")
    class CasosFelices {

        @Test
        @DisplayName("listarTodas retorna historias ordenadas por fecha de creación")
        void listarTodas_conHistorias_retornaLista() {
            when(historiaRepository.findAllByOrderByFechaCreacionDesc())
                    .thenReturn(List.of(historia));

            List<HistoriaClinica> resultado = historiaService.listarTodas();

            assertThat(resultado).hasSize(1);
            assertThat(resultado.get(0).getDiagnostico())
                    .isEqualTo("Hipertension arterial controlada");
            verify(historiaRepository).findAllByOrderByFechaCreacionDesc();
        }

        @Test
        @DisplayName("buscarPorId retorna la historia cuando existe")
        void buscarPorId_existente_retornaHistoria() {
            when(historiaRepository.findById(5L)).thenReturn(Optional.of(historia));

            HistoriaClinica resultado = historiaService.buscarPorId(5L);

            assertThat(resultado.getId()).isEqualTo(5L);
            assertThat(resultado.getPaciente()).isEqualTo(paciente);
        }

        @Test
        @DisplayName("crear guarda la historia con paciente y doctor existentes")
        void crear_conPacienteYDoctor_guardaHistoria() {
            when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
            when(doctorRepository.findById(2L)).thenReturn(Optional.of(doctor));
            when(historiaRepository.save(any(HistoriaClinica.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            HistoriaClinica resultado = historiaService.crear(dto);

            ArgumentCaptor<HistoriaClinica> captor =
                    ArgumentCaptor.forClass(HistoriaClinica.class);
            verify(historiaRepository).save(captor.capture());
            HistoriaClinica guardada = captor.getValue();

            assertThat(guardada.getPaciente()).isEqualTo(paciente);
            assertThat(guardada.getDoctor()).isEqualTo(doctor);
            assertThat(guardada.getDiagnostico()).isEqualTo("Hipertension arterial controlada");
            assertThat(guardada.getTratamiento()).isEqualTo("Losartan 50mg diario");
            assertThat(resultado.getObservaciones())
                    .isEqualTo("Paciente responde bien al tratamiento");
        }

        @Test
        @DisplayName("listarPorPaciente retorna las historias del paciente")
        void listarPorPaciente_retornaHistoriasDelPaciente() {
            when(historiaRepository.findByPacienteId(1L)).thenReturn(List.of(historia));

            List<HistoriaClinica> resultado = historiaService.listarPorPaciente(1L);

            assertThat(resultado).hasSize(1);
            verify(historiaRepository).findByPacienteId(1L);
        }

        @Test
        @DisplayName("listarPorDoctor retorna las historias del doctor")
        void listarPorDoctor_retornaHistoriasDelDoctor() {
            when(historiaRepository.findByDoctorId(2L)).thenReturn(List.of(historia));

            List<HistoriaClinica> resultado = historiaService.listarPorDoctor(2L);

            assertThat(resultado).hasSize(1);
            verify(historiaRepository).findByDoctorId(2L);
        }
    }

    // ==================== CASOS LÍMITE ====================

    @Nested
    @DisplayName("Casos límite (boundary)")
    class CasosLimite {

        @Test
        @DisplayName("crear con doctorId nulo guarda la historia sin doctor (doctor opcional)")
        void crear_sinDoctor_guardaHistoriaConDoctorNulo() {
            dto.setDoctorId(null);
            when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
            when(historiaRepository.save(any(HistoriaClinica.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            HistoriaClinica resultado = historiaService.crear(dto);

            assertThat(resultado.getDoctor()).isNull();
            // No debe consultarse el repositorio de doctores si no hay doctorId
            verify(doctorRepository, never()).findById(anyLong());
        }

        @Test
        @DisplayName("listarTodas retorna lista vacía cuando no hay historias")
        void listarTodas_sinHistorias_retornaListaVacia() {
            when(historiaRepository.findAllByOrderByFechaCreacionDesc())
                    .thenReturn(Collections.emptyList());

            List<HistoriaClinica> resultado = historiaService.listarTodas();

            assertThat(resultado).isEmpty();
        }

        @Test
        @DisplayName("listarPorPaciente retorna lista vacía para paciente sin historias")
        void listarPorPaciente_sinHistorias_retornaListaVacia() {
            when(historiaRepository.findByPacienteId(4L))
                    .thenReturn(Collections.emptyList());

            List<HistoriaClinica> resultado = historiaService.listarPorPaciente(4L);

            assertThat(resultado).isEmpty();
        }

        @Test
        @DisplayName("BUG DETECTADO: crear persiste el diagnóstico sin sanitizar (XSS almacenado)")
        void crear_diagnosticoConScript_noSanitiza() {
            // El servicio guarda tal cual cualquier HTML/script en el diagnóstico.
            // Combinado con el innerHTML del frontend produce XSS almacenado.
            String payload = "<script>alert('xss')</script>";
            dto.setDiagnostico(payload);
            when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
            when(doctorRepository.findById(2L)).thenReturn(Optional.of(doctor));
            when(historiaRepository.save(any(HistoriaClinica.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            HistoriaClinica resultado = historiaService.crear(dto);

            assertThat(resultado.getDiagnostico()).isEqualTo(payload);
        }
    }

    // ==================== MANEJO DE ERRORES ====================

    @Nested
    @DisplayName("Manejo de errores")
    class ManejoDeErrores {

        @Test
        @DisplayName("buscarPorId lanza ResourceNotFoundException si la historia no existe")
        void buscarPorId_inexistente_lanzaExcepcion() {
            when(historiaRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> historiaService.buscarPorId(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("99");
        }

        @Test
        @DisplayName("crear lanza ResourceNotFoundException si el paciente no existe")
        void crear_pacienteInexistente_lanzaExcepcion() {
            dto.setPacienteId(99L);
            when(pacienteRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> historiaService.crear(dto))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Paciente no encontrado");

            verify(historiaRepository, never()).save(any(HistoriaClinica.class));
        }

        @Test
        @DisplayName("crear lanza ResourceNotFoundException si el doctor indicado no existe")
        void crear_doctorInexistente_lanzaExcepcion() {
            dto.setDoctorId(77L);
            when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
            when(doctorRepository.findById(77L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> historiaService.crear(dto))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Doctor no encontrado");

            verify(historiaRepository, never()).save(any(HistoriaClinica.class));
        }
    }
}