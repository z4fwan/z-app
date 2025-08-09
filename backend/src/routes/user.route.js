import express from "express";
import {
  getAllUsers,
  getUserById,
  getUserProfile,
  updateUserProfile,
  deleteMyAccount,
  deleteUser, // Admin deletes user by ID
} from "../controllers/user.controller.js";

import { protectRoute, isAdmin } from "../middleware/protectRoute.js";

const router = express.Router();

// 🔒 All routes below require authentication
router.use(protectRoute);

// ✅ Admin only - fetch all users
router.get("/", isAdmin, getAllUsers);

// ✅ Admin only - delete any user by ID
router.delete("/:userId", isAdmin, deleteUser);

// ✅ Get your own profile
router.get("/me", getUserProfile);

// ✅ Update your own profile
router.put("/me", updateUserProfile);

// ✅ Delete your own account
router.delete("/me", deleteMyAccount);

// ✅ Get user by ID (for admin or public profile view)
router.get("/:id", getUserById);

export default router;
