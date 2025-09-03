// models/Like.js
const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema({
  fromUserId: {
    type: String, // ✅ use String instead of ObjectId
    required: true,
  },
  toUserId: {
    type: String, // ✅ use String instead of ObjectId
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Like", LikeSchema);
