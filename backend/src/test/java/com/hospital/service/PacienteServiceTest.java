package com.hospital.service;

import com.hospital.dto.PacienteDTO;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.model.Paciente;
import com.hospital.repository.PacienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.Month;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PacienteServiceTest {

    // Misma zona horaria fija que usa PacienteService internamente: evita que
    // las fechas relativas de estas pruebas caigan un dia distinto al que ve
    // el servicio si la zona horaria por defecto de esta maquina difiere.
    private static final ZoneId ZONA_HORARIA = ZoneId.of("America/Guayaquil");

    @Mock
    private PacienteRepository pacienteRepository;

    @InjectMocks
    private PacienteService pacienteService;

    private Paciente paciente;

    @BeforeEach
    void setUp() {
        paciente = new Paciente();
        paciente.setId(1L);
        paciente.setNombre("Ana");
        paciente.setApellido("Pérez");
        paciente.setFechaNacimiento(LocalDate.of(1990, Month.MAY, 10));
        paciente.setEmail("ana@mail.com");
        paciente.setTelefono("0999999999");
        paciente.setDireccion("Quito");
        paciente.setActivo(true);
    }

    @Test
    void debeListarTodosLosPacientes() {
        org.springframework.data.domain.PageImpl<Paciente> page = new org.springframework.data.domain.PageImpl<>(
                List.of(paciente));
        when(pacienteRepository.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(page);

        org.springframework.data.domain.Page<Paciente> resultado = pacienteService
                .listarTodos(org.springframework.data.domain.Pageable.unpaged());

        assertEquals(1, resultado.getContent().size());
        assertSame(paciente, resultado.getContent().get(0));
        verify(pacienteRepository).findAll(any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    void debeBuscarPacientePorIdCuandoExiste() {
        when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));

        Paciente resultado = pacienteService.buscarPorId(1L);

        assertSame(paciente, resultado);
        verify(pacienteRepository).findById(1L);
    }

    @Test
    void debeLanzarExcepcionCuandoNoExistePaciente() {
        when(pacienteRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> pacienteService.buscarPorId(99L));

        assertTrue(exception.getMessage().contains("99"));
    }

    @Test
    void debeCrearPacienteYMapearElDto() {
        PacienteDTO dto = new PacienteDTO();
        dto.setNombre("Luis");
        dto.setApellido("Mora");
        dto.setFechaNacimiento(LocalDate.of(1985, Month.MARCH, 15));
        dto.setEmail("luis@mail.com");
        dto.setTelefono("0988888888");
        dto.setDireccion("Guayaquil");
        dto.setActivo(true);

        when(pacienteRepository.save(any(Paciente.class))).thenAnswer(invocation -> {
            Paciente entidad = invocation.getArgument(0);
            entidad.setId(10L);
            return entidad;
        });

        Paciente resultado = pacienteService.crear(dto);

        assertNotNull(resultado);
        assertEquals(10L, resultado.getId());
        assertEquals("Luis", resultado.getNombre());
        assertEquals("Mora", resultado.getApellido());
        assertEquals("luis@mail.com", resultado.getEmail());
        assertTrue(resultado.getActivo());
        verify(pacienteRepository).save(any(Paciente.class));
    }

    @Test
    void debeCalcularEdadPromedioCeroCuandoNoHayPacientes() {
        when(pacienteRepository.findAll()).thenReturn(List.of());

        double promedio = pacienteService.calcularEdadPromedio();

        assertEquals(0.0, promedio);
    }

    @Test
    void debeCalcularEdadPromedioConPacientesValidos() {
        Paciente p1 = new Paciente();
        p1.setFechaNacimiento(LocalDate.now(ZONA_HORARIA).minusYears(30));
        Paciente p2 = new Paciente();
        p2.setFechaNacimiento(LocalDate.now(ZONA_HORARIA).minusYears(20));
        when(pacienteRepository.findAll()).thenReturn(List.of(p1, p2));

        double promedio = pacienteService.calcularEdadPromedio();

        assertEquals(25.0, promedio);
    }

    @Test
    void debeIgnorarFechaNacimientoNulaAlSumarPeroNoAlDividir() {
        Paciente conFecha = new Paciente();
        conFecha.setFechaNacimiento(LocalDate.now(ZONA_HORARIA).minusYears(40));
        Paciente sinFecha = new Paciente();
        sinFecha.setFechaNacimiento(null);
        when(pacienteRepository.findAll()).thenReturn(List.of(conFecha, sinFecha));

        double promedio = pacienteService.calcularEdadPromedio();

        // El paciente sin fecha de nacimiento no suma años pero si cuenta en el
        // divisor (pacientes.size()), por lo que el promedio queda por debajo
        // de la edad real del unico paciente con fecha valida.
        assertEquals(20.0, promedio);
    }

    @Test
    void debeCrearPacienteConActivoPorDefectoCuandoDtoNoLoEspecifica() {
        PacienteDTO dto = new PacienteDTO();
        dto.setNombre("Carla");
        dto.setApellido("Ruiz");
        dto.setActivo(null);

        when(pacienteRepository.save(any(Paciente.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Paciente resultado = pacienteService.crear(dto);

        assertTrue(resultado.getActivo());
    }

    @Test
    void debeCrearPacienteConActivoFalsoCuandoDtoLoEspecificaExplicitamente() {
        PacienteDTO dto = new PacienteDTO();
        dto.setNombre("Mario");
        dto.setApellido("Salas");
        dto.setActivo(false);

        when(pacienteRepository.save(any(Paciente.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Paciente resultado = pacienteService.crear(dto);

        assertFalse(resultado.getActivo());
    }

    @Test
    void debeLanzarExcepcionAlCrearConEmailYaRegistrado() {
        PacienteDTO dto = new PacienteDTO();
        dto.setNombre("Duplicado");
        dto.setEmail("existente@mail.com");
        when(pacienteRepository.findByEmail("existente@mail.com")).thenReturn(paciente);

        assertThrows(IllegalArgumentException.class, () -> pacienteService.crear(dto));
        verify(pacienteRepository, never()).save(any(Paciente.class));
    }

    @Test
    void debeActualizarSoloLosCamposProvistosEnElDto() {
        when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
        when(pacienteRepository.save(any(Paciente.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PacienteDTO cambios = new PacienteDTO();
        cambios.setNombre("Ana María");

        Paciente resultado = pacienteService.actualizar(1L, cambios);

        assertEquals("Ana María", resultado.getNombre());
        // El resto de campos no provistos en el DTO permanecen sin cambios
        assertEquals("Pérez", resultado.getApellido());
        assertEquals("ana@mail.com", resultado.getEmail());
        assertTrue(resultado.getActivo());
    }

    @Test
    void debeActualizarTodosLosCamposCuandoDtoLosProveeTodos() {
        when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
        when(pacienteRepository.save(any(Paciente.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PacienteDTO cambios = new PacienteDTO();
        cambios.setNombre("Nuevo");
        cambios.setApellido("Apellido");
        cambios.setFechaNacimiento(LocalDate.of(2000, Month.JANUARY, 1));
        cambios.setEmail("nuevo@mail.com");
        cambios.setTelefono("0911111111");
        cambios.setDireccion("Nueva Direccion");
        cambios.setActivo(false);

        Paciente resultado = pacienteService.actualizar(1L, cambios);

        assertEquals("Nuevo", resultado.getNombre());
        assertEquals("Apellido", resultado.getApellido());
        assertEquals(LocalDate.of(2000, Month.JANUARY, 1), resultado.getFechaNacimiento());
        assertEquals("nuevo@mail.com", resultado.getEmail());
        assertEquals("0911111111", resultado.getTelefono());
        assertEquals("Nueva Direccion", resultado.getDireccion());
        assertFalse(resultado.getActivo());
    }

    @Test
    void debeLanzarExcepcionAlActualizarPacienteInexistente() {
        when(pacienteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> pacienteService.actualizar(99L, new PacienteDTO()));
        verify(pacienteRepository, never()).save(any(Paciente.class));
    }

    @Test
    void debeEliminarPacienteExistente() {
        when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));

        pacienteService.eliminar(1L);

        verify(pacienteRepository).delete(paciente);
    }

    @Test
    void debeLanzarExcepcionAlEliminarPacienteInexistente() {
        when(pacienteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> pacienteService.eliminar(99L));
        verify(pacienteRepository, never()).delete(any(Paciente.class));
    }

    @Test
    void debeBuscarPacientesPorNombreDelegandoAlRepositorio() {
        when(pacienteRepository.buscarPorNombre("Ana")).thenReturn(List.of(paciente));

        List<Paciente> resultado = pacienteService.buscarPorNombre("Ana");

        assertEquals(1, resultado.size());
        verify(pacienteRepository).buscarPorNombre("Ana");
    }

    @Test
    void debeBuscarPacientePorEmailDelegandoAlRepositorio() {
        when(pacienteRepository.findByEmail("ana@mail.com")).thenReturn(paciente);

        Paciente resultado = pacienteService.buscarPorEmail("ana@mail.com");

        assertSame(paciente, resultado);
    }
}
