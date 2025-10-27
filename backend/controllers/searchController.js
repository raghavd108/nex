// controllers/searchController.js
const Profile = require("../models/Profile");
const Startup = require("../models/Startup");

exports.searchAll = async (req, res) => {
  try {
    const query = req.query.q || ""; // allow empty query for all

    // Search profiles (all)
    const profiles = await Profile.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    })
      .select("username name avatar")
      .limit(20);

    // Search startups (all)
    const startups = await Startup.find({
      name: { $regex: query, $options: "i" },
    })
      .select("name logo stage")
      .limit(20);

    res.json({ profiles, startups });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
