import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";

import User from "./models/user.model.js";
import { app, server, io, userSocketMap } from "./lib/socket.js";

// ─────────────────────────────────────────────────────────────

dotenv.config();

// ── Database Connection ──────────────────────────────────────

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ── Middleware ───────────────────────────────────────────────

app.use(
  cors({
    origin: ["http://localhost:5173", "https://z-app-official-frontend.onrender.com"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ── API Routes ───────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// ── Deployment Support (Render Static Frontend) ──────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendBuildPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendBuildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// ── Admin User Setup ─────────────────────────────────────────

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = "safwan123"; // You may want to hash/store this securely

const setupDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const adminUser = new User({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        username: "Admin",
        isAdmin: true,
      });
      await adminUser.save();
      console.log("✅ Default admin user created.");
    } else {
      console.log("ℹ️ Admin already exists.");
    }
  } catch (error) {
    console.error("❌ Failed to create admin user:", error);
  }
};

setupDefaultAdmin();

// ── Start Server ─────────────────────────────────────────────

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

