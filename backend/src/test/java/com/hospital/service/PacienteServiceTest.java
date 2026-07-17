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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PacienteServiceTest {

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
        paciente.setFechaNacimiento(LocalDate.of(1990, 5, 10));
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
        dto.setFechaNacimiento(LocalDate.of(1985, 3, 15));
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
}
