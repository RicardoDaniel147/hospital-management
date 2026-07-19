package com.hospital.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("handleNotFound devuelve 404 con timestamp, status y el mensaje de la excepcion")
    void handleNotFound_devuelve404ConDetalle() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Paciente no encontrado con ID: 99");

        ResponseEntity<Map<String, Object>> response = handler.handleNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals(404, body.get("status"));
        assertEquals("Recurso no encontrado", body.get("error"));
        assertEquals("Paciente no encontrado con ID: 99", body.get("message"));
        assertNotNull(body.get("timestamp"));
    }

    @Test
    @DisplayName("handleValidation devuelve 400 con los errores de campo agrupados por nombre")
    void handleValidation_devuelve400ConErroresPorCampo() {
        FieldError fieldError = new FieldError("pacienteDTO", "nombre", "El nombre es obligatorio");
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals(400, body.get("status"));
        assertNotNull(body.get("timestamp"));

        @SuppressWarnings("unchecked")
        Map<String, String> errores = (Map<String, String>) body.get("errors");
        assertEquals("El nombre es obligatorio", errores.get("nombre"));
    }

    @Test
    @DisplayName("handleGeneral devuelve 500 sin exponer el detalle interno de la excepcion")
    void handleGeneral_devuelve500SinExponerDetalleInterno() {
        Exception ex = new RuntimeException("fallo interno inesperado con datos sensibles");

        ResponseEntity<Map<String, Object>> response = handler.handleGeneral(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals(500, body.get("status"));
        assertEquals("Error interno del servidor", body.get("error"));
        assertNotNull(body.get("timestamp"));
        assertFalse(body.containsKey("message"), "no debe filtrar el mensaje de la excepcion original");
    }
}