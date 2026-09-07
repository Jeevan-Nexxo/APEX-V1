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

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authMiddleware(req, res, next);
  }
  req.user = null;
  next();
};

router.get("/", optionalAuth, getPublicProjects);
router.get("/search", optionalAuth, searchProjects);
router.get("/mine", authMiddleware, getMyProjects);
router.get("/manage/:id", authMiddleware, getProjectForManagement);
router.post("/", authMiddleware, roleMiddleware("student", "admin"), createProject);
router.get("/:id", optionalAuth, getProjectById);
router.put("/:id", authMiddleware, updateProject);
router.delete("/:id", authMiddleware, deleteProject);
router.post("/:id/review", authMiddleware, roleMiddleware("admin"), reviewProject);

module.exports = router;
