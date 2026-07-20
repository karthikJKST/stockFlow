package com.stockflow.api;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
class ApiErrorHandler {
    @ExceptionHandler({NoSuchElementException.class, IllegalArgumentException.class})
    ResponseEntity<Map<String, String>> handleBadRequest(Exception ex) { return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage())); }
}
