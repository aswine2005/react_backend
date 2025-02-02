const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({ id: decoded.userId });
    if (!user) {
      throw new Error('User not found');
    }

    req.user = { id: user._id };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = auth;