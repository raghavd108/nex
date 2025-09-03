const Profile = require("../models/Profile");
const path = require("path");

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
    const avatarPath = `/uploads/${req.file.filename}`;
    const updated = await Profile.findOneAndUpdate(
      { userId: req.userId },
      { avatar: avatarPath },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
