import React, { useEffect, useState , useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Chip,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Fade,
  Grow,
  Slide,
  Card,
  CardContent,
  Avatar,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DescriptionIcon from "@mui/icons-material/Description";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import { useTheme } from "../ThemeContext";
import { useAuth } from "../useAuth";
import { io } from "socket.io-client";
import ChatIcon from '@mui/icons-material/Chat';
import Drawer from '@mui/material/Drawer';
import ReplyIcon from '@mui/icons-material/Reply';

// Add geometric/dot pattern background component inspired by Landing.jsx
const DotPattern = ({ theme }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: theme === "dark" ? 0.08 : 0.15,
      background: `radial-gradient(circle, ${
        theme === "dark" ? "#6366f1" : "#3b82f6"
      } 1px, transparent 1px)`,
      backgroundSize: "30px 30px",
      zIndex: 0,
      pointerEvents: "none",
    }}
  />
);

function ProjectChatDrawer({ projectId, open, onClose }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    socketRef.current = io("http://localhost:5000");
    socketRef.current.emit("joinProjectRoom", projectId);
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    };
    fetchHistory();
    socketRef.current.on("projectChatMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socketRef.current.emit("leaveProjectRoom", projectId);
      socketRef.current.disconnect();
    };
  }, [projectId, open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current.emit("projectChatMessage", {
      projectId,
      senderId: user.id || user._id,
      message: input,
      replyTo: replyTo ? {
        _id: replyTo._id,
        senderName: replyTo.senderId?.name || 'You',
        text: replyTo.message,
      } : undefined,
    });
    setInput("");
    setReplyTo(null);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 350, p: 0, bgcolor: theme === 'dark' ? '#232946' : '#fff' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #eee', bgcolor: theme === 'dark' ? '#181823' : '#1976d2', color: theme === 'dark' ? '#fbbf24' : 'white' }}>
        <Typography variant="h6" fontWeight={700}>Project Chat</Typography>
        <IconButton onClick={onClose} sx={{ color: theme === 'dark' ? '#fbbf24' : 'white' }}><CloseIcon /></IconButton>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: theme === 'dark' ? '#181823' : '#f9f9f9', minHeight: 0 }}>
          {messages.map((msg) => {
            const isCurrentUser = msg.senderId?._id === (user.id || user._id);
            const isAdmin = msg.senderId?.role === 'admin';
            return (
              <Box
                key={msg._id}
                sx={{
                  mb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                  position: 'relative',
                }}
              >
                {/* If this message is a reply, show the quoted message above */}
                {msg.replyTo && (
                  <Box sx={{
                    bgcolor: theme === 'dark' ? '#393e46' : '#f5f5f5',
                    borderLeft: '3px solid #1976d2',
                    px: 1.5, py: 0.5, mb: 0.5, borderRadius: 1, maxWidth: '75%',
                  }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#1976d2' }}>{msg.replyTo.senderName}</Typography>
                    <Typography variant="caption" sx={{ color: '#232323', fontStyle: 'italic' }}>
                      {msg.replyTo.text.length > 60 ? msg.replyTo.text.slice(0, 60) + '…' : msg.replyTo.text}
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    bgcolor: isAdmin
                      ? (theme === 'dark' ? '#fffde7' : '#fff9c4')
                      : isCurrentUser
                      ? (theme === 'dark' ? '#6366f1' : '#1976d2')
                      : (theme === 'dark' ? '#393e46' : '#e0e0e0'),
                    color: isCurrentUser
                      ? 'white'
                      : isAdmin
                      ? (theme === 'dark' ? '#232946' : '#232946')
                      : (theme === 'dark' ? '#fbbf24' : '#232946'),
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: '80%',
                    border: isAdmin ? '2px solid #ffd600' : 'none',
                    boxShadow: isAdmin ? '0 2px 8px #ffe082' : undefined,
                    position: 'relative',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mr: 1, color: isAdmin ? (theme === 'dark' ? '#b26a00' : '#b26a00') : undefined }}>
                      {msg.senderId?.name || 'You'}
                    </Typography>
                    {isAdmin && (
                      <AdminPanelSettingsIcon fontSize="small" sx={{ color: '#ffd600', ml: 0.5 }} />
                    )}
                  </Box>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word', color: '#232323' }}>{msg.message}</Typography>
                  <Typography variant="caption" sx={{ color: isCurrentUser ? (theme === 'dark' ? '#ffe082' : '#e0e0e0') : '#888', float: 'right', display: 'block', mt: 0.5 }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                  </Typography>
                  {/* Reply icon */}
                  <IconButton size="small" sx={{ position: 'absolute', top: 2, right: isCurrentUser ? '100%' : '-36px', color: '#1976d2' }} onClick={() => setReplyTo(msg)}>
                    <ReplyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
          <div ref={messagesEndRef} />
        </Box>
        {/* Reply preview above input */}
        {replyTo && (
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: theme === 'dark' ? '#393e46' : '#f5f5f5', borderLeft: '3px solid #1976d2', px: 1.5, py: 0.5, mb: 1, borderRadius: 1, mx: 2 }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: '#1976d2', mr: 1 }}>{replyTo.senderId?.name || 'You'}</Typography>
            <Typography variant="caption" sx={{ color: '#232323', fontStyle: 'italic', flex: 1 }}>
              {replyTo.message.length > 60 ? replyTo.message.slice(0, 60) + '…' : replyTo.message}
            </Typography>
            <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ ml: 1, color: '#1976d2' }}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        )}
        <Box component="form" onSubmit={handleSend} sx={{ display: 'flex', gap: 1, p: 2, borderTop: '1px solid #eee', bgcolor: theme === 'dark' ? '#232946' : '#fff' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc', background: theme === 'dark' ? '#181823' : '#fff', color: theme === 'dark' ? '#fbbf24' : '#232946' }}
          />
          <button type="submit" style={{ padding: '8px 16px', borderRadius: 4, background: theme === 'dark' ? '#6366f1' : '#1976d2', color: 'white', border: 'none' }}>Send</button>
        </Box>
      </Box>
    </Drawer>
  );
}

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Remove old editMode/editFields/editLoading state, only use the new inline edit state
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addMemberError, setAddMemberError] = useState("");
  const [joinCodeModalOpen, setJoinCodeModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Add state for overall edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFields, setEditFields] = useState({
    name: "",
    description: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Open edit modal and prefill fields
  const openEditModal = () => {
    setEditFields({
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate || "",
      endDate: project.endDate || "",
    });
    setEditModalOpen(true);
  };
  // Save all edits
  const saveProjectEdit = async () => {
    setEditLoading(true);
    setEditError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFields),
      });
      const data = await res.json();
      if (res.ok) {
        setProject(data);
        setEditModalOpen(false);
      } else {
        setEditError(data.message || "Failed to update project");
      }
    } catch {
      setEditError("Failed to update project");
    } finally {
      setEditLoading(false);
    }
  };

  // Geometric shapes array (from Landing)
  const geometricShapes = [
    {
      size: "120px",
      color: theme === "dark" ? "#6366f1" : "#3b82f6",
      delay: 0,
      position: { x: "10%", y: "20%", rotate: 45 },
    },
    {
      size: "80px",
      color: theme === "dark" ? "#34d399" : "#10b981",
      delay: 2,
      position: { x: "85%", y: "30%", rotate: -30 },
    },
    {
      size: "100px",
      color: theme === "dark" ? "#fbbf24" : "#f59e0b",
      delay: 4,
      position: { x: "15%", y: "70%", rotate: 60 },
    },
    {
      size: "60px",
      color: theme === "dark" ? "#f87171" : "#ef4444",
      delay: 6,
      position: { x: "80%", y: "75%", rotate: -45 },
    },
  ];

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes floatGeometric {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-30px) rotate(180deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchProject = () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setError("");
    fetch(`http://localhost:5000/api/projects/${id}`, {
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
  };

  const handleAddMember = async () => {
    setAddMemberError("");
    if (!newMemberEmail) return;
    // Placeholder: In a real app, search for user by email, get their ID, and call the backend
    setAddMemberError("Feature to add member by email coming soon.");
  };

  const handleCopyJoinCode = () => {
    if (project && project.joinCode) {
      navigator.clipboard.writeText(project.joinCode);
    }
  };

  const handleShareJoinCode = () => {
    if (project && project.joinCode) {
      const shareData = {
        title: "Join my TeamSync project",
        text: `Join my project on TeamSync! Use this code: ${project.joinCode}`,
        url: window.location.href,
      };
      if (navigator.share) {
        navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(project.joinCode);
      }
    }
  };

  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskMember, setTaskMember] = useState("");
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState("");

  const handleAssignTask = async () => {
    setTaskLoading(true);
    setTaskError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          project: project._id,
          assignedTo: taskMember,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign task");
      setTaskTitle("");
      setTaskDesc("");
      setTaskMember("");
      setAssignTaskOpen(false);
      fetchProject();
    } catch (err) {
      setTaskError(err.message);
    } finally {
      setTaskLoading(false);
    }
  };

  // Approve/Reject join request
  const handleJoinRequestAction = async (userId, status) => {
    const token = localStorage.getItem("token");
    await fetch(
      `http://localhost:5000/api/projects/join-request/${project._id}/${userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );
    fetchProject();
  };

  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  if (loading)
    return (
      <Box p={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Box p={4} textAlign="center">
        <Typography color="error.main">{error}</Typography>
      </Box>
    );
  if (!project) return null;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        minHeight: "100vh",
        overflow: "hidden",
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #18181b 0%, #27272a 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
      }}
    >
      {/* Animated geometric shapes */}
      {geometricShapes.map((shape, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: shape.size,
            height: shape.size,
            background: `linear-gradient(135deg, ${shape.color}20, ${shape.color}05)`,
            borderRadius: "12px",
            transform: `rotate(${shape.position.rotate}deg)`,
            left: shape.position.x,
            top: shape.position.y,
            animation: "floatGeometric 8s ease-in-out infinite",
            animationDelay: `${shape.delay}s`,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      ))}
      <DotPattern theme={theme} />
      {/* Floating theme switcher */}
      <Button
        onClick={toggleTheme}
        sx={{
          position: "fixed",
          top: 24,
          right: 32,
          zIndex: 10,
          borderRadius: "50%",
          minWidth: 0,
          width: 48,
          height: 48,
          fontSize: 28,
          bgcolor: theme === "dark" ? "#232946" : "#fbbf24",
          color: theme === "dark" ? "#fbbf24" : "#232946",
          boxShadow: 4,
          "&:hover": { bgcolor: theme === "dark" ? "#393e46" : "#ffe066" },
        }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? "🌞" : "🌙"}
      </Button>
      {/* Floating chat icon button */}
      <Tooltip title="Chat">
        <IconButton
          onClick={() => setChatDrawerOpen(true)}
          sx={{
            position: "fixed",
            bottom: 80,
            right: 32,
            zIndex: 10,
            bgcolor: theme === "dark" ? "#232946" : "#1976d2",
            color: "white",
            "&:hover": { bgcolor: theme === "dark" ? "#393e46" : "#1565c0" },
          }}
        >
          <ChatIcon />
        </IconButton>
      </Tooltip>
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          mx: "auto",
          py: { xs: 3, md: 6 },
          px: { xs: 1, sm: 4, md: 8 },
        }}
      >
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{
            mb: 3,
            fontWeight: 600,
            borderRadius: 3,
            fontSize: 18,
            px: 3,
            py: 1,
          }}
        >
          ← Back to Projects
        </Button>
        <Grow in timeout={900}>
          <Paper
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 5,
              mb: 4,
              background:
                theme === "dark"
                  ? "linear-gradient(135deg, #232946 0%, #18181b 100%)"
                  : "linear-gradient(135deg, #6366f1 0%, #a5b4fc 100%)",
              boxShadow: 8,
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Typography
                variant="h3"
                fontWeight={900}
                mb={2}
                letterSpacing={1}
                sx={{ fontSize: { xs: 32, md: 44 } }}
              >
                {project.name}
              </Typography>
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                onClick={openEditModal}
                sx={{
                  fontWeight: 700,
                  borderRadius: 3,
                  fontSize: 18,
                  px: 3,
                  py: 1,
                }}
              >
                Edit Project
              </Button>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setJoinCodeModalOpen(true)}
              sx={{
                mb: 2,
                fontWeight: 700,
                borderRadius: 3,
                fontSize: 18,
                px: 3,
                py: 1,
                boxShadow: 2,
                background: "linear-gradient(90deg, #fbbf24 0%, #f59e42 100%)",
                color: "#232946",
                "&:hover": {
                  background:
                    "linear-gradient(90deg, #f59e42 0%, #fbbf24 100%)",
                },
              }}
            >
              View Join Code
            </Button>
            <Typography color="inherit" mb={2} fontSize={20}>
              <DescriptionIcon
                fontSize="medium"
                sx={{ mr: 1, verticalAlign: "middle" }}
              />
              {project.description || "No description."}
            </Typography>
            <Box display="flex" gap={3} flexWrap="wrap" mb={2}>
              <Chip
                label={project.status}
                size="medium"
                color="default"
                sx={{
                  fontWeight: 700,
                  fontSize: 16,
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
              />
              <Chip
                icon={<AdminPanelSettingsIcon />}
                label={project.createdBy?.name || "Unknown"}
                color="primary"
                sx={{
                  fontWeight: 700,
                  fontSize: 16,
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
              />
              <Chip
                icon={<CalendarTodayIcon />}
                label={`Start: ${
                  project.startDate
                    ? new Date(project.startDate).toLocaleDateString()
                    : "Not set"
                }`}
                sx={{
                  fontWeight: 700,
                  fontSize: 16,
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
              />
              <Chip
                icon={<CalendarTodayIcon />}
                label={`End: ${
                  project.endDate
                    ? new Date(project.endDate).toLocaleDateString()
                    : "Not set"
                }`}
                sx={{
                  fontWeight: 700,
                  fontSize: 16,
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
              />
            </Box>
            <Typography
              variant="subtitle2"
              color="inherit"
              mt={2}
              mb={1}
              fontSize={18}
            >
              Documents:
            </Typography>
            <Typography color="inherit" fontSize={16}>
              (Document management coming soon)
            </Typography>
            <Typography
              variant="subtitle2"
              color="inherit"
              mt={2}
              mb={1}
              fontSize={18}
            >
              Created At: {new Date(project.createdAt).toLocaleString()}
            </Typography>
          </Paper>
        </Grow>
        <Grow in timeout={1100}>
          <Paper
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 5,
              mb: 4,
              background:
                theme === "dark"
                  ? "linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)"
                  : "linear-gradient(135deg, #6366f1 0%, #a5b4fc 100%)",
              boxShadow: 6,
              color: "#232946",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Typography variant="h4" fontWeight={800} color="inherit">
                <GroupIcon
                  fontSize="large"
                  sx={{ mr: 1, verticalAlign: "middle" }}
                />
                Members
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  onClick={() => setAddMemberOpen(true)}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 3,
                    fontSize: 18,
                    px: 3,
                    py: 1,
                    boxShadow: 2,
                    background:
                      "linear-gradient(90deg, #fbbf24 0%, #f59e42 100%)",
                    color: "#232946",
                    "&:hover": {
                      background:
                        "linear-gradient(90deg, #f59e42 0%, #fbbf24 100%)",
                    },
                  }}
                >
                  Add Member
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => setAssignTaskOpen(true)}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 3,
                    fontSize: 18,
                    px: 3,
                    py: 1,
                    color: theme === "dark" ? "#6366f1" : "#232946",
                    borderColor: theme === "dark" ? "#6366f1" : "#232946",
                  }}
                >
                  Assign Task
                </Button>
              </Box>
            </Box>
            {project.members && project.members.length > 0 ? (
              <Box display="flex" gap={1.5} flexWrap="wrap" mb={2}>
                {project.members.map((m, idx) => (
                  <Grow in timeout={600 + idx * 100} key={m._id}>
                    <Chip
                      avatar={<Avatar>{m.name?.[0] || "?"}</Avatar>}
                      label={m.name + (m.email ? ` (${m.email})` : "")}
                      sx={{
                        fontWeight: 600,
                        fontSize: 17,
                        m: 0.5,
                        bgcolor: "rgba(255,255,255,0.7)",
                        color: "#232946",
                        boxShadow: 1,
                        borderRadius: 2,
                      }}
                    />
                  </Grow>
                ))}
              </Box>
            ) : (
              <Typography color="inherit">No members yet.</Typography>
            )}
          </Paper>
        </Grow>
        {/* Join Code Modal with modern style and working share */}
        <Dialog
          open={joinCodeModalOpen}
          onClose={() => setJoinCodeModalOpen(false)}
          maxWidth="xs"
          fullWidth
          TransitionComponent={Fade}
          TransitionProps={{ timeout: 500 }}
        >
          <DialogTitle
            sx={{
              fontWeight: 900,
              fontSize: 28,
              textAlign: "center",
              letterSpacing: 2,
            }}
          >
            Project Join Code
          </DialogTitle>
          <DialogContent>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={4}
            >
              <Typography
                variant="h2"
                fontWeight={900}
                mb={2}
                letterSpacing={4}
                sx={{ userSelect: "all", color: "#6366f1" }}
              >
                {project.joinCode}
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ShareIcon />}
                  onClick={handleShareJoinCode}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 3,
                    fontSize: 18,
                    px: 3,
                    py: 1,
                    boxShadow: 2,
                    background:
                      "linear-gradient(90deg, #fbbf24 0%, #f59e42 100%)",
                    color: "#232946",
                    "&:hover": {
                      background:
                        "linear-gradient(90deg, #f59e42 0%, #fbbf24 100%)",
                    },
                  }}
                >
                  Share
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => {
                    navigator.clipboard.writeText(project.joinCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 3,
                    fontSize: 18,
                    px: 3,
                    py: 1,
                    color: "#6366f1",
                    borderColor: "#6366f1",
                    "&:hover": {
                      borderColor: "#232946",
                      color: "#232946",
                      background: "#f3f4f6",
                    },
                  }}
                >
                  Copy
                </Button>
              </Box>
              {copied && (
                <Typography
                  color="success.main"
                  fontWeight={600}
                  mt={1}
                  fontSize={16}
                >
                  Copied!
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setJoinCodeModalOpen(false)}
              sx={{ fontWeight: 600, fontSize: 16 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={addMemberOpen}
          onClose={() => setAddMemberOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Add Member</DialogTitle>
          <DialogContent>
            <TextField
              label="Member Email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              fullWidth
              margin="normal"
            />
            {addMemberError && (
              <Typography color="error.main">{addMemberError}</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>
        {/* Assign Task Modal */}
        <Dialog
          open={assignTaskOpen}
          onClose={() => setAssignTaskOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Assign Task</DialogTitle>
          <DialogContent>
            <TextField
              label="Task Title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Description"
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              select
              label="Assign To"
              value={taskMember}
              onChange={(e) => setTaskMember(e.target.value)}
              fullWidth
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="">Select member</option>
              {project.members &&
                project.members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} {m.email && `(${m.email})`}
                  </option>
                ))}
            </TextField>
            {taskError && (
              <Typography color="error.main">{taskError}</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setAssignTaskOpen(false)}
              disabled={taskLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignTask}
              variant="contained"
              disabled={taskLoading || !taskTitle || !taskMember}
            >
              {taskLoading ? "Assigning..." : "Assign"}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Edit Project Modal */}
        <Dialog
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Project</DialogTitle>
          <DialogContent>
            <TextField
              label="Project Name"
              value={editFields.name}
              onChange={(e) =>
                setEditFields((f) => ({ ...f, name: e.target.value }))
              }
              fullWidth
              margin="normal"
            />
            <TextField
              label="Description"
              value={editFields.description}
              onChange={(e) =>
                setEditFields((f) => ({ ...f, description: e.target.value }))
              }
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              label="Status"
              value={editFields.status}
              onChange={(e) =>
                setEditFields((f) => ({ ...f, status: e.target.value }))
              }
              fullWidth
              margin="normal"
            />
            <TextField
              label="Start Date"
              type="date"
              value={editFields.startDate}
              onChange={(e) =>
                setEditFields((f) => ({ ...f, startDate: e.target.value }))
              }
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={editFields.endDate}
              onChange={(e) =>
                setEditFields((f) => ({ ...f, endDate: e.target.value }))
              }
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            {editError && (
              <Typography color="error.main">{editError}</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setEditModalOpen(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={saveProjectEdit}
              variant="contained"
              disabled={editLoading}
            >
              {editLoading ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
        {/* After the Members section, show join requests if user is admin and there are any */}
        {project.joinRequests &&
          project.joinRequests.length > 0 &&
          project.createdBy &&
          project.createdBy._id === project.createdBy._id && (
            <Paper
              sx={{
                p: 3,
                borderRadius: 4,
                mb: 4,
                background:
                  theme === "dark"
                    ? "linear-gradient(135deg, #232946 0%, #18181b 100%)"
                    : "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
                boxShadow: 2,
              }}
            >
              <Typography variant="h6" fontWeight={800} mb={2}>
                Pending Join Requests
              </Typography>
              {project.joinRequests.filter((jr) => jr.status === "pending")
                .length === 0 ? (
                <Typography color="text.secondary">
                  No pending requests.
                </Typography>
              ) : (
                project.joinRequests
                  .filter((jr) => jr.status === "pending")
                  .map((jr) => (
                    <Box
                      key={jr.user._id || jr.user}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Typography fontWeight={600}>
                        {jr.user && (jr.user.name || jr.user.email)
                          ? `${jr.user.name || ""} ${
                              jr.user.email ? `(${jr.user.email})` : ""
                            }`.trim()
                          : "Unknown user"}
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          color="success"
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() =>
                            handleJoinRequestAction(
                              jr.user._id || jr.user,
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
                          startIcon={<ClearIcon />}
                          onClick={() =>
                            handleJoinRequestAction(
                              jr.user._id || jr.user,
                              "rejected"
                            )
                          }
                        >
                          Reject
                        </Button>
                      </Box>
                    </Box>
                  ))
              )}
            </Paper>
          )}
      </Box>
      <ProjectChatDrawer projectId={project._id} open={chatDrawerOpen} onClose={() => setChatDrawerOpen(false)} />
    </Box>
  );
}
