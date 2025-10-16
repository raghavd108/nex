const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic Info
    username: {
      type: String,
      unique: true,
      sparse: true, // allows null until username is set
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String, // profile photo URL or path
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    age: {
      type: Number,
      min: 13,
      max: 100,
    },
    location: {
      type: String,
      trim: true,
    },
    interests: {
      type: [String],
      default: [],
    },

    // 🔹 Professional / Startup Network Fields
    roles: {
      type: [String],
      enum: [
        "Founder",
        "Co-founder",
        "Investor",
        "Mentor",
        "Developer",
        "Designer",
        "Marketer",
        "Advisor",
        "Student",
        "Other",
      ],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    industries: {
      type: [String],
      default: [],
    },

    // 🔹 Startup Linkage
    startupAffiliations: [
      {
        startupId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Startup",
        },
        role: {
          type: String,
          trim: true,
        },
        isFounder: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // 🔹 Platform Networking Settings
    isOpenToCollaborate: {
      type: Boolean,
      default: true, // visible to others for collab requests
    },
    lookingFor: {
      type: [String], // e.g. ["Co-founder", "Investor", "Mentor"]
      default: [],
    },
    visibility: {
      type: String,
      enum: ["public", "connections", "private"],
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

// Auto-update `updatedAt` on save
profileSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Profile", profileSchema);
