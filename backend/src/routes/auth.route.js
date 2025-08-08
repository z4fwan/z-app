import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
  checkAuth,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔓 Public Routes
router.post("/signup", signup);        // Create a new user account
router.post("/login", login);          // User login
router.post("/logout", logout);        // User logout

// 🔒 Protected Routes (requires authentication)
router.put("/update-profile", protectRoute, updateProfile); // Update user profile
router.get("/check", protectRoute, checkAuth);              // Check user authentication status

export default router;
