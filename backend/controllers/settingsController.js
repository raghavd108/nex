const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Get user settings (excluding password)
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      email: user.email,
      emailNotifications: user.settings?.emailNotifications ?? true,
      pushNotifications: user.settings?.pushNotifications ?? false,
      profileVisibility: user.settings?.profileVisibility ?? "public",
      language: user.settings?.language ?? "English",
    });
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const {
      emailNotifications = false,
      pushNotifications = false,
      profileVisibility = "public",
      language = "English",
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.settings = {
      emailNotifications,
      pushNotifications,
      profileVisibility,
      language,
    };

    await user.save();

    res.json({ success: true, settings: user.settings });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both old and new passwords are required" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect old password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Change email
exports.changeEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const existing = await User.findOne({ email });
    if (existing && existing._id.toString() !== req.userId) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.email = email;
    await user.save();

    res.json({ message: "Email updated successfully", email: user.email });
  } catch (err) {
    console.error("Change email error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
