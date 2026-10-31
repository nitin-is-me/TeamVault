package com.nitin.teamvault.exception;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponse {
    private int status;
    private String message;
    private Instant timestamp;
    /**
     * Machine-readable marker for flows the client must branch on,
     * for example EMAIL_NOT_VERIFIED.
     */
    private String errorCode;
    private Map<String, String> validationErrors;
}
