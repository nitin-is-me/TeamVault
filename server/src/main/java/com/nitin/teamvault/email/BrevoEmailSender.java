package com.nitin.teamvault.email;

import com.nitin.teamvault.exception.EmailDeliveryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Sends verification emails through Brevo's HTTPS API.
 * Brevo allows a single verified sender address, so no custom domain is needed
 * to get started, and the API works on Render where SMTP ports are blocked.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "application.email.provider", havingValue = "brevo", matchIfMissing = true)
public class BrevoEmailSender implements EmailSender {

    private final RestClient restClient;
    private final String apiKey;
    private final String fromName;
    private final String fromEmail;
    private final boolean enabled;

    public BrevoEmailSender(
            @Value("${application.brevo.api-key:}") String apiKey,
            @Value("${application.email.from:TeamVault <no-reply@example.com>}") String from,
            @Value("${application.brevo.base-url:https://api.brevo.com/v3}") String baseUrl,
            @Value("${application.email.enabled:true}") boolean enabled
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
        this.apiKey = apiKey;
        this.enabled = enabled;

        String[] parsed = parseFrom(from);
        this.fromName = parsed[0];
        this.fromEmail = parsed[1];
    }

    @Override
    public void sendVerificationCode(String toEmail, String recipientName, String code) {
        if (!enabled) {
            // Local/test convenience: no network calls, code visible in the logs.
            log.info("Email delivery disabled. Verification code for {} is {}", toEmail, code);
            return;
        }

        if (apiKey == null || apiKey.isBlank()) {
            log.error("Brevo API key is not configured; cannot send verification email to {}", toEmail);
            throw new EmailDeliveryException("Email delivery is not configured. Please contact support.");
        }

        Map<String, Object> recipient = (recipientName == null || recipientName.isBlank())
                ? Map.of("email", toEmail)
                : Map.of("email", toEmail, "name", recipientName);

        Map<String, Object> payload = Map.of(
                "sender", Map.of("name", fromName, "email", fromEmail),
                "to", List.of(recipient),
                "subject", VerificationEmailTemplate.SUBJECT,
                "htmlContent", VerificationEmailTemplate.html(recipientName, code)
        );

        try {
            restClient.post()
                    .uri("/smtp/email")
                    .header("api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            // Never log the API key or the raw request body.
            log.error("Brevo rejected the verification email for {}", toEmail, ex);
            throw new EmailDeliveryException("We could not send the verification email. Please try again.");
        }
    }

    /**
     * Accepts both "TeamVault <no-reply@example.com>" and a bare address.
     */
    private String[] parseFrom(String value) {
        String trimmed = value == null ? "" : value.trim();
        int open = trimmed.indexOf('<');
        int close = trimmed.indexOf('>');

        if (open >= 0 && close > open) {
            String name = trimmed.substring(0, open).trim();
            String email = trimmed.substring(open + 1, close).trim();
            return new String[]{name.isEmpty() ? "TeamVault" : name, email};
        }

        return new String[]{"TeamVault", trimmed};
    }
}
