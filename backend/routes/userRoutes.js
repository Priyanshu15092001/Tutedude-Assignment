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


// Send friend request
router.post("/friend-request", verifyToken, async (req, res) => {
    const { recipientId } = req.body;
    try {
      const user = await User.findById(req.userId);
      const recipient = await User.findById(recipientId);
  
      if (!recipient) return res.status(404).json({ message: "User not found." });
      if (recipient.friendRequests.includes(user._id))
        return res.status(400).json({ message: "Request already sent." });
  
      recipient.friendRequests.push(user._id);
      await recipient.save();
  
      res.status(200).json({ message: "Friend request sent." });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

module.exports = router;