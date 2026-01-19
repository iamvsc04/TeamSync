const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// Multer configuration for task attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/tasks");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Authentication middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

// Get all tasks for a project
router.get("/project/:projectId", authMiddleware, async (req, res) => {
  try {
    console.log("Fetching tasks for project:", req.params.projectId);
    console.log("User:", req.user);

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    console.log("Project members:", project.members);
    console.log("Project creator:", project.createdBy);

    // Check if user is member or admin
    const isAdmin = req.user.role === "admin";
    const isProjectMember = project.members
      .map((m) => String(m))
      .includes(req.user.userId);
    const isProjectCreator = String(project.createdBy) === req.user.userId;

    console.log("Authorization check:", {
      isAdmin,
      isProjectMember,
      isProjectCreator,
      userId: req.user.userId,
    });

    if (!isAdmin && !isProjectMember && !isProjectCreator) {
      return res.status(403).json({ message: "Not authorized to view tasks" });
    }

    // If user is not admin, only show tasks assigned to them or created by them
    let query = { project: req.params.projectId };
    if (!isAdmin && !isProjectCreator) {
      query.$or = [
        { assignedTo: req.user.userId },
        { createdBy: req.user.userId },
      ];
    }

    console.log("Query:", JSON.stringify(query, null, 2));

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("dependencies", "title status")
      .populate("comments.author", "name email")
      .populate("attachments.uploader", "name email")
      .populate("timeEntries.user", "name email")
      .sort({ priority: -1, dueDate: 1, createdAt: -1 });

    console.log("Found tasks:", tasks.length);
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get tasks assigned to current user
router.get("/my-tasks", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.userId })
      .populate("project", "name")
      .populate("createdBy", "name email")
      .populate("dependencies", "title status")
      .populate("assignedTo", "name email")
      .sort({ priority: -1, dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error("Error fetching my tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get tasks assigned to a specific user in a project
router.get(
  "/project/:projectId/user/:userId",
  authMiddleware,
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check authorization
      const isAdmin = req.user.role === "admin";
      const isProjectCreator = String(project.createdBy) === req.user.userId;
      const isRequestedUser = req.params.userId === req.user.userId;
      const isProjectMember = project.members
        .map((m) => String(m))
        .includes(req.user.userId);

      if (
        !isAdmin &&
        !isProjectCreator &&
        !isRequestedUser &&
        !isProjectMember
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to view these tasks" });
      }

      const tasks = await Task.find({
        project: req.params.projectId,
        assignedTo: req.params.userId,
      })
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .populate("dependencies", "title status")
        .populate("comments.author", "name email")
        .populate("attachments.uploader", "name email")
        .populate("timeEntries.user", "name email")
        .sort({ priority: -1, dueDate: 1, createdAt: -1 });

      res.json(tasks);
    } catch (err) {
      console.error("Error fetching user tasks:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get task by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name members")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("dependencies", "title status")
      .populate("comments.author", "name email")
      .populate("attachments.uploader", "name email")
      .populate("timeEntries.user", "name email")
      .populate("subtasks", "title status progress");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check authorization
    const project = task.project;
    if (
      req.user.role !== "admin" &&
      !project.members.map((m) => String(m)).includes(req.user.userId)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this task" });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create new task
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      assignedTo,
      priority,
      dueDate,
      estimatedHours,
      tags,
      dependencies,
    } = req.body;

    console.log("Creating task:", {
      title,
      project,
      assignedTo,
      createdBy: req.user.userId,
    });

    // Validate project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: "Project not found" });
    }

    console.log("Project members:", projectDoc.members);
    console.log("User role:", req.user.role);

    if (
      req.user.role !== "admin" &&
      !projectDoc.members.map((m) => String(m)).includes(req.user.userId)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to create tasks in this project" });
    }

    // Validate assigned user exists and is project member
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned user not found" });
      }
      if (!projectDoc.members.map((m) => String(m)).includes(assignedTo)) {
        return res
          .status(400)
          .json({ message: "Assigned user is not a project member" });
      }
    }

    const task = new Task({
      title,
      description,
      project,
      assignedTo: assignedTo || req.user.userId,
      createdBy: req.user.userId,
      priority,
      dueDate,
      estimatedHours,
      tags,
      dependencies,
    });

    await task.save();
    console.log("Task created successfully:", task._id);
    // Emit realtime event to project room
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`project_${project}`).emit("taskCreated", {
          taskId: String(task._id),
          projectId: String(project),
        });
      }
    } catch (e) {
      console.error("Socket emit error (taskCreated):", e);
    }

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name");

    res.status(201).json(populatedTask);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update task
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "project",
      "members"
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check authorization - allow if user is admin, project creator, or assigned to the task
    const isAdmin = req.user.role === "admin";
    const isProjectCreator = String(task.project.createdBy) === req.user.userId;
    const isAssignedToTask = String(task.assignedTo) === req.user.userId;
    const isProjectMember = task.project.members
      .map((m) => String(m))
      .includes(req.user.userId);

    if (
      !isAdmin &&
      !isProjectCreator &&
      !isAssignedToTask &&
      !isProjectMember
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this task" });
    }

    // Update fields
    const updateFields = [
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "estimatedHours",
      "progress",
      "tags",
      "dependencies",
    ];
    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    // Handle status change
    if (req.body.status && req.body.status !== task.status) {
      task.status = req.body.status;
      if (req.body.status === "completed") {
        task.completedDate = new Date();
      }
    }

    await task.save();
    // Emit realtime event
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`project_${task.project._id || task.project}`).emit(
          "taskUpdated",
          {
            taskId: String(task._id),
            projectId: String(task.project._id || task.project),
          }
        );
      }
    } catch (e) {
      console.error("Socket emit error (taskUpdated):", e);
    }

    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name");

    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete task
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "project",
      "members createdBy"
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only project creator or admin can delete tasks
    const project = task.project;
    if (
      req.user.role !== "admin" &&
      project.createdBy.toString() !== req.user.userId
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this task" });
    }

    // Remove task from dependencies of other tasks
    await Task.updateMany(
      { dependencies: task._id },
      { $pull: { dependencies: task._id } }
    );

    // Remove task from subtasks of parent task
    await Task.updateMany(
      { subtasks: task._id },
      { $pull: { subtasks: task._id } }
    );

    await Task.findByIdAndDelete(req.params.id);
    // Emit realtime event
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`project_${project._id || project}`).emit("taskDeleted", {
          taskId: String(req.params.id),
          projectId: String(project._id || project),
        });
      }
    } catch (e) {
      console.error("Socket emit error (taskDeleted):", e);
    }
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add comment to task
router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id).populate(
      "project",
      "members"
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check authorization
    const project = task.project;
    if (
      req.user.role !== "admin" &&
      !project.members.map((m) => String(m)).includes(req.user.userId)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to comment on this task" });
    }

    task.comments.push({
      text,
      author: req.user.userId,
    });

    await task.save();

    const updatedTask = await Task.findById(task._id).populate(
      "comments.author",
      "name email"
    );

    res.json(updatedTask.comments[updatedTask.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update comment
router.put("/:id/comments/:commentId", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only comment author can edit
    if (comment.author.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this comment" });
    }

    comment.text = text;
    comment.updatedAt = new Date();
    await task.save();

    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete comment
router.delete("/:id/comments/:commentId", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only comment author or admin can delete
    if (
      req.user.role !== "admin" &&
      comment.author.toString() !== req.user.userId
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    task.comments.pull(req.params.commentId);
    await task.save();

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Upload attachment to task
router.post(
  "/:id/attachments",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const task = await Task.findById(req.params.id).populate(
        "project",
        "members"
      );
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check authorization
      const project = task.project;
      if (
        req.user.role !== "admin" &&
        !project.members.map((m) => String(m)).includes(req.user.userId)
      ) {
        return res.status(403).json({
          message: "Not authorized to upload attachments to this task",
        });
      }

      task.attachments.push({
        filename: req.file.filename,
        originalname: req.file.originalname,
        uploader: req.user.userId,
      });

      await task.save();

      const updatedTask = await Task.findById(task._id).populate(
        "attachments.uploader",
        "name email"
      );

      res.json(updatedTask.attachments[updatedTask.attachments.length - 1]);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Download task attachment
router.get(
  "/:id/attachments/:attachmentId/download",
  authMiddleware,
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id).populate(
        "project",
        "members"
      );
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check authorization
      const project = task.project;
      if (
        req.user.role !== "admin" &&
        !project.members.map((m) => String(m)).includes(req.user.userId)
      ) {
        return res.status(403).json({
          message: "Not authorized to download attachments from this task",
        });
      }

      const attachment = task.attachments.id(req.params.attachmentId);
      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      const filePath = path.join(
        __dirname,
        "../uploads/tasks",
        attachment.filename
      );
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on server" });
      }

      res.download(filePath, attachment.originalname);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Start time tracking
router.post("/:id/start-timer", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "project",
      "members"
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check authorization
    const project = task.project;
    if (
      req.user.role !== "admin" &&
      !project.members.map((m) => String(m)).includes(req.user.userId)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to track time on this task" });
    }

    // Check if user already has an active timer
    const activeTimer = task.timeEntries.find(
      (entry) => entry.user.toString() === req.user.userId && !entry.endTime
    );

    if (activeTimer) {
      return res
        .status(400)
        .json({ message: "You already have an active timer for this task" });
    }

    task.timeEntries.push({
      user: req.user.userId,
      startTime: new Date(),
    });

    await task.save();

    const updatedTask = await Task.findById(task._id).populate(
      "timeEntries.user",
      "name email"
    );

    res.json(updatedTask.timeEntries[updatedTask.timeEntries.length - 1]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Stop time tracking
router.post("/:id/stop-timer", authMiddleware, async (req, res) => {
  try {
    const { description } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const activeTimer = task.timeEntries.find(
      (entry) => entry.user.toString() === req.user.userId && !entry.endTime
    );

    if (!activeTimer) {
      return res
        .status(400)
        .json({ message: "No active timer found for this task" });
    }

    const endTime = new Date();
    const duration = Math.round(
      (endTime - activeTimer.startTime) / (1000 * 60)
    ); // Duration in minutes

    activeTimer.endTime = endTime;
    activeTimer.duration = duration;
    activeTimer.description = description || "";

    // Update actual hours
    task.actualHours = task.timeEntries.reduce((total, entry) => {
      return total + (entry.duration || 0) / 60; // Convert minutes to hours
    }, 0);

    await task.save();

    const updatedTask = await Task.findById(task._id).populate(
      "timeEntries.user",
      "name email"
    );

    res.json(activeTimer);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get task templates
router.get("/templates", authMiddleware, async (req, res) => {
  try {
    const templates = await Task.find({ isTemplate: true })
      .populate("createdBy", "name email")
      .sort({ templateName: 1 });

    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create task template
router.post("/templates", authMiddleware, async (req, res) => {
  try {
    const { templateName, title, description, priority, estimatedHours, tags } =
      req.body;

    const template = new Task({
      title,
      description,
      templateName,
      priority,
      estimatedHours,
      tags,
      isTemplate: true,
      createdBy: req.user.userId,
    });

    await template.save();

    const populatedTemplate = await Task.findById(template._id).populate(
      "createdBy",
      "name email"
    );

    res.status(201).json(populatedTemplate);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create task from template
router.post("/from-template/:templateId", authMiddleware, async (req, res) => {
  try {
    const { project, assignedTo, dueDate } = req.body;

    const template = await Task.findById(req.params.templateId);
    if (!template || !template.isTemplate) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Validate project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (
      req.user.role !== "admin" &&
      !projectDoc.members.map((m) => String(m)).includes(req.user.userId)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to create tasks in this project" });
    }

    const task = new Task({
      title: template.title,
      description: template.description,
      project,
      assignedTo: assignedTo || req.user.userId,
      createdBy: req.user.userId,
      priority: template.priority,
      dueDate,
      estimatedHours: template.estimatedHours,
      tags: template.tags,
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name");

    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Subtasks: create as a child of a task
router.post("/:id/subtasks", authMiddleware, async (req, res) => {
  try {
    const parent = await Task.findById(req.params.id).populate(
      "project",
      "members createdBy"
    );
    if (!parent)
      return res.status(404).json({ message: "Parent task not found" });

    const project = parent.project;
    const isAdmin = req.user.role === "admin";
    const isProjectMember = project.members
      .map((m) => String(m))
      .includes(req.user.userId);
    const isCreator = String(project.createdBy) === req.user.userId;
    if (!isAdmin && !isProjectMember && !isCreator) {
      return res
        .status(403)
        .json({ message: "Not authorized to create subtasks" });
    }

    const { title, description, assignedTo, priority, dueDate } = req.body;
    const subtask = new Task({
      title,
      description: description || "",
      project: parent.project._id || parent.project,
      assignedTo: assignedTo || req.user.userId,
      createdBy: req.user.userId,
      priority: priority || "medium",
      dueDate,
      parentTask: parent._id,
      status: "pending",
    });
    await subtask.save();
    parent.subtasks.push(subtask._id);
    await parent.save();
    const populated = await Task.findById(subtask._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// List subtasks of a task
router.get("/:id/subtasks", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "project",
      "members"
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = task.project;
    if (
      req.user.role !== "admin" &&
      !project.members.map((m) => String(m)).includes(req.user.userId)
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const subtasks = await Task.find({ _id: { $in: task.subtasks } })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");
    res.json(subtasks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update a subtask (same auth as task update)
router.put(
  "/:parentId/subtasks/:subtaskId",
  authMiddleware,
  async (req, res) => {
    try {
      const subtask = await Task.findById(req.params.subtaskId).populate(
        "project",
        "members createdBy"
      );
      if (!subtask)
        return res.status(404).json({ message: "Subtask not found" });
      const isAdmin = req.user.role === "admin";
      const isProjectCreator =
        String(subtask.project.createdBy) === req.user.userId;
      const isAssigned = String(subtask.assignedTo) === req.user.userId;
      const isProjectMember = subtask.project.members
        .map((m) => String(m))
        .includes(req.user.userId);
      if (!isAdmin && !isProjectCreator && !isAssigned && !isProjectMember) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this subtask" });
      }
      const fields = [
        "title",
        "description",
        "status",
        "priority",
        "dueDate",
        "progress",
      ];
      fields.forEach((f) => {
        if (req.body[f] !== undefined) subtask[f] = req.body[f];
      });
      await subtask.save();
      const updated = await Task.findById(subtask._id)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email");
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete a subtask and remove from parent
router.delete(
  "/:parentId/subtasks/:subtaskId",
  authMiddleware,
  async (req, res) => {
    try {
      const parent = await Task.findById(req.params.parentId).populate(
        "project",
        "members createdBy"
      );
      if (!parent)
        return res.status(404).json({ message: "Parent task not found" });
      const isAdmin = req.user.role === "admin";
      const isProjectCreator =
        String(parent.project.createdBy) === req.user.userId;
      if (!isAdmin && !isProjectCreator) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete subtask" });
      }
      await Task.findByIdAndDelete(req.params.subtaskId);
      await Task.updateOne(
        { _id: parent._id },
        { $pull: { subtasks: req.params.subtaskId } }
      );
      res.json({ message: "Subtask deleted" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get task analytics
router.get(
  "/analytics/project/:projectId",
  authMiddleware,
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check authorization
      if (
        req.user.role !== "admin" &&
        !project.members.map((m) => String(m)).includes(req.user.userId)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to view analytics" });
      }

      const tasks = await Task.find({ project: req.params.projectId });

      const analytics = {
        total: tasks.length,
        byStatus: {
          pending: tasks.filter((t) => t.status === "pending").length,
          "in-progress": tasks.filter((t) => t.status === "in-progress").length,
          completed: tasks.filter((t) => t.status === "completed").length,
          blocked: tasks.filter((t) => t.status === "blocked").length,
          review: tasks.filter((t) => t.status === "review").length,
        },
        byPriority: {
          low: tasks.filter((t) => t.priority === "low").length,
          medium: tasks.filter((t) => t.priority === "medium").length,
          high: tasks.filter((t) => t.priority === "high").length,
          critical: tasks.filter((t) => t.priority === "critical").length,
        },
        overdue: tasks.filter(
          (t) => t.dueDate && t.dueDate < new Date() && t.status !== "completed"
        ).length,
        totalEstimatedHours: tasks.reduce(
          (sum, t) => sum + (t.estimatedHours || 0),
          0
        ),
        totalActualHours: tasks.reduce(
          (sum, t) => sum + (t.actualHours || 0),
          0
        ),
        averageProgress:
          tasks.length > 0
            ? tasks.reduce((sum, t) => sum + (t.progress || 0), 0) /
              tasks.length
            : 0,
      };

      res.json(analytics);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
