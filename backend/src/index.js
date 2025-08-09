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

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS: allow local and deployed frontend
const allowedOrigins = [
  "http://localhost:5173",
  "https://z-app-frontend-2-0.onrender.com", // <-- your deployed frontend URL
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);

// Serve frontend (production build)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "./dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "./dist/index.html"));
  });
}

// Create default admin if not exists
const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("⚠️ ADMIN_EMAIL not set in .env");
      return;
    }

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
      console.log("ℹ️ Admin already exists.");
    }
  } catch (error) {
    console.error("❌ Failed to create default admin:", error.message);
  }
};

// Start server
server.listen(PORT, async () => {
  await connectDB();
  await createDefaultAdmin();
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
