const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { loadProjectById } = require("./projectController");

const detectFileKind = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf" || mimeType.includes("msword") || mimeType.includes("officedocument")) {
    return "document";
  }
  return "other";
};

const canAccessProject = (project, user) => {
  if (!project) return false;
  if (project.status === "approved") return true;
  if (!user) return false;
  if (project.creator_id === user.id || user.role === "admin") return true;
  return Array.isArray(project.members) && project.members.some((member) => member.id === user.id);
};

const isProjectMember = (project, user) => {
  if (!project || !user) return false;
  if (project.creator_id === user.id || user.role === "admin") return true;
  return Array.isArray(project.members) && project.members.some((member) => member.id === user.id);
};

const MAX_FILES_PER_PROJECT = 3;
const MAX_TOTAL_BYTES = 1024 * 1024;

const uploadProjectFile = async (req, res) => {
  try {
    const { project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({ success: false, message: "Project ID is required." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const project = await loadProjectById(pool, project_id, false);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (!isProjectMember(project, req.user)) {
      return res.status(403).json({ success: false, message: "You do not have permission to upload files for this project." });
    }

    // Check file count limit
    const fileCountResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM project_files WHERE project_id = $1`,
      [project_id]
    );

    if (fileCountResult.rows[0].count >= MAX_FILES_PER_PROJECT) {
      return res.status(400).json({
        success: false,
        message: `You can upload a maximum of ${MAX_FILES_PER_PROJECT} files per project.`,
      });
    }

    // Check combined size limit
    const totalSizeResult = await pool.query(
      `SELECT COALESCE(SUM(file_size), 0)::bigint AS total FROM project_files WHERE project_id = $1`,
      [project_id]
    );

    const currentTotal = Number(totalSizeResult.rows[0].total || 0);
    const newTotal = currentTotal + req.file.size;

    if (newTotal > MAX_TOTAL_BYTES) {
      return res.status(400).json({
        success: false,
        message: `Total file size for the project exceeds the 1 MB limit. Current usage: ${(currentTotal / 1024).toFixed(1)} KB. This file would exceed the limit.`,
      });
    }

    const filePath = path.join("uploads", "projects", req.file.filename).replace(/\\/g, "/");

    const result = await pool.query(
      `INSERT INTO project_files
       (project_id, file_name, original_name, file_type, file_size, file_path)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        project_id,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        filePath,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully.",
      file: result.rows[0],
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const getProjectFiles = async (req, res) => {
  try {
    const { project_id } = req.params;
    const project = await loadProjectById(pool, project_id, false);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, message: "You do not have access to these files." });
    }

    const result = await pool.query(
      `SELECT *
       FROM project_files
       WHERE project_id = $1
       ORDER BY uploaded_at DESC`,
      [project_id]
    );

    return res.status(200).json({ success: true, files: result.rows });
  } catch (error) {
    console.error("GET FILES ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const deleteProjectFile = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT pf.*, p.created_by_user_id, p.status
       FROM project_files pf
       JOIN projects p ON p.id = pf.project_id
       WHERE pf.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "File not found." });
    }

    const file = result.rows[0];
    const isOwner = file.created_by_user_id === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "You do not have permission to delete this file." });
    }

    const filePath = path.isAbsolute(file.file_path)
      ? file.file_path
      : path.join(__dirname, "..", file.file_path);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query("DELETE FROM project_files WHERE id = $1", [id]);

    return res.status(200).json({ success: true, message: "File deleted successfully." });
  } catch (error) {
    console.error("DELETE FILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  uploadProjectFile,
  getProjectFiles,
  deleteProjectFile,
};
