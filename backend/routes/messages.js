const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// 📌 Get all messages between two users
router.get("/:userId/:otherUserId", async (req, res) => {
  const { userId, otherUserId } = req.params;
  try {
    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!conversation) {
      return res.json([]); // No chat yet
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// 📌 Send message (REST fallback)
router.post("/", async (req, res) => {
  const { fromUserId, toUserId, content } = req.body;
  if (!fromUserId || !toUserId || !content) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // Ensure conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [fromUserId, toUserId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [fromUserId, toUserId],
      });
      await conversation.save();
    }

    const newMessage = new Message({
      conversationId: conversation._id,
      fromUserId,
      toUserId,
      content,
    });

    await newMessage.save();
    res.json(newMessage);
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
