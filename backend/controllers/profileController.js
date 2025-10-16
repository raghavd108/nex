const Profile = require("../models/Profile");
const cloudinary = require("../config/cloudinary"); // ✅ Cloudinary config import

// ✅ Get or create a user's profile
exports.getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.userId }).populate(
      "startupAffiliations.startupId",
      "name logo stage"
    );

    if (!profile) {
      profile = new Profile({ userId: req.userId });
      await profile.save();
    }

    res.json(profile);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // 🚫 Prevent username change once set
    if (
      profile.username &&
      req.body.username &&
      req.body.username !== profile.username
    ) {
      return res
        .status(400)
        .json({ message: "Username cannot be changed once set" });
    }

    // ✅ Validate username if setting for the first time
    if (!profile.username && req.body.username) {
      const existing = await Profile.findOne({ username: req.body.username });
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    // ✅ Allowed fields for update (prevents overwriting system fields)
    const allowedFields = [
      "name",
      "bio",
      "age",
      "location",
      "interests",
      "roles",
      "skills",
      "industries",
      "startupAffiliations",
      "isOpenToCollaborate",
      "lookingFor",
      "visibility",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle username only if not already set
    if (!profile.username && req.body.username) {
      updateData.username = req.body.username;
    }

    // Update `updatedAt`
    updateData.updatedAt = Date.now();

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: req.userId },
      updateData,
      { new: true }
    ).populate("startupAffiliations.startupId", "name logo stage");

    res.json(updatedProfile);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Upload or update profile photo
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Convert buffer to a data URI for Cloudinary
    const dataUri = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "nex_avatars",
    });

    // Save Cloudinary URL
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

// ✅ Search profiles by username or name (case-insensitive)
exports.searchProfiles = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const results = await Profile.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
      visibility: "public",
    }).select("username name avatar roles industries skills");

    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get profile by username (public view)
exports.getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await Profile.findOne({ username }).populate(
      "startupAffiliations.startupId",
      "name logo stage"
    );

    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respect visibility settings
    if (
      profile.visibility === "private" &&
      profile.userId.toString() !== req.userId
    ) {
      return res.status(403).json({ message: "This profile is private." });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile by username:", error);
    res.status(500).json({ message: "Server error" });
  }
};
