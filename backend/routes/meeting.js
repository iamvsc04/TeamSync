const express = require("express");
const router = express.Router();
const Meeting = require("../models/Meeting");
const Project = require("../models/Project");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// Multer configuration for meeting attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/meetings");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
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

// Get all meetings for a project
router.get("/project/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is member or admin
    if (
      req.user.role !== "admin" &&
      !project.members.map(m => String(m)).includes(req.user.userId)
    ) {
      return res.status(403).json({ message: "Not authorized to view meetings" });
    }

    const meetings = await Meeting.find({ project: req.params.projectId })
      .populate("organizer", "name email")
      .populate("attendees.user", "name email")
      .populate("agenda.presenter", "name email")
      .populate("minutes.recordedBy", "name email")
      .populate("minutes.actionItems.assignedTo", "name email")
      .populate("attachments.uploader", "name email")
      .sort({ startTime: 1 });

    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get meetings for current user
router.get("/my-meetings", authMiddleware, async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { organizer: req.user.userId },
        { "attendees.user": req.user.userId }
      ]
    })
      .populate("project", "name")
      .populate("organizer", "name email")
      .populate("attendees.user", "name email")
      .sort({ startTime: 1 });

    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get meeting by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate("project", "name members")
      .populate("organizer", "name email")
      .populate("attendees.user", "name email")
      .populate("agenda.presenter", "name email")
      .populate("minutes.recordedBy", "name email")
      .populate("minutes.actionItems.assignedTo", "name email")
      .populate("attachments.uploader", "name email");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check authorization
    const project = meeting.project;
    if (
      req.user.role !== "admin" &&
      !project.members.map(m => String(m)).includes(req.user.userId)
    ) {
      return res.status(403).json({ message: "Not authorized to view this meeting" });
    }

    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create new meeting
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      meetingType,
      startTime,
      endTime,
      location,
      videoCallLink,
      agenda,
      attendees,
      isRecurring,
      recurrencePattern
    } = req.body;

    // Validate project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (
      req.user.role !== "admin" &&
      !projectDoc.members.map(m => String(m)).includes(req.user.userId)
    ) {
      return res.status(403).json({ message: "Not authorized to create meetings in this project" });
    }

    // Validate attendees are project members
    if (attendees && attendees.length > 0) {
      for (const attendee of attendees) {
        if (!projectDoc.members.map(m => String(m)).includes(attendee.user)) {
          return res.status(400).json({ message: "All attendees must be project members" });
        }
      }
    }

    const meeting = new Meeting({
      title,
      description,
      project,
      organizer: req.user.userId,
      meetingType,
      startTime,
      endTime,
      location,
      videoCallLink,
      agenda,
      attendees,
      isRecurring,
      recurrencePattern,
    });

    await meeting.save();
    
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate("organizer", "name email")
      .populate("attendees.user", "name email")
      .populate("project", "name");

    res.status(201).json(populatedMeeting);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update meeting
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate("project", "members");
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check authorization - only organizer or admin can update
    const project = meeting.project;
    if (
      req.user.role !== "admin" &&
      meeting.organizer.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Not authorized to update this meeting" });
    }

    // Update fields
    const updateFields = [
      "title", "description", "meetingType", "startTime", "endTime", 
      "location", "videoCallLink", "agenda", "isRecurring", "recurrencePattern"
    ];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        meeting[field] = req.body[field];
      }
    });

    await meeting.save();
    
    const updatedMeeting = await Meeting.findById(meeting._id)
      .populate("organizer", "name email")
      .populate("attendees.user", "name email")
      .populate("project", "name");

    res.json(updatedMeeting);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete meeting
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate("project", "members");
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Only organizer or admin can delete
    const project = meeting.project;
    if (
      req.user.role !== "admin" &&
      meeting.organizer.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Not authorized to delete this meeting" });
    }

    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: "Meeting deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Respond to meeting invitation
router.post("/:id/respond", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const attendee = meeting.attendees.find(a => a.user.toString() === req.user.userId);
    if (!attendee) {
      return res.status(403).json({ message: "You are not invited to this meeting" });
    }

    attendee.status = status;
    attendee.responseTime = new Date();
    await meeting.save();

    res.json({ message: "Response recorded successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Mark attendance
router.post("/:id/attendance", authMiddleware, async (req, res) => {
  try {
    const { userId, status } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Only organizer or admin can mark attendance
    if (
      req.user.role !== "admin" &&
      meeting.organizer.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Not authorized to mark attendance" });
    }

    const attendee = meeting.attendees.find(a => a.user.toString() === userId);
    if (!attendee) {
      return res.status(404).json({ message: "User not found in attendees list" });
    }

    attendee.status = status;
    await meeting.save();

    res.json({ message: "Attendance marked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add meeting minutes
router.post("/:id/minutes", authMiddleware, async (req, res) => {
  try {
    const { topic, discussion, decisions, actionItems } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Only organizer, admin, or attendees can add minutes
    const isAttendee = meeting.attendees.some(a => a.user.toString() === req.user.userId);
    if (
      req.user.role !== "admin" &&
      meeting.organizer.toString() !== req.user.userId &&
      !isAttendee
    ) {
      return res.status(403).json({ message: "Not authorized to add minutes" });
    }

    meeting.minutes.push({
      topic,
      discussion,
      decisions,
      actionItems,
      recordedBy: req.user.userId,
    });

    await meeting.save();
    
    const updatedMeeting = await Meeting.findById(meeting._id)
      .populate("minutes.recordedBy", "name email")
      .populate("minutes.actionItems.assignedTo", "name email");

    res.json(updatedMeeting.minutes[updatedMeeting.minutes.length - 1]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update action item status
router.put("/:id/action-items/:actionItemId", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    let actionItem = null;
    for (const minute of meeting.minutes) {
      actionItem = minute.actionItems.id(req.params.actionItemId);
      if (actionItem) break;
    }

    if (!actionItem) {
      return res.status(404).json({ message: "Action item not found" });
    }

    // Only assigned user, organizer, or admin can update status
    if (
      req.user.role !== "admin" &&
      meeting.organizer.toString() !== req.user.userId &&
      actionItem.assignedTo?.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Not authorized to update this action item" });
    }

    actionItem.status = status;
    await meeting.save();

    res.json({ message: "Action item updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Upload meeting attachment
router.post("/:id/attachments", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const meeting = await Meeting.findById(req.params.id).populate("project", "members");
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check authorization
    const project = meeting.project;
    if (
      req.user.role !== "admin" &&
      !project.members.map(m => String(m)).includes(req.user.userId)
    ) {
      return res.status(403).json({ message: "Not authorized to upload attachments to this meeting" });
    }

    meeting.attachments.push({
      filename: req.file.filename,
      originalname: req.file.originalname,
      uploader: req.user.userId,
    });

    await meeting.save();
    
    const updatedMeeting = await Meeting.findById(meeting._id)
      .populate("attachments.uploader", "name email");

    res.json(updatedMeeting.attachments[updatedMeeting.attachments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Download meeting attachment
router.get("/:id/attachments/:attachmentId/download", authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate("project", "members");
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check authorization
    const project = meeting.project;
    if (
      req.user.role !== "admin" &&
      !project.members.map(m => String(m)).includes(req.user.userId)
    ) {
      return res.status(403).json({ message: "Not authorized to download attachments from this meeting" });
    }

    const attachment = meeting.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const filePath = path.join(__dirname, "../uploads/meetings", attachment.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(filePath, attachment.originalname);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get meeting analytics
router.get("/analytics/project/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      !project.members.map(m => String(m)).includes(req.user.userId)
    ) {
      return res.status(403).json({ message: "Not authorized to view analytics" });
    }

    const meetings = await Meeting.find({ project: req.params.projectId });
    
    const analytics = {
      total: meetings.length,
      byStatus: {
        scheduled: meetings.filter(m => m.status === "scheduled").length,
        "in-progress": meetings.filter(m => m.status === "in-progress").length,
        completed: meetings.filter(m => m.status === "completed").length,
        cancelled: meetings.filter(m => m.status === "cancelled").length,
      },
      byType: {
        "in-person": meetings.filter(m => m.meetingType === "in-person").length,
        "video-call": meetings.filter(m => m.meetingType === "video-call").length,
        hybrid: meetings.filter(m => m.meetingType === "hybrid").length,
      },
      upcoming: meetings.filter(m => m.startTime > new Date() && m.status === "scheduled").length,
      totalDuration: meetings.reduce((sum, m) => sum + (m.duration || 0), 0),
      averageDuration: meetings.length > 0 ? meetings.reduce((sum, m) => sum + (m.duration || 0), 0) / meetings.length : 0,
      totalActionItems: meetings.reduce((sum, m) => sum + m.minutes.reduce((s, minute) => s + minute.actionItems.length, 0), 0),
      completedActionItems: meetings.reduce((sum, m) => 
        sum + m.minutes.reduce((s, minute) => 
          s + minute.actionItems.filter(item => item.status === "completed").length, 0
        ), 0
      ),
    };

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router; 