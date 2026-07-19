package com.hospital.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

public class PacienteDTO {

    private Long id;

    // BUG INTENCIONAL: NotBlank en nombre pero no en apellido en DTO
    // El validador del servicio no valida longitud minima
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String apellido;  // BUG: deberia tener @NotBlank

    // BUG INTENCIONAL: @Past permite fechas muy antiguas, no valida edad maxima
    @Past(message = "La fecha de nacimiento debe ser en el pasado")
    private LocalDate fechaNacimiento;

    @Email(message = "El email debe ser valido")
    private String email;

    @Pattern(regexp = "\\d{10}", message = "El telefono debe tener 10 digitos")
    private String telefono;

    private String direccion;
    private Boolean activo = true;

    public PacienteDTO() {
        // Constructor vacio requerido por Jackson para deserializar JSON
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
