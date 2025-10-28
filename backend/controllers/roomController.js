const Room = require("../models/Room");
const cloudinary = require("../config/cloudinary");

// ✅ Create Room with optional image upload
exports.createRoom = async (req, res) => {
  try {
    const { name, topic, type } = req.body;
    let imageUrl = "";

    if (!name || !topic) {
      return res.status(400).json({ message: "Name and topic are required" });
    }

    // ✅ Upload to Cloudinary if image provided
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload_stream(
        { folder: "nex_rooms" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ message: "Image upload failed" });
          }

          const room = new Room({
            name,
            topic,
            type,
            image: result.secure_url,
            createdBy: req.user.id,
            participants: [req.user.id],
          });

          await room.save();
          const populated = await Room.findById(room._id)
            .populate("createdBy", "name avatar")
            .populate("participants", "name avatar");

          res.status(201).json(populated);
        }
      );

      // Pipe image buffer to Cloudinary
      req.file.stream.pipe(uploadResult);
    } else {
      const room = new Room({
        name,
        topic,
        type,
        createdBy: req.user.id,
        participants: [req.user.id],
      });

      await room.save();
      const populated = await Room.findById(room._id)
        .populate("createdBy", "name avatar")
        .populate("participants", "name avatar");

      res.status(201).json(populated);
    }
  } catch (err) {
    console.error("Create room error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get Rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ type: "public" })
      .populate("createdBy", "name avatar")
      .populate("participants", "name avatar");
    res.json(rooms);
  } catch (err) {
    console.error("Get rooms error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Join Room
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ message: "Unauthorized: User not found" });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (!room.participants.includes(userId)) {
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
