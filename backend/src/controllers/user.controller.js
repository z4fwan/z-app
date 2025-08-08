import User from "../models/user.model.js";

// GET /api/users - Get all users (admin only)
export const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json(users);
};

// GET /api/users/:id - Get single user by ID
export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json(user);
};

// PUT /api/users/:id - Update user by ID
export const updateUser = async (req, res) => {
  const { username, email, profilePic } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { username, email, profilePic },
    { new: true }
  ).select("-password");

  if (!updatedUser) return res.status(404).json({ message: "User not found" });
  res.status(200).json(updatedUser);
};

// DELETE /api/users/:id - Delete user by ID
export const deleteUser = async (req, res) => {
  const deletedUser = await User.findByIdAndDelete(req.params.id);
  if (!deletedUser) return res.status(404).json({ message: "User not found" });
  res.status(200).json({ message: "User deleted successfully" });
};
