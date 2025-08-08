import express from "express";
import {
  getAllUsers,
  suspendUser,
  unsuspendUser,
  blockUser,
  unblockUser,
  deleteUser,
  toggleVerification,
} from "../controllers/admin.controller.js";

import { protectRoute } from "../middleware/protectRoute.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// 🛡️ Protect all routes and require admin
router.use(protectRoute, isAdmin);

// 📦 Admin Routes
router.get("/users", getAllUsers);
router.put("/suspend/:userId", suspendUser);
router.put("/unsuspend/:userId", unsuspendUser);
router.put("/block/:userId", blockUser);
router.put("/unblock/:userId", unblockUser);
router.delete("/delete/:userId", deleteUser);
router.put("/verify/:userId", toggleVerification);

export default router;
