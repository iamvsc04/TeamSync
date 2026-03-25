import { API_BASE, SOCKET_URL } from '../config/api';
import React, { useEffect, useState, useRef } from "react";
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
  MenuItem,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Zoom,
  Collapse,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Backdrop,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useTheme } from "../ThemeContext";
import { useAuth } from "../useAuth";
import { io } from "socket.io-client";
import ChatIcon from "@mui/icons-material/Chat";
import Drawer from "@mui/material/Drawer";
import ReplyIcon from "@mui/icons-material/Reply";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import TaskManagement from "../components/TaskManagement";
import MeetingManagement from "../components/MeetingManagement";
import FileUpload from "../components/FileUpload";
import FileManager from "../components/FileManager";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import FolderIcon from "@mui/icons-material/Folder";
import DashboardIcon from "@mui/icons-material/Dashboard";


// TabPanel Helper
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Professional ProjectChatDrawer
function ProjectChatDrawer({ projectId, open, onClose }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!open) return;
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit("joinProjectRoom", projectId);
    const fetchHistory = async (page = 1) => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE}/projects/${projectId}/chat?page=${page}&limit=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        } else {
          const errData = await res.json();
          setError(errData.message || `Failed to load chat history`);
        }
      } catch (err) {
        setError("Connection error. Is the server running?");
        console.error("Chat fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    socketRef.current.on("projectChatMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socketRef.current.on("userTyping", (data) => {
      // Optionally set a typing state per user; minimal visual hint handled below
      setTypingUsers((prev) => ({
        ...prev,
        [data.userId]: data.userName || "Someone",
      }));
      setTimeout(() => {
        setTypingUsers((prev) => {
          const copy = { ...prev };
          delete copy[data.userId];
          return copy;
        });
      }, 2000);
    });
    socketRef.current.on("userStopTyping", (data) => {
      setTypingUsers((prev) => {
        const copy = { ...prev };
        delete copy[data.userId];
        return copy;
      });
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
      replyTo: replyTo
        ? {
            _id: replyTo._id,
            senderName: replyTo.senderId?.name || "You",
            text: replyTo.message,
          }
        : undefined,
    });
    setInput("");
    setReplyTo(null);
  };

  const [chatPage, setChatPage] = useState(1);
  const loadMoreMessages = async () => {
    const token = localStorage.getItem("token");
    const nextPage = chatPage + 1;
    const res = await fetch(
      `${API_BASE}/projects/${projectId}/chat?page=${nextPage}&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...data.messages, ...prev]);
      setChatPage(nextPage);
    }
  };


  const handleInputChange = (e) => {
    const text = e.target.value;
    setInput(text);
    if (socketRef.current) {
      if (text.trim()) {
        socketRef.current.emit(`typing`, {
          projectId,
          senderId: user.id || user._id,
          senderName: user.name,
        });
      } else {
        socketRef.current.emit("stopTyping", {
          projectId,
          senderId: user.id || user._id,
        });
      }
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 400,
          p: 0,
          bgcolor: theme === "dark" ? "#1a1a1a" : "#ffffff",
          borderLeft: `1px solid ${theme === "dark" ? "#333" : "#e0e0e0"}`,
        },
      }}
      TransitionComponent={Slide}
      transitionDuration={300}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 3,
          borderBottom: `1px solid ${theme === "dark" ? "#333" : "#e0e0e0"}`,
          bgcolor: theme === "dark" ? "#2d2d2d" : "#f5f5f5",
          color: theme === "dark" ? "#fff" : "#333",
        }}
      >
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <ChatIcon />
          Project Chat
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ color: theme === "dark" ? "#fff" : "#333" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 3,
            bgcolor: theme === "dark" ? "#1a1a1a" : "#fafafa",
            minHeight: 0,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
            <Button size="small" variant="outlined" onClick={loadMoreMessages}>
              Load older messages
            </Button>
          </Box>
          {loading && messages.length === 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {error && (
            <Typography color="error" align="center" sx={{ mb: 2 }}>{error}</Typography>
          )}
          {!loading && !error && messages.length === 0 && (
            <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
              No messages yet. Start the conversation!
            </Typography>
          )}
          {Object.keys(typingUsers).length > 0 && (
            <Typography
              variant="caption"
              sx={{ mb: 1, display: "block", color: "#1976d2" }}
            >
              {Object.values(typingUsers).join(", ")} typing...
            </Typography>
          )}
          {messages.map((msg, index) => {
            const isCurrentUser = msg.senderId?._id === (user.id || user._id);
            const isAdmin = msg.senderId?.role === "admin";
            return (
              <Box
                key={msg._id}
                sx={{
                  mb: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isCurrentUser ? "flex-end" : "flex-start",
                }}
              >
                {msg.replyTo && (
                  <Box
                    sx={{
                      bgcolor: theme === "dark" ? "#333" : "#f0f0f0",
                      borderLeft: "3px solid #1976d2",
                      px: 2,
                      py: 1,
                      mb: 1,
                      borderRadius: 1,
                      maxWidth: "75%",
                      fontSize: "0.875rem",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ color: "#1976d2" }}
                    >
                      {msg.replyTo.senderName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme === "dark" ? "#fff" : "#333",
                        fontStyle: "italic",
                      }}
                    >
                      {msg.replyTo.text.length > 60
                        ? msg.replyTo.text.slice(0, 60) + "…"
                        : msg.replyTo.text}
                    </Typography>
                  </Box>
                )}

                <Box
                  sx={{
                    bgcolor: isAdmin
                      ? theme === "dark"
                        ? "#1e3a8a"
                        : "#dbeafe"
                      : isCurrentUser
                      ? theme === "dark"
                        ? "#1976d2"
                        : "#1976d2"
                      : theme === "dark"
                      ? "#374151"
                      : "#f3f4f6",
                    color: isAdmin
                      ? theme === "dark"
                        ? "#fff"
                        : "#1e40af"
                      : isCurrentUser
                      ? "white"
                      : theme === "dark"
                      ? "#fff"
                      : "#374151",
                    px: 3,
                    py: 2,
                    borderRadius: 2,
                    maxWidth: "80%",
                    border: isAdmin
                      ? `2px solid ${theme === "dark" ? "#3b82f6" : "#3b82f6"}`
                      : "none",
                    boxShadow: isAdmin
                      ? theme === "dark"
                        ? "0 4px 12px rgba(59, 130, 246, 0.3)"
                        : "0 4px 12px rgba(59, 130, 246, 0.2)"
                      : theme === "dark"
                      ? "0 2px 8px rgba(0,0,0,0.3)"
                      : "0 2px 8px rgba(0,0,0,0.1)",
                    position: "relative",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        mr: 1,
                        color: isAdmin
                          ? theme === "dark"
                            ? "#fff"
                            : "#1e40af"
                          : isCurrentUser
                          ? "white"
                          : theme === "dark"
                          ? "#fff"
                          : "#374151",
                      }}
                    >
                      {msg.senderId?.name || "You"}
                    </Typography>
                    {isAdmin && (
                      <AdminPanelSettingsIcon
                        fontSize="small"
                        sx={{ color: theme === "dark" ? "#fbbf24" : "#f59e0b" }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      wordBreak: "break-word",
                      mb: 1,
                      color: isAdmin
                        ? theme === "dark"
                          ? "#fff"
                          : "#1e40af"
                        : isCurrentUser
                        ? "white"
                        : theme === "dark"
                        ? "#fff"
                        : "#374151",
                    }}
                  >
                    {msg.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.7,
                      float: "right",
                      display: "block",
                      color: isAdmin
                        ? theme === "dark"
                          ? "#e5e7eb"
                          : "#6b7280"
                        : isCurrentUser
                        ? "rgba(255,255,255,0.7)"
                        : theme === "dark"
                        ? "#9ca3af"
                        : "#6b7280",
                    }}
                  >
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString()
                      : ""}
                  </Typography>

                  <Tooltip title="Reply">
                    <IconButton
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: isCurrentUser ? "100%" : "-40px",
                        color: "#1976d2",
                        opacity: 0,
                        transition: "opacity 0.2s ease",
                        ".MuiBox-root:hover &": { opacity: 1 },
                      }}
                      onClick={() => setReplyTo(msg)}
                    >
                      <ReplyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}
          <div ref={messagesEndRef} />
        </Box>

        {replyTo && (
          <Collapse in={true}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: theme === "dark" ? "#333" : "#f0f0f0",
                borderLeft: "3px solid #1976d2",
                px: 2,
                py: 1,
                mb: 2,
                mx: 3,
                borderRadius: 1,
              }}
            >
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ color: "#1976d2", mr: 1 }}
              >
                {replyTo.senderId?.name || "You"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme === "dark" ? "#fff" : "#333",
                  flex: 1,
                }}
              >
                {replyTo.message.length > 60
                  ? replyTo.message.slice(0, 60) + "…"
                  : replyTo.message}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setReplyTo(null)}
                sx={{ color: "#1976d2" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Collapse>
        )}

        <Box
          component="form"
          onSubmit={handleSend}
          sx={{
            display: "flex",
            gap: 2,
            p: 3,
            borderTop: `1px solid ${theme === "dark" ? "#333" : "#e0e0e0"}`,
            bgcolor: theme === "dark" ? "#1a1a1a" : "#fff",
          }}
        >
          <TextField
            fullWidth
            size="small"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: theme === "dark" ? "#333" : "#f5f5f5",
                color: theme === "dark" ? "#fff" : "#333",
                "&:hover": {
                  bgcolor: theme === "dark" ? "#444" : "#f0f0f0",
                },
                "&.Mui-focused": {
                  bgcolor: theme === "dark" ? "#444" : "#f0f0f0",
                },
                "& input": {
                  color: theme === "dark" ? "#fff" : "#333",
                },
                "& input::placeholder": {
                  color: theme === "dark" ? "#ccc" : "#666",
                  opacity: 1,
                },
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!input.trim()}
            sx={{
              borderRadius: 2,
              px: 3,
              bgcolor: "#1976d2",
              color: "white",
              "&:hover": { bgcolor: "#1565c0" },
              "&:disabled": {
                bgcolor: theme === "dark" ? "#555" : "#ccc",
                color: theme === "dark" ? "#999" : "#666",
              },
            }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

// Professional Admin View Component
function ProjectView({
  project,
  onProjectUpdate,
  onJoinRequestAction,
  onDocumentUpload,
  fileInputRef,
  uploading,
  uploadError,
  uploadSuccess,
  canManageProject,
  setChatDrawerOpen,
  fetchProject,
  toggleTheme,
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editError, setEditError] = useState("");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addMemberError, setAddMemberError] = useState("");
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
  });
  const [assignTaskError, setAssignTaskError] = useState("");
  const [assignTaskLoading, setAssignTaskLoading] = useState(false);
  const [removeMemberOpen, setRemoveMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [assignRoleOpen, setAssignRoleOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ role: "member" });
  const [assignRoleError, setAssignRoleError] = useState("");
  const [assignRoleLoading, setAssignRoleLoading] = useState(false);
  const [joinCodeModalOpen, setJoinCodeModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const openEditModal = () => {
    setEditForm({
      name: project.name,
      description: project.description,
    });
    setEditModalOpen(true);
  };

  const saveProjectEdit = async () => {
    setEditLoading(true);
    setEditError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_BASE}/projects/${project._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );
      const data = await res.json();
      if (res.ok) {
        onProjectUpdate(data);
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

  const handleAddMember = async () => {
    setAddMemberError("");
    if (!newMemberEmail) {
      setAddMemberError("Please enter an email address.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_BASE}/projects/${project._id}/add-member-by-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: newMemberEmail }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setAddMemberError(data.message || "Failed to add member.");
        return;
      }
      setAddMemberOpen(false);
      setNewMemberEmail("");
      onProjectUpdate();
    } catch (err) {
      setAddMemberError("Failed to add member. Please try again.");
    }
  };

  const handleAssignTask = async () => {
    setAssignTaskLoading(true);
    setAssignTaskError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          project: project._id,
          assignedTo: taskForm.assignedTo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign task");
      setAssignTaskOpen(false);
      setTaskForm({ title: "", description: "", assignedTo: "" });
      onProjectUpdate();
    } catch (err) {
      setAssignTaskError(err.message);
    } finally {
      setAssignTaskLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/projects/${project._id}/members/${selectedMember._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove member");
      }
      setRemoveMemberOpen(false);
      setSelectedMember(null);
      onProjectUpdate();
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedMember) return;
    setAssignRoleLoading(true);
    setAssignRoleError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/projects/${project._id}/members/${selectedMember._id}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: roleForm.role }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to assign role");
      }
      setAssignRoleOpen(false);
      setSelectedMember(null);
      setRoleForm({ role: "member" });
      onProjectUpdate();
    } catch (err) {
      setAssignRoleError(err.message);
    } finally {
      setAssignRoleLoading(false);
    }
  };

  const handleDocumentDownload = async (doc) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_BASE}/projects/${project._id}/documents/${doc._id}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to download document.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalname;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading document:", err);
      alert(`Failed to download document: ${err.message}`);
    }
  };

  const handleDocumentPreview = async (doc) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_BASE}/projects/${project._id}/documents/${doc._id}/preview`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to preview document.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, "_blank");
      if (newWindow) {
        newWindow.focus();
      }
    } catch (err) {
      console.error("Error previewing document:", err);
      alert(`Failed to preview document: ${err.message}`);
    }
  };

  const handleDocumentRemove = async (doc) => {
    if (
      !window.confirm(`Are you sure you want to remove "${doc.originalname}"?`)
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_BASE}/projects/${project._id}/documents/${doc._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to remove document.");
      }
      onProjectUpdate(); // Refresh the project data
    } catch (err) {
      console.error("Error removing document:", err);
      alert(`Failed to remove document: ${err.message}`);
    }
  };

  const speedDialActions = [
    { icon: <EditIcon />, name: "Edit Project", action: openEditModal },
    {
      icon: <AddIcon />,
      name: "Add Member",
      action: () => setAddMemberOpen(true),
    },
    {
      icon: <AssignmentIcon />,
      name: "Assign Task",
      action: () => setAssignTaskOpen(true),
    },
    {
      icon: <ShareIcon />,
      name: "Share Code",
      action: () => setJoinCodeModalOpen(true),
    },
    {
      icon: <ChatIcon />,
      name: "Team Chat",
      action: () => setChatDrawerOpen(true),
    },
  ];

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "transparent" }}>
      {/* Premium Header Section */}
      <Box sx={{ 
        p: { xs: 2, md: 4 }, 
        pt: { xs: 2, md: 6 },
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
        mb: 2
      }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
                {project.name}
              </Typography>
              <Chip 
                label={project.status || "Active"} 
                color={project.status === 'completed' ? 'success' : 'primary'}
                sx={{ fontWeight: 600, borderRadius: '8px' }}
              />
              {canManageProject && (
                <Chip
                    label="Admin"
                    color="secondary"
                    icon={<AdminPanelSettingsIcon />}
                    sx={{ fontWeight: 600, borderRadius: '8px' }}
                />
              )}
            </Box>
            <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8, maxWidth: '800px', mb: 2 }}>
              {project.description || "Project collaboration space"}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={0.5}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={500}>Created by {project.createdBy?.name}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <GroupIcon fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={500}>{project.members?.length} Members</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <CalendarTodayIcon fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={500}>{new Date(project.createdAt).toLocaleDateString()}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} gap={2}>
              <Tooltip title="Toggle Theme" placement="top">
                <IconButton
                    onClick={toggleTheme}
                    sx={{
                        bgcolor: theme === "dark" ? "#fbbf24" : "#1e293b",
                        color: theme === "dark" ? "#1e293b" : "#fbbf24",
                        width: 48,
                        height: 48,
                        "&:hover": {
                            bgcolor: theme === "dark" ? "#f59e0b" : "#334155",
                            transform: "scale(1.05)",
                        },
                        transition: "all 0.2s ease",
                    }}
                >
                    {theme === "dark" ? "☀️" : "🌙"}
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<ChatIcon />}
                onClick={() => setChatDrawerOpen(true)}
                sx={{ borderRadius: '12px', px: 3, py: 1.2, fontWeight: 600, textTransform: 'none', boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)' }}
              >
                Team Chat
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Navigation Tabs */}
        <Box sx={{ mt: 4 }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
              '& .MuiTab-root': { 
                fontWeight: 600, 
                fontSize: '1rem', 
                textTransform: 'none',
                minWidth: 120,
                color: theme === 'dark' ? '#94a3b8' : '#64748b',
                '&.Mui-selected': {
                    color: theme === 'dark' ? '#fff' : '#1976d2'
                }
              }
            }}
          >
            <Tab label="Overview" icon={<DashboardIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
            <Tab label="Tasks" icon={<AssignmentIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
            <Tab label="Meetings" icon={<VideoCallIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
            <Tab label="Documents" icon={<FolderIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
            <Tab label="Team" icon={<GroupIcon sx={{ fontSize: 20 }} />} iconPosition="start" />
          </Tabs>
        </Box>
      </Box>

      {/* Tab Panels Content */}
      <Box sx={{ p: { xs: 2, md: 4 }, pt: 0 }}>
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* Project Stats Summary */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', bgcolor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid', borderColor: theme === 'dark' ? '#334155' : '#f1f5f9' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>Project Status</Typography>
                  <Typography variant="h4" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, color: theme === 'dark' ? '#fff' : '#0f172a' }}>
                    <TrendingUpIcon color="primary" /> {project.status?.toUpperCase() || 'ACTIVE'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', bgcolor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid', borderColor: theme === 'dark' ? '#334155' : '#f1f5f9' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>Team Size</Typography>
                  <Typography variant="h4" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, color: theme === 'dark' ? '#fff' : '#0f172a' }}>
                    <GroupIcon color="primary" /> {project.members?.length || 0} Members
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', bgcolor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid', borderColor: theme === 'dark' ? '#334155' : '#f1f5f9' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>Assets</Typography>
                  <Typography variant="h4" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, color: theme === 'dark' ? '#fff' : '#0f172a' }}>
                    <FolderIcon color="primary" /> {project.documents?.length || 0} Files
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Pending Requests Notification for Admin */}
            {canManageProject && project.joinRequests?.filter(jr => jr.status === 'pending').length > 0 && (
              <Grid item xs={12}>
                <Alert 
                  severity="info" 
                  action={
                    <Button color="inherit" size="small" onClick={() => setCurrentTab(4)}>
                      VIEW REQUESTS
                    </Button>
                  }
                  sx={{ borderRadius: '12px' }}
                >
                  There are {project.joinRequests.filter(jr => jr.status === 'pending').length} pending join requests.
                </Alert>
              </Grid>
            )}

            {/* Quick Actions / Info */}
            <Grid item xs={12} md={8}>
               <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid', borderColor: theme === 'dark' ? '#334155' : '#f1f5f9' }}>
                 <Typography variant="h6" gutterBottom fontWeight={700} sx={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>Project Details</Typography>
                 <Divider sx={{ mb: 2, borderColor: theme === 'dark' ? '#334155' : '#f1f5f9' }} />
                 <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>
                   {project.description || "No detailed description provided."}
                 </Typography>
               </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid', borderColor: theme === 'dark' ? '#334155' : '#f1f5f9' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight={700} sx={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>Task Management</Typography>
              {canManageProject && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAssignTaskOpen(true)} sx={{ borderRadius: '10px' }}>
                  Assign New Task
                </Button>
              )}
            </Box>
            <TaskManagement projectId={project._id} onTaskUpdate={onProjectUpdate} />
          </Paper>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid', borderColor: theme === 'dark' ? '#334155' : '#f1f5f9' }}>
            <MeetingManagement projectId={project._id} onMeetingUpdate={onProjectUpdate} />
          </Paper>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid', borderColor: theme === 'dark' ? '#334155' : '#f1f5f9' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight={700} sx={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>Files & Documents</Typography>
              <FileUpload projectId={project._id} onUploaded={() => fetchProject()} />
            </Box>
            <FileManager projectId={project._id} files={project.documents || []} viewMode="grid" onFileDeleted={() => fetchProject()} />
          </Paper>
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
           <Grid container spacing={3}>
             {/* Member List */}
             <Grid item xs={12} md={canManageProject ? 8 : 12}>
                <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid', borderColor: theme === 'dark' ? '#334155' : '#f1f5f9' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" fontWeight={700} sx={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>Team Members</Typography>
                    {canManageProject && (
                      <Button variant="outlined" startIcon={<PersonIcon />} onClick={() => setAddMemberOpen(true)} sx={{ borderRadius: '10px' }}>
                        Invite Member
                      </Button>
                    )}
                  </Box>
                  <List>
                    {project.members?.map((member) => (
                      <ListItem 
                        key={member._id}
                        sx={{ 
                          mb: 1, 
                          borderRadius: '12px', 
                          border: '1px solid',
                          borderColor: theme === 'dark' ? '#334155' : '#f1f5f9',
                          bgcolor: theme === 'dark' ? '#0f172a' : '#f8fafc',
                          p: 2
                        }}
                        secondaryAction={
                          canManageProject && member._id !== user?.id && (
                            <Box display="flex" gap={1}>
                              <IconButton size="small" color="primary" onClick={() => { setSelectedMember(member); setRoleForm({role: member.role || 'member'}); setAssignRoleOpen(true); }}>
                                <AdminPanelSettingsIcon />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => { setSelectedMember(member); setRemoveMemberOpen(true); }}>
                                <CloseIcon />
                              </IconButton>
                            </Box>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: member.role === 'admin' ? 'primary.main' : 'secondary.main' }}>
                            {member.name?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={<Typography fontWeight={600} sx={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>{member.name} {member._id === user?.id && '(You)'}</Typography>}
                          secondary={member.email}
                        />
                        <Chip label={member.role || 'Member'} size="small" sx={{ ml: 2, borderRadius: '6px' }} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
             </Grid>

             {/* Join Requests for Admin */}
             {canManageProject && (
               <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid', borderColor: theme === 'dark' ? '#334155' : '#f1f5f9' }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>Pending Requests</Typography>
                    <List>
                      {project.joinRequests?.filter(jr => jr.status === 'pending').map((jr) => (
                        <ListItem key={jr.user._id} sx={{ mb: 2, borderRadius: '12px', bgcolor: theme === 'dark' ? '#0f172a' : '#f8fafc', p: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Typography fontWeight={600}>{jr.user.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>{jr.user.email}</Typography>
                          <Box width="100%" display="flex" gap={1}>
                            <Button fullWidth variant="contained" size="small" onClick={() => onJoinRequestAction(jr.user._id, 'approved')}>Accept</Button>
                            <Button fullWidth variant="outlined" size="small" color="error" onClick={() => onJoinRequestAction(jr.user._id, 'rejected')}>Reject</Button>
                          </Box>
                        </ListItem>
                      ))}
                      {project.joinRequests?.filter(jr => jr.status === 'pending').length === 0 && (
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>No pending requests</Typography>
                      )}
                    </List>
                    <Divider sx={{ my: 2, borderColor: theme === 'dark' ? '#334155' : '#f1f5f9' }} />
                    <Button fullWidth variant="outlined" startIcon={<ShareIcon />} onClick={() => setJoinCodeModalOpen(true)}>
                      Show Join Code
                    </Button>
                  </Paper>
               </Grid>
             )}
           </Grid>
        </TabPanel>
      </Box>

      {/* Speed Dial for quick actions */}
      <SpeedDial
        ariaLabel="Quick actions"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        FabProps={{
          sx: {
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#1565c0" },
          },
        }}
      >
        {speedDialActions
          .filter(action => {
            if (action.name === "Team Chat") return true;
            return canManageProject;
          })
          .map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.action}
              sx={{
                bgcolor: theme === "dark" ? "#333" : "#fff",
                "&:hover": { bgcolor: theme === "dark" ? "#444" : "#f5f5f5" },
              }}
            />
          ))}
      </SpeedDial>

      {/* Modals */}
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
            value={editForm.name}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, name: e.target.value }))
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, description: e.target.value }))
            }
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          {editError && <Typography color="error.main">{editError}</Typography>}
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

      {/* Add Member Modal */}
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Task</DialogTitle>
        <DialogContent>
          <TextField
            label="Task Title"
            value={taskForm.title}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, title: e.target.value }))
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={taskForm.description}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, description: e.target.value }))
            }
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            select
            label="Assign To"
            value={taskForm.assignedTo}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, assignedTo: e.target.value }))
            }
            fullWidth
            margin="normal"
          >
            {project.members &&
              project.members.map((member) => (
                <MenuItem key={member._id} value={member._id}>
                  {member.name} ({member.email})
                </MenuItem>
              ))}
          </TextField>
          {assignTaskError && (
            <Typography color="error.main">{assignTaskError}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAssignTaskOpen(false)}
            disabled={assignTaskLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignTask}
            variant="contained"
            disabled={
              assignTaskLoading || !taskForm.title || !taskForm.assignedTo
            }
          >
            {assignTaskLoading ? "Assigning..." : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Member Modal */}
      <Dialog
        open={removeMemberOpen}
        onClose={() => setRemoveMemberOpen(false)}
      >
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove {selectedMember?.name} from this
            project?
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveMemberOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRemoveMember}
            color="error"
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Role Modal */}
      <Dialog
        open={assignRoleOpen}
        onClose={() => setAssignRoleOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Role to {selectedMember?.name}</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Role"
            value={roleForm.role}
            onChange={(e) => setRoleForm({ role: e.target.value })}
            fullWidth
            margin="normal"
          >
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
          {assignRoleError && (
            <Typography color="error.main" variant="body2" mt={1}>
              {assignRoleError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAssignRoleOpen(false)}
            disabled={assignRoleLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignRole}
            variant="contained"
            disabled={assignRoleLoading}
          >
            {assignRoleLoading ? "Assigning..." : "Assign Role"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Code Modal */}
      <Dialog
        open={joinCodeModalOpen}
        onClose={() => setJoinCodeModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 700 }}>
          Project Join Code
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" py={3}>
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
                startIcon={<ShareIcon />}
                onClick={() => {
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
                }}
                sx={{ borderRadius: 2 }}
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
                sx={{ borderRadius: 2 }}
              >
                Copy
              </Button>
            </Box>
            {copied && (
              <Typography color="success.main" fontWeight={600} mt={1}>
                Copied!
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinCodeModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function ProjectPage() {
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef();
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line
  }, [id]);

  const fetchProject = () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/projects/${id}`, {
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

  const handleDocumentUpload = async (e) => {
    setUploadError("");
    setUploadSuccess("");
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("file", files[i]);
    }
    setUploading(true);
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(
            `${API_BASE}/projects/${id}/documents`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            }
        );
        const data = await res.json();
        if (!res.ok) {
            setUploadError(data.message || "Failed to upload document(s).");
        } else {
            setUploadSuccess("Documents uploaded successfully.");
            fetchProject();
        }
    } catch (err) {
        setUploadError("Failed to upload document(s). Please try again.");
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleJoinRequestAction = async (userId, status) => {
    const token = localStorage.getItem("token");
    await fetch(
      `${API_BASE}/projects/join-request/${project._id}/${userId}`,
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

  // Check if current user is admin of this project
  const currentUserId = user?.id || user?._id;
  const isCreator = project?.createdBy && (project.createdBy._id === currentUserId || project.createdBy === currentUserId);
  const isProjectAdmin = project?.members?.find(m => m._id === currentUserId)?.role === 'admin';
  const canManageProject = role === "admin" || isCreator || isProjectAdmin;

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: 2,
          bgcolor: theme === "dark" ? "#0f172a" : "#f8fafc",
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Loading project...
        </Typography>
      </Box>
    );
  if (error)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: 2,
          bgcolor: theme === "dark" ? "#0f172a" : "#f8fafc",
        }}
      >
        <Typography color="error.main" variant="h6">
          {error}
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  if (!project) return null;

  return (
    <Box sx={{ flexGrow: 1, position: "relative" }}>
      {/* Professional back button */}
      <Box
        sx={{ position: "absolute", zIndex: 10, top: 16, left: { xs: 16, md: 32 } }}
      >
        <Button
          variant="text"
          onClick={() => navigate("/dashboard")}
          startIcon={<ArrowBackIcon />}
          sx={{
            color: theme === "dark" ? "#94a3b8" : "#64748b",
            "&:hover": {
              color: theme === "dark" ? "#fff" : "#0f172a",
              bgcolor: 'transparent'
            },
            fontWeight: 600,
            textTransform: 'none'
          }}
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Render Project View */}
      <ProjectView
         project={project}
         onProjectUpdate={fetchProject}
         onDocumentUpload={handleDocumentUpload}
         fileInputRef={fileInputRef}
         uploading={uploading}
         uploadError={uploadError}
         uploadSuccess={uploadSuccess}
         onJoinRequestAction={handleJoinRequestAction}
         canManageProject={canManageProject}
         setChatDrawerOpen={setChatDrawerOpen}
         fetchProject={fetchProject}
         toggleTheme={toggleTheme}
      />

      {/* Professional Chat Drawer */}
      <ProjectChatDrawer
        projectId={project._id}
        open={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
      />
    </Box>
  );
}
