import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // 🔐 Check token
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token" });
    }

    // 🔍 Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    // 🚫 Blocked check
    if (user.isBlocked) {
      return res.status(403).json({
        error: "Access denied: You have been blocked by the admin.",
        type: "blocked",
      });
    }

    // ⛔ Suspended check
    const now = new Date();
    if (user.isSuspended && user.suspendedUntil && new Date(user.suspendedUntil) > now) {
      return res.status(403).json({
        error: "Access denied: Your account is suspended.",
        type: "suspended",
        reason: user.suspensionReason || "No reason provided",
        until: user.suspendedUntil,
      });
    }

    // ✅ All good
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};
