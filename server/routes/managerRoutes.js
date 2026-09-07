const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { loadProjectById, reviewProject } = require("../controllers/projectController");

const ensureManager = [authMiddleware, roleMiddleware("manager", "admin")];

router.get("/overview", ...ensureManager, async (_req, res) => {
  try {
    const [projects, approved, pending, reviewers] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS value FROM projects`),
      pool.query(`SELECT COUNT(*)::int AS value FROM projects WHERE status = 'approved'`),
      pool.query(`SELECT COUNT(*)::int AS value FROM projects WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*)::int AS value FROM users WHERE role = 'student'`),
    ]);

    return res.json({
      success: true,
      stats: {
        projects: projects.rows[0].value,
        approvedProjects: approved.rows[0].value,
        pendingProjects: pending.rows[0].value,
        students: reviewers.rows[0].value,
      },
    });
  } catch (error) {
    console.error("MANAGER OVERVIEW ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/projects", ...ensureManager, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.full_name AS owner_name,
              (SELECT COUNT(*)::int FROM project_files WHERE project_id = p.id) AS file_count,
              (SELECT COUNT(*)::int FROM project_members WHERE project_id = p.id) AS member_count
       FROM projects p
       LEFT JOIN users u ON u.id = p.created_by_user_id
       ORDER BY CASE p.status
         WHEN 'pending' THEN 1
         WHEN 'needs_changes' THEN 2
         WHEN 'approved' THEN 3
         WHEN 'rejected' THEN 4
         ELSE 5 END,
         p.created_at DESC`
    );

    return res.json({ success: true, projects: result.rows });
  } catch (error) {
    console.error("MANAGER PROJECTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/projects/:id", ...ensureManager, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await loadProjectById(pool, id, false);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }
    return res.json({ success: true, project });
  } catch (error) {
    console.error("MANAGER PROJECT DETAIL ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.post("/projects/:id/review", ...ensureManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!["approved", "rejected", "needs_changes"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const existing = await pool.query(`SELECT id, title, created_by_user_id FROM projects WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const projectTitle = existing.rows[0].title;

    await pool.query(
      `INSERT INTO project_reviews (project_id, reviewer_user_id, status, notes)
       VALUES ($1, $2, $3, $4)`,
      [id, req.user.id, status, notes || null]
    );

    await pool.query(
      `UPDATE projects SET status = $1::VARCHAR(30), reviewed_by_user_id = $2, review_notes = $3,
       approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
       reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $4`,
      [status, req.user.id, notes || null, id]
    );

    const notificationTemplates = {
      approved: {
        title: "Project Approved",
        message: `Dear Student,\n\nYour project "${projectTitle}" has been reviewed by the APEX team.\n\nStatus: Approved\n\nYour project has been approved and is now published on the APEX platform. It will be visible to visitors and featured according to the platform publishing workflow.\n\nRegards,\nAPEX Team`,
      },
      rejected: {
        title: "Project Not Approved",
        message: `Dear Student,\n\nYour project "${projectTitle}" has been reviewed by the APEX team.\n\nStatus: Not Approved\n\nUnfortunately, your project did not meet the required standards for publication at this time.${notes ? `\n\nReason: ${notes}` : ""}\n\nYou may review the feedback, make improvements, and submit a new project for consideration.\n\nRegards,\nAPEX Team`,
      },
      needs_changes: {
        title: "Project Needs Changes",
        message: `Dear Student,\n\nYour project "${projectTitle}" has been reviewed by the APEX team.\n\nStatus: Needs Changes\n\nYour project requires revisions before it can be approved.${notes ? `\n\nFeedback: ${notes}` : ""}\n\nNext Steps: Please review the feedback above, make the necessary changes to your project, and resubmit it for review.\n\nRegards,\nAPEX Team`,
      },
    };

    const template = notificationTemplates[status] || {
      title: `Project ${status}`,
      message: `Your project "${projectTitle}" has been ${status}.`,
    };

    const memberResult = await pool.query(
      `SELECT user_id FROM project_members WHERE project_id = $1`,
      [id]
    );

    for (const member of memberResult.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [member.user_id, "project-review", template.title, template.message, `/student/project/${id}`]
      );
    }

    try {
      const { sendProjectReviewEmail } = require("../services/emailServices");
      const ownerResult = await pool.query(`SELECT email, full_name FROM users WHERE id = $1`, [existing.rows[0].created_by_user_id]);
      if (ownerResult.rows.length > 0) {
        const owner = ownerResult.rows[0];
        sendProjectReviewEmail(owner.email, owner.full_name, projectTitle, status).catch(() => {});
      }
    } catch (e) {
      // Email is non-critical
    }

    return res.json({ success: true, message: "Review submitted successfully." });
  } catch (error) {
    console.error("MANAGER REVIEW ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/reviews", ...ensureManager, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT pr.id, pr.project_id, pr.status, pr.notes, pr.created_at,
              p.project_id AS project_code, p.title AS project_title,
              u.full_name AS reviewer_name
       FROM project_reviews pr
       JOIN projects p ON p.id = pr.project_id
       LEFT JOIN users u ON u.id = pr.reviewer_user_id
       ORDER BY pr.created_at DESC`
    );

    return res.json({ success: true, reviews: result.rows });
  } catch (error) {
    console.error("MANAGER REVIEWS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/team", ...ensureManager, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (u.id) u.id, u.full_name, u.email, p.title AS project_title
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       JOIN projects p ON p.id = pm.project_id
       WHERE u.role = 'student'
       ORDER BY u.id, p.created_at DESC`
    );

    return res.json({ success: true, team: result.rows });
  } catch (error) {
    console.error("MANAGER TEAM ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
