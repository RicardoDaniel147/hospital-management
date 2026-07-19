package com.hospital.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CitaDTO {

    private Long id;

    @NotNull(message = "El ID del paciente es obligatorio")
    private Long pacienteId;

    @NotNull(message = "El ID del doctor es obligatorio")
    private Long doctorId;

    // BUG INTENCIONAL: @Future impide crear citas con fecha actual (deberia ser @FutureOrPresent)
    @NotNull(message = "La fecha y hora es obligatoria")
    @Future(message = "La fecha debe ser futura")
    private LocalDateTime fechaHora;

    private String motivo;
    private String estado = "PROGRAMADA";

    public CitaDTO() {
        // Constructor vacio requerido por Jackson para deserializar JSON
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPacienteId() { return pacienteId; }
    public void setPacienteId(Long pacienteId) { this.pacienteId = pacienteId; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
