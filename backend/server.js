const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

// Import security middleware
const {
  helmet,
  cors,
  mongoSanitize,
  compression,
  sanitizeInput,
  requestSizeLimiter,
  generalLimiter,
  authLimiter,
  strictAuthLimiter,
  uploadLimiter,
  errorHandler,
  notFoundHandler
} = require('./middleware/security');

// Import models
const User = require("./models/User");
const Project = require("./models/Project");
const Task = require("./models/Task");
const Meeting = require("./models/Meeting");
const Notification = require("./models/Notification");
const ChatMessage = require("./models/ChatMessage");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/task");
const projectRoutes = require("./routes/project");
const meetingRoutes = require("./routes/meeting");
const notificationRoutes = require("./routes/notification");
const searchRoutes = require("./routes/search");

const app = express();
const server = http.createServer(app);

// Security middleware (order matters!)
app.use(helmet); // Security headers
app.use(compression); // Compress responses
app.use(cors); // CORS with proper configuration
app.use(requestSizeLimiter); // Limit request size
app.use(express.json({ limit: '10mb' })); // JSON parser with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize); // Prevent NoSQL injection
app.use(sanitizeInput); // Custom input sanitization
app.use(generalLimiter); // General rate limiting

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Socket.IO setup for real-time features
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make io available to routes
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join project room
  socket.on("joinProjectRoom", (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`User ${socket.id} joined project room: ${projectId}`);
  });

  // Leave project room
  socket.on("leaveProjectRoom", (projectId) => {
    socket.leave(`project_${projectId}`);
    console.log(`User ${socket.id} left project room: ${projectId}`);
  });

  // Handle project chat messages
  socket.on("projectChatMessage", async (data) => {
    try {
      const { projectId, senderId, message, replyTo } = data;

      // Save message to database
      const chatMessage = new ChatMessage({
        projectId,
        senderId,
        message,
        replyTo,
        timestamp: new Date(),
      });

      await chatMessage.save();
      await chatMessage.populate("senderId", "name email role");

      // Broadcast to all users in the project room
      io.to(`project_${projectId}`).emit("projectChatMessage", chatMessage);
    } catch (error) {
      console.error("Error handling chat message:", error);
    }
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    socket.to(`project_${data.projectId}`).emit("userTyping", {
      userId: data.senderId,
      userName: data.senderName,
    });
  });

  // Handle stop typing
  socket.on("stopTyping", (data) => {
    socket.to(`project_${data.projectId}`).emit("userStopTyping", {
      userId: data.senderId,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Mount API routes BEFORE 404 handler
// Auth routes with stricter rate limiting
app.use("/api/auth/login", strictAuthLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);

// Error handling and 404 middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
