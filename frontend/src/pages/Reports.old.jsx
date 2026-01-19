import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useTheme } from "../ThemeContext";
import { useAuth } from "../useAuth";

// Color schemes for charts
const COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  purple: '#9c27b0',
  teal: '#009688',
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.error, COLORS.info];

// Helper component for metric cards
function MetricCard({ title, value, subtitle, icon: Icon, color = "primary", trend }) {
  const { theme } = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        bgcolor: theme === 'dark' ? '#2d2d2d' : '#fff',
        border: `1px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {Icon && (
            <Icon sx={{ color: `${color}.main`, mr: 1, fontSize: 24 }} />
          )}
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" fontWeight={700} color={`${color}.main`} sx={{ mb: 0.5 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <TrendingUpIcon 
              sx={{ 
                fontSize: 16, 
                color: trend > 0 ? 'success.main' : 'error.main',
                mr: 0.5 
              }} 
            />
            <Typography 
              variant="caption" 
              color={trend > 0 ? 'success.main' : 'error.main'}
            >
              {trend > 0 ? '+' : ''}{trend}% from last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Reports() {
  const { theme } = useTheme();
  const { user, role } = useAuth();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [taskAnalytics, setTaskAnalytics] = useState(null);
  const [meetingAnalytics, setMeetingAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [allProjectsData, setAllProjectsData] = useState([]);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    fetchProjects();
    if (role === 'admin') {
      fetchAllProjectsData();
    }
  }, [role]);

  useEffect(() => {
    if (projectId !== "all") fetchAnalytics(projectId);
  }, [projectId]);

  const fetchProjects = async () => {
    try {
      const endpoint = role === 'admin' 
        ? "http://localhost:5000/api/projects/mine"
        : "http://localhost:5000/api/projects/member-projects";
      
      const res = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) setProjectId(data[0]._id);
      }
    } catch (e) {
      console.error('Error fetching projects:', e);
    }
  };

  const fetchAllProjectsData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/projects/mine", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const projects = await res.json();
        const projectsWithAnalytics = await Promise.all(
          projects.map(async (project) => {
            try {
              const [taskRes, meetingRes] = await Promise.all([
                fetch(`http://localhost:5000/api/tasks/analytics/project/${project._id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`http://localhost:5000/api/meetings/analytics/project/${project._id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                }),
              ]);
              
              const [taskData, meetingData] = await Promise.all([
                taskRes.ok ? taskRes.json() : null,
                meetingRes.ok ? meetingRes.json() : null,
              ]);
              
              return {
                ...project,
                taskAnalytics: taskData,
                meetingAnalytics: meetingData,
              };
            } catch {
              return project;
            }
          })
        );
        setAllProjectsData(projectsWithAnalytics);
      }
    } catch (e) {
      console.error('Error fetching all projects data:', e);
    }
  };

  const fetchAnalytics = async (pid) => {
    setLoading(true);
    setError("");
    try {
      const [taskRes, meetingRes] = await Promise.all([
        fetch(`http://localhost:5000/api/tasks/analytics/project/${pid}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:5000/api/meetings/analytics/project/${pid}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (!taskRes.ok || !meetingRes.ok)
        throw new Error("Failed to load analytics");
      const [tData, mData] = await Promise.all([
        taskRes.json(),
        meetingRes.json(),
      ]);
      setTaskAnalytics(tData);
      setMeetingAnalytics(mData);
    } catch (e) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme === "dark" ? "#1a1a1a" : "#f5f5f5",
        py: 4,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 3 }}>
        <Typography
          variant="h3"
          fontWeight={700}
          sx={{ color: theme === "dark" ? "#fff" : "#333", mb: 3 }}
        >
          Reports
        </Typography>

        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: theme === "dark" ? "#2d2d2d" : "#fff",
            borderRadius: 2,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  label="Project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  {projects.length === 0 && (
                    <MenuItem value="all">No projects</MenuItem>
                  )}
                  {projects.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 3, color: "error.main" }}>{error}</Paper>
        ) : projectId === "all" ? (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">
              Select a project to view analytics.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{ p: 3, bgcolor: theme === "dark" ? "#2d2d2d" : "#fff" }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Task Analytics
                </Typography>
                {taskAnalytics ? (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <MetricCard
                        label="Total Tasks"
                        value={taskAnalytics.total}
                        color="primary"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard
                        label="Overdue"
                        value={taskAnalytics.overdue}
                        color="warning"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard
                        label="Avg Progress"
                        value={`${Math.round(taskAnalytics.averageProgress)}%`}
                        color="info"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard
                        label="Actual Hours"
                        value={Math.round(taskAnalytics.totalActualHours)}
                        color="secondary"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {Object.entries(taskAnalytics.byStatus).map(
                          ([k, v]) => (
                            <Chip key={k} label={`${k}: ${v}`} />
                          )
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography color="text.secondary">No data.</Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{ p: 3, bgcolor: theme === "dark" ? "#2d2d2d" : "#fff" }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Meeting Analytics
                </Typography>
                {meetingAnalytics ? (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <MetricCard
                        label="Total Meetings"
                        value={meetingAnalytics.total}
                        color="primary"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard
                        label="Upcoming"
                        value={meetingAnalytics.upcoming}
                        color="success"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard
                        label="Avg Duration"
                        value={Math.round(meetingAnalytics.averageDuration)}
                        color="info"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard
                        label="Action Items"
                        value={meetingAnalytics.totalActionItems}
                        color="secondary"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {Object.entries(meetingAnalytics.byStatus).map(
                          ([k, v]) => (
                            <Chip key={k} label={`${k}: ${v}`} />
                          )
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography color="text.secondary">No data.</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <Paper
      sx={{
        p: 2,
        borderLeft: (theme) => `4px solid ${theme.palette[color].main}`,
      }}
    >
      <Typography variant="h4" color={color} fontWeight={700}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}
