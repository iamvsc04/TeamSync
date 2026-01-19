const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Notification = require("../models/Notification");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

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

// Get all notifications for current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      unreadOnly = false,
      isArchived,
    } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      recipient: req.user.userId,
      isArchived: isArchived === undefined ? false : isArchived === "true",
    };

    if (category) {
      query.category = category;
    }

    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate("sender", "name email")
      .populate("project", "name")
      .populate("task", "title")
      .populate("meeting", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get unread count
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.userId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get notifications by category
router.get("/category/:category", authMiddleware, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const notifications = await Notification.getByCategory(
      req.user.userId,
      req.params.category,
      parseInt(limit)
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get notification by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate("sender", "name email")
      .populate("project", "name")
      .populate("task", "title")
      .populate("meeting", "title");

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this notification" });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Mark notification as read
router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this notification" });
    }

    await notification.markAsRead();
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Mark all notifications as read
router.patch("/mark-all-read", authMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    await Notification.markAllAsRead(req.user.userId, category);
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Archive notification
router.patch("/:id/archive", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this notification" });
    }

    await notification.archive();
    res.json({ message: "Notification archived" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete notification
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this notification" });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create notification (admin only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can create notifications" });
    }

    const {
      recipient,
      type,
      title,
      message,
      project,
      task,
      meeting,
      document,
      comment,
      priority,
      actionUrl,
      metadata,
      expiresAt,
      tags,
    } = req.body;

    const notification = await Notification.createNotification({
      recipient,
      sender: req.user.userId,
      type,
      title,
      message,
      project,
      task,
      meeting,
      document,
      comment,
      priority,
      actionUrl,
      metadata,
      expiresAt,
      tags,
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "name email")
      .populate("recipient", "name email");

    res.status(201).json(populatedNotification);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get notification statistics
router.get("/stats/overview", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [
      totalNotifications,
      unreadCount,
      readCount,
      archivedCount,
      byCategory,
      byPriority,
      recentNotifications,
    ] = await Promise.all([
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({
        recipient: userId,
        isRead: false,
        isArchived: false,
      }),
      Notification.countDocuments({
        recipient: userId,
        isRead: true,
        isArchived: false,
      }),
      Notification.countDocuments({ recipient: userId, isArchived: true }),
      Notification.aggregate([
        { $match: { recipient: mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Notification.aggregate([
        { $match: { recipient: mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Notification.countDocuments({
        recipient: userId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    const stats = {
      total: totalNotifications,
      unread: unreadCount,
      read: readCount,
      archived: archivedCount,
      recent: recentNotifications,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Bulk operations
router.post("/bulk", authMiddleware, async (req, res) => {
  try {
    const { action, notificationIds, category } = req.body;

    let query = {
      recipient: req.user.userId,
      _id: { $in: notificationIds },
    };

    if (category) {
      query.category = category;
    }

    let updateData = {};

    switch (action) {
      case "mark-read":
        updateData = { isRead: true, readAt: new Date() };
        break;
      case "mark-unread":
        updateData = { isRead: false, readAt: null };
        break;
      case "archive":
        updateData = { isArchived: true };
        break;
      case "unarchive":
        updateData = { isArchived: false };
        break;
      case "delete":
        await Notification.deleteMany(query);
        return res.json({ message: "Notifications deleted successfully" });
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    await Notification.updateMany(query, updateData);
    res.json({
      message: `Notifications ${action.replace("-", " ")} successfully`,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Search notifications
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const {
      q,
      category,
      priority,
      isRead,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      recipient: req.user.userId,
    };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { message: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (priority) {
      query.priority = priority;
    }

    if (isRead !== undefined) {
      query.isRead = isRead === "true";
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const notifications = await Notification.find(query)
      .populate("sender", "name email")
      .populate("project", "name")
      .populate("task", "title")
      .populate("meeting", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Export notifications
router.get("/export", authMiddleware, async (req, res) => {
  try {
    const { format = "json", category, startDate, endDate } = req.query;

    let query = {
      recipient: req.user.userId,
    };

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const notifications = await Notification.find(query)
      .populate("sender", "name email")
      .populate("project", "name")
      .populate("task", "title")
      .populate("meeting", "title")
      .sort({ createdAt: -1 });

    if (format === "csv") {
      // Convert to CSV format
      const csvData = notifications.map((notification) => ({
        Title: notification.title,
        Message: notification.message,
        Type: notification.type,
        Category: notification.category,
        Priority: notification.priority,
        "Is Read": notification.isRead,
        "Created At": notification.createdAt.toISOString(),
        Sender: notification.sender?.name || "",
        Project: notification.project?.name || "",
        Task: notification.task?.title || "",
        Meeting: notification.meeting?.title || "",
      }));

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=notifications.csv"
      );

      // Convert to CSV string
      const csvString = [
        Object.keys(csvData[0]).join(","),
        ...csvData.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(",")
        ),
      ].join("\n");

      res.send(csvString);
    } else {
      res.json(notifications);
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
