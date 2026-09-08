const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../config/db");
const generateToken = require("../utils/generateToken");
const {
  validateEmail,
  validatePassword,
  validateFullName,
  validateRole,
} = require("../utils/validators");
const {
  verifyEmailToken,
  createPasswordResetToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/emailServices");

const ALLOWED_REGISTRATION_ROLES = ["student", "visitor"];

const toPublicUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
  is_verified: user.is_verified,
});

const loadProfileForUser = async (client, user) => {
  if (user.role === "student") {
    const result = await client.query(
      `SELECT * FROM student_profiles WHERE user_id = $1`,
      [user.id]
    );
    return result.rows[0] || null;
  }

  if (user.role === "visitor") {
    const result = await client.query(
      `SELECT * FROM visitor_profiles WHERE user_id = $1`,
      [user.id]
    );
    return result.rows[0] || null;
  }

  return null;
};

const register = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      full_name,
      email,
      password,
      role,
      college,
      department,
      year_of_study,
      phone,
      organization,
      purpose,
    } = req.body;

    const nameCheck = validateFullName(full_name);
    if (!nameCheck.valid) {
      return res.status(400).json({ success: false, message: nameCheck.message });
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ success: false, message: emailCheck.message });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const roleCheck = validateRole(role);
    if (!roleCheck.valid || !ALLOWED_REGISTRATION_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Only student and visitor registration is allowed.",
      });
    }

    if (role === "student" && (!college || !department || !year_of_study)) {
      return res.status(400).json({
        success: false,
        message: "Student profile details are required.",
      });
    }

    if (role === "visitor" && (!phone || !purpose)) {
      return res.status(400).json({
        success: false,
        message: "Visitor profile details are required.",
      });
    }

    await client.query("BEGIN");

    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, email_verified)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING id, full_name, email, role, email_verified AS is_verified, created_at`,
      [full_name.trim(), email.toLowerCase().trim(), hashedPassword, role]
    );

    const user = userResult.rows[0];

    // Save identity proof if uploaded
    let identityProofPath = null;
    let identityProofName = null;
    if (req.file) {
      identityProofPath = `uploads/identity-proofs/${req.file.filename}`;
      identityProofName = req.file.originalname;
      await client.query(
        `UPDATE users SET identity_proof_path = $1, identity_proof_original_name = $2 WHERE id = $3`,
        [identityProofPath, identityProofName, user.id]
      );
    }

    if (role === "student") {
      await client.query(
        `INSERT INTO student_profiles (user_id, college, department, year_of_study)
         VALUES ($1, $2, $3, $4)`,
        [user.id, college.trim(), department.trim(), year_of_study.trim()]
      );
    }

    if (role === "visitor") {
      await client.query(
        `INSERT INTO visitor_profiles (user_id, phone, organization, purpose)
         VALUES ($1, $2, $3, $4)`,
        [user.id, phone.trim(), organization?.trim() || null, purpose.trim()]
      );
    }

    const verificationToken = crypto.randomInt(100000, 999999).toString();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO email_verifications (user_id, verification_token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, verificationToken, verificationExpiresAt]
    );

    await client.query("COMMIT");

    // Send verification email (non-blocking)
    sendVerificationEmail(user.email, user.full_name, verificationToken).catch((err) => {
      console.error("Failed to send verification email:", err.message);
    });

    return res.status(201).json({
      success: true,
      message: "Account created. Please verify your email with the OTP code.",
      user,
      profile: role === "student"
        ? { college, department, year_of_study }
        : { phone, organization, purpose },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    client.release();
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const userResult = await pool.query(
      `SELECT id, email, full_name, email_verified
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ success: false, message: "Email is already verified." });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO email_verifications (user_id, verification_token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, otp, expiresAt]
    );

    sendVerificationEmail(user.email, user.full_name, otp).catch((err) => {
      console.error("Failed to send OTP email:", err.message);
    });

    return res.status(200).json({
      success: true,
      message: "A new OTP code has been sent to your email.",
    });
  } catch (error) {
    console.error("RESEND OTP ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ success: false, message: emailCheck.message });
    }

    const userResult = await pool.query(
      `SELECT id, full_name, email, role, password_hash, email_verified AS is_verified, account_status
       FROM users
       WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user = userResult.rows[0];

    if (user.account_status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
        requiresVerification: true,
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const me = async (req, res) => {
  try {
    const profile = await loadProfileForUser(req.dbClient || pool, req.user);

    return res.status(200).json({
      success: true,
      user: toPublicUser(req.user),
      profile,
    });
  } catch (error) {
    console.error("ME ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const jwt = require("jsonwebtoken");
      const jwtConfig = require("../config/jwt");
      try {
        const decoded = jwt.verify(token, jwtConfig.secret, {
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience,
        });
        const expiresAt = new Date(decoded.exp * 1000);
        await pool.query(
          `INSERT INTO token_blacklist (token, user_id, expires_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (token) DO NOTHING`,
          [token, decoded.id, expiresAt]
        );
      } catch (e) {
        // Token already expired or invalid, that's fine
      }
    }
    return res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return res.status(200).json({ success: true, message: "Logged out successfully." });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const token = req.body.token || req.query.token;

    if (!token) {
      return res.status(400).json({ success: false, message: "Verification token is required." });
    }

    await verifyEmailToken(token);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);
    return res.status(400).json({ success: false, message: "Server error." });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ success: false, message: emailCheck.message });
    }

    const userResult = await pool.query(
      "SELECT id, full_name, email FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset link has been created.",
      });
    }

    const resetToken = await createPasswordResetToken(userResult.rows[0].id);

    // Send reset email (non-blocking)
    sendPasswordResetEmail(userResult.rows[0].email || email, userResult.rows[0].full_name, resetToken).catch((err) => {
      console.error("Failed to send password reset email:", err.message);
    });

    return res.status(200).json({
      success: true,
      message: "If the email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const resetPassword = async (req, res) => {
  const client = await pool.connect();

  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Reset token is required." });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    await client.query("BEGIN");

    const resetResult = await client.query(
      `SELECT *
       FROM password_resets
       WHERE reset_token = $1 AND used = FALSE AND expires_at > NOW()
       LIMIT 1`,
      [token]
    );

    if (resetResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }

    const resetRow = resetResult.rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hashedPassword, resetRow.user_id]
    );

    await client.query(
      "UPDATE password_resets SET used = TRUE WHERE id = $1",
      [resetRow.id]
    );

    await client.query("COMMIT");

    return res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    client.release();
  }
};

module.exports = {
  register,
  login,
  me,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendOtp,
};
