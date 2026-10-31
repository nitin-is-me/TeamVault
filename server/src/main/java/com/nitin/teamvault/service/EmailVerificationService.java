package com.nitin.teamvault.service;

import com.nitin.teamvault.dto.AuthenticationResponse;
import com.nitin.teamvault.email.EmailSender;
import com.nitin.teamvault.entity.EmailVerificationCode;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.exception.BadRequestException;
import com.nitin.teamvault.exception.TooManyRequestsException;
import com.nitin.teamvault.repository.EmailVerificationCodeRepository;
import com.nitin.teamvault.repository.UserRepository;
import com.nitin.teamvault.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String INVALID_CODE_MESSAGE = "Invalid or expired verification code";

    private final EmailVerificationCodeRepository codeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailSender emailSender;

    @Value("${application.email.verification.code-ttl:PT10M}")
    private Duration codeTtl;

    @Value("${application.email.verification.resend-cooldown:PT60S}")
    private Duration resendCooldown;

    @Value("${application.email.verification.max-attempts:5}")
    private int maxAttempts;

    /**
     * Generates a fresh code, stores only its hash, and sends it.
     * Called during registration and by the resend endpoint.
     */
    @Transactional
    public void sendNewCode(User user) {
        String code = generateCode();
        Instant now = Instant.now();

        EmailVerificationCode record = codeRepository.findByUserId(user.getId())
                .orElseGet(EmailVerificationCode::new);

        record.setUser(user);
        record.setCodeHash(passwordEncoder.encode(code));
        record.setExpiresAt(now.plus(codeTtl));
        record.setAttempts(0);
        record.setLastSentAt(now);
        codeRepository.save(record);

        // If delivery fails, the surrounding transaction rolls back so the
        // user is not created without a usable code.
        emailSender.sendVerificationCode(user.getEmail(), user.getName(), code);
    }

    /**
     * Verifies a code and returns a JWT on success.
     * Intentionally not transactional: the failed-attempt counter must persist
     * even when BadRequestException is thrown and rolls nothing back.
     */
    public AuthenticationResponse verifyCode(String rawEmail, String rawCode) {
        String email = normalizeEmail(rawEmail);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(INVALID_CODE_MESSAGE));

        if (user.isEmailVerified()) {
            throw new BadRequestException("This email is already verified. Please sign in.");
        }

        EmailVerificationCode record = codeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException(INVALID_CODE_MESSAGE));

        if (record.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("This verification code has expired. Request a new one.");
        }

        if (record.getAttempts() >= maxAttempts) {
            throw new BadRequestException("Too many incorrect attempts. Request a new code.");
        }

        if (!passwordEncoder.matches(rawCode, record.getCodeHash())) {
            record.setAttempts(record.getAttempts() + 1);
            codeRepository.save(record);
            throw new BadRequestException(INVALID_CODE_MESSAGE);
        }

        user.setEmailVerified(true);
        userRepository.save(user);
        codeRepository.delete(record);

        return AuthenticationResponse.builder()
                .token(jwtService.generateToken(user))
                .build();
    }

    /**
     * Resends a code for an unverified account.
     * Responds the same way whether or not the account exists or is already
     * verified, so the endpoint cannot be used to enumerate users.
     */
    @Transactional
    public void resendCode(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isEmpty() || existingUser.get().isEmailVerified()) {
            return;
        }

        User user = existingUser.get();
        Optional<EmailVerificationCode> existingCode = codeRepository.findByUserId(user.getId());

        if (existingCode.isPresent()) {
            Instant lastSentAt = existingCode.get().getLastSentAt();
            if (lastSentAt != null && lastSentAt.plus(resendCooldown).isAfter(Instant.now())) {
                throw new TooManyRequestsException("Please wait a minute before requesting another code.");
            }
        }

        sendNewCode(user);
    }

    private String generateCode() {
        int value = 100_000 + SECURE_RANDOM.nextInt(900_000);
        return Integer.toString(value);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
