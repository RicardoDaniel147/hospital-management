package com.hospital.controller;

import com.hospital.dto.PacienteDTO;
import com.hospital.model.Paciente;
import com.hospital.service.PacienteService;
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
@RequestMapping("/api/pacientes")
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" })
public class PacienteController {

    private final PacienteService pacienteService;

    public PacienteController(PacienteService pacienteService) {
        this.pacienteService = pacienteService;
    }

    @GetMapping
    public ResponseEntity<Page<Paciente>> listar(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(pacienteService.listarTodos(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Paciente> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(pacienteService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Paciente> crear(@Valid @RequestBody PacienteDTO dto) {
        Paciente creado = pacienteService.crear(dto);
        return ResponseEntity.created(URI.create("/api/pacientes/" + creado.getId())).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Paciente> actualizar(@PathVariable Long id, @Valid @RequestBody PacienteDTO dto) {
        return ResponseEntity.ok(pacienteService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        pacienteService.eliminar(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Paciente>> buscarPorNombre(@RequestParam String nombre) {
        return ResponseEntity.ok(pacienteService.buscarPorNombre(nombre));
    }

    @GetMapping("/estadisticas/edad-promedio")
    public ResponseEntity<Double> edadPromedio() {
        return ResponseEntity.ok(pacienteService.calcularEdadPromedio());
    }
}
