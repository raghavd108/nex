const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/me", auth, profileController.getProfile);

router.put("/me", auth, profileController.updateProfile);

router.post(
  "/me/photo",
  auth,
  upload.single("photo"),
  profileController.uploadPhoto
);

router.get("/search", auth, profileController.searchProfiles);

router.get("/:username", auth, profileController.getProfileByUsername);

module.exports = router;
