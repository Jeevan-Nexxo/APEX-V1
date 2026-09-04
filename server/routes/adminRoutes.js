const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { reviewProject, loadProjectById } = require("../controllers/projectController");

const ensureAdmin = [authMiddleware, roleMiddleware("admin")];

const logoDir = path.join(__dirname, "..", "uploads", "logos");
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, "logo-" + Date.now() + ext);
  },
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const teamPhotoDir = path.join(__dirname, "..", "uploads", "team");
if (!fs.existsSync(teamPhotoDir)) {
  fs.mkdirSync(teamPhotoDir, { recursive: true });
}

const teamPhotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, teamPhotoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, "team-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex") + ext);
  },
});

const teamPhotoUpload = multer({
  storage: teamPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.get("/overview", ...ensureAdmin, async (req, res) => {
  try {
    const [users, projects, pending, approved, rejected, bookmarks, contactRequests, students, visitors, managers, blockedUsers, adminUser] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS value FROM users`),
      pool.query(`SELECT COUNT(*)::int AS value FROM projects`),
      pool.query(`SELECT COUNT(*)::int AS value FROM projects WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*)::int AS value FROM projects WHERE status = 'approved'`),
      pool.query(`SELECT COUNT(*)::int AS value FROM projects WHERE status = 'rejected'`),
      pool.query(`SELECT COUNT(*)::int AS value FROM bookmarks`),
      pool.query(`SELECT COUNT(*)::int AS value FROM contact_requests`),
      pool.query(`SELECT COUNT(*)::int AS value FROM users WHERE role = 'student'`),
      pool.query(`SELECT COUNT(*)::int AS value FROM users WHERE role = 'visitor'`),
      pool.query(`SELECT COUNT(*)::int AS value FROM users WHERE role = 'manager'`),
      pool.query(`SELECT COUNT(*)::int AS value FROM users WHERE account_status = 'blocked'`),
      pool.query(`SELECT id, full_name, email, role, profile_picture, email_verified AS is_verified, created_at FROM users WHERE id = $1`, [req.user.id]),
    ]);

    return res.json({
      success: true,
      stats: {
        users: users.rows[0].value,
        projects: projects.rows[0].value,
        pendingProjects: pending.rows[0].value,
        approvedProjects: approved.rows[0].value,
        rejectedProjects: rejected.rows[0].value,
        bookmarks: bookmarks.rows[0].value,
        contactRequests: contactRequests.rows[0].value,
        students: students.rows[0].value,
        visitors: visitors.rows[0].value,
        managers: managers.rows[0].value,
        blockedUsers: blockedUsers.rows[0].value,
      },
      admin: adminUser.rows[0] || null,
    });
  } catch (error) {
    console.error("ADMIN OVERVIEW ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/users", ...ensureAdmin, async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (role) {
      conditions.push(`u.role = $${idx++}`);
      params.push(role);
    }
    if (status) {
      conditions.push(`u.account_status = $${idx++}`);
      params.push(status);
    }
    if (search) {
      conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT u.id, u.full_name, u.email, u.role, u.profile_picture,
             u.email_verified AS is_verified, u.account_status, u.created_at,
             CASE WHEN u.role = 'student' THEN sp.college ELSE NULL END AS college,
             CASE WHEN u.role = 'student' THEN sp.department ELSE NULL END AS department,
             CASE WHEN u.role = 'student' THEN sp.year_of_study ELSE NULL END AS year_of_study,
             CASE WHEN u.role = 'visitor' THEN vp.phone ELSE NULL END AS phone,
             CASE WHEN u.role = 'visitor' THEN vp.organization ELSE NULL END AS organization
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN visitor_profiles vp ON vp.user_id = u.id
      ${where}
      ORDER BY u.created_at DESC
    `;

    const result = await pool.query(sql, params);
    return res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error("ADMIN USERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.patch("/users/:id/role", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["student", "visitor", "manager", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

    if (req.user.id === id && role !== "admin") {
      return res.status(400).json({ success: false, message: "You cannot demote your own account." });
    }

    const result = await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, role, email_verified AS is_verified`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("ADMIN ROLE UPDATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.delete("/users/:id", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    }

    const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error("ADMIN USER DELETE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/users/:id", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      `SELECT id, full_name, email, role, profile_picture, email_verified AS is_verified,
              account_status, created_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = userResult.rows[0];
    let profile = null;
    let projectCount = 0;
    let projectViewCount = 0;
    let projectReviewCount = 0;

    if (user.role === "student") {
      const profileResult = await pool.query(
        `SELECT college, department, year_of_study FROM student_profiles WHERE user_id = $1`,
        [id]
      );
      profile = profileResult.rows[0] || null;

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS count FROM project_members WHERE user_id = $1`,
        [id]
      );
      projectCount = countResult.rows[0].count;
    } else if (user.role === "visitor") {
      const profileResult = await pool.query(
        `SELECT phone, organization, purpose FROM visitor_profiles WHERE user_id = $1`,
        [id]
      );
      profile = profileResult.rows[0] || null;

      const bookmarkResult = await pool.query(
        `SELECT COUNT(*)::int AS count FROM bookmarks WHERE user_id = $1`,
        [id]
      );
      projectViewCount = bookmarkResult.rows[0].count;

      const contactResult = await pool.query(
        `SELECT COUNT(*)::int AS count FROM contact_requests WHERE visitor_user_id = $1`,
        [id]
      );
      projectViewCount += contactResult.rows[0].count;
    } else if (user.role === "manager") {
      const reviewResult = await pool.query(
        `SELECT COUNT(*)::int AS count FROM project_reviews WHERE reviewer_user_id = $1`,
        [id]
      );
      projectReviewCount = reviewResult.rows[0].count;
    }

    return res.json({
      success: true,
      user: {
        ...user,
        profile,
        projectCount,
        projectViewCount,
        projectReviewCount,
      },
    });
  } catch (error) {
    console.error("ADMIN USER DETAILS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.patch("/users/:id/status", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { account_status } = req.body;

    if (!["active", "blocked"].includes(account_status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Must be 'active' or 'blocked'." });
    }

    if (req.user.id === id) {
      return res.status(400).json({ success: false, message: "You cannot change your own account status." });
    }

    const result = await pool.query(
      `UPDATE users SET account_status = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, full_name, email, role, email_verified AS is_verified, account_status`,
      [account_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("ADMIN USER STATUS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/projects", ...ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id
       FROM projects p
       ORDER BY p.created_at DESC`
    );

    const projects = [];
    for (const row of result.rows) {
      const project = await loadProjectById(pool, row.id, false);
      if (project) projects.push(project);
    }

    return res.json({ success: true, projects });
  } catch (error) {
    console.error("ADMIN PROJECTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.post("/projects/:id/review", ...ensureAdmin, reviewProject);

router.delete("/projects/:id", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(`SELECT id, title FROM projects WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const projectTitle = existing.rows[0].title;

    const memberResult = await pool.query(
      `SELECT user_id FROM project_members WHERE project_id = $1`,
      [id]
    );

    for (const member of memberResult.rows) {
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, link_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            member.user_id,
            "project-deleted",
            "Project Deleted",
            `Dear Student,\n\nYour project "${projectTitle}" has been removed from the APEX platform by an administrator.\n\nIf you have questions about this action, please contact the APEX support team.\n\nRegards,\nAPEX Team`,
            null,
          ]
        );
      } catch (e) {
        console.error("ADMIN DELETE NOTIFICATION ERROR:", e);
      }
    }

    await pool.query(`DELETE FROM projects WHERE id = $1`, [id]);
    return res.json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    console.error("ADMIN PROJECT DELETE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.patch("/projects/:id/featured", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;

    if (typeof is_featured !== "boolean") {
      return res.status(400).json({ success: false, message: "is_featured must be a boolean." });
    }

    const result = await pool.query(
      `UPDATE projects SET is_featured = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, project_id, title, is_featured, status`,
      [is_featured, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    return res.json({ success: true, project: result.rows[0] });
  } catch (error) {
    console.error("ADMIN PROJECT FEATURED ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/reviews", ...ensureAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT pr.id, pr.project_id, pr.reviewer_user_id, pr.status, pr.notes, pr.created_at,
              p.project_id AS project_code, p.title AS project_title,
              u.full_name AS reviewer_name
       FROM project_reviews pr
       JOIN projects p ON p.id = pr.project_id
       JOIN users u ON u.id = pr.reviewer_user_id
       ORDER BY pr.created_at DESC`
    );

    return res.json({ success: true, reviews: result.rows });
  } catch (error) {
    console.error("ADMIN REVIEWS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/analytics", ...ensureAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users)::int AS users,
         (SELECT COUNT(*) FROM projects WHERE status = 'approved')::int AS approved_projects,
         (SELECT COUNT(*) FROM projects WHERE status = 'pending')::int AS pending_projects,
         (SELECT COUNT(*) FROM bookmarks)::int AS bookmarks`
    );

    return res.json({ success: true, analytics: result.rows[0] });
  } catch (error) {
    console.error("ADMIN ANALYTICS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/settings", ...ensureAdmin, async (_req, res) => {
  try {
    const result = await pool.query(`SELECT key, value FROM platform_settings ORDER BY key ASC`);
    const settings = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    return res.json({ success: true, settings });
  } catch (error) {
    console.error("ADMIN SETTINGS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.put("/settings", ...ensureAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ success: false, message: "Settings object is required." });
    }

    // Lock primary_color - developer controlled, not admin-modifiable
    const LOCKED_KEYS = ["primary_color"];
    for (const [key, value] of Object.entries(settings)) {
      if (LOCKED_KEYS.includes(key)) continue;
      await pool.query(
        `INSERT INTO platform_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value ?? "")]
      );
    }

    const result = await pool.query(`SELECT key, value FROM platform_settings ORDER BY key ASC`);
    const updated = {};
    for (const row of result.rows) {
      updated[row.key] = row.value;
    }

    return res.json({ success: true, settings: updated });
  } catch (error) {
    console.error("ADMIN SETTINGS UPDATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/team", ...ensureAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM team_members ORDER BY sort_order ASC, name ASC`
    );
    return res.json({ success: true, team: result.rows });
  } catch (error) {
    console.error("ADMIN TEAM ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.post("/team", ...ensureAdmin, async (req, res) => {
  try {
    const { name, role, qualification, email, phone, photo_url, social_media, sort_order, show_on_homepage } = req.body;
    if (!name || !role) {
      return res.status(400).json({ success: false, message: "Name and role are required." });
    }

    const result = await pool.query(
      `INSERT INTO team_members (name, role, qualification, email, phone, photo_url, social_media, sort_order, show_on_homepage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        role,
        qualification || null,
        email || null,
        phone || null,
        photo_url || null,
        social_media ? JSON.stringify(social_media) : "{}",
        typeof sort_order === "number" ? sort_order : 0,
        typeof show_on_homepage === "boolean" ? show_on_homepage : false,
      ]
    );

    return res.status(201).json({ success: true, member: result.rows[0] });
  } catch (error) {
    console.error("ADMIN TEAM CREATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.put("/team/:id", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, qualification, email, phone, photo_url, social_media, sort_order, is_active, show_on_homepage } = req.body;

    const result = await pool.query(
      `UPDATE team_members
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           qualification = COALESCE($3, qualification),
           email = COALESCE($4, email),
           phone = COALESCE($5, phone),
           photo_url = COALESCE($6, photo_url),
           social_media = COALESCE($7, social_media),
           sort_order = COALESCE($8, sort_order),
           is_active = COALESCE($9, is_active),
           show_on_homepage = COALESCE($10, show_on_homepage),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        name || null,
        role || null,
        qualification !== undefined ? qualification : null,
        email !== undefined ? email : null,
        phone !== undefined ? phone : null,
        photo_url !== undefined ? photo_url : null,
        social_media ? JSON.stringify(social_media) : null,
        typeof sort_order === "number" ? sort_order : null,
        typeof is_active === "boolean" ? is_active : null,
        typeof show_on_homepage === "boolean" ? show_on_homepage : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Team member not found." });
    }

    return res.json({ success: true, member: result.rows[0] });
  } catch (error) {
    console.error("ADMIN TEAM UPDATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.delete("/team/:id", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM team_members WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Team member not found." });
    }
    return res.json({ success: true, message: "Team member deleted successfully." });
  } catch (error) {
    console.error("ADMIN TEAM DELETE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.post("/team/photo", ...ensureAdmin, teamPhotoUpload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    // Resize to 400x400 square using sharp
    const sharp = require("sharp");
    const outputPath = path.join(teamPhotoDir, "resized-" + req.file.filename);

    await sharp(req.file.path)
      .resize(400, 400, { fit: "cover", position: "centre" })
      .toFile(outputPath);

    // Replace original with resized version
    fs.unlinkSync(req.file.path);
    fs.renameSync(outputPath, req.file.path);

    const photoUrl = "/uploads/team/" + req.file.filename;
    return res.json({ success: true, photoUrl });
  } catch (error) {
    console.error("ADMIN TEAM PHOTO ERROR:", error);
    return res.status(500).json({ success: false, message: "Image processing failed. Please upload a valid image file." });
  }
});

router.get("/team/home", ...ensureAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM team_members WHERE show_on_homepage = TRUE ORDER BY sort_order ASC, name ASC`
    );
    return res.json({ success: true, team: result.rows });
  } catch (error) {
    console.error("ADMIN TEAM HOME ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.post("/settings/logo", ...ensureAdmin, logoUpload.single("logo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }
    const logoUrl = "/uploads/logos/" + req.file.filename;
    await pool.query(
      `INSERT INTO platform_settings (key, value, updated_at)
       VALUES ('website_logo', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [logoUrl]
    );
    return res.json({ success: true, logoUrl });
  } catch (error) {
    console.error("ADMIN LOGO UPLOAD ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Get identity proof for a specific user (admin only)
router.get("/users/:id/identity-proof", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, full_name, email, role, identity_proof_path, identity_proof_original_name
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = result.rows[0];

    if (!user.identity_proof_path) {
      return res.status(404).json({ success: false, message: "No identity proof uploaded for this user." });
    }

    return res.json({ success: true, identity_proof: user });
  } catch (error) {
    console.error("ADMIN IDENTITY PROOF ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Toggle project public visibility (admin only)
router.patch("/projects/:id/public", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_public } = req.body;

    if (typeof is_public !== "boolean") {
      return res.status(400).json({ success: false, message: "is_public must be a boolean." });
    }

    const result = await pool.query(
      `UPDATE projects SET is_public = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, project_id, title, is_public, status`,
      [is_public, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    return res.json({ success: true, project: result.rows[0] });
  } catch (error) {
    console.error("ADMIN PROJECT PUBLIC ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Upload category icon (admin only)
const categoryIconDir = path.join(__dirname, "..", "uploads", "category-icons");
if (!fs.existsSync(categoryIconDir)) {
  fs.mkdirSync(categoryIconDir, { recursive: true });
}

const categoryIconStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, categoryIconDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, "category-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex") + ext);
  },
});

const categoryIconUpload = multer({
  storage: categoryIconStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.post("/categories/:id/icon", ...ensureAdmin, categoryIconUpload.single("icon"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }
    const iconUrl = "/uploads/category-icons/" + req.file.filename;
    await pool.query(
      `UPDATE categories SET icon_path = $1, updated_at = NOW() WHERE id = $2`,
      [iconUrl, id]
    );
    return res.json({ success: true, iconUrl });
  } catch (error) {
    console.error("ADMIN CATEGORY ICON ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
