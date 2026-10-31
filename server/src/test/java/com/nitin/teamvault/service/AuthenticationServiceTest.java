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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserRepository repository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private EmailVerificationService emailVerificationService;

    @InjectMocks
    private AuthenticationService authenticationService;

    @Test
    void registerRejectsDuplicateEmail() {
        when(repository.existsByEmail("duplicate@example.com")).thenReturn(true);

        RegisterRequest request = RegisterRequest.builder()
                .name("Name")
                .email("  Duplicate@Example.com ")
                .password("password123")
                .build();

        assertThrows(ConflictException.class, () -> authenticationService.register(request));
    }

    @Test
    void registerNormalizesEmailAndName() {
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(repository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RegisterRequest request = RegisterRequest.builder()
                .name("  Alice  ")
                .email("  ALICE@Example.com ")
                .password("password123")
                .build();

        RegisterResponse response = authenticationService.register(request);

        assertEquals("alice@example.com", response.getEmail());
        assertEquals(true, response.isRequiresEmailVerification());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(repository).save(userCaptor.capture());
        assertEquals("Alice", userCaptor.getValue().getName());
        assertEquals("alice@example.com", userCaptor.getValue().getEmail());
        assertEquals("encoded", userCaptor.getValue().getPasswordHash());
        assertEquals(false, userCaptor.getValue().isEmailVerified());

        verify(emailVerificationService).sendNewCode(userCaptor.getValue());
    }

    @Test
    void authenticateNormalizesEmail() {
        User user = User.builder().id(1L).name("Alice").email("alice@example.com").emailVerified(true).build();
        when(repository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("token");

        AuthenticationRequest request = AuthenticationRequest.builder()
                .email("  ALICE@example.com ")
                .password("password123")
                .build();

        AuthenticationResponse response = authenticationService.authenticate(request);

        assertEquals("token", response.getToken());

        ArgumentCaptor<UsernamePasswordAuthenticationToken> authCaptor =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(authCaptor.capture());
        assertEquals("alice@example.com", authCaptor.getValue().getPrincipal());
    }

    @Test
    void authenticateRejectsUnverifiedEmail() {
        User user = User.builder().id(1L).name("Alice").email("alice@example.com").emailVerified(false).build();
        when(repository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));

        AuthenticationRequest request = AuthenticationRequest.builder()
                .email("alice@example.com")
                .password("password123")
                .build();

        assertThrows(EmailNotVerifiedException.class, () -> authenticationService.authenticate(request));
        verify(jwtService, never()).generateToken(any(User.class));
    }
}
