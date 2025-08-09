import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";
<<<<<<< HEAD
=======

>>>>>>> 05bbbb6ac96808c36f1618b6c65a7d7b8538de09
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import User from "./models/user.model.js";

// Load environment variables
dotenv.config();
<<<<<<< HEAD
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
=======
>>>>>>> 05bbbb6ac96808c36f1618b6c65a7d7b8538de09

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

<<<<<<< HEAD
// Middleware
app.use(express.json());
=======
// ✅ Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
>>>>>>> 05bbbb6ac96808c36f1618b6c65a7d7b8538de09
app.use(cookieParser());

// ✅ CORS settings
const allowedOrigins = [
  "http://localhost:5173", // Dev
  "https://z-app-official-frontend.onrender.com", // Prod
];

app.use(
  cors({
<<<<<<< HEAD
    origin: [FRONTEND_URL, "http://localhost:5173"],
=======
    origin: allowedOrigins,
>>>>>>> 05bbbb6ac96808c36f1618b6c65a7d7b8538de09
    credentials: true,
  })
);

<<<<<<< HEAD
// Routes
=======
// ✅ API Routes
>>>>>>> 05bbbb6ac96808c36f1618b6c65a7d7b8538de09
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

<<<<<<< HEAD
// Serve frontend (production build)
if (process.env.NODE_ENV === "production") {
  // ✅ Serve from backend/dist since build is copied here
  app.use(express.static(path.join(__dirname, "./dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "./dist/index.html"));
  });
}

// Create default admin if not exists
const createDefaultAdmin = async () => {
=======
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
>>>>>>> 05bbbb6ac96808c36f1618b6c65a7d7b8538de09
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("⚠ ADMIN_EMAIL not set in .env");
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail });

<<<<<<< HEAD
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("safwan123", 10);
      const admin = new User({
        fullName: "Admin",
=======
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("safwan123", 10);
      await User.create({
        username: "admin",
>>>>>>> 05bbbb6ac96808c36f1618b6c65a7d7b8538de09
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

<<<<<<< HEAD
// Start server
server.listen(PORT, async () => {
  await connectDB();
  await createDefaultAdmin();
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
=======
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


>>>>>>> 05bbbb6ac96808c36f1618b6c65a7d7b8538de09
