import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import EventIcon from "@mui/icons-material/Event";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import PlaceIcon from "@mui/icons-material/Place";
import { useTheme } from "../ThemeContext";

export default function Meetings() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    projectId: "all",
    type: "all",
    status: "all",
    q: "",
  });
  const [selected, setSelected] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [filters.projectId]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/projects/member-projects",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchMeetings = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "";
      if (filters.projectId && filters.projectId !== "all") {
        url = `http://localhost:5000/api/meetings/project/${filters.projectId}`;
      } else {
        // fall back to my-meetings when no specific project is selected
        url = "http://localhost:5000/api/meetings/my-meetings";
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch meetings");
      const data = await res.json();
      setMeetings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to fetch meetings");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return meetings
      .filter((m) =>
        filters.type === "all" ? true : m.meetingType === filters.type
      )
      .filter((m) =>
        filters.status === "all" ? true : m.status === filters.status
      )
      .filter((m) =>
        filters.q.trim()
          ? (m.title || "").toLowerCase().includes(filters.q.toLowerCase()) ||
            (m.description || "")
              .toLowerCase()
              .includes(filters.q.toLowerCase())
          : true
      )
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [meetings, filters]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme === "dark" ? "#1a1a1a" : "#f5f5f5",
        py: 4,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h3"
            fontWeight={700}
            sx={{ color: theme === "dark" ? "#fff" : "#333" }}
          >
            Meetings
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton onClick={fetchMeetings} color="primary">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: theme === "dark" ? "#2d2d2d" : "#fff",
            borderRadius: 2,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  label="Project"
                  value={filters.projectId}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, projectId: e.target.value }))
                  }
                >
                  <MenuItem value="all">All Accessible Projects</MenuItem>
                  {projects.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="in-person">In-person</MenuItem>
                  <MenuItem value="video-call">Video call</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Search"
                value={filters.q}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, q: e.target.value }))
                }
                InputProps={{
                  endAdornment: <FilterAltIcon fontSize="small" />,
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 3, color: "error.main" }}>{error}</Paper>
        ) : (
          <Grid container spacing={2}>
            {filtered.map((m) => (
              <Grid item xs={12} md={6} key={m._id}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    bgcolor: theme === "dark" ? "#2d2d2d" : "#fff",
                  }}
                  onClick={() => setSelected(m)}
                >
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                    {m.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {m.description || "No description."}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      size="small"
                      label={m.meetingType}
                      icon={<EventIcon />}
                    />
                    {m.status && (
                      <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={m.status}
                      />
                    )}
                    {m.startTime && (
                      <Chip
                        size="small"
                        label={new Date(m.startTime).toLocaleString()}
                        variant="outlined"
                      />
                    )}
                    {m.location && (
                      <Chip
                        size="small"
                        icon={<PlaceIcon />}
                        label={m.location}
                      />
                    )}
                    {m.videoCallLink && (
                      <Chip
                        size="small"
                        icon={<VideoCallIcon />}
                        label="Video"
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
            {filtered.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    No meetings found.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        <Dialog
          open={!!selected}
          onClose={() => setSelected(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{selected?.title}</DialogTitle>
          <DialogContent>
            {selected && (
              <Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {selected.description || "No description."}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  <Chip size="small" label={selected.meetingType} />
                  {selected.status && (
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={selected.status}
                    />
                  )}
                  {selected.startTime && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Starts: ${new Date(
                        selected.startTime
                      ).toLocaleString()}`}
                    />
                  )}
                  {selected.endTime && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Ends: ${new Date(
                        selected.endTime
                      ).toLocaleString()}`}
                    />
                  )}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Attendees
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  {(selected.attendees || []).map((a, i) => (
                    <Chip
                      key={i}
                      size="small"
                      label={a.user?.name || a.user?.email || "Unknown"}
                    />
                  ))}
                </Box>
                {selected.videoCallLink && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<VideoCallIcon />}
                    onClick={() =>
                      window.open(selected.videoCallLink, "_blank")
                    }
                  >
                    Join Video Call
                  </Button>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelected(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
