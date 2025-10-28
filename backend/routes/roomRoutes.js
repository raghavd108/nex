const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createRoom,
  getRooms,
  joinRoom,
} = require("../controllers/roomController");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Multer memory storage for Cloudinary uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Routes
router.post("/", authMiddleware, upload.single("image"), createRoom);
router.get("/", getRooms);
router.post("/:roomId/join", authMiddleware, joinRoom);

module.exports = router;
