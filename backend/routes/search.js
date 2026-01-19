const express = require("express");
const jwt = require("jsonwebtoken");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Meeting = require("../models/Meeting");

const router = express.Router();

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

// GET /api/search?q=...&scope=all|tasks|projects|meetings&limit=10&page=1
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { q = "", scope = "all", limit = 10, page = 1 } = req.query;
    const userId = req.user.userId;
    const regex = new RegExp(q, "i");
    const lim = Math.min(parseInt(limit) || 10, 50);
    const pg = Math.max(parseInt(page) || 1, 1);
    const skip = (pg - 1) * lim;

    const results = {};

    // Projects the user belongs to or owns
    if (scope === "all" || scope === "projects") {
      const projects = await Project.find({
        $and: [
          { $or: [{ name: regex }, { description: regex }] },
          { $or: [{ members: userId }, { createdBy: userId }] },
        ],
      })
        .select("name description status createdAt")
        .skip(skip)
        .limit(lim);
      results.projects = projects;
    }

    // Tasks in projects user can access
    if (scope === "all" || scope === "tasks") {
      const projectFilter = {
        $or: [{ members: userId }, { createdBy: userId }],
      };
      const accessibleProjects = await Project.find(projectFilter).select(
        "_id"
      );
      const projectIds = accessibleProjects.map((p) => p._id);
      const tasks = await Task.find({
        $and: [
          { project: { $in: projectIds } },
          { $or: [{ title: regex }, { description: regex }, { tags: regex }] },
        ],
      })
        .select("title status priority dueDate project")
        .skip(skip)
        .limit(lim)
        .populate("project", "name");
      results.tasks = tasks;
    }

    // Meetings in accessible projects
    if (scope === "all" || scope === "meetings") {
      const projectFilter = {
        $or: [{ members: userId }, { createdBy: userId }],
      };
      const accessibleProjects = await Project.find(projectFilter).select(
        "_id"
      );
      const projectIds = accessibleProjects.map((p) => p._id);
      const meetings = await Meeting.find({
        $and: [
          { project: { $in: projectIds } },
          { $or: [{ title: regex }, { description: regex }] },
        ],
      })
        .select("title startTime endTime meetingType project")
        .skip(skip)
        .limit(lim)
        .populate("project", "name");
      results.meetings = meetings;
    }

    res.json({ query: q, scope, page: pg, limit: lim, results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
