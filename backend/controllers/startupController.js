const Startup = require("../models/Startup");
const Profile = require("../models/Profile");
const cloudinary = require("../config/cloudinary");

/*  Create a new Startup*/
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
      roles,
      industries,
      skills,
    });

    await newStartup.save();

    // 🔗 Automatically link startup to founder’s profile
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

/*  Update Startup (Only Founder Can Edit)*/
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

    const updateData = { ...req.body };

    // ✅ If a new logo is uploaded, handle it
    if (req.file) {
      const dataUri = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "nex_startup_logos",
      });
      updateData.logo = result.secure_url;
    }

    // ✅ Parse arrays (since you stringify them in frontend)
    if (updateData.industries)
      updateData.industries = JSON.parse(updateData.industries);
    if (updateData.skills) updateData.skills = JSON.parse(updateData.skills);

    const updated = await Startup.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json(updated);
  } catch (err) {
    console.error("Update Startup Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* Upload Logo*/
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const founderProfile = await Profile.findOne({ userId: req.userId });
    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.founderProfileId.toString() !== founderProfile._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const dataUri = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "nex_startup_logos",
    });

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

/* Upload Pitch Deck (PDF / Slides)*/
exports.uploadPitchDeck = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const founderProfile = await Profile.findOne({ userId: req.userId });
    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.founderProfileId.toString() !== founderProfile._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const dataUri = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "nex_pitch_decks",
      resource_type: "raw", // PDF or PPT files
    });

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

/*  Add Team Member */
exports.addTeamMember = async (req, res) => {
  try {
    const { profileId, role } = req.body;

    const founderProfile = await Profile.findOne({ userId: req.userId });
    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.founderProfileId.toString() !== founderProfile._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const alreadyMember = startup.team.some(
      (m) => m.profileId.toString() === profileId
    );
    if (alreadyMember)
      return res.status(400).json({ message: "User already in team" });

    startup.team.push({ profileId, role });
    await startup.save();

    // also update that profile’s affiliation
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
    res.status(500).json({ message: err.message });
  }
};

/* Remove Team Member*/
exports.removeTeamMember = async (req, res) => {
  try {
    const founderProfile = await Profile.findOne({ userId: req.userId });
    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.founderProfileId.toString() !== founderProfile._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    startup.team = startup.team.filter(
      (m) => m.profileId.toString() !== req.params.memberId
    );
    await startup.save();

    // remove from member’s profile affiliations
    await Profile.findByIdAndUpdate(req.params.memberId, {
      $pull: { startupAffiliations: { startupId: startup._id } },
    });

    res.json({ message: "Team member removed", startup });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* Follow / Unfollow Startup */
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
    res.status(500).json({ message: err.message });
  }
};

/* Get All Public Startups (with Filters)*/
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
    res.status(500).json({ message: err.message });
  }
};

/*  Get Startups by Founder */
exports.getStartupsByFounder = async (req, res) => {
  try {
    const startups = await Startup.find({
      founderProfileId: req.params.profileId,
    }).populate("founderProfileId", "name username avatar");

    res.json(startups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*
    Get Startup by ID*/
exports.getStartupById = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id)
      .populate("founderProfileId", "name username avatar")
      .populate("team.profileId", "name avatar username");

    if (!startup) return res.status(404).json({ message: "Startup not found" });

    res.json(startup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
