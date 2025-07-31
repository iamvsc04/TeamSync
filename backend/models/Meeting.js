const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    meetingType: {
      type: String,
      enum: ["in-person", "video-call", "hybrid"],
      default: "video-call",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    videoCallLink: {
      type: String,
      trim: true,
    },
    agenda: [{
      item: { type: String, required: true },
      duration: { type: Number, min: 1 }, // in minutes
      presenter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }],
    attendees: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      status: { 
        type: String, 
        enum: ["invited", "accepted", "declined", "attended", "absent"],
        default: "invited"
      },
      responseTime: { type: Date },
    }],
    minutes: [{
      topic: { type: String, required: true },
      discussion: { type: String },
      decisions: [String],
      actionItems: [{
        description: { type: String, required: true },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        dueDate: { type: Date },
        status: { 
          type: String, 
          enum: ["pending", "in-progress", "completed"],
          default: "pending"
        },
      }],
      recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      timestamp: { type: Date, default: Date.now },
    }],
    attachments: [{
      filename: { type: String, required: true },
      originalname: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    }],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      frequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"] },
      interval: { type: Number, min: 1, default: 1 },
      endDate: { type: Date },
      daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0 = Sunday, 6 = Saturday
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    recordingUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
MeetingSchema.index({ project: 1, startTime: 1 });
MeetingSchema.index({ organizer: 1, startTime: 1 });
MeetingSchema.index({ "attendees.user": 1, startTime: 1 });
MeetingSchema.index({ status: 1, startTime: 1 });

// Virtual for meeting duration
MeetingSchema.virtual('duration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // Duration in minutes
  }
  return 0;
});

// Virtual for checking if meeting is upcoming
MeetingSchema.virtual('isUpcoming').get(function() {
  return this.startTime > new Date() && this.status === 'scheduled';
});

// Virtual for checking if meeting is ongoing
MeetingSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now && this.status === 'scheduled';
});

// Pre-save middleware to validate end time
MeetingSchema.pre('save', function(next) {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    return next(new Error('End time must be after start time'));
  }
  next();
});

// Method to get meeting statistics
MeetingSchema.methods.getStats = function() {
  const totalAttendees = this.attendees.length;
  const acceptedAttendees = this.attendees.filter(a => a.status === 'accepted').length;
  const attendedAttendees = this.attendees.filter(a => a.status === 'attended').length;
  const actionItems = this.minutes.reduce((total, minute) => total + minute.actionItems.length, 0);
  const completedActionItems = this.minutes.reduce((total, minute) => 
    total + minute.actionItems.filter(item => item.status === 'completed').length, 0
  );

  return {
    totalAttendees,
    acceptedAttendees,
    attendedAttendees,
    attendanceRate: totalAttendees > 0 ? (attendedAttendees / totalAttendees) * 100 : 0,
    actionItems,
    completedActionItems,
    completionRate: actionItems > 0 ? (completedActionItems / actionItems) * 100 : 0,
  };
};

module.exports = mongoose.model("Meeting", MeetingSchema); 