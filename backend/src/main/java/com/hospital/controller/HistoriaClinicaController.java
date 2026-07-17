package com.hospital.controller;

import com.hospital.dto.HistoriaClinicaDTO;
import com.hospital.model.HistoriaClinica;
import com.hospital.service.HistoriaClinicaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/historias-clinicas")
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" })
public class HistoriaClinicaController {

    private final HistoriaClinicaService historiaService;

    public HistoriaClinicaController(HistoriaClinicaService historiaService) {
        this.historiaService = historiaService;
    }

    @GetMapping
    public ResponseEntity<Page<HistoriaClinica>> listar(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(historiaService.listarTodas(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HistoriaClinica> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(historiaService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<HistoriaClinica> crear(@Valid @RequestBody HistoriaClinicaDTO dto) {
        HistoriaClinica creada = historiaService.crear(dto);
        return ResponseEntity.created(URI.create("/api/historias-clinicas/" + creada.getId())).body(creada);
    }

    @GetMapping("/paciente/{pacienteId}")
    public ResponseEntity<List<HistoriaClinica>> listarPorPaciente(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(historiaService.listarPorPaciente(pacienteId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<HistoriaClinica>> listarPorDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(historiaService.listarPorDoctor(doctorId));
    }
}
