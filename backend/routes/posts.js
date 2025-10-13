const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); // your Cloudinary config file

// Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a new post
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { content, mood } = req.body;
    const userId = req.user.profileId; // profile _id stored in JWT middleware

    let imageUrl = null;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const uploadRes = await cloudinary.uploader.upload(dataURI, {
        folder: "posts",
      });

      imageUrl = uploadRes.secure_url;
    }

    const newPost = new Post({
      userId,
      content,
      imageUrl,
      mood,
    });

    await newPost.save();

    // Return post with populated user
    const populatedPost = await Post.findById(newPost._id)
      .populate("userId", "username name avatar")
      .populate("comments.userId", "username avatar");

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all posts
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

// GET a post by ID
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("userId", "username name avatar")
      .populate("comments.userId", "username avatar");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like/unlike a post
router.post("/:id/like", auth, async (req, res) => {
  try {
    const userId = req.user.profileId;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const liked = post.likes.includes(userId);

    if (liked) post.likes.pull(userId);
    else post.likes.push(userId);

    await post.save();
    res.json({ success: true, likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comment on a post
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const userId = req.user.profileId;
    const { text } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ userId, text });
    await post.save();

    await post.populate("comments.userId", "username avatar");
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get posts by mood
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

// Delete a post (only owner)
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.userId.toString() !== req.user.profileId)
      return res.status(403).json({ message: "Unauthorized" });

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
