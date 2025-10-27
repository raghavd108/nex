const mongoose = require("mongoose");

const startupSchema = new mongoose.Schema(
  {
    founderProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: "" },
    mission: { type: String, trim: true, maxlength: 400, default: "" },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    stage: {
      type: String,
      enum: ["idea", "MVP", "seed", "growth", "scaling"],
      default: "idea",
    },
    fundingInfo: { type: String, trim: true, default: "" },
    pitchDeckUrl: { type: String, default: "" },
    roles: { type: [String], default: [] },
    industries: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    team: [
      {
        profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
        role: { type: String, trim: true, default: "Member" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Profile" }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Startup", startupSchema);
