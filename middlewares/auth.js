const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user");
const mongoose = require('mongoose');

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded.userId) {
        throw new Error('Invalid token structure');
      }

      // Find user by MongoDB _id
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Store full user object in req.user
      req.user = user;

      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ 
        success: false,
        message: "Invalid or expired token" 
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ 
      success: false,
      message: "Authentication failed",
      error: error.message 
    });
  }
};

module.exports = auth;