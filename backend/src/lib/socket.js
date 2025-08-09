import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// ✅ Setup Socket.IO server
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",                // Local frontend
      "https://z-app-frontend-2-0.onrender.com" // Render frontend
    ],
    credentials: true,
  },
});

// ✅ Store userId -> socketId
const userSocketMap = {}; // { userId: socketId }

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

// ✅ Emit to a specific user by userId
export const emitToUser = (userId, event, data) => {
  const socketId = userSocketMap[userId];
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

// ✅ Socket.IO logic
io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  socket.on("register-user", (userId) => {
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`✅ Registered user ${userId} with socket ${socket.id}`);
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);

    const disconnectedUserId = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket.id
    );

    if (disconnectedUserId) {
      delete userSocketMap[disconnectedUserId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

// ✅ Export for index.js
export { io, server, app, userSocketMap };
