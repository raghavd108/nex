const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Post = require("../models/startuppost");
const Profile = require("../models/Profile");
const Startup = require("../models/Startup");
const auth = require("../middleware/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ===============================
   🟢 Create Startup Post
=============================== */
router.post("/:startupId", auth, upload.single("image"), async (req, res) => {
  try {
    const { content, mood } = req.body;
    const { startupId } = req.params;

    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const startup = await Startup.findById(startupId);
    if (!startup) return res.status(404).json({ message: "Startup not found" });

    let imageUrl = null;
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const uploadRes = await cloudinary.uploader.upload(dataURI, {
        folder: "startup_posts",
      });
      imageUrl = uploadRes.secure_url;
    }

    const newPost = new Post({
      userId: profile._id,
      startupId,
      content,
      imageUrl,
      mood,
    });

    await newPost.save();
    startup.posts.push(newPost._id);
    await startup.save();

    const populatedPost = await Post.findById(newPost._id)
      .populate("userId", "name avatar")
      .populate("startupId", "name logo");

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Error creating startup post:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   🟣 Get All Posts for a Startup
=============================== */
router.get("/:startupId", async (req, res) => {
  try {
    const posts = await Post.find({ startupId: req.params.startupId })
      .populate("userId", "username name avatar")
      .populate("startupId", "name logo")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching startup posts:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   🔵 Get All Startup Posts for Home Feed
=============================== */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({ startupId: { $exists: true } })
      .populate("userId", "username name avatar")
      .populate("startupId", "name logo")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching all startup posts:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   ❤️ Like or Unlike Post
=============================== */
router.put("/:postId/like", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const liked = post.likes.includes(profile._id);

    if (liked) {
      post.likes.pull(profile._id); // Unlike
    } else {
      post.likes.push(profile._id); // Like
    }

    await post.save();

    const updated = await Post.findById(req.params.postId)
      .populate("userId", "name avatar")
      .populate("startupId", "name logo");

    res.json(updated);
  } catch (err) {
    console.error("Error liking/unliking post:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   💬 Add Comment
=============================== */
router.post("/:postId/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = {
      userId: profile._id,
      text,
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    const updated = await Post.findById(req.params.postId)
      .populate("comments.userId", "name avatar")
      .populate("userId", "name avatar")
      .populate("startupId", "name logo");

    res.json(updated);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   🗑️ Delete Post (only owner)
=============================== */
router.delete("/:postId", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Only owner of the post can delete
    if (post.userId.toString() !== profile._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Post.findByIdAndDelete(req.params.postId);

    // Remove from startup.posts array
    await Startup.updateMany({}, { $pull: { posts: post._id } });

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
