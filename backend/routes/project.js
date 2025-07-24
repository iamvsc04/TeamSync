const express = require("express");
const Project = require("../models/Project");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const ChatMessage = require("../models/ChatMessage");

const router = express.Router();

// Middleware to check JWT and set req.user
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function generateJoinCode(length = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new project
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, members, status } = req.body;
    const createdBy = req.user.userId;
    if (!name || !createdBy) {
      return res
        .status(400)
        .json({ message: "Project name and creator are required." });
    }
    let joinCode;
    let unique = false;
    // Ensure joinCode is unique
    while (!unique) {
      joinCode = generateJoinCode();
      const existing = await Project.findOne({ joinCode });
      if (!existing) unique = true;
    }
    const project = new Project({
      name,
      description,
      members: members || [],
      status: status || "active",
      createdBy,
      joinCode,
    });
    await project.save();
    res.status(201).json({ message: "Project created successfully.", project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// Get all ongoing (active) projects
router.get("/ongoing", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ status: "active" }).sort({
      createdAt: -1,
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Get all projects created by the current admin
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ createdBy: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Get project details by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("members", "name email role")
      .populate("joinRequests.user", "name email");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Add members to a project
router.post("/:id/members", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can add members" });
  }
  try {
    const { members } = req.body; // array of user IDs
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: { $each: members } } },
      { new: true }
    ).populate("members", "name email role");
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Schedule a meeting for a project
router.post("/:id/meetings", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Only admin can schedule meetings" });
  }
  try {
    const { title, date, link } = req.body;
    if (!title || !date) {
      return res
        .status(400)
        .json({ message: "Meeting title and date are required." });
    }
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $push: { meetings: { title, date, link } } },
      { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Member requests to join a project by join code
router.post("/join-request", authMiddleware, async (req, res) => {
  try {
    const { joinCode } = req.body;
    if (!joinCode)
      return res.status(400).json({ message: "Join code is required." });
    const project = await Project.findOne({ joinCode });
    if (!project)
      return res.status(404).json({ message: "Project not found." });
    // Check if already a member
    if (project.members.some((id) => id.toString() === req.user.userId)) {
      return res
        .status(400)
        .json({ message: "You are already a member of this project." });
    }
    // Check if already requested
    if (
      project.joinRequests.some(
        (r) => r.user.toString() === req.user.userId && r.status === "pending"
      )
    ) {
      return res
        .status(400)
        .json({ message: "You have already requested to join this project." });
    }
    // Add join request
    project.joinRequests.push({ user: req.user.userId });
    await project.save();
    res.json({ message: "Join request sent. Awaiting admin approval." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Admin: Get all join requests for projects they own
router.get("/join-requests", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admins only" });
  try {
    const projects = await Project.find({ createdBy: req.user.userId })
      .populate("joinRequests.user", "name email")
      .select("name joinRequests");
    // Flatten join requests with project info
    const requests = [];
    projects.forEach((project) => {
      project.joinRequests.forEach((reqst) => {
        if (reqst.status === "pending") {
          requests.push({
            projectId: project._id,
            projectName: project.name,
            user: reqst.user,
            status: reqst.status,
            requestedAt: reqst.requestedAt,
          });
        }
      });
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Admin: Approve or reject a join request
router.patch(
  "/join-request/:projectId/:userId",
  authMiddleware,
  async (req, res) => {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admins only" });
    try {
      const { status } = req.body;
      if (!["approved", "rejected"].includes(status))
        return res.status(400).json({ message: "Invalid status." });
      const { projectId, userId } = req.params;
      const project = await Project.findById(projectId);
      if (!project)
        return res.status(404).json({ message: "Project not found." });
      if (project.createdBy.toString() !== req.user.userId)
        return res.status(403).json({ message: "Not your project." });
      const joinReq = project.joinRequests.find(
        (r) => r.user.toString() === userId && r.status === "pending"
      );
      if (!joinReq)
        return res.status(404).json({ message: "Join request not found." });
      joinReq.status = status;
      if (status === "approved") {
        // Add user to members if not already
        if (!project.members.some((m) => m.toString() === userId)) {
          project.members.push(userId);
        }
      }
      await project.save();
      res.json({ message: `Request ${status}.` });
    } catch (err) {
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Member: Get all join requests made by the user
router.get("/my-join-requests", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      "joinRequests.user": req.user.userId,
    }).select("name joinRequests");
    const requests = [];
    projects.forEach((project) => {
      project.joinRequests.forEach((reqst) => {
        if (reqst.user.toString() === req.user.userId) {
          requests.push({
            projectId: project._id,
            projectName: project.name,
            status: reqst.status,
            requestedAt: reqst.requestedAt,
          });
        }
      });
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Member: Get all projects where the user is a member
router.get("/member-projects", authMiddleware, async (req, res) => {
  try {
    console.log('Fetching projects for user:', req.user.userId);
    const projects = await Project.find({ members: req.user.userId })
      .populate("members", "name email role")
      .sort({ createdAt: -1 });
    console.log('Projects found:', projects.map(p => ({ id: p._id, name: p.name })));
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Get chat history for a project
router.get("/:projectId/chat", authMiddleware, async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    // Only members or admins can view chat
    if (
      req.user.role !== "admin" &&
      !project.members.map(m => String(m)).includes(req.user.userId)
    ) {
      return res.status(403).json({ message: "Not authorized to view chat" });
    }
    const messages = await ChatMessage.find({ projectId })
      .sort({ timestamp: 1 })
      .populate("senderId", "name email role");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
