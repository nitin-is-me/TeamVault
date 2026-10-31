package com.nitin.teamvault.exception;

/**
 * Thrown when a request is syntactically valid but semantically invalid.
 * Mapped to HTTP 400 by {@link GlobalExceptionHandler}.
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
