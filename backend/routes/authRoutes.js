const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const router = express.Router();

// Register user
router.post(
  "/register",
  [
    body("username", "Username must be min 3 length")
      .isLength({ min: 3 })
      .exists(),
    body("password", "Password must be min 8 length.")
      .isLength({ min: 8 })
      .exists(),
  ],
  async (req, res) => {
    const { username, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const existingUser = await User.findOne({ username });
      if (existingUser)
        return res.status(400).json({ message: "Username already exists." });

      const user = new User({ username, password });
      await user.save();

      res.status(201).json({ message: "User registered successfully." });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Login user
router.post(
  "/login",
  [
    body("username", "Username cannot be blank").exists(),
    body("password", "Password cannot be blank").exists(),
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username });
      if (!user)
        return res.status(400).json({ message: "User not registered" });

      const isMatch = await user.comparePassword(password);
      if (!isMatch)
        return res
          .status(400)
          .json({ message: "Invalid username or password." });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.status(200).json({ token, username });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
