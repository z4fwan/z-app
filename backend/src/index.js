// backend/src/index.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import adminRoutes from "./routes/admin.route.js";
import User from "./models/user.model.js";

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 5001;
// FRONTEND_URL should be set in env; default to your local dev URL
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares (app is imported from ./lib/socket.js)
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// --- API Routes ---
// Keep API routes before static serving so they are prioritized.
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);

// --- Serve frontend (production build) ---
// The frontend build files are expected to be placed at backend/dist
// (your postinstall/build:frontend should copy frontend/dist -> backend/dist)
const distPath = path.join(__dirname, "../dist");
if (process.env.NODE_ENV === "production") {
  // Serve static assets
  app.use(express.static(distPath));

  // Handle client-side routing - return index.html for unmatched routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// --- Create default admin if not exists ---
const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("⚠️  ADMIN_EMAIL not set in environment - skipping default admin creation");
      return;
    }

    // ensure User model is available and DB connected
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("safwan123", 10);
      const admin = new User({
        fullName: "Admin",
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        isVerified: true,
      });
      await admin.save();
      console.log(`✅ Default admin created: ${adminEmail}`);
    } else {
      console.log("ℹ️  Default admin already exists.");
    }
  } catch (error) {
    console.error("❌ Failed to create default admin:", error);
  }
};

// --- Start up: connect DB, create admin, then listen ---
const start = async () => {
  try {
    // connect to DB
    await connectDB();
    console.log("✅ MongoDB connected");

    // create default admin if needed
    await createDefaultAdmin();

    // start socket + http server
    server.listen(PORT, () => {
      if (process.env.NODE_ENV === "production") {
        console.log(`🚀 Server running on port ${PORT}`);
      } else {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`🔗 Frontend dev URL: ${FRONTEND_URL}`);
      }
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
};

start();
