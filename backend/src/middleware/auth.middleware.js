import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from DB, exclude password
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: "Access denied - User is blocked" });
    }

    // If user is suspended
    if (user.isSuspended && user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      return res.status(403).json({
        message: `Account suspended until ${new Date(user.suspendedUntil).toLocaleString()} - Reason: ${user.suspensionReason}`,
      });
    }

    // All good - attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
