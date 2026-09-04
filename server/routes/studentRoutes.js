const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const ensureStudent = roleMiddleware("student", "admin");

router.get("/dashboard", authMiddleware, ensureStudent, async (req, res) => {
  try {
    const [projects, approvedProjects, bookmarks, unreadNotifications, recentProjects, notifications] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS value FROM projects WHERE created_by_user_id = $1`,
        [req.user.id]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS value FROM projects WHERE created_by_user_id = $1 AND status = 'approved'`,
        [req.user.id]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS value FROM bookmarks WHERE user_id = $1`,
        [req.user.id]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS value FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
        [req.user.id]
      ),
      pool.query(
        `SELECT id, project_id, title, status, created_at
         FROM projects
         WHERE created_by_user_id = $1
         ORDER BY created_at DESC
         LIMIT 3`,
        [req.user.id]
      ),
      pool.query(
        `SELECT id, type, title, message, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 3`,
        [req.user.id]
      ),
    ]);

    return res.json({
      success: true,
      stats: {
        projects: projects.rows[0].value,
        approvedProjects: approvedProjects.rows[0].value,
        bookmarks: bookmarks.rows[0].value,
        unreadNotifications: unreadNotifications.rows[0].value,
      },
      recentProjects: recentProjects.rows,
      notifications: notifications.rows,
    });
  } catch (error) {
    console.error("STUDENT DASHBOARD ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/profile", authMiddleware, ensureStudent, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.email_verified AS is_verified,
              sp.college, sp.department, sp.year_of_study
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Profile not found." });
    }

    return res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error("STUDENT PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.put("/profile", authMiddleware, ensureStudent, async (req, res) => {
  try {
    const { full_name, college, department, year_of_study } = req.body;

    if (!full_name || !college || !department || !year_of_study) {
      return res.status(400).json({ success: false, message: "All profile fields are required." });
    }

    await pool.query(
      `UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2`,
      [full_name.trim(), req.user.id]
    );

    await pool.query(
      `UPDATE student_profiles
       SET college = $1, department = $2, year_of_study = $3, updated_at = NOW()
       WHERE user_id = $4`,
      [college.trim(), department.trim(), year_of_study.trim(), req.user.id]
    );

    return res.json({ success: true, message: "Profile updated successfully." });
  } catch (error) {
    console.error("UPDATE STUDENT PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/bookmarks", authMiddleware, ensureStudent, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id AS bookmark_id, b.created_at AS bookmarked_at,
              p.id, p.project_id, p.title, p.status, p.created_at,
              creator.full_name AS creator_name
       FROM bookmarks b
       JOIN projects p ON p.id = b.project_id
       JOIN users creator ON creator.id = p.created_by_user_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    return res.json({ success: true, bookmarks: result.rows });
  } catch (error) {
    console.error("BOOKMARKS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.post("/bookmarks/:projectId", authMiddleware, ensureStudent, async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectResult = await pool.query(
      `SELECT id, status FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0 || projectResult.rows[0].status !== "approved") {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    await pool.query(
      `INSERT INTO bookmarks (user_id, project_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, project_id) DO NOTHING`,
      [req.user.id, projectId]
    );

    return res.json({ success: true, message: "Project bookmarked successfully." });
  } catch (error) {
    console.error("CREATE BOOKMARK ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.delete("/bookmarks/:projectId", authMiddleware, ensureStudent, async (req, res) => {
  try {
    const { projectId } = req.params;
    await pool.query(
      `DELETE FROM bookmarks WHERE user_id = $1 AND project_id = $2`,
      [req.user.id, projectId]
    );

    return res.json({ success: true, message: "Bookmark removed successfully." });
  } catch (error) {
    console.error("DELETE BOOKMARK ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/notifications", authMiddleware, ensureStudent, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, title, message, link_url, is_read, read_at, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error("STUDENT NOTIFICATIONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.patch("/notifications/:id/read", authMiddleware, ensureStudent, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("MARK NOTIFICATION ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.patch("/notifications/read-all", authMiddleware, ensureStudent, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/settings", authMiddleware, ensureStudent, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT theme, email_notifications FROM user_settings WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
        [req.user.id]
      );
      return res.json({ success: true, settings: { theme: "system", email_notifications: true } });
    }

    return res.json({ success: true, settings: result.rows[0] });
  } catch (error) {
    console.error("STUDENT SETTINGS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.put("/settings", authMiddleware, ensureStudent, async (req, res) => {
  try {
    const { theme, email_notifications } = req.body;

    await pool.query(
      `INSERT INTO user_settings (user_id, theme, email_notifications)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
         theme = COALESCE($2, user_settings.theme),
         email_notifications = COALESCE($3, user_settings.email_notifications),
         updated_at = NOW()`,
      [req.user.id, theme || "system", email_notifications !== false]
    );

    return res.json({ success: true, message: "Settings saved." });
  } catch (error) {
    console.error("UPDATE STUDENT SETTINGS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
