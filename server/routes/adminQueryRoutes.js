const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const ensureAdmin = [authMiddleware, roleMiddleware("admin")];

// Get all queries (admin)
router.get("/", ...ensureAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const answeredOnly = status === "answered";
    const unansweredOnly = status === "unanswered";

    const result = await pool.query(
      `SELECT q.id, q.subject, q.message, q.reply, q.replied_at, q.is_read, q.created_at,
              sender.full_name AS sender_name,
              sender.email AS sender_email,
              sender.role AS sender_role
       FROM queries q
       JOIN users sender ON sender.id = q.user_id
       WHERE ($1 = FALSE OR q.reply IS NOT NULL)
         AND ($2 = FALSE OR q.reply IS NULL)
       ORDER BY CASE WHEN q.reply IS NULL THEN 0 ELSE 1 END, q.created_at DESC`,
      [answeredOnly, unansweredOnly]
    );

    return res.json({ success: true, queries: result.rows });
  } catch (error) {
    console.error("ADMIN QUERY LIST ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Reply to a query (admin only, one reply per query)
router.post("/:id/reply", ...ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;

  if (!reply || !reply.trim()) {
    return res.status(400).json({ success: false, message: "Reply content is required." });
  }

  try {
    const existing = await pool.query(
      `SELECT q.*, sender.full_name AS sender_name,
              sender.email AS sender_email
       FROM queries q
       JOIN users sender ON sender.id = q.user_id
       WHERE q.id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Query not found." });
    }

    const query = existing.rows[0];

    if (query.reply) {
      return res.status(400).json({
        success: false,
        message: "This query has already been answered. The user must create a new query if they need further help.",
      });
    }

    await pool.query(
      `UPDATE queries SET reply = $1, replied_by_user_id = $2, replied_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [String(reply).trim(), req.user.id, id]
    );

    // Create notification for the user who raised the query
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link_url)
       VALUES ($1, 'query-reply', 'Query Answered', $2, $3)`,
      [
        query.user_id,
        `Your query "${query.subject}" has been answered by the APEX admin.`,
        "/student/queries",
      ]
    );

    // Mark original query as read if it was a reply
    await pool.query(
      `UPDATE queries SET is_read = TRUE WHERE id = $1`,
      [id]
    );

    return res.json({ success: true, message: "Reply sent successfully." });
  } catch (error) {
    console.error("QUERY REPLY ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Delete a query (admin)
router.delete("/:id", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM queries WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Query not found." });
    }

    return res.json({ success: true, message: "Query deleted." });
  } catch (error) {
    console.error("QUERY DELETE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
