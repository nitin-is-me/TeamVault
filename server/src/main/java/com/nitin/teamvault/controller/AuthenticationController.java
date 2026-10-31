package com.nitin.teamvault.controller;

import com.nitin.teamvault.dto.AuthenticationRequest;
import com.nitin.teamvault.dto.AuthenticationResponse;
import com.nitin.teamvault.dto.MessageResponse;
import com.nitin.teamvault.dto.RegisterRequest;
import com.nitin.teamvault.dto.RegisterResponse;
import com.nitin.teamvault.dto.ResendVerificationRequest;
import com.nitin.teamvault.dto.VerifyEmailRequest;
import com.nitin.teamvault.service.AuthenticationService;
import com.nitin.teamvault.service.EmailVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return new ResponseEntity<>(service.register(request), HttpStatus.CREATED);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthenticationResponse> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request
    ) {
        return ResponseEntity.ok(emailVerificationService.verifyCode(request.getEmail(), request.getCode()));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<MessageResponse> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request
    ) {
        emailVerificationService.resendCode(request.getEmail());

        // Same response for unknown/already-verified accounts to avoid enumeration.
        return ResponseEntity.ok(MessageResponse.builder()
                .message("If an unverified account exists for this email, a new code has been sent.")
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @Valid @RequestBody AuthenticationRequest request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }
}
