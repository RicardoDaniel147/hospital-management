package com.hospital.repository;

import com.hospital.model.HistoriaClinica;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, Long> {

    List<HistoriaClinica> findByPacienteId(Long pacienteId);

    List<HistoriaClinica> findByDoctorId(Long doctorId);

    Page<HistoriaClinica> findAllByOrderByFechaCreacionDesc(Pageable pageable);
}
