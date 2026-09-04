const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const generateProjectId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `APX-${date}-${suffix}`;
};

const resolveCategoryIds = async (client, categories) => {
  const categoryIds = [];

  for (const category of categories) {
    const name = String(category).trim();
    const slug = slugify(name);

    const result = await client.query(
      `SELECT id, name, slug
       FROM categories
       WHERE slug = $1 OR LOWER(name) = LOWER($2)
       LIMIT 1`,
      [slug, name]
    );

    if (result.rows.length === 0) {
      const created = await client.query(
        `INSERT INTO categories (name, slug, description, sort_order)
         VALUES ($1, $2, NULL, 0)
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name
         RETURNING id`,
        [name, slug]
      );
      categoryIds.push(created.rows[0].id);
      continue;
    }

    categoryIds.push(result.rows[0].id);
  }

  return [...new Set(categoryIds)];
};

const resolveMemberUsers = async (client, teamMembers, creatorId) => {
  const emails = normalizeList(teamMembers);
  if (emails.length === 0) return [];

  const uniqueEmails = [...new Set(emails.map((email) => email.toLowerCase()))];
  if (uniqueEmails.length + 1 > 5) {
    throw new Error("A project can contain up to 5 students.");
  }

  const members = [];
  for (const email of uniqueEmails) {
    const result = await client.query(
      `SELECT id, role, full_name, email
       FROM users
       WHERE LOWER(email) = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error(`Team member not found: ${email}`);
    }

    const user = result.rows[0];
    if (user.id === creatorId) continue;
    if (user.role !== "student") {
      throw new Error(`Team member must be a student account: ${email}`);
    }

    members.push(user);
  }

  return members;
};

const syncProjectRelations = async (client, projectId, categories, teamMembers, creatorId, replaceMembers = false) => {
  const categoryIds = await resolveCategoryIds(client, categories);

  await client.query("DELETE FROM project_categories WHERE project_id = $1", [projectId]);
  for (let i = 0; i < categoryIds.length; i += 1) {
    await client.query(
      `INSERT INTO project_categories (project_id, category_id, is_primary)
       VALUES ($1, $2, $3)`,
      [projectId, categoryIds[i], i === 0]
    );
  }

  if (replaceMembers) {
    await client.query(
      `DELETE FROM project_members
       WHERE project_id = $1 AND member_role <> 'owner'`,
      [projectId]
    );
  }

  const members = await resolveMemberUsers(client, teamMembers, creatorId);

  if (!replaceMembers) {
    await client.query(
      `DELETE FROM project_members
       WHERE project_id = $1`,
      [projectId]
    );
  }

  await client.query(
    `INSERT INTO project_members (project_id, user_id, member_role, is_primary)
     VALUES ($1, $2, 'owner', TRUE)
     ON CONFLICT (project_id, user_id) DO UPDATE
     SET member_role = EXCLUDED.member_role, is_primary = EXCLUDED.is_primary`,
    [projectId, creatorId]
  );

  for (const member of members) {
    await client.query(
      `INSERT INTO project_members (project_id, user_id, member_role, is_primary)
       VALUES ($1, $2, 'member', FALSE)
       ON CONFLICT (project_id, user_id) DO UPDATE
       SET member_role = EXCLUDED.member_role, is_primary = EXCLUDED.is_primary`,
      [projectId, member.id]
    );
  }
};

const loadProjectById = async (client, projectId, includeFiles = false) => {
  const result = await client.query(
    `SELECT
       p.id,
       p.project_id,
       p.title,
       p.slug,
       p.problem_statement,
       p.solution,
       p.description,
       p.abstract,
       p.technologies,
       p.tags,
       p.github_link,
       p.demo_link,
       p.status,
       p.is_featured,
       p.is_public,
       p.review_notes,
       p.approved_at,
       p.created_at,
       p.updated_at,
       creator.id AS creator_id,
       creator.full_name AS creator_name,
       creator.email AS creator_email,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'id', c.id,
               'name', c.name,
               'slug', c.slug
             ) ORDER BY pc.is_primary DESC, c.sort_order, c.name
           )
           FROM project_categories pc
           JOIN categories c ON c.id = pc.category_id
           WHERE pc.project_id = p.id
         ),
         '[]'::json
       ) AS categories,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'id', u.id,
               'full_name', u.full_name,
               'email', u.email,
               'member_role', pm.member_role,
               'is_primary', pm.is_primary
             ) ORDER BY pm.is_primary DESC, u.full_name
           )
           FROM project_members pm
           JOIN users u ON u.id = pm.user_id
           WHERE pm.project_id = p.id
         ),
         '[]'::json
       ) AS members
     FROM projects p
     JOIN users creator ON creator.id = p.created_by_user_id
     WHERE p.id = $1`,
    [projectId]
  );

  if (result.rows.length === 0) return null;

  const project = result.rows[0];

  if (includeFiles) {
    const filesResult = await client.query(
      `SELECT id, project_id, file_name, original_name, file_type, file_size, file_path, uploaded_at
       FROM project_files
       WHERE project_id = $1
       ORDER BY uploaded_at DESC`,
      [projectId]
    );
    project.files = filesResult.rows;
  }

  return project;
};

const getPublicProjects = async (req, res) => {
  try {
    const { q = "", category = "", page = "1", limit = "12", featured } = req.query;
    const offset = (Math.max(Number(page) || 1, 1) - 1) * Math.min(Math.max(Number(limit) || 12, 1), 48);
    const search = `%${String(q).trim()}%`;
    const categoryValue = String(category).trim();
    const featuredOnly = featured === "true";

    // Public visitors: only see approved AND is_public projects
    // Verified users: see all approved projects
    const isVerifiedUser = req.user && req.user.email_verified === true;

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
          p.is_featured,
          p.is_public,
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
        WHERE p.status = 'approved'
          AND ($1 = TRUE OR p.is_public = TRUE)
          AND (${featuredOnly ? "p.is_featured = TRUE" : "TRUE"})
          AND (
            $2 = ''
            OR p.title ILIKE $3
            OR COALESCE(p.abstract, '') ILIKE $3
            OR COALESCE(p.problem_statement, '') ILIKE $3
            OR COALESCE(p.solution, '') ILIKE $3
          )
          AND (
            $4 = ''
            OR EXISTS (
              SELECT 1
              FROM project_categories pc
              JOIN categories c ON c.id = pc.category_id
              WHERE pc.project_id = p.id AND c.slug = $4
            )
          )
        ORDER BY p.created_at DESC
        LIMIT $5 OFFSET $6`,
      [isVerifiedUser, String(q).trim(), search, categoryValue, Math.min(Math.max(Number(limit) || 12, 1), 48), offset]
    );

    return res.status(200).json({ success: true, projects: result.rows });
  } catch (error) {
    console.error("PUBLIC PROJECTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const searchProjects = async (req, res) => getPublicProjects(req, res);

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT id, status, is_public, created_by_user_id FROM projects WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const project = result.rows[0];
    if (project.status !== "approved") {
      const isStaff = req.user && ["admin", "manager"].includes(req.user.role);
      const isOwner = req.user && project.created_by_user_id === req.user.id;

      if (!isStaff && !isOwner) {
        return res.status(404).json({ success: false, message: "Project not found." });
      }
    } else if (!project.is_public) {
      // Approved but not public: only verified users, staff, or owner can view
      const isVerified = req.user && req.user.email_verified === true;
      const isStaff = req.user && ["admin", "manager"].includes(req.user.role);
      const isOwner = req.user && project.created_by_user_id === req.user.id;

      if (!isVerified && !isStaff && !isOwner) {
        return res.status(404).json({ success: false, message: "Project not found." });
      }
    }

    const detailed = await loadProjectById(pool, project.id, true);
    return res.status(200).json({ success: true, project: detailed });
  } catch (error) {
    console.error("PROJECT DETAIL ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const getProjectForManagement = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await loadProjectById(pool, id, true);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const isOwner = project.creator_id === req.user.id;
    const isStaff = ["admin", "manager"].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: "You do not have access to this project." });
    }

    return res.status(200).json({ success: true, project });
  } catch (error) {
    console.error("PROJECT MANAGEMENT ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id
       FROM projects p
       WHERE p.created_by_user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    const projects = [];
    for (const row of result.rows) {
      const project = await loadProjectById(pool, row.id, false);
      if (project) projects.push(project);
    }

    return res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("MY PROJECTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const createProject = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      title,
      categories,
      problem_statement,
      solution,
      description,
      abstract,
      technologies,
      github_link,
      demo_link,
      tags,
      team_members,
      status: requestedStatus,
    } = req.body;

    const titleValue = String(title || "").trim();
    const categoryValues = normalizeList(categories);

    if (!titleValue || categoryValues.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Project title and at least one category are required.",
      });
    }

    const projectStatus = requestedStatus === "draft" ? "draft" : "pending";
    const projectId = generateProjectId();
    const baseSlug = slugify(titleValue) || `project-${projectId.toLowerCase()}`;
    const uniqueSuffix = crypto.randomBytes(3).toString("hex").toLowerCase();
    const slug = `${baseSlug}-${uniqueSuffix}`;

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO projects
       (project_id, title, slug, problem_statement, solution, description, abstract, technologies, github_link, demo_link, tags, status, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10, $11::text[], $12::VARCHAR(30), $13)
       RETURNING id`,
      [
        projectId,
        titleValue,
        slug,
        problem_statement || null,
        solution || null,
        description || abstract || null,
        abstract || null,
        normalizeList(technologies),
        github_link || null,
        demo_link || null,
        normalizeList(tags),
        projectStatus,
        req.user.id,
      ]
    );

    const projectDbId = result.rows[0].id;
    await syncProjectRelations(client, projectDbId, categoryValues, team_members, req.user.id, false);

    await client.query("COMMIT");

    const project = await loadProjectById(pool, projectDbId, true);

    return res.status(201).json({
      success: true,
      message: projectStatus === "draft"
        ? "Project saved as draft."
        : "Project created successfully.",
      project,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PROJECT CREATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  } finally {
    client.release();
  }
};

const updateProject = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const existing = await client.query(
      `SELECT id, created_by_user_id, status
       FROM projects
       WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const project = existing.rows[0];
    const isOwner = project.created_by_user_id === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "You do not have permission to update this project." });
    }

    const {
      title,
      categories,
      problem_statement,
      solution,
      description,
      abstract,
      technologies,
      github_link,
      demo_link,
      tags,
      team_members,
    } = req.body;

    const titleValue = String(title || "").trim();
    const categoryValues = normalizeList(categories);

    if (!titleValue || categoryValues.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Project title and at least one category are required.",
      });
    }

    await client.query("BEGIN");

    const baseSlug = slugify(titleValue) || `project-${id}`;
    const uniqueSuffix = crypto.randomBytes(3).toString("hex").toLowerCase();

    await client.query(
      `UPDATE projects
       SET title = $1,
           slug = $2,
           problem_statement = $3,
           solution = $4,
           description = $5,
           abstract = $6,
           technologies = $7::text[],
           github_link = $8,
           demo_link = $9,
           tags = $10::text[],
           status = $12::VARCHAR(30),
           reviewed_by_user_id = NULL,
           review_notes = NULL,
           approved_at = NULL,
           updated_at = NOW()
       WHERE id = $11`,
      [
        titleValue,
        `${baseSlug}-${uniqueSuffix}`,
        problem_statement || null,
        solution || null,
        description || abstract || null,
        abstract || null,
        normalizeList(technologies),
        github_link || null,
        demo_link || null,
        normalizeList(tags),
        id,
        req.body.status === "draft" && project.status === "draft" ? "draft" : "pending",
      ]
    );

    await syncProjectRelations(client, id, categoryValues, team_members, project.created_by_user_id, true);

    await client.query("COMMIT");

    const updated = await loadProjectById(pool, id, true);
    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      project: updated,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PROJECT UPDATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  } finally {
    client.release();
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(
      `SELECT id, created_by_user_id, title
       FROM projects
       WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const project = existing.rows[0];
    const isOwner = project.created_by_user_id === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "You do not have permission to delete this project." });
    }

    const deleteNotification = async (userId, projectTitle) => {
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, link_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            userId,
            "project-deleted",
            "Project Deleted",
            `Dear Student,\n\nYour project "${projectTitle}" has been deleted.\n\nIf you did not request this deletion, please contact the APEX support team.\n\nRegards,\nAPEX Team`,
            null,
          ]
        );
      } catch (e) {
        console.error("DELETE NOTIFICATION ERROR:", e);
      }
    };

    const memberResult = await pool.query(
      `SELECT user_id FROM project_members WHERE project_id = $1`,
      [id]
    );

    for (const member of memberResult.rows) {
      await deleteNotification(member.user_id, project.title);
    }

    const filesResult = await pool.query(
      `SELECT file_path FROM project_files WHERE project_id = $1`,
      [id]
    );

    await pool.query("DELETE FROM projects WHERE id = $1", [id]);

    for (const row of filesResult.rows) {
      const filePath = path.isAbsolute(row.file_path)
        ? row.file_path
        : path.join(__dirname, "..", row.file_path);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return res.status(200).json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    console.error("PROJECT DELETE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const reviewProject = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!["approved", "rejected", "needs_changes"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid review status." });
    }

    await client.query("BEGIN");

    const projectResult = await client.query(
      `SELECT id, created_by_user_id FROM projects WHERE id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    await client.query(
      `UPDATE projects
       SET status = $1::VARCHAR(30),
           reviewed_by_user_id = $2,
           review_notes = $3,
           approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE id = $4`,
      [status, req.user.id, notes || null, id]
    );

    await client.query(
      `INSERT INTO project_reviews (project_id, reviewer_user_id, status, notes)
       VALUES ($1, $2, $3, $4)`,
      [id, req.user.id, status, notes || null]
    );

    const memberResult = await client.query(
      `SELECT user_id FROM project_members WHERE project_id = $1`,
      [id]
    );

    const projectTitle = (await client.query(`SELECT title FROM projects WHERE id = $1`, [id])).rows[0]?.title || "Your project";

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

    for (const member of memberResult.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, link_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          member.user_id,
          "project-review",
          template.title,
          template.message,
          `/student/project/${id}`,
        ]
      );
    }

    await client.query("COMMIT");

    const updated = await loadProjectById(pool, id, true);
    return res.status(200).json({
      success: true,
      message: `Project ${status} successfully.`,
      project: updated,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PROJECT REVIEW ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  } finally {
    client.release();
  }
};

module.exports = {
  createProject,
  getMyProjects,
  getPublicProjects,
  searchProjects,
  getProjectById,
  getProjectForManagement,
  updateProject,
  deleteProject,
  reviewProject,
  loadProjectById,
};
