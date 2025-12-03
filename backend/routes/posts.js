const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const Profile = require("../models/Profile");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); // Cloudinary config

// ✅ Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------------- CREATE POST ----------------------
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { content } = req.body;

    // Get the user's Profile (Post references Profile)
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

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
      userId: profile._id, // reference Profile
      content,
      imageUrl,
    });

    await newPost.save();

    const populatedPost = await Post.findById(newPost._id)
      .populate("userId", "username name avatar")
      .populate("comments.userId", "username avatar");

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- GET ALL POSTS ----------------------
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({ startupId: { $exists: false } }) // ✅ only user posts
      .populate("userId", "name avatar username")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- GET POST BY ID ----------------------
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("userId", "username name avatar")
      .populate("comments.userId", "username avatar");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- LIKE POST ----------------------

router.put("/:id/like", auth, async (req, res) => {
  try {
    // Get profile id (we store profile._id in post.userId and in likes)
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const profileId = profile._id;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if profileId already in likes (compare strings)
    const alreadyLiked = post.likes.some(
      (l) => l.toString() === profileId.toString()
    );

    if (alreadyLiked) {
      // remove like
      post.likes = post.likes.filter(
        (l) => l.toString() !== profileId.toString()
      );
    } else {
      // add like
      post.likes.push(profileId);
    }

    await post.save();

    // Return the updated likes array (so frontend can replace it)
    res.json({ success: true, likes: post.likes });
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- COMMENT ON POST ----------------------
router.post("/:id/comment", auth, async (req, res) => {
  const userId = req.user.id;
  const { text } = req.body;

  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  post.comments.push({ userId, text });
  await post.save();
  await post.populate("comments.userId", "username avatar");

  res.json(post);
});

// ---------------------- DELETE POST ----------------------
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Only owner can delete
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile || post.userId.toString() !== profile._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    // Delete image from Cloudinary if exists
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

// ---------------------- GET POSTS BY USERNAME ----------------------
router.get("/user/:username", async (req, res) => {
  try {
    // Find profile by username
    const profile = await Profile.findOne({ username: req.params.username });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const posts = await Post.find({ userId: profile._id })
      .populate("userId", "username name avatar")
      .populate("comments.userId", "username avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
