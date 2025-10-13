// routes/posts.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); // your Cloudinary config file

// ✅ Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { content, mood } = req.body;
    const userId = req.user.id; // from JWT middleware

    let imageUrl = null;

    // ✅ If image uploaded, upload to Cloudinary
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const uploadRes = await cloudinary.uploader.upload(dataURI, {
        folder: "posts",
      });

      imageUrl = uploadRes.secure_url;
    }

    // ✅ Create new post
    const newPost = new Post({
      userId, // references Profile model
      content,
      imageUrl,
      mood,
    });

    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "username name avatar")
      .populate("comments.userId", "username avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/like", auth, async (req, res) => {
  try {
    const userId = req.user.id; // from JWT
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const liked = post.likes.includes(userId);

    if (liked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ success: true, likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/comment", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { text } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ userId, text });
    await post.save();

    // Re-populate for returning fresh comment data
    await post.populate("comments.userId", "username avatar");

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/mood/:mood", async (req, res) => {
  try {
    const posts = await Post.find({ mood: req.params.mood })
      .populate("userId", "username name avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 🔹 Delete a post (only owner)
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Only the owner can delete
    if (post.userId.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    // Optionally delete image from Cloudinary
    if (post.imageUrl) {
      const publicId = post.imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`posts/${publicId}`);
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
