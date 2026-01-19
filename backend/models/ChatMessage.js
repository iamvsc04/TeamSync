const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    replyTo: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage" },
      senderName: { type: String },
      text: { type: String },
    },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Index for better query performance
ChatMessageSchema.index({ projectId: 1, timestamp: -1 });
ChatMessageSchema.index({ senderId: 1 });

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
