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
      console.log('Decoded token:', decoded);
      
      // Find user by UUID
      const user = await User.findOne({ id: decoded.userId });
      console.log('Found user:', user);

      if (!user) {
        throw new Error('User not found');
      }

      // Store MongoDB _id in req.user
      req.user = { 
        mongoId: user._id,  // MongoDB ObjectId
        id: user.id        // UUID string
      };
      console.log('Set req.user:', req.user);
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