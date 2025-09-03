const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getSettings,
  updateSettings,
  changePassword,
  changeEmail,
  deleteAccount,
} = require("../controllers/settingsController");

router.get("/", auth, getSettings);
router.put("/", auth, updateSettings);
router.put("/password", auth, changePassword);
router.put("/email", auth, changeEmail);
router.delete("/account", auth, deleteAccount);

module.exports = router;
