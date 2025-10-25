// controllers/startupController.js
const Startup = require("../models/Startup");
const Profile = require("../models/Profile");
const cloudinary = require("../config/cloudinary");

/* ================================
   CREATE NEW STARTUP
================================ */
exports.createStartup = async (req, res) => {
  try {
    const founderProfile = await Profile.findOne({ userId: req.userId });
    if (!founderProfile)
      return res.status(404).json({ message: "Profile not found" });

    const {
      name,
      mission,
      description,
      stage,
      fundingInfo,
      roles,
      industries,
      skills,
    } = req.body;

    const newStartup = new Startup({
      founderProfileId: founderProfile._id,
      name,
      mission,
      description,
      stage,
      fundingInfo,
      roles: roles || [],
      industries: industries || [],
      skills: skills || [],
    });

    await newStartup.save();

    founderProfile.startupAffiliations.push({
      startupId: newStartup._id,
      role: "Founder",
      isFounder: true,
    });
    await founderProfile.save();

    res.status(201).json(newStartup);
  } catch (err) {
    console.error("Create Startup Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   UPDATE STARTUP (FOUNDERS ONLY)
================================ */
exports.updateStartup = async (req, res) => {
  try {
    const founderProfile = await Profile.findOne({ userId: req.userId });
    const startup = await Startup.findById(req.params.id);

    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (
      !founderProfile ||
      startup.founderProfileId.toString() !== founderProfile._id.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let updateData = { ...req.body };

    // Convert comma-separated strings to arrays
    ["industries", "roles", "skills"].forEach((key) => {
      if (updateData[key]) {
        if (typeof updateData[key] === "string") {
          try {
            // Try parsing JSON first
            updateData[key] = JSON.parse(updateData[key]);
          } catch {
            // Fallback to comma-separated split
            updateData[key] = updateData[key]
              .split(",")
              .map((i) => i.trim())
              .filter(Boolean);
          }
        }
      }
    });

    // Handle logo upload
    if (req.file) {
      const dataUri = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "nex_startup_logos",
      });

      // Delete old logo if exists
      if (startup.logo && startup.logo.includes("res.cloudinary.com")) {
        try {
          const publicId = startup.logo.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`nex_startup_logos/${publicId}`);
        } catch (e) {
          console.warn("Old logo deletion failed:", e.message);
        }
      }

      updateData.logo = result.secure_url;
    }

    const updatedStartup = await Startup.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("founderProfileId", "name avatar username")
      .populate("team.profileId", "name avatar username");

    res.json({
      message: "Startup updated successfully",
      startup: updatedStartup,
    });
  } catch (err) {
    console.error("Update Startup Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   UPLOAD LOGO (SINGLE)
================================ */
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const founderProfile = await Profile.findOne({ userId: req.userId });
    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.founderProfileId.toString() !== founderProfile._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    const dataUri = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "nex_startup_logos",
    });

    if (startup.logo && startup.logo.includes("res.cloudinary.com")) {
      try {
        const publicId = startup.logo.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`nex_startup_logos/${publicId}`);
      } catch (e) {
        console.warn("Old logo deletion failed:", e.message);
      }
    }

    startup.logo = result.secure_url;
    await startup.save();

    res.json({
      message: "Logo uploaded successfully",
      logoUrl: result.secure_url,
    });
  } catch (err) {
    console.error("Upload Logo Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   UPLOAD PITCH DECK (PDF/PPT)
================================ */
exports.uploadPitchDeck = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const founderProfile = await Profile.findOne({ userId: req.userId });
    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.founderProfileId.toString() !== founderProfile._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    const dataUri = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "nex_pitch_decks",
      resource_type: "raw",
    });

    if (
      startup.pitchDeckUrl &&
      startup.pitchDeckUrl.includes("res.cloudinary.com")
    ) {
      try {
        const publicId = startup.pitchDeckUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`nex_pitch_decks/${publicId}`, {
          resource_type: "raw",
        });
      } catch (e) {
        console.warn("Old pitch deck deletion failed:", e.message);
      }
    }

    startup.pitchDeckUrl = result.secure_url;
    await startup.save();

    res.json({
      message: "Pitch deck uploaded successfully",
      pitchDeckUrl: result.secure_url,
    });
  } catch (err) {
    console.error("Upload Pitch Deck Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   ADD TEAM MEMBER
================================ */
exports.addTeamMember = async (req, res) => {
  try {
    const { profileId, role } = req.body;
    const founderProfile = await Profile.findOne({ userId: req.userId });
    const startup = await Startup.findById(req.params.id);

    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.founderProfileId.toString() !== founderProfile._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    const alreadyMember = startup.team.some(
      (m) => m.profileId.toString() === profileId
    );
    if (alreadyMember)
      return res.status(400).json({ message: "User already in team" });

    startup.team.push({ profileId, role });
    await startup.save();

    const memberProfile = await Profile.findById(profileId);
    if (memberProfile) {
      memberProfile.startupAffiliations.push({
        startupId: startup._id,
        role,
        isFounder: false,
      });
      await memberProfile.save();
    }

    res.json({ message: "Team member added", startup });
  } catch (err) {
    console.error("Add Team Member Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   REMOVE TEAM MEMBER
================================ */
exports.removeTeamMember = async (req, res) => {
  try {
    const founderProfile = await Profile.findOne({ userId: req.userId });
    const startup = await Startup.findById(req.params.id);

    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.founderProfileId.toString() !== founderProfile._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    startup.team = startup.team.filter(
      (m) => m.profileId.toString() !== req.params.memberId
    );
    await startup.save();

    await Profile.findByIdAndUpdate(req.params.memberId, {
      $pull: { startupAffiliations: { startupId: startup._id } },
    });

    res.json({ message: "Team member removed", startup });
  } catch (err) {
    console.error("Remove Team Member Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   FOLLOW / UNFOLLOW STARTUP
================================ */
exports.toggleFollow = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });

    const index = startup.followers.findIndex(
      (id) => id.toString() === profile._id.toString()
    );
    if (index > -1) {
      startup.followers.splice(index, 1);
      await startup.save();
      return res.json({ message: "Unfollowed startup" });
    } else {
      startup.followers.push(profile._id);
      await startup.save();
      return res.json({ message: "Followed startup" });
    }
  } catch (err) {
    console.error("Follow Toggle Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   GET ALL STARTUPS (FILTERED)
================================ */
exports.getAllStartups = async (req, res) => {
  try {
    const { industry, stage, role } = req.query;
    const filter = { visibility: "public" };
    if (industry) filter.industries = { $in: [industry] };
    if (stage) filter.stage = stage;
    if (role) filter.roles = { $in: [role] };

    const startups = await Startup.find(filter)
      .populate("founderProfileId", "name username avatar")
      .populate("team.profileId", "name avatar username");

    res.json(startups);
  } catch (err) {
    console.error("Get All Startups Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   GET STARTUPS BY FOUNDER
================================ */
exports.getStartupsByFounder = async (req, res) => {
  try {
    const startups = await Startup.find({
      founderProfileId: req.params.profileId,
    })
      .populate("founderProfileId", "name username avatar")
      .populate("team.profileId", "name avatar username");

    res.json(startups);
  } catch (err) {
    console.error("Get Founder Startups Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   GET STARTUP BY ID
================================ */
exports.getStartupById = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id)
      .populate("founderProfileId", "name username avatar")
      .populate("team.profileId", "name avatar username");

    if (!startup) return res.status(404).json({ message: "Startup not found" });

    res.json(startup);
  } catch (err) {
    console.error("Get Startup By ID Error:", err);
    res.status(500).json({ message: err.message });
  }
};
