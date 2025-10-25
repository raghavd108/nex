// models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
    required: true,
  },
  content: String,
  imageUrl: String,
  mood: { type: String }, // e.g., "happy", "sad", "motivated"
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Profile" }],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", postSchema);
