const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      unique: true,
      default: () => uuidv4().slice(0, 8),
    },
    name: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    type: { type: String, enum: ["public", "private"], default: "public" },
    image: { type: String, default: "" }, // ✅ new image field
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
