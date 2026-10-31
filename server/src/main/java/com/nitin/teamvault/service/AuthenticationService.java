package com.nitin.teamvault.service;

import com.nitin.teamvault.dto.AuthenticationRequest;
import com.nitin.teamvault.dto.AuthenticationResponse;
import com.nitin.teamvault.dto.RegisterRequest;
import com.nitin.teamvault.dto.RegisterResponse;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.exception.ConflictException;
import com.nitin.teamvault.exception.EmailNotVerifiedException;
import com.nitin.teamvault.repository.UserRepository;
import com.nitin.teamvault.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailVerificationService emailVerificationService;

    /**
     * Creates an unverified account and emails a 6-digit code.
     * No JWT is issued here; the client must verify before signing in.
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (repository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }

        var user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .emailVerified(false)
                .build();

        repository.save(user);

        // If the email cannot be sent, this transaction rolls back and the
        // user can simply try registering again.
        emailVerificationService.sendNewCode(user);

        return RegisterResponse.builder()
                .email(user.getEmail())
                .requiresEmailVerification(true)
                .message("We sent a 6-digit verification code to " + user.getEmail())
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        String email = normalizeEmail(request.getEmail());

        // Authenticate the user - this checks the username and password against the database
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        var user = repository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException("Verify your email before signing in");
        }

        var jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
