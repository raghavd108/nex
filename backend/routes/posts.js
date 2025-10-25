const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Profile = require("../models/Profile");
const Startup = require("../models/Startup");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

// ================= MULTER CONFIG =================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// =================================================
//                  CREATE POST
// =================================================
router.post("/", auth, upload.array("media", 5), async (req, res) => {
  try {
    const { content, mood, ownerType, ownerId, postType } = req.body;

    // ✅ Validate ownerType
    if (!["user", "startup"].includes(ownerType)) {
      return res.status(400).json({ message: "Invalid ownerType" });
    }

    // ✅ Confirm that the logged-in user is allowed to post as this owner
    const userProfile = await Profile.findOne({ userId: req.user.id });
    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    let validOwner = null;

    if (ownerType === "user") {
      if (userProfile._id.toString() !== ownerId)
        return res
          .status(403)
          .json({ message: "Unauthorized to post as this user" });
      validOwner = userProfile;
    } else if (ownerType === "startup") {
      const startup = await Startup.findById(ownerId);
      if (!startup)
        return res.status(404).json({ message: "Startup not found" });

      if (startup.founderProfileId.toString() !== userProfile._id.toString())
        return res
          .status(403)
          .json({ message: "Unauthorized to post as this startup" });

      validOwner = startup;
    }

    // ✅ Upload media (if any)
    let media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const uploadRes = await cloudinary.uploader.upload(dataURI, {
          folder: "posts",
        });
        media.push({ url: uploadRes.secure_url });
      }
    }

    // ✅ Create post
    const newPost = new Post({
      ownerType,
      ownerId,
      content,
      mood: mood || null,
      media,
      postType:
        postType || (ownerType === "startup" ? "startup_update" : "personal"),
    });

    await newPost.save();

    const populatedPost = await Post.findById(newPost._id)
      .populate({
        path: "ownerId",
        model: ownerType === "user" ? "Profile" : "Startup",
        select: ownerType === "user" ? "username name avatar" : "name logo",
      })
      .populate("comments.userId", "username avatar");

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("❌ Error creating post:", err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================
//                  GET ALL POSTS
// =================================================
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("comments.userId", "username avatar")
      .populate({
        path: "ownerId",
        select: "username name avatar logo",
        populate: { path: "founderProfileId", select: "username name" },
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("❌ Error fetching posts:", err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================
//                  GET POST BY ID
// =================================================
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate({
        path: "ownerId",
        select: "username name avatar logo",
        populate: { path: "founderProfileId", select: "username name" },
      })
      .populate("comments.userId", "username avatar");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    console.error("❌ Error fetching post:", err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================
//                  LIKE POST
// =================================================
router.post("/:id/like", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    const post = await Post.findById(req.params.id);
    if (!post || !profile)
      return res.status(404).json({ message: "Not found" });

    const liked = post.likes.includes(profile._id);
    if (liked) post.likes.pull(profile._id);
    else post.likes.push(profile._id);

    await post.save();
    res.json({ success: true, likes: post.likes.length });
  } catch (err) {
    console.error("❌ Error liking post:", err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================
//                  COMMENT ON POST
// =================================================
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    const { text } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ userId: profile._id, text });
    await post.save();
    await post.populate("comments.userId", "username avatar");

    res.json(post);
  } catch (err) {
    console.error("❌ Error commenting on post:", err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================
//                  DELETE POST
// =================================================
router.delete("/:id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    let isOwner = false;

    if (
      post.ownerType === "user" &&
      post.ownerId.toString() === profile._id.toString()
    ) {
      isOwner = true;
    } else if (post.ownerType === "startup") {
      const startup = await Startup.findOne({
        _id: post.ownerId,
        founderProfileId: profile._id,
      });
      if (startup) isOwner = true;
    }

    if (!isOwner) return res.status(403).json({ message: "Unauthorized" });

    // ✅ Delete all Cloudinary images
    if (post.media && post.media.length > 0) {
      for (const m of post.media) {
        const publicId = m.url.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`posts/${publicId}`);
      }
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting post:", err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================
//              FILTER BY OWNER TYPE
// =================================================
router.get("/owner/:ownerType/:ownerId", async (req, res) => {
  try {
    const { ownerType, ownerId } = req.params;
    const posts = await Post.find({ ownerType, ownerId })
      .populate("comments.userId", "username avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("❌ Error fetching owner posts:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
