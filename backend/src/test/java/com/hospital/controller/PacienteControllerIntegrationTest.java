package com.hospital.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.dto.PacienteDTO;
import com.hospital.service.PacienteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PacienteController.class)
class PacienteControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PacienteService pacienteService;

    @Test
    void debeListarPacientes() throws Exception {
        when(pacienteService.listarTodos(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

        mockMvc.perform(get("/api/pacientes"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @Test
    void debeCrearPaciente() throws Exception {
        PacienteDTO dto = new PacienteDTO();
        dto.setNombre("Laura");
        dto.setApellido("Torres");
        dto.setFechaNacimiento(LocalDate.of(1995, 1, 5));
        dto.setEmail("laura@mail.com");
        dto.setTelefono("0987654321");
        dto.setDireccion("Cuenca");
        dto.setActivo(true);

        com.hospital.model.Paciente pacienteCreado = new com.hospital.model.Paciente();
        pacienteCreado.setId(1L);
        when(pacienteService.crear(any(PacienteDTO.class))).thenReturn(pacienteCreado);

        mockMvc.perform(post("/api/pacientes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }
}
