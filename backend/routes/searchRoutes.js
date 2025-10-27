const express = require("express");
const router = express.Router();
const { searchAll } = require("../controllers/searchController");
const auth = require("../middleware/authMiddleware");

router.get("/all", auth, searchAll);

module.exports = router;
