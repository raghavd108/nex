const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");

// ✅ Multer setup (use memory storage so no local files are saved)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔒 Protected Routes
router.get("/me", auth, profileController.getProfile);
router.put("/me", auth, profileController.updateProfile);

// ✅ Upload photo (buffer passed to controller → Cloudinary)
router.post(
  "/me/photo",
  auth,
  upload.single("photo"),
  profileController.uploadPhoto
);

module.exports = router;
