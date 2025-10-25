const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    // 🔹 Ownership: Either a User Profile OR a Startup owns the post
    ownerType: {
      type: String,
      enum: ["user", "startup"],
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "ownerTypeRef", // Dynamic reference based on ownerType
    },
    ownerTypeRef: {
      type: String,
      required: true,
      enum: ["Profile", "Startup"], // references actual model names
    },

    // 🔹 Content
    content: {
      type: String,
      trim: true,
    },

    // 🔹 Optional media (support multiple images or files)
    media: [
      {
        url: String,
        caption: String,
      },
    ],

    // 🔹 Mood (for personal posts)
    mood: {
      type: String,
      enum: [
        "happy",
        "motivated",
        "neutral",
        "sad",
        "excited",
        "proud",
        "inspired",
      ],
    },

    // 🔹 Post Category (for filtering startup activities)
    postType: {
      type: String,
      enum: [
        "personal",
        "startup_update",
        "funding_announcement",
        "team_hiring",
        "product_launch",
      ],
      default: "personal",
    },

    // 🔹 Engagement
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
      },
    ],
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // 🔹 System info
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 🔹 Automatically set the dynamic reference model (Profile or Startup)
postSchema.pre("validate", function (next) {
  if (this.ownerType === "user") {
    this.ownerTypeRef = "Profile";
  } else if (this.ownerType === "startup") {
    this.ownerTypeRef = "Startup";
  }
  next();
});

// 🔹 Auto-update `updatedAt`
postSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Post", postSchema);
