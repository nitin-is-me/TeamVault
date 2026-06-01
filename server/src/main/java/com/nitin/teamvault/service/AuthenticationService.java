package com.nitin.teamvault.service;

import com.nitin.teamvault.dto.AuthenticationRequest;
import com.nitin.teamvault.dto.AuthenticationResponse;
import com.nitin.teamvault.dto.RegisterRequest;
import com.nitin.teamvault.entity.User;
import com.nitin.teamvault.repository.UserRepository;
import com.nitin.teamvault.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(RegisterRequest request) {
        // Create user entity from request, encoding the password
        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        
        // Save to DB
        repository.save(user);
        
        // Generate JWT token for the newly registered user
        var jwtToken = jwtService.generateToken(user);
        
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // Authenticate the user - this checks the username and password against the database
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        // If we reach here, the user's password was correct!
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
        
        // Generate a new token for them to use
        var jwtToken = jwtService.generateToken(user);
        
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }
}
