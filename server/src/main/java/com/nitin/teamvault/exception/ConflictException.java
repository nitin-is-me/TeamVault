package com.nitin.teamvault.exception;

/**
 * Thrown when a request conflicts with the current state of a resource,
 * for example registering an email that already exists.
 * Mapped to HTTP 409 by {@link GlobalExceptionHandler}.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
