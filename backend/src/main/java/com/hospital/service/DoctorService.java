package com.hospital.service;

import com.hospital.dto.DoctorDTO;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.model.Doctor;
import com.hospital.repository.DoctorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    public Page<Doctor> listarTodos(Pageable pageable) {
        return doctorRepository.findAll(pageable);
    }

    public Doctor buscarPorId(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor no encontrado con ID: " + id));
    }

    public Doctor crear(DoctorDTO dto) {
        Doctor doctor = toEntity(dto);
        return doctorRepository.save(doctor);
    }

    public Doctor actualizar(Long id, DoctorDTO dto) {
        Doctor doctor = buscarPorId(id);
        doctor.setNombre(dto.getNombre());
        doctor.setApellido(dto.getApellido());
        doctor.setEspecialidad(dto.getEspecialidad());
        doctor.setEmail(dto.getEmail());
        doctor.setTelefono(dto.getTelefono());
        doctor.setConsultorio(dto.getConsultorio());
        return doctorRepository.save(doctor);
    }

    public void eliminar(Long id) {
        // BUG INTENCIONAL: no verifica si el doctor tiene citas activas antes de
        // eliminar
        doctorRepository.deleteById(id);
    }

    public List<Doctor> buscarPorEspecialidadInsegura(String especialidad) {
        return doctorRepository.findByEspecialidadContainingIgnoreCase(especialidad);
    }

    // Version segura del mismo metodo (para que los estudiantes comparen)
    public List<Doctor> buscarPorEspecialidad(String especialidad) {
        return doctorRepository.findByEspecialidadContainingIgnoreCase(especialidad);
    }

    // BUG INTENCIONAL: No hay validacion de que nombre/apellido no esten vacios
    public List<Doctor> buscarPorNombreCompleto(String nombre, String apellido) {
        return doctorRepository.findByNombreAndApellido(nombre, apellido);
    }

    private Doctor toEntity(DoctorDTO dto) {
        Doctor d = new Doctor();
        d.setNombre(dto.getNombre());
        d.setApellido(dto.getApellido());
        d.setEspecialidad(dto.getEspecialidad());
        d.setEmail(dto.getEmail());
        d.setTelefono(dto.getTelefono());
        d.setConsultorio(dto.getConsultorio());
        return d;
    }
}
