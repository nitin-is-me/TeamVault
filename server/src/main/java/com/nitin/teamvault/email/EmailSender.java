package com.nitin.teamvault.email;

/**
 * Abstraction over the transactional email provider so the OTP workflow
 * can be tested without making real HTTP calls.
 */
public interface EmailSender {

    void sendVerificationCode(String toEmail, String recipientName, String code);
}
