package com.hospital.service;

import com.hospital.dto.DoctorDTO;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.model.Doctor;
import com.hospital.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private DoctorService doctorService;

    private Doctor doctor;

    @BeforeEach
    void setUp() {
        doctor = new Doctor();
        doctor.setId(1L);
        doctor.setNombre("Carlos");
        doctor.setApellido("Ramos");
        doctor.setEspecialidad("Cardiología");
        doctor.setEmail("carlos@mail.com");
        doctor.setTelefono("0987654321");
        doctor.setConsultorio("101");
    }

    @Test
    void debeListarTodosLosDoctores() {
        org.springframework.data.domain.PageImpl<Doctor> page = new org.springframework.data.domain.PageImpl<>(List.of(doctor));
        when(doctorRepository.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(page);

        org.springframework.data.domain.Page<Doctor> resultado = doctorService.listarTodos(org.springframework.data.domain.Pageable.unpaged());

        assertEquals(1, resultado.getContent().size());
        assertSame(doctor, resultado.getContent().get(0));
        verify(doctorRepository).findAll(any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    void debeBuscarDoctorPorIdCuandoExiste() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

        Doctor resultado = doctorService.buscarPorId(1L);

        assertSame(doctor, resultado);
        verify(doctorRepository).findById(1L);
    }

    @Test
    void debeLanzarExcepcionCuandoNoExisteDoctor() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> doctorService.buscarPorId(99L)
        );

        assertTrue(exception.getMessage().contains("99"));
    }

    @Test
    void debeCrearDoctorYMapearElDto() {
        DoctorDTO dto = new DoctorDTO();
        dto.setNombre("María");
        dto.setApellido("Lopez");
        dto.setEspecialidad("Neurología");
        dto.setEmail("maria@mail.com");
        dto.setTelefono("0977777777");
        dto.setConsultorio("202");

        when(doctorRepository.save(any(Doctor.class))).thenAnswer(invocation -> {
            Doctor entidad = invocation.getArgument(0);
            entidad.setId(7L);
            return entidad;
        });

        Doctor resultado = doctorService.crear(dto);

        assertNotNull(resultado);
        assertEquals(7L, resultado.getId());
        assertEquals("María", resultado.getNombre());
        assertEquals("Neurología", resultado.getEspecialidad());
        verify(doctorRepository).save(any(Doctor.class));
    }

    @Test
    void debeBuscarDoctoresPorEspecialidad() {
        when(doctorRepository.findByEspecialidadContainingIgnoreCase("cardi")).thenReturn(List.of(doctor));

        List<Doctor> resultado = doctorService.buscarPorEspecialidad("cardi");

        assertEquals(1, resultado.size());
        assertSame(doctor, resultado.get(0));
        verify(doctorRepository).findByEspecialidadContainingIgnoreCase("cardi");
    }
}
