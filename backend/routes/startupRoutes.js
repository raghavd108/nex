const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const startupController = require("../controllers/startupController");

// ✅ Use memory storage (no local file writes)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Create new startup profile
router.post("/", auth, startupController.createStartup);

// ✅ Update existing startup (only founder)
router.put("/:id", auth, startupController.updateStartup);

// ✅ Upload or update SINGLE startup logo
router.post(
  "/:id/logo",
  auth,
  upload.single("logo"),
  startupController.uploadLogo
);

// ✅ Upload MULTIPLE pitch decks
router.post(
  "/:id/pitchdeck",
  auth,
  upload.array("pitchDecks", 10), // up to 10 pitch decks
  startupController.uploadPitchDecks
);

// ✅ Add or remove team member
router.post("/:id/team", auth, startupController.addTeamMember);
router.delete("/:id/team/:memberId", auth, startupController.removeTeamMember);

// ✅ Follow or unfollow a startup
router.post("/:id/follow", auth, startupController.toggleFollow);

// 🔍 Get all public startups (filtered)
router.get("/", auth, startupController.getAllStartups);

// 👤 Get startups by founder
router.get("/founder/:profileId", auth, startupController.getStartupsByFounder);

// 🔎 Get single startup by ID
router.get("/:id", auth, startupController.getStartupById);

module.exports = router;
