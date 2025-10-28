const Room = require("../models/Room");
const cloudinary = require("../config/cloudinary");

// ✅ Create Room (with optional Cloudinary image upload)
exports.createRoom = async (req, res) => {
  try {
    const { name, topic, type } = req.body;

    if (!name || !topic) {
      return res.status(400).json({ message: "Name and topic are required" });
    }

    let imageUrl = "";

    // ✅ If image is uploaded, upload to Cloudinary
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "nex_rooms" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer); // ✅ send buffer to Cloudinary
        });
        imageUrl = result.secure_url;
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    // ✅ Create room document
    const room = new Room({
      name,
      topic,
      type,
      image: imageUrl || "",
      createdBy: req.user.id,
      participants: [req.user.id],
    });

    await room.save();

    const populatedRoom = await Room.findById(room._id)
      .populate("createdBy", "name avatar")
      .populate("participants", "name avatar");

    res.status(201).json(populatedRoom);
  } catch (err) {
    console.error("Create room error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all public rooms
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

// ✅ Join a room
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ message: "Unauthorized: User not found" });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // ✅ Add user if not already in participants
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
