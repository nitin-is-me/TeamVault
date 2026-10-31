package com.nitin.teamvault.email;

/**
 * Shared verification email content so every provider sends the same message.
 */
public final class VerificationEmailTemplate {

    public static final String SUBJECT = "Your TeamVault verification code";

    private VerificationEmailTemplate() {
    }

    public static String html(String recipientName, String code) {
        String name = escapeHtml(
                recipientName == null || recipientName.isBlank() ? "there" : recipientName
        );

        return """
                <!doctype html>
                <html>
                  <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
                    <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1e293b;border:1px solid #334155;border-radius:16px;overflow:hidden;">
                            <tr>
                              <td style="padding:32px 32px 8px 32px;color:#f8fafc;">
                                <div style="font-size:20px;font-weight:700;">TeamVault</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:8px 32px 0 32px;color:#e2e8f0;">
                                <h1 style="margin:0 0 8px 0;font-size:20px;font-weight:600;">Verify your email</h1>
                                <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6;">
                                  Hi %s, use the code below to finish creating your TeamVault account.
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td align="center" style="padding:24px 32px;">
                                <div style="display:inline-block;background:#0f172a;border:1px solid #4f46e5;border-radius:12px;padding:16px 28px;color:#a5b4fc;font-size:32px;font-weight:700;letter-spacing:10px;">%s</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:0 32px 32px 32px;color:#94a3b8;font-size:13px;line-height:1.6;">
                                <p style="margin:0 0 8px 0;">This code expires in 10 minutes.</p>
                                <p style="margin:0;">If you did not create this account, you can safely ignore this email.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(name, code);
    }

    private static String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
