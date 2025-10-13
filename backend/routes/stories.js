const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Story = require("../models/Story");

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get user's profile first
const Profile = require("../models/Profile");

router.post("/story", auth, upload.single("story"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    // Upload to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const uploadRes = await cloudinary.uploader.upload(dataURI, {
      folder: "stories",
    });

    // Set expiration: 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newStory = new Story({
      userId: profile._id, // ✅ reference Profile
      imageUrl: uploadRes.secure_url,
      expiresAt,
    });

    await newStory.save();

    res.status(201).json(newStory);
  } catch (err) {
    console.error("Error creating story:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Get active stories
router.get("/story", async (req, res) => {
  try {
    const now = new Date();
    const stories = await Story.find({ expiresAt: { $gt: now } })
      .populate("userId", "username name avatar")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Delete a story manually (only owner)
router.delete("/story/:id", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    // Only the owner can delete
    if (story.userId.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    // Optionally delete from Cloudinary as well
    const publicId = story.imageUrl.split("/").pop().split(".")[0]; // crude extraction
    await cloudinary.uploader.destroy(`stories/${publicId}`);

    await story.deleteOne();
    res.json({ message: "Story deleted successfully" });
  } catch (err) {
    console.error("Error deleting story:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Cleanup expired stories (optional cron/manual)
router.delete("/story/cleanup", async (req, res) => {
  try {
    const now = new Date();
    const deleted = await Story.deleteMany({ expiresAt: { $lte: now } });
    res.json({ deletedCount: deleted.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
