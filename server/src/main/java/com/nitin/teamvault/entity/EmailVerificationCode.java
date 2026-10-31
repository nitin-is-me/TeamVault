package com.nitin.teamvault.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * A single pending email verification code for a user.
 * The raw 6-digit code is never stored, only its BCrypt hash.
 */
@Entity
@Table(
        name = "email_verification_codes",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_email_verification_codes_user",
                columnNames = "user_id"
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String codeHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(nullable = false)
    private Instant lastSentAt;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
