import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Paper,
  useTheme as useMuiTheme,
} from "@mui/material";
import KanbanBoard from "../components/KanbanBoard";
import { useTheme } from "../ThemeContext";
import { useAuth } from "../useAuth";
import { API_BASE } from "../config/api";

const TasksOverview = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const { user } = useAuth(); // Import useAuth to get user role
  const navigate = useNavigate();
  const isDark = theme === "dark";

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/dashboard");
      return;
    }
    fetchTasks();
  }, [user, navigate]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/tasks/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      
      // Update local state
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error("Error updating task status:", err);
    }
  };

  const handleUpdateProgress = async (taskId, newProgress) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ progress: newProgress }),
      });
      if (!response.ok) throw new Error("Failed to update progress");

      // Update local state
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, progress: newProgress } : t))
      );
    } catch (err) {
      console.error("Error updating task progress:", err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            My Tasks
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all your assigned tasks across different projects.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          bgcolor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid",
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
        }}
      >
        {tasks.length === 0 ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              No tasks assigned to you yet.
            </Typography>
          </Box>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onChangeStatus={handleStatusChange}
            onUpdateProgress={handleUpdateProgress}
          />
        )}
      </Paper>
    </Container>
  );
};

export default TasksOverview;
