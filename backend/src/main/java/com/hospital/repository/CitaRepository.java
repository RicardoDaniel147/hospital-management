package com.hospital.repository;

import com.hospital.model.Cita;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {

    @EntityGraph(attributePaths = "doctor")
    Page<Cita> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "doctor")
    List<Cita> findByPacienteId(Long pacienteId);

    @EntityGraph(attributePaths = "doctor")
    List<Cita> findByDoctorId(Long doctorId);

    @EntityGraph(attributePaths = "doctor")
    List<Cita> findByEstado(String estado);

    @EntityGraph(attributePaths = "doctor")
    List<Cita> findByFechaHoraBetween(LocalDateTime inicio, LocalDateTime fin);

    @EntityGraph(attributePaths = "doctor")
    @Query("SELECT c FROM Cita c WHERE c.estado = :estado ORDER BY c.fechaHora")
    List<Cita> findCitasByEstadoOrdered(@Param("estado") String estado);

    boolean existsByDoctorIdAndFechaHora(Long doctorId, LocalDateTime fechaHora);
}
