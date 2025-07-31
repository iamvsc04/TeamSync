import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Badge,
  Tabs,
  Tab,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Alert,
  Snackbar,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemSecondaryAction,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  PriorityHigh as PriorityHighIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../useAuth';
import { useTheme } from '../ThemeContext';

const TaskManagement = ({ projectId, onTaskUpdate }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    estimatedHours: '',
    progress: 0,
    tags: '',
  });
  const [projectMembers, setProjectMembers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTimers, setActiveTimers] = useState({});
  const [commentText, setCommentText] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchTasks();
    fetchProjectMembers();
    fetchAnalytics();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching tasks for project:', projectId);
      console.log('Current user:', user);
      
      const response = await fetch(`http://localhost:5000/api/tasks/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched tasks:', data);
        setTasks(data);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch tasks:', errorData);
        setError(errorData.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProjectMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch project members:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/analytics/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const handleCreateTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...taskForm,
          project: projectId,
          tags: taskForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        }),
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Task created successfully', severity: 'success' });
        setTaskDialogOpen(false);
        resetTaskForm();
        fetchTasks();
        fetchAnalytics();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to create task', severity: 'error' });
    }
  };

  const handleUpdateTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${editingTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...taskForm,
          tags: taskForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        }),
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Task updated successfully', severity: 'success' });
        setTaskDialogOpen(false);
        setEditingTask(null);
        resetTaskForm();
        fetchTasks();
        fetchAnalytics();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update task', severity: 'error' });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Task deleted successfully', severity: 'success' });
        fetchTasks();
        fetchAnalytics();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete task', severity: 'error' });
    }
  };

  const handleStartTimer = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/start-timer`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setActiveTimers(prev => ({ ...prev, [taskId]: true }));
        setSnackbar({ open: true, message: 'Timer started', severity: 'success' });
        fetchTasks();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to start timer', severity: 'error' });
    }
  };

  const handleStopTimer = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/stop-timer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description: 'Time tracked' }),
      });
      if (response.ok) {
        setActiveTimers(prev => ({ ...prev, [taskId]: false }));
        setSnackbar({ open: true, message: 'Timer stopped', severity: 'success' });
        fetchTasks();
        fetchAnalytics();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to stop timer', severity: 'error' });
    }
  };

  const handleAddComment = async (taskId) => {
    if (!commentText.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });
      if (response.ok) {
        setCommentText('');
        setSnackbar({ open: true, message: 'Comment added successfully', severity: 'success' });
        fetchTasks();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add comment', severity: 'error' });
    }
  };

  const handleQuickProgressUpdate = async (task) => {
    const newProgress = Math.min((task.progress || 0) + 25, 100);
    const newStatus = newProgress === 100 ? 'completed' : newProgress >= 50 ? 'in-progress' : task.status;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          progress: newProgress,
          status: newStatus
        }),
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Progress updated successfully', severity: 'success' });
        fetchTasks();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update progress', severity: 'error' });
    }
  };

  const openTaskDialog = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo._id,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: task.estimatedHours || '',
        progress: task.progress || 0,
        tags: task.tags ? task.tags.join(', ') : '',
      });
    } else {
      setEditingTask(null);
      resetTaskForm();
    }
    setTaskDialogOpen(true);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
      estimatedHours: '',
      progress: 0,
      tags: '',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'blocked': return 'error';
      case 'review': return 'warning';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'in-progress': return <TrendingUpIcon />;
      case 'blocked': return <BlockIcon />;
      case 'review': return <AssessmentIcon />;
      default: return <PendingIcon />;
    }
  };

  const filteredTasks = () => {
    switch (selectedTab) {
      case 0: return tasks; // All tasks
      case 1: return tasks.filter(task => task.status === 'pending');
      case 2: return tasks.filter(task => task.status === 'in-progress');
      case 3: return tasks.filter(task => task.status === 'completed');
      case 4: return tasks.filter(task => task.status === 'blocked');
      case 5: return tasks.filter(task => String(task.assignedTo?._id || task.assignedTo) === String(user?.id || user?._id)); // My tasks
      default: return tasks;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Analytics Dashboard */}
      {analytics && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: theme === 'dark' ? '#2d2d2d' : '#fff' }}>
          <Typography variant="h6" gutterBottom sx={{ color: theme === 'dark' ? '#fff' : '#333' }}>
            Task Analytics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: theme === 'dark' ? '#333' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h4" color="primary">{analytics.total}</Typography>
                  <Typography variant="body2">Total Tasks</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: theme === 'dark' ? '#333' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h4" color="success.main">{analytics.byStatus.completed}</Typography>
                  <Typography variant="body2">Completed</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: theme === 'dark' ? '#333' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h4" color="warning.main">{analytics.overdue}</Typography>
                  <Typography variant="body2">Overdue</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: theme === 'dark' ? '#333' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h4" color="info.main">{Math.round(analytics.averageProgress)}%</Typography>
                  <Typography variant="body2">Avg Progress</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Task Tabs */}
      <Paper sx={{ bgcolor: theme === 'dark' ? '#2d2d2d' : '#fff' }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label={`All (${tasks.length})`} />
          <Tab label={`Pending (${tasks.filter(t => t.status === 'pending').length})`} />
          <Tab label={`In Progress (${tasks.filter(t => t.status === 'in-progress').length})`} />
          <Tab label={`Completed (${tasks.filter(t => t.status === 'completed').length})`} />
          <Tab label={`Blocked (${tasks.filter(t => t.status === 'blocked').length})`} />
          <Tab label={`My Tasks (${tasks.filter(t => String(t.assignedTo?._id || t.assignedTo) === String(user?.id || user?._id)).length})`} />
        </Tabs>
      </Paper>

      {/* Task List */}
      <List sx={{ mt: 2 }}>
        {filteredTasks().map((task) => (
          <Paper key={task._id} sx={{ mb: 2, bgcolor: theme === 'dark' ? '#2d2d2d' : '#fff' }}>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getStatusColor(task.status) }}>
                  {getStatusIcon(task.status)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6" sx={{ color: theme === 'dark' ? '#fff' : '#333' }}>
                      {task.title}
                    </Typography>
                    <Chip 
                      label={task.priority} 
                      size="small" 
                      color={getPriorityColor(task.priority)}
                    />
                    {task.dueDate && (
                      <Chip 
                        icon={<CalendarIcon />}
                        label={new Date(task.dueDate).toLocaleDateString()}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ color: theme === 'dark' ? '#ccc' : '#666', mb: 1 }}>
                      {task.description}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip 
                        icon={<PersonIcon />}
                        label={task.assignedTo.name}
                        size="small"
                      />
                      {task.tags && task.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                    <Box mt={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={task.progress || 0} 
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" sx={{ color: theme === 'dark' ? '#ccc' : '#666' }}>
                        {task.progress || 0}% Complete
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Box display="flex" gap={1}>
                  <Tooltip title="Edit Task">
                    <IconButton onClick={() => openTaskDialog(task)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Task">
                    <IconButton onClick={() => handleDeleteTask(task._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={activeTimers[task._id] ? "Stop Timer" : "Start Timer"}>
                    <IconButton 
                      onClick={() => activeTimers[task._id] 
                        ? handleStopTimer(task._id) 
                        : handleStartTimer(task._id)
                      }
                      color={activeTimers[task._id] ? "error" : "primary"}
                    >
                      {activeTimers[task._id] ? <StopIcon /> : <PlayIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add Comment">
                    <IconButton onClick={() => setSelectedTask(task)}>
                      <CommentIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Quick Progress Update">
                    <IconButton 
                      onClick={() => handleQuickProgressUpdate(task)}
                      color="success"
                    >
                      <TrendingUpIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          </Paper>
        ))}
      </List>

      {/* Create Task FAB */}
      <Fab
        color="primary"
        aria-label="add task"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => openTaskDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                >
                  {projectMembers.map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      {member.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Hours"
                value={taskForm.estimatedHours}
                onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">hours</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Progress (%)"
                value={taskForm.progress}
                onChange={(e) => setTaskForm({ ...taskForm, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={taskForm.tags}
                onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })}
                placeholder="bug, frontend, urgent"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={editingTask ? handleUpdateTask : handleCreateTask}
            variant="contained"
          >
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Comment to "{selectedTask?.title}"</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comment"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTask(null)}>Cancel</Button>
          <Button onClick={() => handleAddComment(selectedTask._id)} variant="contained">
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskManagement; 