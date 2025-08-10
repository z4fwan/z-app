import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.model.js";
import { generateToken } from "../lib/utils.js";

// ─── Signup ─────────────────────────────────────────────
export const signup = async (req, res) => {
  const { fullName, email, password, profilePic } = req.body;
  console.log("Signup request body:", req.body);

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let uploadedProfilePic = "";
    if (profilePic) {
      try {
        const uploadResult = await cloudinary.uploader.upload(profilePic);
        uploadedProfilePic = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary Upload Error:", uploadError);
        return res.status(500).json({ message: "Failed to upload profile picture." });
      }
    }

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      profilePic: uploadedProfilePic,
    });

    await newUser.save();
    generateToken(newUser._id, res);

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
      isAdmin: newUser.email === process.env.ADMIN_EMAIL,
      isBlocked: newUser.isBlocked,
      isSuspended: newUser.isSuspended,
      isVerified: newUser.isVerified,
      isOnline: newUser.isOnline,
      createdAt: newUser.createdAt,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Signup failed. Please try again later." });
  }
};

// ─── Login ─────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

    if (user.isBlocked) return res.status(403).json({ message: "Your account is blocked." });
    if (user.isSuspended) return res.status(403).json({ message: "Your account is suspended." });

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      isAdmin: user.email === process.env.ADMIN_EMAIL,
      isBlocked: user.isBlocked,
      isSuspended: user.isSuspended,
      isVerified: user.isVerified,
      isOnline: user.isOnline,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed. Please try again later." });
  }
};

// ─── Logout ─────────────────────────────────────────────
export const logout = (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production", // match login cookie settings
    });
    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Logout failed. Please try again." });
  }
};

// ─── Update Profile ─────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required." });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Failed to update profile picture." });
  }
};

// ─── Check Auth ─────────────────────────────────────────
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      isAdmin: user.email === process.env.ADMIN_EMAIL,
      isBlocked: user.isBlocked,
      isSuspended: user.isSuspended,
      isVerified: user.isVerified,
      isOnline: user.isOnline,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Check Auth Error:", error);
    res.status(500).json({ message: "Failed to verify authentication." });
  }
};
