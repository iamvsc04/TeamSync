const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/task");
const projectRoutes = require("./routes/project");
const ChatMessage = require("./models/ChatMessage");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Adjust to your frontend's dev URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  socket.on("joinProjectRoom", (projectId) => {
    socket.join(`project:${projectId}`);
    console.log(`User ${socket.id} joined room project:${projectId}`);
  });

  socket.on("leaveProjectRoom", (projectId) => {
    socket.leave(`project:${projectId}`);
    console.log(`User ${socket.id} left room project:${projectId}`);
  });

  socket.on("projectChatMessage", async ({ projectId, senderId, message }) => {
    if (!projectId || !senderId || !message) return;
    try {
      const chatMsg = new ChatMessage({ projectId, senderId, message });
      await chatMsg.save();
      io.to(`project:${projectId}`).emit("projectChatMessage", {
        _id: chatMsg._id,
        projectId,
        senderId,
        message,
        timestamp: chatMsg.timestamp,
      });
    } catch (err) {
      console.error("Error saving project chat message:", err);
    }
  });

  // Placeholder for chat message event (to be implemented next)
  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
