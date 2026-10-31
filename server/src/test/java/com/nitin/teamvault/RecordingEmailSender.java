package com.nitin.teamvault;

import com.nitin.teamvault.email.EmailSender;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Test double that captures verification codes instead of calling Resend.
 */
public class RecordingEmailSender implements EmailSender {

    private final Map<String, String> lastCodes = new ConcurrentHashMap<>();

    @Override
    public void sendVerificationCode(String toEmail, String recipientName, String code) {
        lastCodes.put(toEmail.toLowerCase(Locale.ROOT), code);
    }

    public String lastCodeFor(String email) {
        return lastCodes.get(email.toLowerCase(Locale.ROOT));
    }
}
