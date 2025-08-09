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

// FRONTEND_URL may be a single URL or a comma-separated list (e.g. for staging)
const rawFrontend = process.env.FRONTEND_URL || "http://localhost:5173";
const FRONTEND_URLS = rawFrontend
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If behind a proxy (Render, Heroku, etc.), trust the first proxy
app.set("trust proxy", 1);

// Middlewares (app is imported from ./lib/socket.js)
app.use(express.json());
app.use(cookieParser());

// CORS config - allow the configured frontend URLs and localhost during dev
const allowedOrigins = new Set(FRONTEND_URLS);
// Ensure localhost dev origin is allowed when not provided
allowedOrigins.add("http://localhost:5173");
allowedOrigins.add("http://127.0.0.1:5173");

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin like curl, mobile apps, server-to-server
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error(`CORS policy: origin ${origin} not allowed`), false);
    },
    credentials: true,
    exposedHeaders: ["Set-Cookie"],
  })
);

// Configure Socket.IO CORS to match Express
try {
  // if `server` is an http.Server with socket.io attached in ./lib/socket.js,
  // that socket instance should be configured there. If not, configure here:
  if (server && server.io) {
    server.io.origins((origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) cb(null, true);
      else cb("origin not allowed", false);
    });
  }
} catch (e) {
  // If socket lib already configured, ignore
  // console.log("Socket.IO cors config skipped (handled elsewhere).");
}

// --- API Routes ---
// Keep API routes before static serving so they are prioritized.
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);

// --- Serve frontend (production build) ---
// The frontend build files are expected to be placed at backend/dist
const distPath = path.join(__dirname, "../dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(distPath));
  // Return index.html for all client-side routes
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
        console.log(`🔗 Allowed frontend origins: ${Array.from(allowedOrigins).join(", ")}`);
      } else {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`🔗 Allowed frontend origins: ${Array.from(allowedOrigins).join(", ")}`);
      }
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
};

start();
