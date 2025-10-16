const mongoose = require("mongoose");

const startupSchema = new mongoose.Schema(
  {
    // 🔹 The main founder — linked to their Profile, not raw User
    founderProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    // 🔹 Basic Startup Info
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String, // file path or URL
      default: "",
    },
    mission: {
      type: String,
      trim: true,
      maxlength: 400,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    stage: {
      type: String,
      enum: ["idea", "MVP", "seed", "growth", "scaling"],
      default: "idea",
    },
    fundingInfo: {
      type: String,
      trim: true,
    },
    pitchDeckUrl: {
      type: String, // file URL or path (e.g., from Multer)
      default: "",
    },

    // 🔹 Tags & Categories
    roles: {
      type: [String],
      default: [],
    },
    industries: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },

    // 🔹 Team Members (Profiles linked)
    team: [
      {
        profileId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Profile",
        },
        role: {
          type: String,
          trim: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // 🔹 Engagement & Visibility
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
      },
    ],
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    // 🔹 System Info
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Auto-update updatedAt before saving
startupSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Startup", startupSchema);
