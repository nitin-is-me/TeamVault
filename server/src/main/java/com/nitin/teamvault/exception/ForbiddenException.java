package com.nitin.teamvault.exception;

/**
 * Thrown when the authenticated user is not allowed to perform an action.
 * Mapped to HTTP 403 by {@link GlobalExceptionHandler}.
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
