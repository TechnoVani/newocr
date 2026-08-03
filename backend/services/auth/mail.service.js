import nodemailer from "nodemailer";
import { existsSync } from "fs";
// Authentication mail service.

const getTransporter = () => {
    const transport = String(process.env.MAIL_TRANSPORT || "smtp").trim().toLowerCase();
    const sendmailPath = process.env.MAIL_SENDMAIL_PATH || "/usr/sbin/sendmail";
    const useSendmail = transport === "sendmail" || (transport === "auto" && existsSync(sendmailPath));

    if (useSendmail) {
        return nodemailer.createTransport({
            sendmail: true,
            newline: "unix",
            path: sendmailPath
        });
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || "").trim().toLowerCase();
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        const error = new Error(
            "Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS."
        );
        error.statusCode = 503;
        throw error;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: secure ? secure === "true" : port === 465,
        requireTLS: port === 587,
        auth: { user, pass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000
    });
};

const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
}[character]));

const buildDeliveryError = (cause) => {
    const response = String(cause?.response || cause?.message || "");
    const sender = process.env.SMTP_USER || "configured sender mailbox";
    const error = new Error("Unable to send password reset email. Please try again later.");
    error.statusCode = 503;

    if (cause?.responseCode === 535 && /restricted/i.test(response)) {
        error.message = `Password reset email cannot be sent because ${sender} is restricted by the mail provider. Use an unrestricted SMTP mailbox or unblock this mailbox.`;
        error.statusCode = 503;
    } else if (cause?.code === "EAUTH" || cause?.responseCode === 535) {
        error.message = "Password reset email cannot be sent because SMTP authentication failed. Check SMTP_USER and SMTP_PASS.";
        error.statusCode = 503;
    } else if (["ECONNREFUSED", "ETIMEDOUT", "ESOCKET", "ECONNECTION"].includes(cause?.code)) {
        error.message = "Password reset email cannot be sent because the SMTP server is unreachable. Check SMTP_HOST, SMTP_PORT and hosting firewall rules.";
        error.statusCode = 503;
    }

    return error;
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
    const transport = String(process.env.MAIL_TRANSPORT || "smtp").trim().toLowerCase();
    const sendmailPath = process.env.MAIL_SENDMAIL_PATH || "/usr/sbin/sendmail";
    const useSendmail = transport === "sendmail" || (transport === "auto" && existsSync(sendmailPath));
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const smtpMissing = !useSendmail && (!host || !user || !pass
        || user.includes("your-email@")
        || pass.includes("your-smtp-app-password"));

    if (smtpMissing) {
        if (process.env.NODE_ENV !== "production" && process.env.MAIL_LOG_ONLY === "true") {
            console.warn(`Development password reset link for ${to}: ${resetUrl}`);
            return;
        }
        const error = new Error("Email service is not configured");
        error.statusCode = 503;
        throw error;
    }

    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const safeName = escapeHtml(name || "User");
    const safeResetUrl = escapeHtml(resetUrl);

    try {
        await transporter.sendMail({
            from,
            to,
            subject: "Reset your Notion Insurance password",
            text: `Hello ${name || "User"}, reset your password using this link: ${resetUrl}. This link expires in 30 minutes.`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#1e293b">
                    <h2 style="color:#1e88e5">Reset your password</h2>
                    <p>Hello ${safeName},</p>
                    <p>Click the button below to create a new password. This link expires in 30 minutes and can be used only once.</p>
                    <p style="margin:28px 0">
                        <a href="${safeResetUrl}" style="background:#1e88e5;color:white;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Reset Password</a>
                    </p>
                    <p style="font-size:12px;color:#64748b">If you did not request this reset, you can safely ignore this email.</p>
                </div>
            `
        });
    } catch (cause) {
        console.error("Password reset email delivery failed:", {
            code: cause.code,
            command: cause.command,
            responseCode: cause.responseCode,
            message: cause.message
        });
        throw buildDeliveryError(cause);
    }
};
