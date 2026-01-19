const express = require("express");
const Project = require("../models/Project");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const ChatMessage = require("../models/ChatMessage");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "../uploads"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

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

// Update project details (name, description, status) - only creator or admin
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const isAdmin = req.user.role === "admin";
    const isCreator = String(project.createdBy) === req.user.userId;
    if (!isAdmin && !isCreator) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this project." });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (
      status !== undefined &&
      ["active", "completed", "archived"].includes(status)
    ) {
      project.status = status;
    }

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("members", "name email role")
      .populate("createdBy", "name email");

    return res.json(populated);
  } catch (err) {
    console.error("Error updating project:", err);
    return res.status(500).json({ message: "Server error." });
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
    console.error("Error in my-join-requests route:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Member: Get all projects where the user is a member
router.get("/member-projects", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.user.userId,
    })
      .populate("members", "name email role")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    console.error("Error in member-projects route:", err);
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

// Add member to project by email (admin only)
router.post("/:id/add-member-by-email", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can add members" });
  }
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    // Only allow admins who own the project
    if (project.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not your project." });
    }
    // Check if already a member
    if (project.members.some((id) => id.toString() === user._id.toString())) {
      return res
        .status(400)
        .json({ message: "User is already a member of this project." });
    }
    project.members.push(user._id);
    await project.save();

    // Create notification for the user who was added
    try {
      const Notification = require("../models/Notification");
      await Notification.createNotification({
        recipient: user._id,
        sender: req.user.userId,
        type: "project_invitation",
        title: "Added to Project",
        message: `You have been added to the project "${project.name}" by the admin.`,
        project: project._id,
        category: "projects",
        priority: "medium",
      });
    } catch (notificationErr) {
      console.error("Error creating notification:", notificationErr);
      // Don't fail the main request if notification fails
    }

    const updatedProject = await Project.findById(req.params.id).populate(
      "members",
      "name email role"
    );
    res.json({
      message: "Member added successfully.",
      project: updatedProject,
    });
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

    // Create notification for the project admin
    try {
      const Notification = require("../models/Notification");
      const User = require("../models/User");
      const user = await User.findById(req.user.userId).select("name email");

      await Notification.createNotification({
        recipient: project.createdBy,
        sender: req.user.userId,
        type: "join_request",
        title: "New Join Request",
        message: `${user.name} (${user.email}) has requested to join your project "${project.name}"`,
        project: project._id,
        category: "projects",
        priority: "medium",
      });
    } catch (notificationErr) {
      console.error("Error creating notification:", notificationErr);
      // Don't fail the main request if notification fails
    }

    res.json({ message: "Join request sent. Awaiting admin approval." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Admin: Get all join requests for projects they own
router.get("/join-requests", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }

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

        // Create notification for the user whose request was approved
        try {
          const Notification = require("../models/Notification");
          await Notification.createNotification({
            recipient: userId,
            sender: req.user.userId,
            type: "join_request_approved",
            title: "Join Request Approved",
            message: `Your join request for project "${project.name}" has been approved!`,
            project: projectId,
            category: "projects",
            priority: "medium",
          });
        } catch (notificationErr) {
          console.error("Error creating notification:", notificationErr);
          // Don't fail the main request if notification fails
        }
      } else if (status === "rejected") {
        // Create notification for the user whose request was rejected
        try {
          const Notification = require("../models/Notification");
          await Notification.createNotification({
            recipient: userId,
            sender: req.user.userId,
            type: "join_request_rejected",
            title: "Join Request Rejected",
            message: `Your join request for project "${project.name}" has been rejected.`,
            project: projectId,
            category: "projects",
            priority: "medium",
          });
        } catch (notificationErr) {
          console.error("Error creating notification:", notificationErr);
          // Don't fail the main request if notification fails
        }
      }

      await project.save();
      // Return updated project for frontend
      const updatedProject = await Project.findById(projectId).populate(
        "members",
        "name email role"
      );
      res.json({ message: `Request ${status}.`, project: updatedProject });
    } catch (err) {
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Get project chat messages
router.get("/:id/chat", authMiddleware, async (req, res) => {
  try {
    const projectId = req.params.id;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is a member of the project
    const isMember = project.members.some(
      (member) =>
        member._id.toString() === req.user.userId ||
        member.toString() === req.user.userId
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const total = await ChatMessage.countDocuments({ projectId });
    const messages = await ChatMessage.find({ projectId })
      .populate("senderId", "name email role")
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send chat message
router.post("/:id/chat", authMiddleware, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { message, replyTo } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is a member of the project
    const isMember = project.members.some(
      (member) =>
        member._id.toString() === req.user.userId ||
        member.toString() === req.user.userId
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const chatMessage = new ChatMessage({
      projectId,
      senderId: req.user.userId,
      message: message.trim(),
      replyTo: replyTo || null,
      timestamp: new Date(),
    });

    await chatMessage.save();

    // Populate sender info for the response
    await chatMessage.populate("senderId", "name email role");

    res.status(201).json(chatMessage);
  } catch (error) {
    console.error("Error sending chat message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload a document to a project (admin only)
router.post(
  "/:id/documents",
  authMiddleware,
  upload.array("file", 10), // Allow up to 10 files
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can upload documents" });
    }
    try {
      const project = await Project.findById(req.params.id);
      if (!project)
        return res.status(404).json({ message: "Project not found" });
      if (project.createdBy.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Not your project." });
      }
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded." });
      }

      const uploadedDocs = [];
      for (const file of req.files) {
        const docMeta = {
          filename: file.filename,
          originalname: file.originalname,
          uploader: req.user.userId,
        };
        project.documents.push(docMeta);
        uploadedDocs.push(docMeta);
      }

      await project.save();
      res.status(201).json({
        message: `${uploadedDocs.length} document(s) uploaded.`,
        documents: uploadedDocs,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error." });
    }
  }
);

// List all documents for a project
router.get("/:id/documents", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "documents.uploader",
      "name email"
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    // Only members or admins can view documents
    if (
      req.user.role !== "admin" &&
      !project.members.map((m) => String(m)).includes(req.user.userId)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view documents" });
    }
    res.json(project.documents);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Download a document
router.get(
  "/:id/documents/:docId/download",
  authMiddleware,
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project)
        return res.status(404).json({ message: "Project not found" });
      // Only members or admins can download documents
      if (
        req.user.role !== "admin" &&
        !project.members.map((m) => String(m)).includes(req.user.userId)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to download documents" });
      }
      const doc = project.documents.id(req.params.docId);
      if (!doc) return res.status(404).json({ message: "Document not found" });
      const filePath = path.join(__dirname, "../uploads", doc.filename);
      res.download(filePath, doc.originalname);
    } catch (err) {
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Preview a document
router.get(
  "/:id/documents/:docId/preview",
  authMiddleware,
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project)
        return res.status(404).json({ message: "Project not found" });
      // Only members or admins can preview documents
      if (
        req.user.role !== "admin" &&
        !project.members.map((m) => String(m)).includes(req.user.userId)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to preview documents" });
      }
      const doc = project.documents.id(req.params.docId);
      if (!doc) return res.status(404).json({ message: "Document not found" });
      const filePath = path.join(__dirname, "../uploads", doc.filename);

      // Set appropriate headers for preview
      res.setHeader("Content-Type", getContentType(doc.originalname));
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + doc.originalname + '"'
      );

      // Stream the file
      const fs = require("fs");
      if (fs.existsSync(filePath)) {
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else {
        res.status(404).json({ message: "File not found on server" });
      }
    } catch (err) {
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Remove a document
router.delete("/:id/documents/:docId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only admins can remove documents
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can remove documents" });
    }

    // Check if user is the project creator
    if (project.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Not authorized to remove documents from this project",
      });
    }

    const doc = project.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Remove file from filesystem
    const filePath = path.join(__dirname, "../uploads", doc.filename);
    const fs = require("fs");
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove document from project
    project.documents.pull(req.params.docId);
    await project.save();

    res.json({ message: "Document removed successfully" });
  } catch (err) {
    console.error("Error removing document:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Helper function to determine content type
function getContentType(filename) {
  const ext = filename.toLowerCase().split(".").pop();
  const contentTypes = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };
  return contentTypes[ext] || "application/octet-stream";
}

// Admin: Remove member from project
router.delete("/:id/members/:userId", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can remove members" });
  }
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    if (project.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not your project." });
    }

    const memberId = req.params.userId;
    project.members = project.members.filter((m) => m.toString() !== memberId);
    await project.save();

    const updatedProject = await Project.findById(req.params.id).populate(
      "members",
      "name email role"
    );
    res.json({
      message: "Member removed successfully.",
      project: updatedProject,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Admin: Assign role to member (requires User model update)
router.patch("/:id/members/:userId/role", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can assign roles" });
  }
  try {
    const { role } = req.body;
    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    if (project.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not your project." });
    }

    // Update user role in User collection
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Role assigned successfully.", user });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
