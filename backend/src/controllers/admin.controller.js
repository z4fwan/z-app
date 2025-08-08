import User from "../models/user.model.js";

// ✅ Safe Socket Emit Utility
const emitToUser = (io, userId, event, data) => {
  if (!io || !userId || !global.userSocketMap) return;
  const socketId = global.userSocketMap[userId];
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

// ✅ Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// ✅ Suspend a user
export const suspendUser = async (req, res) => {
  const { userId } = req.params;
  const { until, reason } = req.body;

  if (!until || !reason) {
    return res.status(400).json({ error: "Suspension reason and duration are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const suspendUntilDate = new Date(until);
    if (isNaN(suspendUntilDate.getTime())) {
      return res.status(400).json({ error: "Invalid suspension date" });
    }

    user.isSuspended = true;
    user.suspendedUntil = suspendUntilDate;
    user.suspensionReason = reason;
    await user.save();

    const io = req.app.get("io");
    emitToUser(io, userId, "user-action", {
      type: "suspended",
      reason,
      until: suspendUntilDate,
    });

    res.status(200).json({ message: "User suspended", user });
  } catch (err) {
    console.error("suspendUser error:", err);
    res.status(500).json({ error: "Failed to suspend user" });
  }
};

// ✅ Unsuspend user
export const unsuspendUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isSuspended = false;
    user.suspendedUntil = null;
    user.suspensionReason = null;
    await user.save();

    const io = req.app.get("io");
    emitToUser(io, userId, "user-action", {
      type: "unsuspended",
    });

    res.status(200).json({ message: "User unsuspended", user });
  } catch (err) {
    console.error("unsuspendUser error:", err);
    res.status(500).json({ error: "Failed to unsuspend user" });
  }
};

// ✅ Block user
export const blockUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isBlocked = true;
    await user.save();

    const io = req.app.get("io");
    emitToUser(io, userId, "user-action", {
      type: "blocked",
    });

    res.status(200).json({ message: "User blocked", user });
  } catch (err) {
    console.error("blockUser error:", err);
    res.status(500).json({ error: "Failed to block user" });
  }
};

// ✅ Unblock user
export const unblockUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isBlocked = false;
    await user.save();

    const io = req.app.get("io");
    emitToUser(io, userId, "user-action", {
      type: "unblocked",
    });

    res.status(200).json({ message: "User unblocked", user });
  } catch (err) {
    console.error("unblockUser error:", err);
    res.status(500).json({ error: "Failed to unblock user" });
  }
};

// ✅ Delete user
export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const io = req.app.get("io");
    emitToUser(io, userId, "user-action", {
      type: "deleted",
    });

    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// ✅ Toggle verification
export const toggleVerification = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isVerified = !user.isVerified;
    await user.save();

    res.status(200).json({
      message: `User verification ${user.isVerified ? "enabled" : "disabled"}`,
      user,
    });
  } catch (err) {
    console.error("toggleVerification error:", err);
    res.status(500).json({ error: "Failed to toggle verification" });
  }
};
