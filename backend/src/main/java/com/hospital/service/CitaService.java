package com.hospital.service;

import com.hospital.dto.CitaDTO;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.model.Cita;
import com.hospital.model.Doctor;
import com.hospital.model.Paciente;
import com.hospital.repository.CitaRepository;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.PacienteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class CitaService {

    private static final ZoneId ZONA_HORARIA = ZoneId.of("America/Guayaquil");

    private final CitaRepository citaRepository;
    private final DoctorRepository doctorRepository;
    private final PacienteRepository pacienteRepository;

    public CitaService(CitaRepository citaRepository, DoctorRepository doctorRepository,
            PacienteRepository pacienteRepository) {
        this.citaRepository = citaRepository;
        this.doctorRepository = doctorRepository;
        this.pacienteRepository = pacienteRepository;
    }

    public Page<Cita> listarTodas(Pageable pageable) {
        return citaRepository.findAll(pageable);
    }

    public Cita buscarPorId(Long id) {
        return citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada con ID: " + id));
    }

    @Transactional
    public Cita crear(CitaDTO dto) {
        Paciente paciente = pacienteRepository.findById(dto.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado"));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor no encontrado"));

        if (dto.getFechaHora() == null || dto.getFechaHora().isBefore(LocalDateTime.now(ZONA_HORARIA))) {
            throw new IllegalArgumentException("La fecha y hora de la cita debe ser válida");
        }

        boolean existeConflicto = citaRepository.existsByDoctorIdAndFechaHora(dto.getDoctorId(), dto.getFechaHora());
        if (existeConflicto) {
            throw new IllegalArgumentException("Ya existe una cita programada para ese doctor en esa fecha y hora");
        }

        Cita cita = new Cita();
        cita.setPacienteId(paciente.getId());
        cita.setDoctor(doctor);
        cita.setFechaHora(dto.getFechaHora());
        cita.setMotivo(dto.getMotivo());
        cita.setEstado(dto.getEstado() != null ? dto.getEstado() : "PROGRAMADA");

        return citaRepository.save(cita);
    }

    @Transactional
    public Cita actualizar(Long id, CitaDTO dto) {
        Cita cita = buscarPorId(id);
        cita.setFechaHora(dto.getFechaHora());
        cita.setMotivo(dto.getMotivo());
        if (dto.getEstado() != null) {
            cita.setEstado(dto.getEstado());
        }
        return citaRepository.save(cita);
    }

    @Transactional
    public void eliminar(Long id) {
        citaRepository.deleteById(id);
    }

    public List<Cita> listarPorPaciente(Long pacienteId) {
        return citaRepository.findByPacienteId(pacienteId);
    }

    public List<Cita> listarPorDoctor(Long doctorId) {
        return citaRepository.findByDoctorId(doctorId);
    }

    public List<Cita> listarPorEstado(String estado) {
        return citaRepository.findCitasByEstadoOrdered(estado);
    }

    public List<Cita> listarPorRangoFechas(LocalDateTime inicio, LocalDateTime fin) {
        if (inicio == null || fin == null || inicio.isAfter(fin)) {
            throw new IllegalArgumentException("El rango de fechas es inválido");
        }
        return citaRepository.findByFechaHoraBetween(inicio, fin);
    }
}
