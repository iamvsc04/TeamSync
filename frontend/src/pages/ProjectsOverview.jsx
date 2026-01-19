import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Folder as FolderIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useAuth } from "../useAuth";
import { useTheme } from "../ThemeContext";

export default function ProjectsOverview() {
  const { user, role } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      let url = "";

      if (role === "admin") {
        url = "http://localhost:5000/api/projects/mine";
      } else {
        url = "http://localhost:5000/api/projects/member-projects";
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        setError("Failed to fetch projects");
      }
    } catch (err) {
      setError("Failed to fetch projects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      setError("Project name is required");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProject.name.trim(),
          description: newProject.description.trim(),
          createdBy: user.id || user._id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProjects([data.project, ...projects]);
        setCreateProjectModalOpen(false);
        setNewProject({ name: "", description: "" });
      } else {
        setError(data.message || "Failed to create project");
      }
    } catch (err) {
      setError("Failed to create project. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/dashboard/projects/${projectId}`);
  };

  const handleEditProject = (project) => {
    // Navigate to project edit page or open edit modal
    navigate(`/dashboard/projects/${project._id}`);
  };

  const handleDeleteProject = async (projectId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setProjects(projects.filter((p) => p._id !== projectId));
      } else {
        setError("Failed to delete project");
      }
    } catch (err) {
      setError("Failed to delete project. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme === "dark" ? "#1a1a1a" : "#f5f5f5",
        py: 4,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography
            variant="h3"
            fontWeight={700}
            sx={{
              color: theme === "dark" ? "#fff" : "#333",
            }}
          >
            Projects Overview
          </Typography>
          {role === "admin" && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateProjectModalOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Create Project
            </Button>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: "center",
              bgcolor: theme === "dark" ? "#2d2d2d" : "#fff",
              borderRadius: 2,
            }}
          >
            <FolderIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No projects yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {role === "admin"
                ? "Create your first project to get started!"
                : "Join a project to get started!"}
            </Typography>
            {role === "admin" ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateProjectModalOpen(true)}
              >
                Create Your First Project
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project._id}>
                <Card
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "0.2s",
                    "&:hover": {
                      boxShadow: 8,
                      transform: "translateY(-2px)",
                    },
                    bgcolor: theme === "dark" ? "#2d2d2d" : "#fff",
                  }}
                  onClick={() => handleProjectClick(project._id)}
                >
                  <CardContent
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ flex: 1 }}
                      >
                        {project.name}
                      </Typography>
                      {role === "admin" && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Edit Project">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProject(project);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Project">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project._id);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, flex: 1 }}
                    >
                      {project.description || "No description available."}
                    </Typography>

                    <Box sx={{ mt: "auto" }}>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          mb: 2,
                        }}
                      >
                        <Chip
                          label={project.status || "active"}
                          size="small"
                          color={
                            project.status === "completed"
                              ? "success"
                              : project.status === "archived"
                              ? "default"
                              : "primary"
                          }
                        />
                        <Chip
                          label={`${project.members?.length || 0} members`}
                          size="small"
                          color="info"
                          icon={<GroupIcon />}
                        />
                      </Box>

                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={<VisibilityIcon />}
                      >
                        View Project
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Create Project Modal */}
      <Dialog
        open={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            label="Project Name"
            value={newProject.name}
            onChange={(e) =>
              setNewProject((prev) => ({ ...prev, name: e.target.value }))
            }
            fullWidth
            required
            margin="normal"
            placeholder="Enter project name"
          />
          <TextField
            label="Description"
            value={newProject.description}
            onChange={(e) =>
              setNewProject((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            fullWidth
            multiline
            rows={3}
            margin="normal"
            placeholder="Enter project description (optional)"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateProjectModalOpen(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={creating || !newProject.name.trim()}
          >
            {creating ? <CircularProgress size={20} /> : "Create Project"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

