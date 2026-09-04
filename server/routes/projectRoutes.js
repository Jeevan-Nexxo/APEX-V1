const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createProject,
  getMyProjects,
  getPublicProjects,
  searchProjects,
  getProjectById,
  getProjectForManagement,
  updateProject,
  deleteProject,
  reviewProject,
} = require("../controllers/projectController");

router.get("/", getPublicProjects);
router.get("/search", searchProjects);
router.get("/mine", authMiddleware, getMyProjects);
router.get("/manage/:id", authMiddleware, getProjectForManagement);
router.post("/", authMiddleware, roleMiddleware("student", "admin"), createProject);
router.get("/:id", (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authMiddleware(req, res, next);
  }
  req.user = null;
  next();
}, getProjectById);
router.put("/:id", authMiddleware, updateProject);
router.delete("/:id", authMiddleware, deleteProject);
router.post("/:id/review", authMiddleware, roleMiddleware("admin"), reviewProject);

module.exports = router;
