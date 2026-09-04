const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const uploadIdentityProof = require("../middleware/identityProofMiddleware");

const {
  register,
  login,
  me,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendOtp,
} = require("../controllers/authController");

// Middleware to validate required fields
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Email and password are required." 
    });
  }
  next();
};

const validateForgotPasswordInput = (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: "Email is required." 
    });
  }
  next();
};

const validateResetPasswordInput = (req, res, next) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Token and password are required." 
    });
  }
  next();
};

router.post("/register", uploadIdentityProof.single("identity_proof"), register);
router.post("/login", validateLoginInput, login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, me);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", validateForgotPasswordInput, forgotPassword);
router.post("/reset-password", validateResetPasswordInput, resetPassword);

module.exports = router;
