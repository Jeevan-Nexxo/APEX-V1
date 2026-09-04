const pool = require("../config/db");

// -----------------------------------------------------------
// Contact Admin / Queries
// Students, Visitors and Managers raise threads to Admin.
// Flow: open -> replied -> closed (Admin replies / closes).
// -----------------------------------------------------------

const THREAD_LIST_SELECT = `
  SELECT t.id,
         t.sender_user_id,
         t.subject,
         t.status,
         t.last_message_at,
         t.replied_at,
         t.closed_at,
         t.created_at,
         u.full_name AS sender_name,
         u.email     AS sender_email,
         u.role      AS sender_role,
         (SELECT m.body FROM query_messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message_body,
         (SELECT COUNT(*) FROM query_messages m WHERE m.thread_id = t.id)::int AS message_count,
         (SELECT COUNT(*) FROM query_messages m WHERE m.thread_id = t.id AND m.is_admin_reply = TRUE AND m.read_by_recipient = FALSE)::int AS unread_replies
  FROM query_threads t
  JOIN users u ON u.id = t.sender_user_id
`;

const loadThreadById = async (client, id) => {
  const result = await client.query(`SELECT * FROM query_threads WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

// POST /api/queries  (student | visitor | manager)
const createThread = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !subject.trim() || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Subject and message are required." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const threadResult = await client.query(
        `INSERT INTO query_threads (sender_user_id, subject)
         VALUES ($1, $2)
         RETURNING *`,
        [req.user.id, subject.trim().slice(0, 200)]
      );

      await client.query(
        `INSERT INTO query_messages (thread_id, sender_user_id, sender_role, body)
         VALUES ($1, $2, $3, $4)`,
        [threadResult.rows[0].id, req.user.id, req.user.role, message.trim()]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Your message has been sent to the APEX Admin team.",
        thread: threadResult.rows[0],
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("QUERY CREATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/queries/mine
const getMyThreads = async (req, res) => {
  try {
    const result = await pool.query(
      `${THREAD_LIST_SELECT}
       WHERE t.sender_user_id = $1
       ORDER BY t.last_message_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, threads: result.rows });
  } catch (error) {
    console.error("QUERY MINE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/queries/unread-count
const getUnreadReplyCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS value
       FROM query_messages m
       JOIN query_threads t ON t.id = m.thread_id
       WHERE t.sender_user_id = $1
         AND m.is_admin_reply = TRUE
         AND m.read_by_recipient = FALSE`,
      [req.user.id]
    );
    return res.json({ success: true, count: result.rows[0].value });
  } catch (error) {
    console.error("QUERY UNREAD COUNT ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/queries/thread/:id  (owner or admin; owner open marks replies read)
const getThreadDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const thread = await loadThreadById(pool, id);
    if (!thread) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const isAdmin = req.user.role === "admin";
    if (!isAdmin && thread.sender_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "You do not have access to this conversation." });
    }

    const messagesResult = await pool.query(
      `SELECT m.id, m.thread_id, m.sender_user_id, m.sender_role, m.body,
              m.is_admin_reply, m.read_by_recipient, m.read_at, m.created_at,
              u.full_name AS sender_name
       FROM query_messages m
       JOIN users u ON u.id = m.sender_user_id
       WHERE m.thread_id = $1
       ORDER BY m.created_at ASC, m.id ASC`,
      [id]
    );

    if (!isAdmin) {
      await pool.query(
        `UPDATE query_messages
         SET read_by_recipient = TRUE, read_at = NOW()
         WHERE thread_id = $1 AND is_admin_reply = TRUE AND read_by_recipient = FALSE`,
        [id]
      );

      // Opening the conversation also marks its unread reply notifications
      // as read so badge counts stay consistent across entry points.
      await pool.query(
        `UPDATE notifications
         SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
         WHERE user_id = $1
           AND type = 'query_reply'
           AND is_read = FALSE
           AND link_url LIKE '%thread=' || $2::text`,
        [req.user.id, String(thread.id)]
      );
    }

    let threadView = { ...thread };
    if (isAdmin) {
      const sender = await pool.query(
        `SELECT full_name, email, role FROM users WHERE id = $1`,
        [thread.sender_user_id]
      );
      if (sender.rows[0]) {
        threadView.sender_name = sender.rows[0].full_name;
        threadView.sender_email = sender.rows[0].email;
        threadView.sender_role = sender.rows[0].role;
      }
    }

    return res.json({ success: true, thread: threadView, messages: messagesResult.rows });
  } catch (error) {
    console.error("QUERY DETAIL ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/queries/thread/:id/messages  (owner follow-up; reopens replied threads)
const sendFollowUpMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const thread = await loadThreadById(pool, id);
    if (!thread) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    if (thread.sender_user_id !== req.user.id || req.user.role === "admin") {
      return res.status(403).json({ success: false, message: "Only the conversation owner can reply here." });
    }
    if (thread.status === "closed") {
      return res.status(400).json({ success: false, message: "This conversation is closed. Please raise a new query." });
    }

    const insertResult = await pool.query(
      `INSERT INTO query_messages (thread_id, sender_user_id, sender_role, body)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [thread.id, req.user.id, req.user.role, message.trim()]
    );

    await pool.query(
      `UPDATE query_threads SET status = 'open', last_message_at = NOW() WHERE id = $1`,
      [thread.id]
    );

    return res.status(201).json({ success: true, message: "Message sent.", record: insertResult.rows[0] });
  } catch (error) {
    console.error("QUERY FOLLOWUP ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/queries/thread/:id/reply  (admin)
const replyToThread = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Reply message is required." });
    }

    const thread = await loadThreadById(pool, id);
    if (!thread) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    if (thread.status === "closed") {
      return res.status(400).json({ success: false, message: "This conversation is closed and cannot be reopened." });
    }

    const insertResult = await pool.query(
      `INSERT INTO query_messages (thread_id, sender_user_id, sender_role, body, is_admin_reply)
       VALUES ($1, $2, 'admin', $3, TRUE)
       RETURNING *`,
      [thread.id, req.user.id, message.trim()]
    );

    await pool.query(
      `UPDATE query_threads
       SET status = 'replied', replied_at = COALESCE(replied_at, NOW()), last_message_at = NOW()
       WHERE id = $1`,
      [thread.id]
    );

    // Official APEX-format in-app notification for the sender.
    const senderResult = await pool.query(
      `SELECT full_name, role FROM users WHERE id = $1`,
      [thread.sender_user_id]
    );
    const sender = senderResult.rows[0];
    if (sender) {
      const firstName = (sender.full_name || "there").trim().split(/\s+/)[0];
      const title = `Re: ${thread.subject}`;
      const body = `From: APEX\n\nDear ${firstName},\n\n${message.trim()}\n\nRegards,\nAPEX Team`;
      const linkUrl = `/${sender.role}/queries?thread=${thread.id}`;
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link_url)
         VALUES ($1, 'query_reply', $2, $3, $4)`,
        [thread.sender_user_id, title.slice(0, 200), body, linkUrl]
      );
    }

    return res.status(201).json({ success: true, message: "Reply sent. The sender has been notified.", record: insertResult.rows[0] });
  } catch (error) {
    console.error("QUERY REPLY ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// PATCH /api/queries/thread/:id/close  (admin)
const closeThread = async (req, res) => {
  try {
    const { id } = req.params;
    const thread = await loadThreadById(pool, id);
    if (!thread) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    if (thread.status === "closed") {
      return res.json({ success: true, message: "Conversation closed." });
    }

    await pool.query(
      `UPDATE query_threads
       SET status = 'closed', closed_at = NOW(), closed_by_user_id = $2
       WHERE id = $1`,
      [thread.id, req.user.id]
    );

    return res.json({ success: true, message: "Conversation closed." });
  } catch (error) {
    console.error("QUERY CLOSE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/queries/all  (admin)
const getAdminThreads = async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let where = "";
    if (status && ["open", "replied", "closed"].includes(status)) {
      params.push(status);
      where = `WHERE t.status = $1`;
    }
    const result = await pool.query(
      `${THREAD_LIST_SELECT}
       ${where}
       ORDER BY t.last_message_at DESC`,
      params
    );
    return res.json({ success: true, threads: result.rows });
  } catch (error) {
    console.error("QUERY ADMIN LIST ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  createThread,
  getMyThreads,
  getUnreadReplyCount,
  getThreadDetail,
  sendFollowUpMessage,
  replyToThread,
  closeThread,
  getAdminThreads,
};
