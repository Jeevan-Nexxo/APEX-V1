const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const ensureAuth = [authMiddleware];

// Create a new query (any non-admin user)
router.post("/", ...ensureAuth, async (req, res) => {
  if (req.user.role === "admin") {
    return res.status(403).json({ success: false, message: "Admin cannot raise queries." });
  }

  const { subject, message } = req.body;

  if (!subject || !subject.trim()) {
    return res.status(400).json({ success: false, message: "Subject is required." });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: "Message is required." });
  }

  try {
    // Check 5-per-day limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM queries
       WHERE user_id = $1 AND created_at >= $2`,
      [req.user.id, startOfDay]
    );

    if (countResult.rows[0].count >= 5) {
      return res.status(429).json({
        success: false,
        message: "You have reached the daily limit of 5 queries. Please try again tomorrow.",
      });
    }

    const result = await pool.query(
      `INSERT INTO queries (user_id, subject, message, is_read)
       VALUES ($1, $2, $3, FALSE)
       RETURNING id, user_id, subject, message, reply, replied_at, is_read, created_at`,
      [req.user.id, String(subject).trim(), String(message).trim()]
    );

    // Create notification for admin
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link_url)
       SELECT id, 'query', 'New Query Received', $1, '/admin/queries'
       FROM users WHERE role = 'admin'`,
      [`New query from ${req.user.full_name}: ${String(subject).trim()}`]
    );

    return res.status(201).json({ success: true, query: result.rows[0] });
  } catch (error) {
    console.error("QUERY CREATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Get all queries for current non-admin user
router.get("/mine", ...ensureAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.id, q.subject, q.message, q.reply, q.replied_at, q.is_read, q.created_at,
              replier.full_name AS replied_by_name
       FROM queries q
       LEFT JOIN users replier ON replier.id = q.replied_by_user_id
       WHERE q.user_id = $1
       ORDER BY q.created_at DESC`,
      [req.user.id]
    );

    return res.json({ success: true, queries: result.rows });
  } catch (error) {
    console.error("QUERY LIST ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Get a single query (for the admin or the owner)
router.get("/:id", ...ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT q.id, q.subject, q.message, q.reply, q.replied_at, q.is_read, q.created_at,
              sender.full_name AS sender_name,
              sender.email AS sender_email,
              sender.role AS sender_role,
              vp.phone AS sender_phone,
              replier.full_name AS replied_by_name
       FROM queries q
       JOIN users sender ON sender.id = q.user_id
       LEFT JOIN visitor_profiles vp ON vp.user_id = sender.id
       LEFT JOIN users replier ON replier.id = q.replied_by_user_id
       WHERE q.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Query not found." });
    }

    const query = result.rows[0];
    if (req.user.role !== "admin" && query.sender_email !== req.user.email) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }

    return res.json({ success: true, query });
  } catch (error) {
    console.error("QUERY DETAIL ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
