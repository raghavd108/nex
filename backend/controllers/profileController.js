const Profile = require("../models/Profile");
const cloudinary = require("../config/cloudinary"); // ✅ import cloudinary config
const { v2: cloudinary } = require("cloudinary");

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
