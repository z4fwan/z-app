import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./lib/db.js";
import { app as socketApp, server } from "./lib/socket.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";

import User from "./models/user.model.js";
import bcrypt from "bcryptjs";

// ─── Environment Setup ──────────────────────
dotenv.config();
const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Middleware ─────────────────────────────
socketApp.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://z-app-official-frontend.onrender.com",
    ],
    credentials: true,
  })
);
socketApp.use(cookieParser());
socketApp.use(express.json());
socketApp.use(express.urlencoded({ extended: true }));

// ─── Routes ─────────────────────────────────
socketApp.use("/api/auth", authRoutes);
socketApp.use("/api/messages", messageRoutes);
socketApp.use("/api/users", userRoutes);
socketApp.use("/api/admin", adminRoutes);

// ─── Serve Frontend ─────────────────────────
if (process.env.NODE_ENV === "production") {
  socketApp.use(express.static(path.join(__dirname, "../client/dist")));

  socketApp.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

// ─── Start Server ───────────────────────────
const startServer = async () => {
  await connectDB();

  // ✅ Auto-create default admin if not exists
  const adminEmail = process.env.ADMIN_EMAIL;
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("safwan123", 10);
    await User.create({
      email: adminEmail,
      password: hashedPassword,
      username: "Admin",
      isAdmin: true,
      isVerified: true,
    });
    console.log("✅ Default admin created:", adminEmail);
  }

  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
};

startServer();
