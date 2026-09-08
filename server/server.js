const fs = require("fs");
const path = require("path");
const pool = require("./config/db");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const projectRoutes = require("./routes/projectRoutes");
const projectFileRoutes = require("./routes/projectFileRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const managerRoutes = require("./routes/managerRoutes");
const visitorRoutes = require("./routes/visitorRoutes");
const publicRoutes = require("./routes/publicRoutes");
const queryRoutes = require("./routes/queryRoutes");
const adminQueryRoutes = require("./routes/adminQueryRoutes");
const faqRoutes = require("./routes/faqRoutes");

const SCHEMA_DIR = path.join(__dirname, "..", "database", "schema");

const applySchema = async () => {
  const files = fs
    .readdirSync(SCHEMA_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  let applied = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const sql = fs.readFileSync(path.join(SCHEMA_DIR, file), "utf8");
      await pool.query(sql);
      applied++;
    } catch (error) {
      errors++;
      console.error(`⚠ Schema file failed: ${file}`);
      console.error(`  ${error.message}`);
    }
  }

  if (errors > 0) {
    console.warn(`⚠ Schema applied with ${errors} error(s) (${applied}/${files.length} files OK)`);
  } else {
    console.log(`✓ Schema auto-applied (${applied} files)`);
  }
};

const app = express();

// CORS
const clientOrigin = process.env.CLIENT_ORIGIN;
if (clientOrigin) {
  app.use(cors({ origin: clientOrigin, credentials: true }));
} else {
  app.use(cors({ origin: false, credentials: true }));
}

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many password reset requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const resendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many OTP requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom JSON error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format.",
    });
  }
  next(err);
});

app.use("/uploads", (req, res, next) => {
  if (req.path.startsWith("/identity-proofs")) {
    return res.status(403).json({ success: false, message: "Access denied." });
  }
  next();
}, express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the APEX Backend" });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "healthy", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "unhealthy", database: "disconnected" });
  }
});

app.use("/api/auth", (req, res, next) => {
  if (req.method === "POST" && (req.path === "/login" || req.path === "/register")) {
    return loginLimiter(req, res, next);
  }
  if (req.method === "POST" && req.path === "/forgot-password") {
    return forgotPasswordLimiter(req, res, next);
  }
  if (req.method === "POST" && req.path === "/resend-otp") {
    return resendOtpLimiter(req, res, next);
  }
  next();
}, authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/project-files", projectFileRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/queries", adminQueryRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/visitor", visitorRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/faq", faqRoutes);

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large. Maximum single file size is 1 MB and total project files cannot exceed 1 MB."
        : err.message;
    return res.status(400).json({ success: false, message });
  }

  if (err && err.message === "File type not allowed.") {
    return res.status(400).json({ success: false, message: "File type not allowed." });
  }

  if (err instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format.",
    });
  }

  console.error("UNHANDLED ERROR:", err.message);
  return res.status(500).json({ success: false, message: "Server error." });
});

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required.");
}

// Token blacklist cleanup - runs every hour
const cleanupBlacklist = async () => {
  try {
    const result = await pool.query(
      `DELETE FROM token_blacklist WHERE expires_at < NOW()`
    );
    if (result.rowCount > 0) {
      console.log(`Cleaned up ${result.rowCount} expired blacklisted tokens`);
    }
  } catch (error) {
    console.error("Token blacklist cleanup error:", error.message);
  }
};

// Run cleanup on startup and every hour
cleanupBlacklist();
setInterval(cleanupBlacklist, 60 * 60 * 1000);

pool.connect()
  .then(async () => {
    console.log("✅ PostgreSQL Connected Successfully");
    await applySchema();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database Connection Failed");
    console.error(err.message);
  });
