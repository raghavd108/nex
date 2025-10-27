const express = require("express");
const router = express.Router();
const { searchAll } = require("../controllers/searchController");
const authMiddleware = require("../middleware/auth");

router.get("/all", authMiddleware, searchAll);

module.exports = router;
