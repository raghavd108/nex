const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const startupController = require("../controllers/startupController");

// Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create new startup
router.post("/", auth, startupController.createStartup);

// Update existing startup
router.put("/:id", auth, startupController.updateStartup);

// Upload / update logo
router.post(
  "/:id/logo",
  auth,
  upload.single("logo"),
  startupController.uploadLogo
);

// Upload pitch deck (single file)
router.post(
  "/:id/pitchdeck",
  auth,
  upload.single("pitchDeck"),
  startupController.uploadPitchDeck
);

// Add / remove team members
router.post("/:id/team", auth, startupController.addTeamMember);
router.delete("/:id/team/:memberId", auth, startupController.removeTeamMember);

// Follow / unfollow
router.post("/:id/follow", auth, startupController.toggleFollow);

// Get startups
router.get("/", auth, startupController.getAllStartups);
router.get("/founder/:profileId", auth, startupController.getStartupsByFounder);
router.get("/:id", auth, startupController.getStartupById);

module.exports = router;
