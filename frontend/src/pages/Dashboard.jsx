import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../useAuth";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Box,
  Typography,
  Paper,
  Badge,
  IconButton,
  Avatar,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { useTheme } from "../ThemeContext";
import NotificationCenter from "../components/NotificationCenter";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ChatIcon from "@mui/icons-material/Chat";
import GroupIcon from "@mui/icons-material/Group";
import FolderIcon from "@mui/icons-material/Folder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import EventIcon from "@mui/icons-material/Event";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AssessmentIcon from "@mui/icons-material/Assessment";
import MessageIcon from "@mui/icons-material/Message";

// Remove unused placeholder fetchers; actual fetchers are defined in TeamSyncDashboard

function JoinProjectModal({ open, onClose, onJoinSuccess }) {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleJoinProject = async () => {
    if (!joinCode.trim()) {
      setError("Please enter a join code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/projects/join-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ joinCode: joinCode.trim() }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Successfully joined the project!");
        setTimeout(() => {
          onClose();
          onJoinSuccess();
        }, 2000);
      } else {
        setError(data.message || "Failed to join project");
      }
    } catch (err) {
      setError("Failed to join project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setJoinCode("");
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Join Project</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the join code provided by your project administrator to join an
          existing project.
        </Typography>
        <TextField
          label="Project Join Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          fullWidth
          required
          margin="normal"
          placeholder="Enter the 8-character join code"
          inputProps={{ maxLength: 8 }}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleJoinProject}
          variant="contained"
          disabled={loading || !joinCode.trim()}
        >
          {loading ? <CircularProgress size={20} /> : "Join Project"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MemberDashboardContent({
  projects,
  meetings,
  notifications,
  user,
  onJoinProject,
  fetchProjects,
}) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [joinProjectModalOpen, setJoinProjectModalOpen] = useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [tasksModalOpen, setTasksModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [meetingsModalOpen, setMeetingsModalOpen] = useState(false);

  // Calculate metrics
  const myProjectsCount = projects.length;
  const completedProjectsCount = projects.filter(
    (p) => p.status === "completed"
  ).length;

  const handleJoinProject = () => {
    setJoinProjectModalOpen(true);
  };

  const handleJoinSuccess = () => {
    fetchProjects();
  };

  const handleViewProjects = () => {
    // Show projects overview modal
    setProjectsModalOpen(true);
  };

  const handleMyTasks = () => {
    setTasksModalOpen(true);
  };

  const handleProgress = () => {
    setProgressModalOpen(true);
  };

  const handleMeetings = () => {
    setMeetingsModalOpen(true);
  };

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        p: { xs: 2, md: 4 },
        bgcolor: theme === "dark" ? "#181823" : "#f7f9fb",
        minHeight: "100vh",
      }}
    >
      {/* Welcome Message */}
      <Typography
        variant="h4"
        fontWeight={700}
        sx={{
          mb: 4,
          color: theme === "dark" ? "#fff" : "#333",
          textAlign: { xs: "center", md: "left" },
        }}
      >
        Welcome back, {user.name}!
      </Typography>

      {/* Metrics Overview Section - 3 Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* My Projects Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              bgcolor: theme === "dark" ? "#232946" : "#fff",
              border: `1px solid ${theme === "dark" ? "#444" : "#e0e0e0"}`,
              height: "200px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ textAlign: "left" }}>
              <FolderIcon sx={{ fontSize: 32, color: "primary.main", mb: 2 }} />
            </Box>
            <Box>
              <Typography
                variant="h2"
                fontWeight={700}
                color="primary"
                sx={{ mb: 1 }}
              >
                {myProjectsCount}
              </Typography>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                My Projects
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active projects
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Completed Projects Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              bgcolor: theme === "dark" ? "#232946" : "#fff",
              border: `1px solid ${theme === "dark" ? "#444" : "#e0e0e0"}`,
              height: "200px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ textAlign: "left" }}>
              <CheckCircleIcon
                sx={{ fontSize: 32, color: "success.main", mb: 2 }}
              />
            </Box>
            <Box>
              <Typography
                variant="h2"
                fontWeight={700}
                color="success.main"
                sx={{ mb: 1 }}
              >
                {completedProjectsCount}
              </Typography>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Completed Projects
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successfully delivered
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Join Meeting Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              bgcolor: theme === "dark" ? "#232946" : "#fff",
              border: `1px solid ${theme === "dark" ? "#444" : "#e0e0e0"}`,
              height: "200px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ textAlign: "left" }}>
              <VideoCallIcon sx={{ fontSize: 32, color: "info.main", mb: 2 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Join Meeting
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
                onClick={handleMeetings}
              >
                + Join Meeting
              </Button>
              <Typography variant="body2" color="text.secondary">
                Join team meetings
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Member Actions Section */}
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{
          mb: 3,
          color: theme === "dark" ? "#fff" : "#333",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <DashboardIcon color="primary" />
        Member Actions
      </Typography>

      {/* 5 Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              p: 3,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
            onClick={handleJoinProject}
          >
            <AddIcon sx={{ fontSize: 24 }} />
            Join Project
          </Button>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{
              p: 3,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
            onClick={handleViewProjects}
          >
            <FolderIcon sx={{ fontSize: 24 }} />
            View Projects
          </Button>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Button
            variant="contained"
            color="success"
            fullWidth
            sx={{
              p: 3,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
            onClick={handleMyTasks}
          >
            <GroupIcon sx={{ fontSize: 24 }} />
            My Tasks
          </Button>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Button
            variant="contained"
            color="warning"
            fullWidth
            sx={{
              p: 3,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
            onClick={handleProgress}
          >
            <AssessmentIcon sx={{ fontSize: 24 }} />
            Progress
          </Button>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Button
            variant="contained"
            color="info"
            fullWidth
            sx={{
              p: 3,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
            onClick={handleMeetings}
          >
            <VideoCallIcon sx={{ fontSize: 24 }} />
            Meetings
          </Button>
        </Grid>
      </Grid>

      {/* Recent Projects Section */}
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{
          mb: 3,
          color: theme === "dark" ? "#fff" : "#333",
        }}
      >
        Recent Projects
      </Typography>

      <Grid container spacing={3}>
        {projects.length === 0 ? (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                color: "text.secondary",
                borderRadius: 3,
                bgcolor: theme === "dark" ? "#232946" : "#fff",
              }}
            >
              <Typography variant="h6" gutterBottom>
                No projects yet
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                You haven't joined any projects yet. Click "Join Project" to get
                started!
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleJoinProject}
              >
                Join Your First Project
              </Button>
            </Paper>
          </Grid>
        ) : (
          projects.slice(0, 3).map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: 3,
                  cursor: "pointer",
                  transition: "0.2s",
                  "&:hover": {
                    boxShadow: 8,
                    transform: "translateY(-2px)",
                  },
                  bgcolor: theme === "dark" ? "#232946" : "#fff",
                }}
                onClick={() => navigate(`/dashboard/projects/${project._id}`)}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {project.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, minHeight: "3em" }}
                  >
                    {project.description || "No description available."}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                    <Chip
                      label={project.status}
                      size="small"
                      color={
                        project.status === "completed" ? "success" : "primary"
                      }
                    />
                    <Chip
                      label={`${project.members?.length || 0} members`}
                      size="small"
                      color="info"
                    />
                  </Box>
                  <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Modals */}
      <JoinProjectModal
        open={joinProjectModalOpen}
        onClose={() => setJoinProjectModalOpen(false)}
        onJoinSuccess={handleJoinSuccess}
      />

      {/* Projects Overview Modal */}
      <Dialog
        open={projectsModalOpen}
        onClose={() => setProjectsModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>My Projects</DialogTitle>
        <DialogContent>
          {projects.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No projects found. Join a project to get started!
            </Typography>
          ) : (
            <Box sx={{ mt: 1 }}>
              {projects.map((project) => (
                <Paper
                  key={project._id || project.id}
                  sx={{ p: 2, mb: 2, borderRadius: 3, position: "relative" }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    mb={0.5}
                    sx={{ cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => {
                      setProjectsModalOpen(false);
                      navigate(
                        `/dashboard/projects/${project._id || project.id}`
                      );
                    }}
                  >
                    {project.name}
                  </Typography>
                  <Typography color="text.secondary" mb={1}>
                    {project.description || "No description."}
                  </Typography>
                  <Box display="flex" gap={2} alignItems="center">
                    <Chip
                      label={project.status || "active"}
                      color={
                        project.status === "completed"
                          ? "success"
                          : project.status === "archived"
                          ? "default"
                          : "primary"
                      }
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Created:{" "}
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString()
                        : "N/A"}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Tasks Modal */}
      <Dialog
        open={tasksModalOpen}
        onClose={() => setTasksModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>My Tasks</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Task management functionality will be available in the project view.
            Please navigate to a specific project to manage your tasks.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTasksModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Progress Modal */}
      <Dialog
        open={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>My Progress</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Progress tracking is available within individual projects. Please
            navigate to a specific project to view your progress.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Meetings Modal */}
      <Dialog
        open={meetingsModalOpen}
        onClose={() => setMeetingsModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Meetings</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Meeting management is available within individual projects. Please
            navigate to a specific project to view and join meetings.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMeetingsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function CreateProjectModal({ open, onClose, onCreate, user }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          createdBy: user.id || user._id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create project");
      onCreate(data.project);
      setName("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Project</DialogTitle>
      <DialogContent>
        <TextField
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={3}
          margin="normal"
        />
        {error && (
          <Box color="error.main" mt={1}>
            {error}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !name}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ProjectDetailsModal({ open, onClose, projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    fetch(`http://localhost:5000/api/projects/${projectId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data._id) setProject(data);
        else setError(data.message || "Project not found");
      })
      .catch(() => setError("Failed to fetch project details."))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Project Details</DialogTitle>
      <DialogContent>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error.main">{error}</Typography>
        ) : project ? (
          <Box>
            <Typography variant="h5" fontWeight={700} mb={1}>
              {project.name}
            </Typography>
            <Typography color="text.secondary" mb={2}>
              {project.description || "No description."}
            </Typography>
            <Typography variant="subtitle1" fontWeight={600}>
              Status: <Chip label={project.status} size="small" />
            </Typography>
            <Typography variant="subtitle2" mt={2} mb={1}>
              Members:
            </Typography>
            {project.members && project.members.length > 0 ? (
              <Box display="flex" gap={1} flexWrap="wrap">
                {project.members.map((m) => (
                  <Chip
                    key={m._id}
                    label={m.name + (m.email ? ` (${m.email})` : "")}
                  />
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">No members yet.</Typography>
            )}
            <Typography variant="subtitle2" mt={2} mb={1}>
              Created At: {new Date(project.createdAt).toLocaleString()}
            </Typography>
            {/* Add more project details, meetings, actions here */}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function CurrentProjectsModal({ open, onClose, projects, onViewJoinRequests }) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Current Projects</DialogTitle>
      <DialogContent>
        {projects.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No projects found. Create a new project to get started!
          </Typography>
        ) : (
          <Box sx={{ mt: 1 }}>
            {projects.map((project) => (
              <Paper
                key={project._id || project.id}
                sx={{ p: 2, mb: 2, borderRadius: 3, position: "relative" }}
              >
                <Typography
                  variant="h6"
                  fontWeight={700}
                  mb={0.5}
                  sx={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => {
                    onClose();
                    navigate(
                      `/dashboard/projects/${project._id || project.id}`
                    );
                  }}
                >
                  {project.name}
                </Typography>
                <Typography color="text.secondary" mb={1}>
                  {project.description || "No description."}
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <Chip
                    label={project.status || "active"}
                    color={
                      project.status === "completed"
                        ? "success"
                        : project.status === "archived"
                        ? "default"
                        : "primary"
                    }
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Created:{" "}
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString()
                      : "N/A"}
                  </Typography>
                  {/* Show join requests count if available */}
                  {project.joinRequests &&
                    project.joinRequests.filter((jr) => jr.status === "pending")
                      .length > 0 && (
                      <Chip
                        label={`${
                          project.joinRequests.filter(
                            (jr) => jr.status === "pending"
                          ).length
                        } Pending Join Request(s)`}
                        color="warning"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  {onViewJoinRequests &&
                    project.joinRequests &&
                    project.joinRequests.filter((jr) => jr.status === "pending")
                      .length > 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={() => onViewJoinRequests(project)}
                      >
                        View Join Requests
                      </Button>
                    )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function AdminDashboardContent({
  projects,
  meetings,
  notifications,
  user,
  theme,
  onProjectCreated,
  fetchProjects,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [joinRequestsModalOpen, setJoinRequestsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  // Calculate metrics
  const ongoingProjectsCount = projects.filter(
    (p) => p.status === "active"
  ).length;
  const completedProjectsCount = projects.filter(
    (p) => p.status === "completed"
  ).length;

  const fetchJoinRequests = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        "http://localhost:5000/api/projects/join-requests",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setJoinRequests(data);
      } else if (res.status === 403) {
        setJoinRequests([]);
      } else {
        console.error("Error fetching join requests:", res.status);
      }
    } catch (error) {
      console.error("Error fetching join requests:", error);
    }
  };

  const handleJoinRequestAction = async (projectId, userId, action) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:5000/api/projects/join-request/${projectId}/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: action }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update join request status");
      }

      setSnackbarMsg(`Join request ${action} successfully!`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setJoinRequestsModalOpen(false);
      await fetchJoinRequests();
      if (fetchProjects) await fetchProjects();
    } catch (err) {
      setSnackbarMsg(err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    fetchJoinRequests();
  }, []);

  const onViewJoinRequests = (project) => {
    setSelectedProject(project);
    setJoinRequestsModalOpen(true);
  };

  const totalPendingRequests = joinRequests.length;

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        p: { xs: 2, md: 4 },
        bgcolor: theme === "dark" ? "#181823" : "#f7f9fb",
        minHeight: "100vh",
      }}
    >
      {/* Welcome Message */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            color: theme === "dark" ? "#fff" : "#333",
            textAlign: { xs: "center", md: "left" },
          }}
        >
          Welcome back, {user?.name || "Admin"}!
        </Typography>
        {totalPendingRequests > 0 && (
          <Chip
            label={`${totalPendingRequests} Pending Join Request${
              totalPendingRequests > 1 ? "s" : ""
            }`}
            color="warning"
            variant="filled"
            sx={{ fontSize: "14px", fontWeight: "bold" }}
          />
        )}
      </Box>

      {/* Metrics Overview Section - 3 Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Ongoing Projects Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              bgcolor: theme === "dark" ? "#232946" : "#fff",
              border: `1px solid ${theme === "dark" ? "#444" : "#e0e0e0"}`,
              height: "200px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ textAlign: "left" }}>
              <TrendingUpIcon
                sx={{ fontSize: 32, color: "primary.main", mb: 2 }}
              />
            </Box>
            <Box>
              <Typography
                variant="h2"
                fontWeight={700}
                color="primary"
                sx={{ mb: 1 }}
              >
                {ongoingProjectsCount}
              </Typography>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Total Ongoing Projects
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Across all teams
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Completed Projects Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              bgcolor: theme === "dark" ? "#232946" : "#fff",
              border: `1px solid ${theme === "dark" ? "#444" : "#e0e0e0"}`,
              height: "200px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ textAlign: "left" }}>
              <CheckCircleIcon
                sx={{ fontSize: 32, color: "success.main", mb: 2 }}
              />
            </Box>
            <Box>
              <Typography
                variant="h2"
                fontWeight={700}
                color="success.main"
                sx={{ mb: 1 }}
              >
                {completedProjectsCount}
              </Typography>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Total Completed Projects
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successfully delivered
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Schedule Meeting Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              bgcolor: theme === "dark" ? "#232946" : "#fff",
              border: `1px solid ${theme === "dark" ? "#444" : "#e0e0e0"}`,
              height: "200px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ textAlign: "left" }}>
              <VideoCallIcon sx={{ fontSize: 32, color: "info.main", mb: 2 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Schedule a Meeting
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
                onClick={() => navigate("/dashboard/meetings")}
              >
                + New Meeting
              </Button>
              <Typography variant="body2" color="text.secondary">
                Schedule team meetings
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Admin Actions Section */}
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{
          mb: 3,
          color: theme === "dark" ? "#fff" : "#333",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <DashboardIcon color="primary" />
        Admin Actions
      </Typography>

      {/* 5 Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              p: 3,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
            onClick={() => setModalOpen(true)}
          >
            <AddIcon sx={{ fontSize: 24 }} />
            Create Project
          </Button>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{
              p: 3,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
            onClick={() => setProjectsModalOpen(true)}
          >
            <FolderIcon sx={{ fontSize: 24 }} />
            View Projects
          </Button>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Button
            variant="contained"
            color="success"
            fullWidth
            sx={{
              p: 3,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
            onClick={() => setJoinRequestsModalOpen(true)}
          >
            <GroupIcon sx={{ fontSize: 24 }} />
            Manage Teams
          </Button>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Button
            variant="contained"
            color="warning"
            fullWidth
            sx={{
              p: 3,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
            onClick={() => navigate("/dashboard/reports")}
          >
            <AssessmentIcon sx={{ fontSize: 24 }} />
            View Reports
          </Button>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Button
            variant="contained"
            color="info"
            fullWidth
            sx={{
              p: 3,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
            onClick={() => navigate("/dashboard/meetings")}
          >
            <VideoCallIcon sx={{ fontSize: 24 }} />
            Schedule Meeting
          </Button>
        </Grid>
      </Grid>

      {/* Modals */}
      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={onProjectCreated}
        user={user}
      />
      <CurrentProjectsModal
        open={projectsModalOpen}
        onClose={() => setProjectsModalOpen(false)}
        projects={projects}
        onViewJoinRequests={onViewJoinRequests}
      />

      {/* Join Requests Modal */}
      <Dialog
        open={joinRequestsModalOpen}
        onClose={() => setJoinRequestsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Join Requests for {selectedProject?.name}</DialogTitle>
        <DialogContent>
          {!selectedProject?.joinRequests ||
          selectedProject.joinRequests.filter((req) => req.status === "pending")
            .length === 0 ? (
            <Typography color="text.secondary">
              No pending join requests for this project.
            </Typography>
          ) : (
            selectedProject.joinRequests
              .filter((req) => req.status === "pending")
              .map((req) => (
                <Paper key={req._id} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography fontWeight={600}>
                        {req.user && req.user.name
                          ? req.user.name
                          : "Unknown User"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {req.user && req.user.email
                          ? req.user.email
                          : "No email"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Requested on:{" "}
                        {new Date(req.requestedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        color="success"
                        variant="contained"
                        onClick={() =>
                          handleJoinRequestAction(
                            selectedProject._id,
                            req.user._id || req.user,
                            "approved"
                          )
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() =>
                          handleJoinRequestAction(
                            selectedProject._id,
                            req.user._id || req.user,
                            "rejected"
                          )
                        }
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinRequestsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
        >
          {snackbarMsg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}

const TeamSyncDashboard = () => {
  const { user, role, setRole, logout } = useAuth();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { theme, toggleTheme } = useTheme();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
    let url = "";
    if (role === "admin") {
      url = "http://localhost:5000/api/projects/mine";
    } else {
      url = "http://localhost:5000/api/projects/member-projects";
    }
    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        console.error("Failed to fetch projects:", res.status);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/notifications/unread-count",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.count);
      }
    } catch (err) {
      console.error("Failed to fetch unread notifications:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUnreadNotifications();
    fetchNotifications();
  }, []);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: theme === "dark" ? "#181823" : "#f5f5f5",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Top Navigation Bar */}
      <nav
        style={{
          backgroundColor: "#1976d2",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          color: "white",
          width: "98vw",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
              marginRight: "20px",
            }}
          >
            ☰
          </button>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            TeamSync
          </h1>
        </div>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography
            variant="h4"
            sx={{ color: theme === "dark" ? "#fff" : "#333" }}
          >
            Dashboard
          </Typography>
          <Badge badgeContent={unreadNotifications} color="error">
            <IconButton
              onClick={() => setNotificationCenterOpen(true)}
              sx={{
                bgcolor: theme === "dark" ? "#1976d2" : "#1976d2",
                color: "white",
                "&:hover": {
                  bgcolor: theme === "dark" ? "#1565c0" : "#1565c0",
                },
              }}
            >
              <NotificationsIcon />
            </IconButton>
          </Badge>
        </Box>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "1.7rem",
              cursor: "pointer",
              marginRight: "8px",
            }}
            title="Toggle theme"
          >
            {theme === "dark" ? "🌞" : "🌙"}
          </button>

          {/* Profile Menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={{
                background: "#ff9800",
                border: "none",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {role === "admin" ? "A" : "M"}
            </button>
            {profileMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  backgroundColor: theme === "white" ? "white" : "#181823",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  width: "200px",
                  zIndex: 1000,
                  color: "#333",
                }}
              >
                <button
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "none",
                    color: "white",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                  onClick={() => navigate("/profile")}
                >
                  👤 Profile
                </button>
                <button
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "white",
                    gap: "10px",
                  }}
                  onClick={() => navigate("/settings")}
                >
                  ⚙️ Settings
                </button>
                <hr
                  style={{
                    margin: "8px 0",
                    border: "none",
                    borderTop: "1px solid #eee",
                  }}
                />
                <button
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    color: "white",
                    alignItems: "center",
                    gap: "10px",
                  }}
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div
        style={{
          width: "100vw",
          height: "calc(100vh - 64px)",
          marginTop: "64px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            width: "100%",
            padding: "30px 20px",
            boxSizing: "border-box",
          }}
        >
          {role === "member" && (
            <MemberDashboardContent
              projects={projects}
              meetings={meetings}
              notifications={notifications}
              user={user}
              onJoinProject={fetchProjects}
              fetchProjects={fetchProjects}
            />
          )}
          {role === "admin" && (
            <AdminDashboardContent
              projects={projects}
              meetings={meetings}
              notifications={notifications}
              user={user}
              theme={theme}
              onProjectCreated={(project) =>
                setProjects((prev) => [project, ...prev])
              }
              fetchProjects={fetchProjects}
            />
          )}
        </div>
      </div>
      <NotificationCenter
        open={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
        notifications={notifications}
        unreadNotifications={unreadNotifications}
        setUnreadNotifications={setUnreadNotifications}
      />
      {/* Insights widgets removed as requested */}
    </div>
  );
};

export default TeamSyncDashboard;
