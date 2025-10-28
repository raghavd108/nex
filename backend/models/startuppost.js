const mongoose = require("mongoose");

const startupPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true, // Who created the post (a user profile)
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      required: true, // only startup posts have this
    },
    content: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    mood: {
      type: String,
      enum: ["happy", "sad", "motivated", "neutral", "excited"],
      default: "neutral",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile", // users can like startup posts too
      },
    ],
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
        text: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("StartupPost", startupPostSchema);
