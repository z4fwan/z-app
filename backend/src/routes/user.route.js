import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { protectRoute, isAdmin } from "../middleware/protectRoute.js";

const router = express.Router();

// 🔒 All routes below require authentication
router.use(protectRoute);

// ✅ Get all users (admin only)
router.get("/", isAdmin, getAllUsers);

// ✅ Get user by ID
router.get("/:id", getUserById);

// ✅ Update user (self or admin)
router.put("/:id", updateUser);

// ✅ Delete user (admin only)
router.delete("/:id", isAdmin, deleteUser);

export default router;
