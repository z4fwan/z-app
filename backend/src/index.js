import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import User from "./models/user.model.js";

// ─── ENVIRONMENT & PATH SETUP ───────────────────────────────
dotenv.config();
const PORT = process.env.PORT || 5001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── MIDDLEWARE ─────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://z-app-official-frontend.onrender.com",
  ],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── ROUTES ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// ❌ DO NOT SERVE FRONTEND – It's hosted separately

// ─── CONNECT DB AND START SERVER ────────────────────────────
connectDB().then(async () => {
  await createDefaultAdmin(); // ✅ Ensure admin exists before server starts
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("❌ Failed to connect to DB:", err.message);
});

// ─── CREATE DEFAULT ADMIN IF NOT EXISTS ─────────────────────
async function createDefaultAdmin() {
  try {
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("safwan123", 10);
      const newAdmin = await User.create({
        username: "admin",
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        isAdmin: true,
      });
      console.log("✅ Default admin created:", newAdmin.email);
    } else {
      console.log("ℹ️ Default admin already exists:", existingAdmin.email);
    }
  } catch (err) {
    console.error("❌ Error creating default admin:", err.message);
  }
}
