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

// Accept or reject friend request
router.post("/respond-request", verifyToken, async (req, res) => {
    const { senderId, action } = req.body;
    try {
      const user = await User.findById(req.userId);
      let message="";
      if (!user.friendRequests.includes(senderId))
        return res.status(400).json({ message: "Request not found." });
  
      if (action === "accept") {
        user.friends.push(senderId);
        const sender = await User.findById(senderId);
        sender.friends.push(user._id);
        await sender.save();
        message="Request accepted.";
      }
      else{
        message="Request rejected";
      }
  
      user.friendRequests = user.friendRequests.filter(id => id.toString() !== senderId);
      await user.save();
  
      res.status(200).json({ message: message });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// Fetch recommendations
router.get("/recommendations", verifyToken, async (req, res) => {
  try {
    // Fetch the current user and their friends
    const user = await User.findById(req.userId).populate("friends");

    // Fetch users excluding current user and their friends
    const potentialFriends = await User.find({
      _id: { $nin: [req.userId, ...user.friends.map(f => f._id)] },
    }).select("username friends"); // Fetch only relevant fields

    // Map potential friends to include mutual friend counts
    const recommendations = potentialFriends.map(potentialFriend => {
      const mutualConnections = potentialFriend.friends.filter(friend =>
        user.friends.some(userFriend => userFriend.equals(friend))
      ).length;

      return {
        _id: potentialFriend._id,
        username: potentialFriend.username,
        mutualConnections,
      };
    });

    // Sort by mutual connections (descending order)
    recommendations.sort((a, b) => b.mutualConnections - a.mutualConnections);

    res.status(200).json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch recommendations." });
  }
});

//fetch friends
router.get("/friends", verifyToken, async (req, res) => {
  try {
    // Fetch the user and populate the friends list
    const user = await User.findById(req.userId).populate("friends", "username");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with the list of friends
    res.status(200).json(user.friends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch friends" });
  }
});

//unfriend friend
router.delete("/unfriend/:friendId", verifyToken, async (req, res) => {
  try {
    const { friendId } = req.params;

    // Ensure the friend exists in the database
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // Find the authenticated user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove friendId from the user's friends list
    user.friends = user.friends.filter(friend => !friend.equals(friendId));

    // Remove userId from the friend's friends list
    friend.friends = friend.friends.filter(f => !f.equals(req.userId));

    // Save both updated users
    await user.save();
    await friend.save();

    res.status(200).json({ message: "Unfriended" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to unfriend user" });
  }
});

module.exports = router;