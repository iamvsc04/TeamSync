import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Select,
  MenuItem,
  Slider,
  Tooltip,
  LinearProgress,
  IconButton,
} from "@mui/material";
import {
  DragIndicator as DragIcon,
} from "@mui/icons-material";
import { useTheme } from "../ThemeContext";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#9e9e9e", bg: "#f5f5f5" },
  "in-progress": { label: "In Progress", color: "#1976d2", bg: "#e3f2fd" },
  review: { label: "In Review", color: "#ff9800", bg: "#fff8e1" },
  blocked: { label: "Blocked", color: "#f44336", bg: "#fce4ec" },
  completed: { label: "Completed", color: "#4caf50", bg: "#e8f5e9" },
};

const PRIORITY_COLORS = {
  critical: "#f44336",
  high: "#ff9800",
  medium: "#1976d2",
  low: "#4caf50",
};

const columns = [
  { key: "pending", title: "Pending" },
  { key: "in-progress", title: "In Progress" },
  { key: "review", title: "In Review" },
  { key: "blocked", title: "Blocked" },
  { key: "completed", title: "Completed" },
];

// Individual task card with inline status + progress controls
function TaskCard({ task, onChangeStatus, onUpdateProgress }) {
  const { theme } = useTheme();
  const [localProgress, setLocalProgress] = useState(task.progress || 0);
  const isDark = theme === "dark";

  const handleStatusChange = (e) => {
    e.stopPropagation();
    onChangeStatus && onChangeStatus(task._id, e.target.value);
  };

  const handleProgressCommit = (e, value) => {
    e.stopPropagation();
    setLocalProgress(value);
    onUpdateProgress && onUpdateProgress(task._id, value);
  };

  const handleProgressChange = (e, value) => {
    setLocalProgress(value);
  };

  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;

  return (
    <Paper
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task._id);
      }}
      sx={{
        p: 1.5,
        mb: 1.5,
        borderLeft: `4px solid ${cfg.color}`,
        bgcolor: 'background.paper',
        cursor: "grab",
        transition: "box-shadow 0.15s",
        "&:hover": {
          boxShadow: 4,
        },
        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      {/* Title + drag handle */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mb: 1 }}>
        <DragIcon
          fontSize="small"
          sx={{ color: "text.disabled", mt: 0.2, fontSize: 16, flexShrink: 0 }}
        />
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ color: 'text.primary', flexGrow: 1, lineHeight: 1.3 }}
        >
          {task.title}
        </Typography>
        {task.priority && (
          <Chip
            label={task.priority}
            size="small"
            sx={{
              fontSize: "0.65rem",
              height: 18,
              bgcolor: PRIORITY_COLORS[task.priority] || "#9e9e9e",
              color: "#fff",
              flexShrink: 0,
            }}
          />
        )}
      </Box>

      {/* Description snippet */}
      {task.description && (
        <Typography
          variant="caption"
          sx={{ color: isDark ? "#aaa" : "#666", display: "block", mb: 1 }}
        >
          {task.description.slice(0, 80)}{task.description.length > 80 ? "…" : ""}
        </Typography>
      )}

      {/* Progress bar */}
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: isDark ? "#ccc" : "#555" }}>
            Progress
          </Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color: cfg.color }}>
            {localProgress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={localProgress}
          sx={{
            height: 4,
            borderRadius: 2,
            bgcolor: isDark ? "#555" : "#e0e0e0",
            "& .MuiLinearProgress-bar": { bgcolor: cfg.color },
            mb: 0.5,
          }}
        />
        <Slider
          size="small"
          value={localProgress}
          min={0}
          max={100}
          step={5}
          onChange={handleProgressChange}
          onChangeCommitted={handleProgressCommit}
          onClick={(e) => e.stopPropagation()}
          sx={{
            py: 0,
            "& .MuiSlider-thumb": { width: 12, height: 12 },
            color: cfg.color,
          }}
        />
      </Box>

      {/* Inline status change */}
      <Select
        value={task.status}
        onChange={handleStatusChange}
        size="small"
        fullWidth
        onClick={(e) => e.stopPropagation()}
        sx={{
          fontSize: "0.75rem",
          height: 30,
          bgcolor: isDark ? "#2a2a2a" : cfg.bg,
          color: cfg.color,
          fontWeight: 600,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: cfg.color + "55",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: cfg.color,
          },
          "& .MuiSvgIcon-root": { color: cfg.color },
        }}
      >
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <MenuItem key={key} value={key}>
            <Typography variant="caption" fontWeight={600}>
              {val.label}
            </Typography>
          </MenuItem>
        ))}
      </Select>

      {/* Tags */}
      {Array.isArray(task.tags) && task.tags.length > 0 && (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
          {task.tags.slice(0, 3).map((tag, idx) => (
            <Chip
              key={idx}
              size="small"
              variant="outlined"
              label={tag}
              sx={{ fontSize: "0.6rem", height: 16 }}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
}

// HTML5 drag-and-drop Kanban board
export default function KanbanBoard({ tasks = [], onChangeStatus, onUpdateProgress }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [dragOverCol, setDragOverCol] = useState(null);

  const grouped = columns.reduce((acc, c) => {
    acc[c.key] = tasks.filter((t) => t.status === c.key);
    return acc;
  }, {});

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId && onChangeStatus) {
      onChangeStatus(taskId, status);
    }
    setDragOverCol(null);
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 2,
        overflowX: "auto",
        pb: 1,
      }}
    >
      {columns.map((col) => {
        const cfg = STATUS_CONFIG[col.key];
        const isOver = dragOverCol === col.key;
        return (
          <Box
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.key);
            }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.key)}
            sx={{ minWidth: 180 }}
          >
            {/* Column header */}
            <Box
              sx={{
                mb: 1.5,
                px: 1.5,
                py: 0.75,
                borderRadius: 1.5,
                bgcolor: isDark ? cfg.color + "22" : cfg.bg,
                border: `1px solid ${cfg.color}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ color: cfg.color }}
              >
                {col.title}
              </Typography>
              <Chip
                label={grouped[col.key]?.length || 0}
                size="small"
                sx={{
                  bgcolor: cfg.color,
                  color: "#fff",
                  height: 18,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              />
            </Box>

            {/* Drop zone */}
            <Paper
              sx={{
                p: 1,
                minHeight: 200,
                bgcolor: isOver
                  ? isDark
                    ? cfg.color + "22"
                    : cfg.bg
                  : isDark
                  ? "#2d2d2d"
                  : "#fafafa",
                border: isOver
                  ? `2px dashed ${cfg.color}`
                  : `2px dashed transparent`,
                borderRadius: 2,
                transition: "all 0.15s",
              }}
            >
              {(grouped[col.key] || []).map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onChangeStatus={onChangeStatus}
                  onUpdateProgress={onUpdateProgress}
                />
              ))}
              {grouped[col.key]?.length === 0 && (
                <Box
                  sx={{
                    height: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: isDark ? "#555" : "#ccc" }}
                  >
                    Drop here
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
}
