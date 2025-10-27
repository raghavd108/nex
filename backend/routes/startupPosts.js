const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Post = require("../models/Post");
const Profile = require("../models/Profile");
const Startup = require("../models/Startup");
const auth = require("../middleware/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// =================== Create Post for a Startup ===================
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
      content,
      imageUrl,
      mood,
    });

    await newPost.save();
    startup.posts.push(newPost._id);
    await startup.save();

    const populatedPost = await Post.findById(newPost._id).populate(
      "userId",
      "username name avatar"
    );

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Error creating startup post:", err);
    res.status(500).json({ error: err.message });
  }
});

// =================== Get All Posts for a Startup ===================
router.get("/:startupId", async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.startupId).populate({
      path: "posts",
      populate: {
        path: "userId",
        select: "username name avatar",
      },
      options: { sort: { createdAt: -1 } },
    });

    if (!startup) return res.status(404).json({ message: "Startup not found" });

    res.json(startup.posts || []);
  } catch (err) {
    console.error("Error fetching startup posts:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
