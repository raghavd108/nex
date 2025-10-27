// controllers/searchController.js
const Profile = require("../models/Profile");
const Startup = require("../models/Startup");

exports.searchAll = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: "Query required" });

    // Search profiles
    const profiles = await Profile.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
      visibility: "public",
    })
      .select("username name avatar")
      .limit(10);

    // Search startups
    const startups = await Startup.find({
      name: { $regex: query, $options: "i" },
      visibility: "public",
    })
      .select("name logo stage")
      .limit(10);

    res.json({ profiles, startups });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
