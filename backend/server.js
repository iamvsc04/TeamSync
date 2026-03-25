const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const http = require("http");
const { Server } = require("socket.io");
const {
  helmet,
  cors,
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

const initScheduler = require("./utils/scheduler");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/task");
const projectRoutes = require("./routes/project");
const meetingRoutes = require("./routes/meeting");
const notificationRoutes = require("./routes/notification");
const searchRoutes = require("./routes/search");

const app = express();
const server = http.createServer(app);

app.use(helmet);
app.use(compression);
app.use(cors);
app.use(requestSizeLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    writable: true,
    configurable: true,
    value: req.query
  });
  next();
});


app.use(sanitizeInput);
app.use(generalLimiter);

app.set('trust proxy', 1);

const io = require("socket.io")(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinProjectRoom", (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`User ${socket.id} joined project room: ${projectId}`);
  });

  // Leave project room
  socket.on("leaveProjectRoom", (projectId) => {
    socket.leave(`project_${projectId}`);
    console.log(`User ${socket.id} left project room: ${projectId}`);
  });

  socket.on("projectChatMessage", async (data) => {
    try {
      const { projectId, senderId, message, replyTo } = data;
      const chatMessage = new ChatMessage({
        projectId,
        senderId,
        message,
        replyTo,
        timestamp: new Date(),
      });

      await chatMessage.save();
      await chatMessage.populate("senderId", "name email role");

      io.to(`project_${projectId}`).emit("projectChatMessage", chatMessage);
    } catch (error) {
      console.error("Error handling chat message:", error);
    }
  });

  socket.on("typing", (data) => {
    socket.to(`project_${data.projectId}`).emit("userTyping", {
      userId: data.senderId,
      userName: data.senderName,
    });
  });

  socket.on("stopTyping", (data) => {
    socket.to(`project_${data.projectId}`).emit("userStopTyping", {
      userId: data.senderId,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

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

// --- Deployment: Serve static files in production ---
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    // If request is not an API call, serve index.html
    if (!req.path.startsWith("/api/")) {
      res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
    }
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    initScheduler();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
