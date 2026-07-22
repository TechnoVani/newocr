import nodemailer from "nodemailer";

const getTransporter = () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
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
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 30000
    });
};

const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
}[character]));

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const smtpMissing = !host || !user || !pass
        || user.includes("your-email@")
        || pass.includes("your-smtp-app-password");

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
        console.error("Password reset email delivery failed:", cause.message);
        const error = new Error("Unable to send password reset email. Please try again later.");
        error.statusCode = 502;
        throw error;
    }
};
