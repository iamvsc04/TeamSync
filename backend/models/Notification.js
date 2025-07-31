const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "task_assigned",
        "task_completed",
        "task_updated",
        "meeting_invitation",
        "meeting_reminder",
        "meeting_cancelled",
        "project_invitation",
        "join_request",
        "join_request_approved",
        "join_request_rejected",
        "document_uploaded",
        "comment_added",
        "mention",
        "deadline_approaching",
        "overdue_task",
        "system_announcement"
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
    },
    category: {
      type: String,
      enum: ["tasks", "meetings", "projects", "documents", "comments", "system"],
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, category: 1 });
NotificationSchema.index({ recipient: 1, priority: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for expired notifications

// Virtual for checking if notification is expired
NotificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for checking if notification is recent (within 24 hours)
NotificationSchema.virtual('isRecent').get(function() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > twentyFourHoursAgo;
});

// Pre-save middleware to set category based on type
NotificationSchema.pre('save', function(next) {
  if (!this.category) {
    switch (this.type) {
      case 'task_assigned':
      case 'task_completed':
      case 'task_updated':
      case 'deadline_approaching':
      case 'overdue_task':
        this.category = 'tasks';
        break;
      case 'meeting_invitation':
      case 'meeting_reminder':
      case 'meeting_cancelled':
        this.category = 'meetings';
        break;
      case 'project_invitation':
      case 'join_request':
      case 'join_request_approved':
      case 'join_request_rejected':
        this.category = 'projects';
        break;
      case 'document_uploaded':
        this.category = 'documents';
        break;
      case 'comment_added':
      case 'mention':
        this.category = 'comments';
        break;
      case 'system_announcement':
        this.category = 'system';
        break;
      default:
        this.category = 'system';
    }
  }
  next();
});

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to archive
NotificationSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

// Static method to create notification
NotificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false,
    isArchived: false,
  });
};

// Static method to get notifications by category
NotificationSchema.statics.getByCategory = async function(userId, category, limit = 20) {
  return await this.find({
    recipient: userId,
    category: category,
    isArchived: false,
  })
    .populate('sender', 'name email')
    .populate('project', 'name')
    .populate('task', 'title')
    .populate('meeting', 'title')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to mark all as read
NotificationSchema.statics.markAllAsRead = async function(userId, category = null) {
  const query = {
    recipient: userId,
    isRead: false,
    isArchived: false,
  };
  
  if (category) {
    query.category = category;
  }
  
  return await this.updateMany(query, {
    isRead: true,
    readAt: new Date(),
  });
};

// Static method to delete old notifications
NotificationSchema.statics.cleanupOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true,
    isArchived: true,
  });
};

module.exports = mongoose.model("Notification", NotificationSchema); 