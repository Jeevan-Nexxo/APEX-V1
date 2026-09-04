const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", async (req, res) => {
  try {
    const { homepage } = req.query;
    const homepageOnly = homepage === "true";

    const result = await pool.query(
      `SELECT c.id, c.name, c.slug, c.description, c.is_active, c.sort_order, c.show_on_homepage, c.icon_path,
              COALESCE(p.project_count, 0)::int AS project_count
       FROM categories c
       LEFT JOIN (
         SELECT pc.category_id, COUNT(*) AS project_count
         FROM project_categories pc
         JOIN projects p ON p.id = pc.project_id
         WHERE p.status = 'approved'
         GROUP BY pc.category_id
       ) p ON p.category_id = c.id
       WHERE c.is_active = TRUE
         ${homepageOnly ? "AND c.show_on_homepage = TRUE" : ""}
       ORDER BY c.sort_order ASC, c.name ASC`
    );

    return res.json({ success: true, categories: result.rows });
  } catch (error) {
    console.error("CATEGORY LIST ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.post("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { name, description, sort_order = 0 } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required." });
    }

    const slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const result = await pool.query(
      `INSERT INTO categories (name, slug, description, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [String(name).trim(), slug, description || null, Number(sort_order) || 0]
    );

    return res.status(201).json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error("CATEGORY CREATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.put("/:id", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active, sort_order, show_on_homepage } = req.body;
    const slug = name
      ? String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      : undefined;

    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active),
           sort_order = COALESCE($5, sort_order),
           show_on_homepage = COALESCE($6, show_on_homepage),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name || null, slug || null, description || null, typeof is_active === "boolean" ? is_active : null, typeof sort_order === "number" ? sort_order : null, typeof show_on_homepage === "boolean" ? show_on_homepage : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    return res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error("CATEGORY UPDATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.delete("/:id", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM project_categories WHERE category_id = $1`,
      [id]
    );
    const projectCount = countResult.rows[0].count;

    if (projectCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete category: it is assigned to ${projectCount} project(s). Remove it from all projects first.`,
        projectCount,
      });
    }

    const result = await pool.query(`DELETE FROM categories WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    return res.json({ success: true, message: "Category deleted successfully." });
  } catch (error) {
    console.error("CATEGORY DELETE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
