package com.nitin.teamvault.exception;

/**
 * Thrown when a client exceeds an application-level rate limit,
 * such as requesting verification codes too frequently.
 * Mapped to HTTP 429 by {@link GlobalExceptionHandler}.
 */
public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException(String message) {
        super(message);
    }
}
