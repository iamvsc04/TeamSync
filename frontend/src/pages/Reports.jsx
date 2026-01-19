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
  Event as EventIcon,
  PictureAsPdf as PdfIcon,
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
        {trend !== undefined && (
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

  // Export functions
  const exportToPDF = () => {
    const pdf = new jsPDF();
    const selectedProject = projects.find(p => p._id === projectId);
    
    // Header
    pdf.setFontSize(20);
    pdf.text('TeamSync Project Report', 20, 30);
    pdf.setFontSize(14);
    pdf.text(`Project: ${selectedProject?.name || 'All Projects'}`, 20, 45);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
    pdf.text(`Generated by: ${user.name}`, 20, 65);

    let yPosition = 85;

    // Task Analytics
    if (taskAnalytics) {
      pdf.setFontSize(16);
      pdf.text('Task Analytics', 20, yPosition);
      yPosition += 15;

      const taskData = [
        ['Metric', 'Value'],
        ['Total Tasks', taskAnalytics.total.toString()],
        ['Completed', taskAnalytics.byStatus.completed?.toString() || '0'],
        ['In Progress', taskAnalytics.byStatus['in-progress']?.toString() || '0'],
        ['Pending', taskAnalytics.byStatus.pending?.toString() || '0'],
        ['Overdue Tasks', taskAnalytics.overdue.toString()],
        ['Average Progress', `${Math.round(taskAnalytics.averageProgress)}%`],
        ['Total Estimated Hours', taskAnalytics.totalEstimatedHours.toString()],
        ['Total Actual Hours', Math.round(taskAnalytics.totalActualHours).toString()],
      ];

      pdf.autoTable({
        startY: yPosition,
        head: [taskData[0]],
        body: taskData.slice(1),
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [25, 118, 210] },
      });

      yPosition = pdf.lastAutoTable.finalY + 20;
    }

    // Meeting Analytics
    if (meetingAnalytics && yPosition < 250) {
      pdf.setFontSize(16);
      pdf.text('Meeting Analytics', 20, yPosition);
      yPosition += 15;

      const meetingData = [
        ['Metric', 'Value'],
        ['Total Meetings', meetingAnalytics.total.toString()],
        ['Completed', meetingAnalytics.byStatus.completed?.toString() || '0'],
        ['Scheduled', meetingAnalytics.byStatus.scheduled?.toString() || '0'],
        ['Upcoming', meetingAnalytics.upcoming.toString()],
        ['Total Duration', `${meetingAnalytics.totalDuration} minutes`],
        ['Average Duration', `${Math.round(meetingAnalytics.averageDuration)} minutes`],
        ['Total Action Items', meetingAnalytics.totalActionItems.toString()],
        ['Completed Action Items', meetingAnalytics.completedActionItems.toString()],
      ];

      pdf.autoTable({
        startY: yPosition,
        head: [meetingData[0]],
        body: meetingData.slice(1),
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [25, 118, 210] },
      });
    }

    pdf.save(`TeamSync-Report-${selectedProject?.name || 'All'}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const selectedProject = projects.find(p => p._id === projectId);
    let csvContent = `TeamSync Project Report\n`;
    csvContent += `Project,${selectedProject?.name || 'All Projects'}\n`;
    csvContent += `Generated,${new Date().toLocaleDateString()}\n`;
    csvContent += `Generated by,${user.name}\n\n`;

    if (taskAnalytics) {
      csvContent += `Task Analytics\n`;
      csvContent += `Metric,Value\n`;
      csvContent += `Total Tasks,${taskAnalytics.total}\n`;
      csvContent += `Completed,${taskAnalytics.byStatus.completed || 0}\n`;
      csvContent += `In Progress,${taskAnalytics.byStatus['in-progress'] || 0}\n`;
      csvContent += `Pending,${taskAnalytics.byStatus.pending || 0}\n`;
      csvContent += `Overdue,${taskAnalytics.overdue}\n`;
      csvContent += `Average Progress,${Math.round(taskAnalytics.averageProgress)}%\n`;
      csvContent += `Estimated Hours,${taskAnalytics.totalEstimatedHours}\n`;
      csvContent += `Actual Hours,${Math.round(taskAnalytics.totalActualHours)}\n\n`;
    }

    if (meetingAnalytics) {
      csvContent += `Meeting Analytics\n`;
      csvContent += `Metric,Value\n`;
      csvContent += `Total Meetings,${meetingAnalytics.total}\n`;
      csvContent += `Completed,${meetingAnalytics.byStatus.completed || 0}\n`;
      csvContent += `Scheduled,${meetingAnalytics.byStatus.scheduled || 0}\n`;
      csvContent += `Upcoming,${meetingAnalytics.upcoming}\n`;
      csvContent += `Total Duration,${meetingAnalytics.totalDuration} minutes\n`;
      csvContent += `Average Duration,${Math.round(meetingAnalytics.averageDuration)} minutes\n`;
      csvContent += `Action Items,${meetingAnalytics.totalActionItems}\n`;
      csvContent += `Completed Action Items,${meetingAnalytics.completedActionItems}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `TeamSync-Report-${selectedProject?.name || 'All'}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Prepare chart data
  const taskStatusData = taskAnalytics ? Object.entries(taskAnalytics.byStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
    value: count,
  })) : [];

  const taskPriorityData = taskAnalytics ? Object.entries(taskAnalytics.byPriority).map(([priority, count]) => ({
    name: priority.charAt(0).toUpperCase() + priority.slice(1),
    value: count,
  })) : [];

  const meetingTypeData = meetingAnalytics ? Object.entries(meetingAnalytics.byType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
    value: count,
  })) : [];

  const overviewData = allProjectsData.map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    tasks: project.taskAnalytics?.total || 0,
    meetings: project.meetingAnalytics?.total || 0,
    completion: project.taskAnalytics ? 
      Math.round((project.taskAnalytics.byStatus.completed || 0) / (project.taskAnalytics.total || 1) * 100) : 0,
  }));

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography
            variant="h3"
            fontWeight={700}
            sx={{ color: theme === "dark" ? "#fff" : "#333" }}
          >
            <AssessmentIcon sx={{ mr: 2, fontSize: 'inherit' }} />
            Analytics & Reports
          </Typography>
          
          {/* Export buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <IconButton onClick={exportToPDF} color="primary">
                <PdfIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <IconButton onClick={exportToCSV} color="primary">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Project Selector */}
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

        {/* Tabs */}
        <Paper sx={{ bgcolor: theme === "dark" ? "#2d2d2d" : "#fff", borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab label="Project Overview" />
            <Tab label="Task Analytics" />
            <Tab label="Meeting Analytics" />
            {role === 'admin' && <Tab label="Portfolio View" />}
          </Tabs>

          {/* Project Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>
            ) : projectId === "all" ? (
              <Box sx={{ p: 3 }}>
                <Typography color="text.secondary">
                  Select a project to view detailed analytics.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Key Metrics */}
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Total Tasks"
                      value={taskAnalytics?.total || 0}
                      subtitle="All tasks in project"
                      icon={AssignmentIcon}
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Total Meetings"
                      value={meetingAnalytics?.total || 0}
                      subtitle="All meetings scheduled"
                      icon={EventIcon}
                      color="secondary"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Completion Rate"
                      value={taskAnalytics ? 
                        `${Math.round((taskAnalytics.byStatus.completed || 0) / (taskAnalytics.total || 1) * 100)}%` : '0%'
                      }
                      subtitle="Tasks completed"
                      icon={TrendingUpIcon}
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Overdue Tasks"
                      value={taskAnalytics?.overdue || 0}
                      subtitle="Tasks past deadline"
                      icon={ScheduleIcon}
                      color="warning"
                    />
                  </Grid>

                  {/* Progress Metrics */}
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Avg Progress"
                      value={taskAnalytics ? `${Math.round(taskAnalytics.averageProgress)}%` : '0%'}
                      subtitle="Average task completion"
                      icon={TrendingUpIcon}
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Hours Logged"
                      value={taskAnalytics ? Math.round(taskAnalytics.totalActualHours) : 0}
                      subtitle={taskAnalytics ? `of ${taskAnalytics.totalEstimatedHours} estimated` : 'No data'}
                      icon={ScheduleIcon}
                      color="purple"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Upcoming Meetings"
                      value={meetingAnalytics?.upcoming || 0}
                      subtitle="Scheduled meetings"
                      icon={EventIcon}
                      color="teal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Action Items"
                      value={meetingAnalytics?.totalActionItems || 0}
                      subtitle={meetingAnalytics ? 
                        `${meetingAnalytics.completedActionItems} completed` : 'No data'
                      }
                      icon={AssignmentIcon}
                      color="secondary"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </TabPanel>

          {/* Task Analytics Tab */}
          <TabPanel value={activeTab} index={1}>
            {taskAnalytics && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Task Status Chart */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 400 }}>
                      <Typography variant="h6" gutterBottom>Task Status Distribution</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                          <Pie
                            data={taskStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {taskStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  {/* Task Priority Chart */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 400 }}>
                      <Typography variant="h6" gutterBottom>Task Priority Distribution</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={taskPriorityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill={COLORS.primary} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  {/* Task Summary Cards */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Task Summary</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {Object.entries(taskAnalytics.byStatus).map(([status, count]) => (
                          <Chip
                            key={status}
                            label={`${status.replace('-', ' ')}: ${count}`}
                            color={status === 'completed' ? 'success' : status === 'in-progress' ? 'primary' : 'default'}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </TabPanel>

          {/* Meeting Analytics Tab */}
          <TabPanel value={activeTab} index={2}>
            {meetingAnalytics && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Meeting Type Chart */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 400 }}>
                      <Typography variant="h6" gutterBottom>Meeting Type Distribution</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                          <Pie
                            data={meetingTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {meetingTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  {/* Meeting Status Chart */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 400 }}>
                      <Typography variant="h6" gutterBottom>Meeting Status Overview</Typography>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={Object.entries(meetingAnalytics.byStatus).map(([status, count]) => ({
                          name: status.charAt(0).toUpperCase() + status.slice(1),
                          value: count,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill={COLORS.secondary} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  {/* Meeting Summary */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Meeting Summary</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`Total Duration: ${meetingAnalytics.totalDuration} minutes`} />
                        <Chip label={`Average Duration: ${Math.round(meetingAnalytics.averageDuration)} minutes`} />
                        <Chip label={`Action Items: ${meetingAnalytics.totalActionItems}`} />
                        <Chip label={`Completed Actions: ${meetingAnalytics.completedActionItems}`} />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </TabPanel>

          {/* Portfolio View Tab (Admin only) */}
          {role === 'admin' && (
            <TabPanel value={activeTab} index={3}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Portfolio Overview</Typography>
                {allProjectsData.length > 0 ? (
                  <Grid container spacing={3}>
                    {/* Portfolio Summary Chart */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, height: 400 }}>
                        <Typography variant="h6" gutterBottom>Projects Overview</Typography>
                        <ResponsiveContainer width="100%" height="90%">
                          <BarChart data={overviewData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" orientation="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <RechartsTooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="tasks" fill={COLORS.primary} name="Tasks" />
                            <Bar yAxisId="left" dataKey="meetings" fill={COLORS.secondary} name="Meetings" />
                            <Line yAxisId="right" dataKey="completion" stroke={COLORS.success} name="Completion %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Paper>
                    </Grid>

                    {/* Project Cards */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Project Details</Typography>
                      <Grid container spacing={2}>
                        {allProjectsData.map((project) => (
                          <Grid item xs={12} sm={6} md={4} key={project._id}>
                            <Card sx={{ height: '100%' }}>
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  {project.name}
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                  <Chip 
                                    label={project.status || 'active'} 
                                    color={project.status === 'completed' ? 'success' : 'primary'}
                                    size="small" 
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Tasks:</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                      {project.taskAnalytics?.total || 0}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Meetings:</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                      {project.meetingAnalytics?.total || 0}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Completion:</Typography>
                                    <Typography variant="body2" fontWeight={600} color="success.main">
                                      {project.taskAnalytics ? 
                                        `${Math.round((project.taskAnalytics.byStatus.completed || 0) / (project.taskAnalytics.total || 1) * 100)}%` : '0%'
                                      }
                                    </Typography>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography color="text.secondary">Loading portfolio data...</Typography>
                )}
              </Box>
            </TabPanel>
          )}
        </Paper>
      </Box>
    </Box>
  );
}