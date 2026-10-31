package com.nitin.teamvault.exception;

/**
 * Thrown when the transactional email provider cannot deliver a message.
 * Mapped to HTTP 502 because the failure is upstream, not the client's fault.
 */
public class EmailDeliveryException extends RuntimeException {
    public EmailDeliveryException(String message) {
        super(message);
    }
}
