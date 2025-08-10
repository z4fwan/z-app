import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// 🔐 Middleware to protect routes
export const protectRoute = async (req, res, next) => {
  try {
    // Debug: Check incoming cookies
    if (!req.cookies) {
      return res.status(401).json({ error: "Unauthorized: No cookies received" });
    }

    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token in cookies" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found in database" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: "Access denied: You have been blocked by the admin.",
        type: "blocked",
      });
    }

    const now = new Date();
    if (user.isSuspended && user.suspendedUntil && new Date(user.suspendedUntil) > now) {
      return res.status(403).json({
        error: "Access denied: Your account is suspended.",
        type: "suspended",
        reason: user.suspensionReason || "No reason provided",
        until: user.suspendedUntil,
      });
    }

    // ✅ Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("protectRoute error:", err);
    return res.status(500).json({ error: "Server error in protectRoute" });
  }
};

// 🛡️ Middleware to check admin access
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user data in request" });
    }
    if (req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: "Access denied: Admins only" });
    }
    next();
  } catch (err) {
    console.error("isAdmin error:", err);
    return res.status(500).json({ error: "Server error in admin check" });
  }
};
