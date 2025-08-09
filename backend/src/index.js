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
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import User from "./models/user.model.js";

// ✅ Load environment variables
dotenv.config();

// ✅ Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ CORS settings
const allowedOrigins = [
  "http://localhost:5173", // Dev
  "https://z-app-official-frontend.onrender.com", // Prod
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Serve frontend only in production
if (process.env.NODE_ENV === "production") {
  // dist folder will be created in backend by build script
  const frontendPath = path.join(__dirname, "../dist");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// ✅ Create default admin if not exists
const createAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("⚠ ADMIN_EMAIL not set in .env");
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("safwan123", 10);
      await User.create({
        username: "admin",
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        isVerified: true,
      });
      console.log(`✅ Default admin created: ${adminEmail}`);
    } else {
      console.log("ℹ Admin already exists");
    }
  } catch (error) {
    console.error("❌ Failed to create default admin:", error);
  }
};

// ✅ Start server only after DB connects
const startServer = async () => {
  try {
    await connectDB();
    await createAdmin();
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();


