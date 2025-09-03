// routes/likeRoutes.js
const express = require("express");
const Like = require("../models/Like");
const Profile = require("../models/Profile");
const router = express.Router();

// ✅ POST /api/likes/like - Save a like
router.post("/like", async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;

    // ✅ Optional validation (e.g., check not liking self)
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ error: "User IDs are required" });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ error: "Cannot like yourself" });
    }

    // ✅ Save like
    const like = await Like.create({ fromUserId, toUserId });
    res.status(201).json(like);
  } catch (err) {
    console.error("❌ Error saving like:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET /api/likes/:userId - Get liked profiles
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Step 1: Find all likes by this user
    const likes = await Like.find({ fromUserId: userId });

    // Step 2: Extract all liked userIds
    const likedUserIds = likes.map((like) => like.toUserId);

    // Step 3: Fetch corresponding profiles
    const profiles = await Profile.find({ userId: { $in: likedUserIds } });

    res.json(profiles); // ✅ Return profiles directly
  } catch (err) {
    console.error("❌ Error fetching liked profiles:", err);
    res.status(500).json({ error: "Failed to get liked profiles" });
  }
});

module.exports = router;
