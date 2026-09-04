const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/platform-settings", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT key, value FROM platform_settings ORDER BY key ASC`
    );

    const settings = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    return res.json({ success: true, settings });
  } catch (error) {
    console.error("PUBLIC PLATFORM SETTINGS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/team", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, role, qualification, email, phone, photo_url, social_media
       FROM team_members
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, name ASC`
    );

    return res.json({ success: true, team: result.rows });
  } catch (error) {
    console.error("PUBLIC TEAM ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/team-home", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, role, qualification, email, phone, photo_url, social_media
       FROM team_members
       WHERE is_active = TRUE AND show_on_homepage = TRUE
       ORDER BY sort_order ASC, name ASC`
    );

    return res.json({ success: true, team: result.rows });
  } catch (error) {
    console.error("PUBLIC TEAM HOME ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/featured-projects", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          p.id,
          p.project_id,
          p.title,
          p.abstract AS description,
          p.problem_statement,
          p.solution,
          p.abstract,
          p.status,
          p.created_at,
          p.updated_at,
          creator.full_name AS creator_name,
          creator.role AS creator_role,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
                ORDER BY pc.is_primary DESC, c.sort_order, c.name
              )
              FROM project_categories pc
              JOIN categories c ON c.id = pc.category_id
              WHERE pc.project_id = p.id
            ),
            '[]'::json
          ) AS categories,
          (
            SELECT COUNT(*)::int
            FROM project_members pm
            WHERE pm.project_id = p.id
          ) AS member_count
        FROM projects p
        JOIN users creator ON creator.id = p.created_by_user_id
        WHERE p.status = 'approved' AND p.is_featured = TRUE
        ORDER BY p.approved_at DESC NULLS LAST, p.created_at DESC
        LIMIT 6`
    );

    return res.json({ success: true, projects: result.rows });
  } catch (error) {
    console.error("PUBLIC FEATURED PROJECTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
