const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: String,
  avatar: { type: String },
  bio: String,
  age: Number,
  location: String,
  interests: [String],
});

module.exports = mongoose.model("Profile", profileSchema);
