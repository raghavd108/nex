const Room = require("../models/Room");

// Create a new room
exports.createRoom = async (req, res) => {
  try {
    const { name, topic, type } = req.body;

    if (!name || !topic) {
      return res.status(400).json({ message: "Name and topic are required" });
    }

    const room = new Room({
      name,
      topic,
      type,
      createdBy: req.user.id,
      participants: [req.user.id],
    });

    await room.save();
    const populatedRoom = await Room.findById(room._id)
      .populate("createdBy", "name avatar")
      .populate("participants", "name avatar");

    res.status(201).json(populatedRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all public rooms (for Explore page)
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ type: "public" })
      .populate("createdBy", "name avatar")
      .populate("participants", "name avatar");
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Join a room
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const room = await Room.findById(roomId);

    if (!room) return res.status(404).json({ message: "Room not found" });

    // Only add if not already joined
    const userId = req.user.id.toString();
    if (!room.participants.some((p) => p.toString() === userId)) {
      room.participants.push(userId);
      await room.save();
    }

    const populatedRoom = await Room.findById(room._id)
      .populate("createdBy", "name avatar")
      .populate("participants", "name avatar");

    res.json(populatedRoom);
  } catch (err) {
    console.error("Join room error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
