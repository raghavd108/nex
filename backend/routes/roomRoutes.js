const express = require("express");
const router = express.Router();
const {
  createRoom,
  getRooms,
  joinRoom,
} = require("../controllers/roomController");
const authMiddleware = require("../middleware/authMiddleware");

// Create a room
router.post("/", authMiddleware, createRoom);

// Get all public rooms
router.get("/", getRooms);

// Join a room by roomId
router.post("/:roomId/join", authMiddleware, joinRoom);

module.exports = router;
