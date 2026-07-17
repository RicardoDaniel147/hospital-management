package com.hospital.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.dto.DoctorDTO;
import com.hospital.service.DoctorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DoctorController.class)
class DoctorControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DoctorService doctorService;

    @Test
    void debeListarDoctores() throws Exception {
        when(doctorService.listarTodos(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

        mockMvc.perform(get("/api/doctores"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @Test
    void debeCrearDoctor() throws Exception {
        DoctorDTO dto = new DoctorDTO();
        dto.setNombre("Pedro");
        dto.setApellido("Vera");
        dto.setEspecialidad("Pediatría");
        dto.setEmail("pedro@mail.com");
        dto.setTelefono("0988888888");
        dto.setConsultorio("303");

        com.hospital.model.Doctor doctorCreado = new com.hospital.model.Doctor();
        doctorCreado.setId(1L);
        when(doctorService.crear(any(DoctorDTO.class))).thenReturn(doctorCreado);

        mockMvc.perform(post("/api/doctores")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }
}
