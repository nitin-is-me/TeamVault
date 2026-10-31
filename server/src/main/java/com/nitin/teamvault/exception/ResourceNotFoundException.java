package com.nitin.teamvault.exception;

/**
 * Thrown when a requested resource (project, article, user, version) does not exist.
 * Mapped to HTTP 404 by {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
