const express = require("express");
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware")

const router = express.Router();


// Search users
router.get("/search", verifyToken, async (req, res) => {
  const { username } = req.query;
  try {
    const users = await User.find({ username: new RegExp(username, "i") });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;