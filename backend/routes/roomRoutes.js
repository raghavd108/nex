const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  createRoom,
  getRooms,
  joinRoom,
} = require("../controllers/roomController");

const authMiddleware = require("../middleware/authMiddleware");

// ✅ Multer memory storage for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Create a room (with optional image upload)
router.post("/", authMiddleware, upload.single("image"), createRoom);

// ✅ Get all public rooms
router.get("/", getRooms);

// ✅ Join a room by ID
router.post("/:roomId/join", authMiddleware, joinRoom);

module.exports = router;
