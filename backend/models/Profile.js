const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    unique: true, // must be unique
    sparse: true, // allow empty until set
    trim: true,
  },
  name: String,
  avatar: { type: String },
  bio: String,
  age: Number,
  location: String,
  interests: [String],
});

module.exports = mongoose.model("Profile", profileSchema);
