const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  uploadProjectFile,
  getProjectFiles,
  deleteProjectFile,
} = require("../controllers/projectFileController");

router.post("/upload", authMiddleware, upload.single("file"), uploadProjectFile);

router.get("/:project_id", getProjectFiles);

router.delete("/:id", authMiddleware, deleteProjectFile);

module.exports = router;
