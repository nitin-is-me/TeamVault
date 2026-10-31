package com.nitin.teamvault.email;

import com.nitin.teamvault.exception.EmailDeliveryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Sends verification emails through Resend's HTTPS API.
 * Resend requires a verified domain unless you only send to the account owner,
 * so Brevo is the default provider. Kept for when a domain is available.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "application.email.provider", havingValue = "resend")
public class ResendEmailSender implements EmailSender {

    private final RestClient restClient;
    private final String apiKey;
    private final String from;
    private final boolean enabled;

    public ResendEmailSender(
            @Value("${application.resend.api-key:}") String apiKey,
            @Value("${application.email.from:TeamVault <no-reply@example.com>}") String from,
            @Value("${application.resend.base-url:https://api.resend.com}") String baseUrl,
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
        this.from = from;
        this.enabled = enabled;
    }

    @Override
    public void sendVerificationCode(String toEmail, String recipientName, String code) {
        if (!enabled) {
            // Local/test convenience: no network calls, code visible in the logs.
            log.info("Email delivery disabled. Verification code for {} is {}", toEmail, code);
            return;
        }

        if (apiKey == null || apiKey.isBlank()) {
            log.error("Resend API key is not configured; cannot send verification email to {}", toEmail);
            throw new EmailDeliveryException("Email delivery is not configured. Please contact support.");
        }

        Map<String, Object> payload = Map.of(
                "from", from,
                "to", List.of(toEmail),
                "subject", VerificationEmailTemplate.SUBJECT,
                "html", VerificationEmailTemplate.html(recipientName, code)
        );

        try {
            restClient.post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            // Never log the API key or the raw request body.
            log.error("Resend rejected the verification email for {}", toEmail, ex);
            throw new EmailDeliveryException("We could not send the verification email. Please try again.");
        }
    }
}
