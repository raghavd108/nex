const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Protected Routes
router.get("/me", auth, profileController.getProfile);
router.put("/me", auth, profileController.updateProfile);
router.post(
  "/me/photo",
  auth,
  upload.single("photo"),
  profileController.uploadPhoto
);

module.exports = router;
