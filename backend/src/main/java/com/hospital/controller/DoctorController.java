package com.hospital.controller;

import com.hospital.dto.DoctorDTO;
import com.hospital.model.Doctor;
import com.hospital.service.DoctorService;
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
@RequestMapping("/api/doctores")
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" })
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping
    public ResponseEntity<Page<Doctor>> listar(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(doctorService.listarTodos(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Doctor> crear(@Valid @RequestBody DoctorDTO dto) {
        Doctor creado = doctorService.crear(dto);
        return ResponseEntity.created(URI.create("/api/doctores/" + creado.getId())).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Doctor> actualizar(@PathVariable Long id, @Valid @RequestBody DoctorDTO dto) {
        return ResponseEntity.ok(doctorService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        doctorService.eliminar(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    // BUG INTENCIONAL: endpoint que expone busqueda por especialidad vulnerable a
    // SQL Injection
    @GetMapping("/buscar-especialidad")
    public ResponseEntity<List<Doctor>> buscarPorEspecialidad(@RequestParam String q) {
        return ResponseEntity.ok(doctorService.buscarPorEspecialidadInsegura(q));
    }

    @GetMapping("/buscar-nombre")
    public ResponseEntity<List<Doctor>> buscarPorNombreCompleto(@RequestParam String nombre,
            @RequestParam String apellido) {
        return ResponseEntity.ok(doctorService.buscarPorNombreCompleto(nombre, apellido));
    }
}
