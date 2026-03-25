import { API_BASE } from '../config/api';
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../useAuth";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell
} from 'recharts';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Divider,
  Box,
  Typography,
  Paper,
  IconButton,
  Avatar,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { useTheme } from "../ThemeContext";
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
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import NotificationsIcon from "@mui/icons-material/Notifications";


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
        `${API_BASE}/projects/join-request`,
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
  analytics,
  user,
  onJoinProject,
  fetchProjects,
}) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [joinProjectModalOpen, setJoinProjectModalOpen] = useState(false);

  // Metrics
  const activeProjects = projects.filter(p => p.status !== 'completed').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  return (
    <Box>
      <Box mb={6}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: theme === 'dark' ? '#fff' : '#0f172a' }}>
          Hello, {user?.name?.split(' ')[0]} 👋
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
          Here's what's happening with your projects today.
        </Typography>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={3} mb={6}>
        <Grid xs={12} md={4}>
          <Card sx={{ 
            p: 3, 
            height: '100%',
            borderRadius: '24px', 
            bgcolor: theme === 'dark' ? '#1e293b' : '#fff',
            border: '1px solid',
            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                <FolderIcon sx={{ fontSize: 120, color: 'primary.main' }} />
             </Box>
             <Typography variant="overline" fontWeight={700} color="primary">Active Projects</Typography>
             <Typography variant="h2" fontWeight={800} sx={{ my: 1 }}>{activeProjects}</Typography>
             <Typography variant="body2" color="text.secondary">Currently in progress</Typography>
          </Card>
        </Grid>
        <Grid xs={12} md={4}>
          <Card sx={{ 
            p: 3, 
            height: '100%',
            borderRadius: '24px', 
            bgcolor: theme === 'dark' ? '#1e293b' : '#fff',
            border: '1px solid',
            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                <CheckCircleIcon sx={{ fontSize: 120, color: 'success.main' }} />
             </Box>
             <Typography variant="overline" fontWeight={700} color="success.main">Completed</Typography>
             <Typography variant="h2" fontWeight={800} sx={{ my: 1 }}>{completedProjects}</Typography>
             <Typography variant="body2" color="text.secondary">Successfully delivered</Typography>
          </Card>
        </Grid>
        <Grid xs={12} md={4}>
          <Card 
            onClick={() => setJoinProjectModalOpen(true)}
            sx={{ 
              p: 3, 
              height: '100%',
              borderRadius: '24px', 
              bgcolor: 'primary.main',
              color: '#fff',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' }
            }}
          >
             <AddIcon sx={{ fontSize: 48, mb: 1 }} />
             <Typography variant="h5" fontWeight={700}>Join Project</Typography>
             <Typography variant="body2" sx={{ opacity: 0.8 }}>Use a join code</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics & Activity Row */}
      <Grid container spacing={3} mb={6}>
        <Grid xs={12} lg={8} className="dashboard-performance">
          <Card sx={{ 
            p: 3, 
            borderRadius: '24px', 
            bgcolor: theme === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
            height: '100%'
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Project Performance</Typography>
                <Typography variant="body2" color="text.secondary">Weekly completion rate</Typography>
              </Box>
              <Button size="small" variant="outlined" sx={{ borderRadius: '8px' }}>This Week</Button>
            </Box>
            <Box sx={{ height: 300, width: '100%', minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={analytics?.weeklyCompletion || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#475569' : '#94a3b8'} fontSize={12} />
                  <YAxis hide />
                  <ChartTooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area type="monotone" dataKey="completion" stroke="#6366f1" fillOpacity={1} fill="url(#colorComp)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
        <Grid xs={12} lg={4}>
          <Card sx={{ 
            p: 3, 
            borderRadius: '24px', 
            bgcolor: theme === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
            height: '100%'
          }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Recent Activity</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {notifications.slice(0, 4).length > 0 ? notifications.slice(0, 4).map((notif, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', color: 'primary.main' }}>
                    <NotificationsIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{notif.title}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{notif.message}</Typography>
                    <Typography variant="caption" sx={{ color: 'primary.main', opacity: 0.8 }}>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                  </Box>
                </Box>
              )) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                   <Typography variant="body2" color="text.secondary">No recent activity</Typography>
                </Box>
              )}
            </Box>
            <Button fullWidth variant="text" size="small" sx={{ mt: 'auto', pt: 3 }} onClick={() => navigate('/dashboard/reports')}>View Full Report</Button>
          </Card>
        </Grid>
      </Grid>

      {/* Projects List */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
           <Typography variant="h5" fontWeight={700}>My Projects</Typography>
           <Button variant="text" sx={{ fontWeight: 600 }}>View All</Button>
        </Box>
        
        <Grid container spacing={3}>
          {projects.length === 0 ? (
            <Grid xs={12}>
              <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '24px', border: '1px dashed #cbd5e1', bgcolor: 'transparent' }}>
                 <Typography variant="h6" color="text.secondary">No projects yet</Typography>
                 <Button variant="contained" sx={{ mt: 2, borderRadius: '12px' }} onClick={() => setJoinProjectModalOpen(true)}>Join your first project</Button>
              </Paper>
            </Grid>
          ) : (
            projects.map(project => (
              <Grid xs={12} md={6} lg={4} key={project._id}>
                <Card 
                  onClick={() => navigate(`/dashboard/projects/${project._id}`)}
                  sx={{ 
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: theme === 'dark' ? '#334155' : '#f1f5f9',
                    bgcolor: theme === 'dark' ? '#1e293b' : '#fff',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" fontWeight={700}>{project.name}</Typography>
                      <Chip 
                        label={project.status} 
                        size="small" 
                        sx={{ 
                          borderRadius: '8px', 
                          fontWeight: 600,
                          bgcolor: project.status === 'completed' ? 'success.light' : 'primary.light',
                          color: project.status === 'completed' ? 'success.dark' : 'primary.dark'
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      mb: 3, 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden',
                      minHeight: '40px'
                    }}>
                      {project.description || "Project collaboration and management."}
                    </Typography>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                       <Box display="flex" alignItems="center" gap={1}>
                          <GroupIcon fontSize="small" color="action" />
                          <Typography variant="caption" fontWeight={600}>{project.members?.length || 0} Members</Typography>
                       </Box>
                       <Avatar sx={{ width: 24, height: 24, fontSize: '10px' }}>{project.createdBy?.name?.charAt(0)}</Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      <JoinProjectModal
        open={joinProjectModalOpen}
        onClose={() => setJoinProjectModalOpen(false)}
        onJoinSuccess={fetchProjects}
      />
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
      const res = await fetch(`${API_BASE}/projects`, {
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
    fetch(`${API_BASE}/projects/${projectId}`, {
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
  analytics,
  user,
  theme,
  onProjectCreated,
  fetchProjects,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [joinRequestsModalOpen, setJoinRequestsModalOpen] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  // Metrics
  const activeProjectsCount = projects.filter(p => p.status !== 'completed').length;
  const completedProjectsCount = projects.filter(p => p.status === 'completed').length;

  const fetchJoinRequests = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/projects/join-requests`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setJoinRequests(data);
      }
    } catch (error) {
      console.error("Error fetching join requests:", error);
    }
  };

  useEffect(() => {
    fetchJoinRequests();
  }, []);

  const handleJoinRequestAction = async (projectId, userId, action) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_BASE}/projects/join-request/${projectId}/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: action }),
        }
      );
      if (!res.ok) throw new Error("Failed to update status");

      setSnackbarMsg(`Request ${action} successfully`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      fetchJoinRequests();
      fetchProjects();
    } catch (err) {
      setSnackbarMsg(err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box>
       <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: theme === 'dark' ? '#fff' : '#0f172a' }}>
            Admin Panel
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
            Manage projects, teams and track overall progress.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ 
            borderRadius: '12px', 
            px: 3, 
            py: 1.5,
            fontWeight: 700,
            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)'
          }}
        >
          New Project
        </Button>
      </Box>

      {/* Admin Metrics */}
      <Grid container spacing={3} mb={6}>
        <Grid xs={12} md={4}>
           <Card sx={{ 
            p: 3, 
            height: '100%',
            borderRadius: '24px', 
            bgcolor: theme === 'dark' ? '#1e293b' : '#fff',
            border: '1px solid',
            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                <FolderIcon sx={{ fontSize: 120, color: 'primary.main' }} />
             </Box>
             <Typography variant="overline" fontWeight={700} color="primary">Total Ongoing</Typography>
             <Typography variant="h2" fontWeight={800} sx={{ my: 1 }}>{activeProjectsCount}</Typography>
             <Typography variant="body2" color="text.secondary">Projects currently in development</Typography>
          </Card>
        </Grid>
        <Grid xs={12} md={4}>
           <Card sx={{ 
            p: 3, 
            height: '100%',
            borderRadius: '24px', 
            bgcolor: theme === 'dark' ? '#1e293b' : '#fff',
            border: '1px solid',
            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                <CheckCircleIcon sx={{ fontSize: 120, color: 'success.main' }} />
             </Box>
             <Typography variant="overline" fontWeight={700} color="success.main">Completed</Typography>
             <Typography variant="h2" fontWeight={800} sx={{ my: 1 }}>{completedProjectsCount}</Typography>
             <Typography variant="body2" color="text.secondary">Successfully delivered projects</Typography>
          </Card>
        </Grid>
        <Grid xs={12} md={4}>
           <Card sx={{ 
            p: 3, 
            height: '100%',
            borderRadius: '24px', 
            bgcolor: theme === 'dark' ? '#1e293b' : '#fff',
            border: '1px solid',
            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                <GroupIcon sx={{ fontSize: 120, color: 'warning.main' }} />
             </Box>
             <Typography variant="overline" fontWeight={700} color="warning.main">Join Requests</Typography>
             <Typography variant="h2" fontWeight={800} sx={{ my: 1 }}>{joinRequests.length}</Typography>
             <Button size="small" variant="outlined" color="warning" sx={{ borderRadius: '8px', mt: 1 }} onClick={() => setJoinRequestsModalOpen(true)}>Review Requests</Button>
          </Card>
        </Grid>
      </Grid>
      
      {/* Analytics Section for Admin */}
      <Grid container spacing={3} mb={6}>
        <Grid xs={12} className="dashboard-performance">
          <Card sx={{ 
            p: 3, 
            borderRadius: '24px', 
            bgcolor: theme === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Platform Growth</Typography>
                <Typography variant="body2" color="text.secondary">Weekly project completion rate</Typography>
              </Box>
              <TrendingUpIcon color="primary" />
            </Box>
            <Box sx={{ height: 300, width: '100%', minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={analytics?.weeklyCompletion || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAdminComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#475569' : '#94a3b8'} fontSize={12} />
                  <YAxis hide />
                  <ChartTooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area type="monotone" dataKey="completion" stroke="#6366f1" fillOpacity={1} fill="url(#colorAdminComp)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Projects Grid for Admin */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
           <Typography variant="h5" fontWeight={700}>Project Management</Typography>
        </Box>
        
        <Grid container spacing={3}>
          {projects.length === 0 ? (
            <Grid xs={12}>
              <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '24px', border: '1px dashed #cbd5e1', bgcolor: 'transparent' }}>
                 <Typography variant="h6" color="text.secondary">No projects yet</Typography>
                 <Button variant="contained" sx={{ mt: 2, borderRadius: '12px' }} onClick={() => setModalOpen(true)}>Create your first project</Button>
              </Paper>
            </Grid>
          ) : (
            projects.map(project => (
              <Grid xs={12} md={6} lg={4} key={project._id}>
                <Card 
                  onClick={() => navigate(`/dashboard/projects/${project._id}`)}
                  sx={{ 
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: theme === 'dark' ? '#334155' : '#f1f5f9',
                    bgcolor: theme === 'dark' ? '#1e293b' : '#fff',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" fontWeight={700}>{project.name}</Typography>
                      <Chip 
                        label={project.status} 
                        size="small" 
                        sx={{ 
                          borderRadius: '8px', 
                          fontWeight: 600,
                          bgcolor: project.status === 'completed' ? 'success.light' : 'primary.light',
                          color: project.status === 'completed' ? 'success.dark' : 'primary.dark'
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      mb: 3, 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden',
                      minHeight: '40px'
                    }}>
                      {project.description || "Project collaboration and management."}
                    </Typography>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                       <Box display="flex" alignItems="center" gap={1}>
                          <GroupIcon fontSize="small" color="action" />
                          <Typography variant="caption" fontWeight={600}>{project.members?.length || 0} Team Members</Typography>
                       </Box>
                       <Avatar sx={{ width: 24, height: 24, fontSize: '10px' }}>{project.name?.charAt(0)}</Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Modals restored with premium styling */}
      <CreateProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={onProjectCreated} user={user} />
      
      <Dialog open={joinRequestsModalOpen} onClose={() => setJoinRequestsModalOpen(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 800 }}>Team Join Requests</DialogTitle>
         <DialogContent>
            {joinRequests.length === 0 ? (
              <Typography color="text.secondary" p={2}>No pending requests.</Typography>
            ) : (
              joinRequests.map(req => (
                <Paper key={req._id} sx={{ p: 2, mb: 1, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <Box>
                      <Typography fontWeight={700}>{req.user?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Project: {req.project?.name || "Shared Project"}</Typography>
                   </Box>
                   <Box display="flex" gap={1}>
                      <Button size="small" variant="contained" color="success" onClick={() => handleJoinRequestAction(req.project?._id || req.projectId, req.user?._id || req.userId, 'approved')}>Approve</Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleJoinRequestAction(req.project?._id || req.projectId, req.user?._id || req.userId, 'rejected')}>Deny</Button>
                   </Box>
                </Paper>
              ))
            )}
         </DialogContent>
         <DialogActions><Button onClick={() => setJoinRequestsModalOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <MuiAlert severity={snackbarSeverity} variant="filled">{snackbarMsg}</MuiAlert>
      </Snackbar>
    </Box>
  );
}

const TeamSyncDashboard = () => {
  const { user, role } = useAuth();
  const [projects, setProjects] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const { theme } = useTheme();

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
    const url = role === "admin" ? `${API_BASE}/projects/mine` : `${API_BASE}/projects/member-projects`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setProjects(await res.json());
    } catch (error) { console.error(error); }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setNotifications((await res.json()).notifications || []);
    } catch (err) { console.error(err); }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/projects/stats/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAnalytics(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (role) {
      fetchProjects();
      fetchNotifications();
      fetchAnalytics();
    }
  }, [role]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {role === 'member' ? (
          <MemberDashboardContent
            projects={projects}
            meetings={meetings}
            notifications={notifications}
            analytics={analytics}
            user={user}
            onJoinProject={fetchProjects}
            fetchProjects={fetchProjects}
          />
        ) : (
          <AdminDashboardContent
            projects={projects}
            meetings={meetings}
            notifications={notifications}
            analytics={analytics}
            user={user}
            theme={theme}
            onProjectCreated={() => { fetchProjects(); fetchAnalytics(); }}
            fetchProjects={fetchProjects}
          />
        )}
      </Box>
    </Box>
  );
};

export default TeamSyncDashboard;
