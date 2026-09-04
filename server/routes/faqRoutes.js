const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const ensureAdmin = [authMiddleware, roleMiddleware("admin")];

// Public: Get all active FAQ categories with items
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fc.id, fc.title, fc.description, fc.sort_order,
              COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'id', fi.id,
                      'question', fi.question,
                      'answer', fi.answer,
                      'sort_order', fi.sort_order
                    ) ORDER BY fi.sort_order ASC, fi.id ASC
                  )
                  FROM faq_items fi
                  WHERE fi.category_id = fc.id AND fi.is_active = TRUE
                ),
                '[]'::json
              ) AS items
       FROM faq_categories fc
       WHERE fc.is_active = TRUE
       ORDER BY fc.sort_order ASC, fc.id ASC`
    );

    return res.json({ success: true, categories: result.rows });
  } catch (error) {
    console.error("FAQ LIST ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Admin: Create FAQ category
router.post("/categories", ...ensureAdmin, async (req, res) => {
  try {
    const { title, description, sort_order = 0 } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Category title is required." });
    }

    const result = await pool.query(
      `INSERT INTO faq_categories (title, description, sort_order)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [String(title).trim(), description?.trim() || null, Number(sort_order) || 0]
    );

    return res.status(201).json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error("FAQ CATEGORY CREATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Admin: Update FAQ category
router.put("/categories/:id", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, sort_order, is_active } = req.body;

    const result = await pool.query(
      `UPDATE faq_categories
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           sort_order = COALESCE($3, sort_order),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        title?.trim() || null,
        description?.trim() || null,
        typeof sort_order === "number" ? sort_order : null,
        typeof is_active === "boolean" ? is_active : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    return res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error("FAQ CATEGORY UPDATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Admin: Delete FAQ category
router.delete("/categories/:id", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM faq_categories WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    return res.json({ success: true, message: "Category deleted." });
  } catch (error) {
    console.error("FAQ CATEGORY DELETE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Admin: Create FAQ item
router.post("/items", ...ensureAdmin, async (req, res) => {
  try {
    const { category_id, question, answer, sort_order = 0 } = req.body;

    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ success: false, message: "Question and answer are required." });
    }

    const result = await pool.query(
      `INSERT INTO faq_items (category_id, question, answer, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [category_id || null, question.trim(), answer.trim(), Number(sort_order) || 0]
    );

    return res.status(201).json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error("FAQ ITEM CREATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Admin: Update FAQ item
router.put("/items/:id", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, question, answer, sort_order, is_active } = req.body;

    const result = await pool.query(
      `UPDATE faq_items
       SET category_id = COALESCE($1, category_id),
           question = COALESCE($2, question),
           answer = COALESCE($3, answer),
           sort_order = COALESCE($4, sort_order),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        category_id || null,
        question?.trim() || null,
        answer?.trim() || null,
        typeof sort_order === "number" ? sort_order : null,
        typeof is_active === "boolean" ? is_active : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    return res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error("FAQ ITEM UPDATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Admin: Delete FAQ item
router.delete("/items/:id", ...ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM faq_items WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    return res.json({ success: true, message: "Item deleted." });
  } catch (error) {
    console.error("FAQ ITEM DELETE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
