import User from "../models/user.model.js";

// ─────────────────────────────────────────────────────────────
// @desc    Get all users (for admin dashboard or user list)
// @route   GET /api/users
// @access  Admin / Protected
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Protected / Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Update user details (e.g., username or profile picture)
// @route   PUT /api/users/:id
// @access  Protected / User or Admin
export const updateUser = async (req, res) => {
  try {
    const { username, profilePic } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username) user.username = username;
    if (profilePic) user.profilePic = profilePic;

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
      isVerified: updatedUser.isVerified,
      isAdmin: updatedUser.isAdmin,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Delete user by ID (admin use only)
// @route   DELETE /api/users/:id
// @access  Admin only
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found or already deleted" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

