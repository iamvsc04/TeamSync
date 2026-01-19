import React, { useState } from "react";
import { Box, Paper, Typography, Chip } from "@mui/material";

// HTML5 drag-and-drop Kanban with status change callback
export default function KanbanBoard({ tasks = [], onChangeStatus }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const columns = [
    { key: "pending", title: "Pending" },
    { key: "in-progress", title: "In Progress" },
    { key: "review", title: "In Review" },
    { key: "blocked", title: "Blocked" },
    { key: "completed", title: "Completed" },
  ];

  const grouped = columns.reduce((acc, c) => {
    acc[c.key] = tasks.filter((t) => t.status === c.key);
    return acc;
  }, {});

  const handleDragStart = (taskId) => {
    setDraggedTaskId(taskId);
  };

  const handleDropOnColumn = (status) => {
    if (!draggedTaskId || !onChangeStatus) return;
    onChangeStatus(draggedTaskId, status);
    setDraggedTaskId(null);
  };

  return (
    <Box
      sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2 }}
    >
      {columns.map((col) => (
        <Paper
          key={col.key}
          sx={{ p: 2, minHeight: 220 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDropOnColumn(col.key)}
        >
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            {col.title} ({grouped[col.key]?.length || 0})
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {(grouped[col.key] || []).map((task) => (
              <Paper
                key={task._id}
                sx={{
                  p: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
                draggable
                onDragStart={() => handleDragStart(task._id)}
              >
                <Typography variant="body1" fontWeight={600}>
                  {task.title}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  {task.description?.slice(0, 100)}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {task.priority && <Chip size="small" label={task.priority} />}
                  {Array.isArray(task.tags) &&
                    task.tags
                      .slice(0, 3)
                      .map((tag, idx) => (
                        <Chip
                          key={idx}
                          size="small"
                          variant="outlined"
                          label={tag}
                        />
                      ))}
                </Box>
              </Paper>
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
