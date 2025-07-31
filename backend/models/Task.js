const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
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
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "blocked", "review"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    completedDate: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      min: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    dependencies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    attachments: [{
      filename: { type: String, required: true },
      originalname: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    }],
    comments: [{
      text: { type: String, required: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }],
    timeEntries: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      startTime: { type: Date, required: true },
      endTime: { type: Date },
      duration: { type: Number, min: 0 }, // in minutes
      description: { type: String },
    }],
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    templateName: {
      type: String,
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    subtasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ tags: 1 });

// Virtual for calculating total time spent
TaskSchema.virtual('totalTimeSpent').get(function() {
  return this.timeEntries.reduce((total, entry) => {
    return total + (entry.duration || 0);
  }, 0);
});

// Method to update progress based on subtasks
TaskSchema.methods.updateProgress = function() {
  if (this.subtasks && this.subtasks.length > 0) {
    // This would need to be populated to calculate actual progress
    return this.progress;
  }
  return this.progress;
};

// Pre-save middleware to update completedDate
TaskSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  } else if (this.status !== 'completed') {
    this.completedDate = undefined;
  }
  next();
});

module.exports = mongoose.model("Task", TaskSchema);
