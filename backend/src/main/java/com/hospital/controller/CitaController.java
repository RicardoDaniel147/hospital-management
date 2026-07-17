package com.hospital.controller;

import com.hospital.dto.CitaDTO;
import com.hospital.model.Cita;
import com.hospital.service.CitaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/citas")
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" })
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @GetMapping
    public ResponseEntity<Page<Cita>> listar(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(citaService.listarTodas(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cita> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(citaService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Cita> crear(@Valid @RequestBody CitaDTO dto) {
        Cita creada = citaService.crear(dto);
        return ResponseEntity.created(URI.create("/api/citas/" + creada.getId())).body(creada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cita> actualizar(@PathVariable Long id, @Valid @RequestBody CitaDTO dto) {
        return ResponseEntity.ok(citaService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        citaService.eliminar(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/paciente/{pacienteId}")
    public ResponseEntity<List<Cita>> listarPorPaciente(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(citaService.listarPorPaciente(pacienteId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Cita>> listarPorDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(citaService.listarPorDoctor(doctorId));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Cita>> listarPorEstado(@PathVariable String estado) {
        return ResponseEntity.ok(citaService.listarPorEstado(estado));
    }

    @GetMapping("/rango-fechas")
    public ResponseEntity<List<Cita>> listarPorRangoFechas(@RequestParam LocalDateTime inicio,
            @RequestParam LocalDateTime fin) {
        return ResponseEntity.ok(citaService.listarPorRangoFechas(inicio, fin));
    }
}
