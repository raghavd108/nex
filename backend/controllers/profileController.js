const Profile = require("../models/Profile");
const User = require("../models/User"); // ⭐ Import User model
const cloudinary = require("../config/cloudinary");

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

// ✅ Update or create user profile
exports.updateProfile = async (req, res) => {
  try {
    // Check if profile exists
    let profile = await Profile.findOne({ userId: req.userId });

    // If no profile, create one (first-time setup)
    if (!profile) {
      const newProfileData = {
        userId: req.userId,
        ...req.body,
      };

      // Ensure interests array is properly formatted
      if (typeof newProfileData.interests === "string") {
        newProfileData.interests = newProfileData.interests
          .split(",")
          .map((i) => i.trim());
      }

      profile = new Profile(newProfileData);
      await profile.save();

      // Mark user as profile completed
      await User.findByIdAndUpdate(req.userId, { isProfileCompleted: true });

      return res.json(profile);
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

    // ✅ Check username availability when setting first time
    if (!profile.username && req.body.username) {
      const existing = await Profile.findOne({ username: req.body.username });
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    // Allowed fields to update
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

    // Handle first-time username
    if (!profile.username && req.body.username) {
      updateData.username = req.body.username;
    }

    // Format interests if string
    if (updateData.interests && typeof updateData.interests === "string") {
      updateData.interests = updateData.interests
        .split(",")
        .map((i) => i.trim());
    }

    // Update timestamp
    updateData.updatedAt = Date.now();

    // Update profile
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: req.userId },
      updateData,
      { new: true }
    ).populate("startupAffiliations.startupId", "name logo stage");

    // Mark user profile as completed
    await User.findByIdAndUpdate(req.userId, { isProfileCompleted: true });

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

    // Convert buffer to base64
    const dataUri = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "nex_avatars",
    });

    // Save in DB
    const updated = await Profile.findOneAndUpdate(
      { userId: req.userId },
      { avatar: result.secure_url },
      { new: true }
    );

    // ⭐ Mark profile completed when photo added
    await User.findByIdAndUpdate(req.userId, { isProfileCompleted: true });

    res.json(updated);
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Public profile by username
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
