package com.nitin.teamvault.exception;

/**
 * Thrown when a user tries to sign in before verifying their email.
 * Mapped to HTTP 403 with errorCode EMAIL_NOT_VERIFIED so the client can
 * redirect to the verification screen instead of showing a generic error.
 */
public class EmailNotVerifiedException extends RuntimeException {

    public static final String ERROR_CODE = "EMAIL_NOT_VERIFIED";

    public EmailNotVerifiedException(String message) {
        super(message);
    }
}
