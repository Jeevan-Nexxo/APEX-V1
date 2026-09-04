const pool = require("../config/db");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Create transporter (configured via env vars)
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("⚠ SMTP not configured. Emails will not be sent.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
};

const sendEmail = async (to, subject, html) => {
  const transport = getTransporter();
  if (!transport) {
    console.warn(`📧 Email skipped (SMTP not configured): ${subject} to ${to}`);
    return false;
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || "APEX <noreply@apex.com>",
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent: ${subject} to ${to}`);
    return true;
  } catch (error) {
    console.error(`📧 Email failed: ${error.message}`);
    return false;
  }
};

const createVerificationToken = async (userId) => {
  const otp = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO email_verifications (user_id, verification_token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, otp, expiresAt]
  );

  return otp;
};

const verifyEmailToken = async (token) => {
  const result = await pool.query(
    `SELECT * FROM email_verifications
     WHERE verification_token = $1 AND verified = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [token]
  );

  if (result.rows.length === 0) throw new Error("Invalid or expired code.");

  await pool.query("UPDATE email_verifications SET verified = TRUE WHERE id = $1", [result.rows[0].id]);
  await pool.query("UPDATE users SET email_verified = TRUE WHERE id = $1", [result.rows[0].user_id]);

  return { success: true };
};

const createPasswordResetToken = async (userId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO password_resets (user_id, reset_token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );

  return token;
};

const sendVerificationEmail = async (email, name, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
      <div style="background: #1a1a2e; border-radius: 12px; padding: 32px;">
        <h2 style="color: #F59E0B; margin-top: 0;">Welcome to APEX!</h2>
        <p style="color: #fff; font-size: 16px;">Hi ${name},</p>
        <p style="color: #ccc;">Thank you for registering. Please use the verification code below to verify your email address:</p>
        <div style="background: #f59e0b; color: #1a1a2e; font-size: 28px; font-weight: bold; padding: 16px; text-align: center; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">${otp}</div>
        <p style="color: #999; font-size: 14px;">This code expires in 24 hours. Do not share it with anyone.</p>
        <p style="color: #999; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
      </div>
    </div>
  `;

  return sendEmail(email, "Your APEX email verification code", html);
};

const sendPasswordResetEmail = async (email, name, token) => {
  const clientUrl = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #F59E0B;">Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; background: #F59E0B; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password</a>
      <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
    </div>
  `;

  return sendEmail(email, "Reset your APEX password", html);
};

const sendProjectReviewEmail = async (email, name, projectTitle, status) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #F59E0B;">Project Review Update</h2>
      <p>Hi ${name},</p>
      <p>Your project "<strong>${projectTitle}</strong>" has been <strong>${status}</strong>.</p>
      ${status === "needs_changes" ? "<p>Please review the feedback and make necessary changes.</p>" : ""}
      <p style="color: #666; font-size: 14px;">Log in to view details.</p>
    </div>
  `;

  return sendEmail(email, `Project ${status} - APEX`, html);
};

module.exports = {
  createVerificationToken,
  verifyEmailToken,
  createPasswordResetToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendProjectReviewEmail,
  sendEmail,
};
