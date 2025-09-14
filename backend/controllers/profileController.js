const Profile = require("../models/Profile");
const cloudinary = require("../config/cloudinary"); // ✅ import cloudinary config

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      const newProfile = new Profile({ userId: req.userId });
      await newProfile.save();
      return res.json(newProfile);
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.body.username) {
      const existing = await Profile.findOne({
        username: req.body.username,
        userId: { $ne: req.userId }, // not the same user
      });
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const updated = await Profile.findOneAndUpdate(
      { userId: req.userId },
      req.body,
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Convert buffer to a data URI
    const dataUri = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "nex_avatars",
    });

    // Save URL to DB
    const updated = await Profile.findOneAndUpdate(
      { userId: req.userId },
      { avatar: result.secure_url },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ message: err.message });
  }
};
// Search profiles by username (case-insensitive, partial match)
exports.searchProfiles = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const results = await Profile.find({
      username: { $regex: query, $options: "i" }, // case-insensitive match
    }).select("username name avatar _id"); // return only useful fields

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
