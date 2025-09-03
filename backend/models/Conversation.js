// models/Conversation.js
const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ], // Two users in this chat
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
