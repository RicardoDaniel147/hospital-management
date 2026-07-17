package com.hospital.service;

import com.hospital.dto.HistoriaClinicaDTO;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.model.Doctor;
import com.hospital.model.HistoriaClinica;
import com.hospital.model.Paciente;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.HistoriaClinicaRepository;
import com.hospital.repository.PacienteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HistoriaClinicaService {

    private final HistoriaClinicaRepository historiaRepository;
    private final PacienteRepository pacienteRepository;
    private final DoctorRepository doctorRepository;

    public HistoriaClinicaService(HistoriaClinicaRepository historiaRepository,
            PacienteRepository pacienteRepository,
            DoctorRepository doctorRepository) {
        this.historiaRepository = historiaRepository;
        this.pacienteRepository = pacienteRepository;
        this.doctorRepository = doctorRepository;
    }

    public Page<HistoriaClinica> listarTodas(Pageable pageable) {
        return historiaRepository.findAllByOrderByFechaCreacionDesc(pageable);
    }

    public HistoriaClinica buscarPorId(Long id) {
        return historiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Historia clinica no encontrada con ID: " + id));
    }

    public HistoriaClinica crear(HistoriaClinicaDTO dto) {
        Paciente paciente = pacienteRepository.findById(dto.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado"));

        Doctor doctor = null;
        if (dto.getDoctorId() != null) {
            doctor = doctorRepository.findById(dto.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor no encontrado"));
        }

        HistoriaClinica historia = new HistoriaClinica();
        historia.setPaciente(paciente);
        historia.setDoctor(doctor);
        historia.setDiagnostico(dto.getDiagnostico());
        historia.setTratamiento(dto.getTratamiento());
        historia.setObservaciones(dto.getObservaciones());

        historia.setDiagnostico(
                historia.getDiagnostico() == null ? null : historia.getDiagnostico().replaceAll("<[^>]*>", ""));
        return historiaRepository.save(historia);
    }

    public List<HistoriaClinica> listarPorPaciente(Long pacienteId) {
        return historiaRepository.findByPacienteId(pacienteId);
    }

    public List<HistoriaClinica> listarPorDoctor(Long doctorId) {
        return historiaRepository.findByDoctorId(doctorId);
    }
}
