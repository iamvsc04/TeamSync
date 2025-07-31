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
  Alert,
  Snackbar,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemSecondaryAction,
  Checkbox,
  FormControlLabel,
  Switch,
  Autocomplete,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Event as EventIcon,
  MeetingRoom as MeetingRoomIcon,
  Videocam as VideocamIcon,
  Public as PublicIcon,
  Notes as NotesIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { useAuth } from '../useAuth';
import { useTheme } from '../ThemeContext';

const MeetingManagement = ({ projectId, onMeetingUpdate }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    meetingType: 'video-call',
    startTime: '',
    endTime: '',
    location: '',
    videoCallLink: '',
    agenda: [],
    attendees: [],
    isRecurring: false,
    recurrencePattern: {
      frequency: 'weekly',
      interval: 1,
      endDate: '',
      daysOfWeek: [],
    },
  });
  const [projectMembers, setProjectMembers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [minutesDialogOpen, setMinutesDialogOpen] = useState(false);
  const [minutesForm, setMinutesForm] = useState({
    topic: '',
    discussion: '',
    decisions: '',
    actionItems: [],
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchMeetings();
    fetchProjectMembers();
    fetchAnalytics();
  }, [projectId]);

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/meetings/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      } else {
        setError('Failed to fetch meetings');
      }
    } catch (err) {
      setError('Failed to fetch meetings');
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
      const response = await fetch(`http://localhost:5000/api/meetings/analytics/project/${projectId}`, {
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

  const handleCreateMeeting = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...meetingForm,
          project: projectId,
          startTime: new Date(meetingForm.startTime).toISOString(),
          endTime: new Date(meetingForm.endTime).toISOString(),
        }),
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Meeting created successfully', severity: 'success' });
        setMeetingDialogOpen(false);
        resetMeetingForm();
        fetchMeetings();
        fetchAnalytics();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to create meeting', severity: 'error' });
    }
  };

  const handleUpdateMeeting = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/meetings/${editingMeeting._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...meetingForm,
          startTime: new Date(meetingForm.startTime).toISOString(),
          endTime: new Date(meetingForm.endTime).toISOString(),
        }),
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Meeting updated successfully', severity: 'success' });
        setMeetingDialogOpen(false);
        setEditingMeeting(null);
        resetMeetingForm();
        fetchMeetings();
        fetchAnalytics();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update meeting', severity: 'error' });
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Meeting deleted successfully', severity: 'success' });
        fetchMeetings();
        fetchAnalytics();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete meeting', severity: 'error' });
    }
  };

  const handleRespondToMeeting = async (meetingId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/meetings/${meetingId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Response recorded successfully', severity: 'success' });
        fetchMeetings();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to respond to meeting', severity: 'error' });
    }
  };

  const handleAddMinutes = async (meetingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/meetings/${meetingId}/minutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...minutesForm,
          decisions: minutesForm.decisions.split('\n').filter(d => d.trim()),
        }),
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Minutes added successfully', severity: 'success' });
        setMinutesDialogOpen(false);
        resetMinutesForm();
        fetchMeetings();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add minutes', severity: 'error' });
    }
  };

  const openMeetingDialog = (meeting = null) => {
    if (meeting) {
      setEditingMeeting(meeting);
      setMeetingForm({
        title: meeting.title,
        description: meeting.description,
        meetingType: meeting.meetingType,
        startTime: new Date(meeting.startTime).toISOString().slice(0, 16),
        endTime: new Date(meeting.endTime).toISOString().slice(0, 16),
        location: meeting.location || '',
        videoCallLink: meeting.videoCallLink || '',
        agenda: meeting.agenda || [],
        attendees: meeting.attendees || [],
        isRecurring: meeting.isRecurring || false,
        recurrencePattern: meeting.recurrencePattern || {
          frequency: 'weekly',
          interval: 1,
          endDate: '',
          daysOfWeek: [],
        },
      });
    } else {
      setEditingMeeting(null);
      resetMeetingForm();
    }
    setMeetingDialogOpen(true);
  };

  const resetMeetingForm = () => {
    setMeetingForm({
      title: '',
      description: '',
      meetingType: 'video-call',
      startTime: '',
      endTime: '',
      location: '',
      videoCallLink: '',
      agenda: [],
      attendees: [],
      isRecurring: false,
      recurrencePattern: {
        frequency: 'weekly',
        interval: 1,
        endDate: '',
        daysOfWeek: [],
      },
    });
  };

  const resetMinutesForm = () => {
    setMinutesForm({
      topic: '',
      discussion: '',
      decisions: '',
      actionItems: [],
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getMeetingTypeIcon = (type) => {
    switch (type) {
      case 'video-call': return <VideocamIcon />;
      case 'in-person': return <MeetingRoomIcon />;
      case 'hybrid': return <PublicIcon />;
      default: return <EventIcon />;
    }
  };

  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'declined': return 'error';
      case 'attended': return 'primary';
      case 'absent': return 'warning';
      default: return 'default';
    }
  };

  const filteredMeetings = () => {
    switch (selectedTab) {
      case 0: return meetings; // All meetings
      case 1: return meetings.filter(meeting => meeting.status === 'scheduled' && new Date(meeting.startTime) > new Date());
      case 2: return meetings.filter(meeting => meeting.status === 'completed');
      case 3: return meetings.filter(meeting => meeting.status === 'cancelled');
      default: return meetings;
    }
  };

  const isUpcoming = (meeting) => {
    return new Date(meeting.startTime) > new Date() && meeting.status === 'scheduled';
  };

  const isOngoing = (meeting) => {
    const now = new Date();
    return new Date(meeting.startTime) <= now && new Date(meeting.endTime) >= now && meeting.status === 'scheduled';
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
            Meeting Analytics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: theme === 'dark' ? '#333' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h4" color="primary">{analytics.total}</Typography>
                  <Typography variant="body2">Total Meetings</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: theme === 'dark' ? '#333' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h4" color="success.main">{analytics.upcoming}</Typography>
                  <Typography variant="body2">Upcoming</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: theme === 'dark' ? '#333' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h4" color="info.main">{Math.round(analytics.averageDuration)}m</Typography>
                  <Typography variant="body2">Avg Duration</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: theme === 'dark' ? '#333' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h4" color="warning.main">{analytics.totalActionItems}</Typography>
                  <Typography variant="body2">Action Items</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Meeting Tabs */}
      <Paper sx={{ bgcolor: theme === 'dark' ? '#2d2d2d' : '#fff' }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label={`All (${meetings.length})`} />
          <Tab label={`Upcoming (${meetings.filter(m => isUpcoming(m)).length})`} />
          <Tab label={`Completed (${meetings.filter(m => m.status === 'completed').length})`} />
          <Tab label={`Cancelled (${meetings.filter(m => m.status === 'cancelled').length})`} />
        </Tabs>
      </Paper>

      {/* Meeting List */}
      <List sx={{ mt: 2 }}>
        {filteredMeetings().map((meeting) => (
          <Paper key={meeting._id} sx={{ mb: 2, bgcolor: theme === 'dark' ? '#2d2d2d' : '#fff' }}>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getStatusColor(meeting.status) }}>
                  {getMeetingTypeIcon(meeting.meetingType)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6" sx={{ color: theme === 'dark' ? '#fff' : '#333' }}>
                      {meeting.title}
                    </Typography>
                    {isUpcoming(meeting) && (
                      <Chip label="Upcoming" size="small" color="primary" />
                    )}
                    {isOngoing(meeting) && (
                      <Chip label="Ongoing" size="small" color="success" />
                    )}
                    {meeting.isRecurring && (
                      <Chip label="Recurring" size="small" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ color: theme === 'dark' ? '#ccc' : '#666', mb: 1 }}>
                      {meeting.description}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                      <Chip 
                        icon={<CalendarIcon />}
                        label={new Date(meeting.startTime).toLocaleDateString()}
                        size="small"
                        variant="outlined"
                      />
                      <Chip 
                        icon={<TimeIcon />}
                        label={`${new Date(meeting.startTime).toLocaleTimeString()} - ${new Date(meeting.endTime).toLocaleTimeString()}`}
                        size="small"
                        variant="outlined"
                      />
                      {meeting.location && (
                        <Chip 
                          icon={<LocationIcon />}
                          label={meeting.location}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip 
                        icon={<PersonIcon />}
                        label={meeting.organizer.name}
                        size="small"
                      />
                      <Chip 
                        icon={<GroupIcon />}
                        label={`${meeting.attendees.length} attendees`}
                        size="small"
                      />
                    </Box>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Box display="flex" gap={1}>
                  <Tooltip title="Edit Meeting">
                    <IconButton onClick={() => openMeetingDialog(meeting)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Meeting">
                    <IconButton onClick={() => handleDeleteMeeting(meeting._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add Minutes">
                    <IconButton onClick={() => {
                      setSelectedMeeting(meeting);
                      setMinutesDialogOpen(true);
                    }}>
                      <NotesIcon />
                    </IconButton>
                  </Tooltip>
                  {meeting.videoCallLink && (
                    <Tooltip title="Join Video Call">
                      <IconButton 
                        href={meeting.videoCallLink} 
                        target="_blank"
                        color="primary"
                      >
                        <VideoCallIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          </Paper>
        ))}
      </List>

      {/* Create Meeting FAB */}
      <Fab
        color="primary"
        aria-label="add meeting"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => openMeetingDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Meeting Dialog */}
      <Dialog open={meetingDialogOpen} onClose={() => setMeetingDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Meeting Title"
                value={meetingForm.title}
                onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={meetingForm.description}
                onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Meeting Type</InputLabel>
                <Select
                  value={meetingForm.meetingType}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingType: e.target.value })}
                >
                  <MenuItem value="video-call">Video Call</MenuItem>
                  <MenuItem value="in-person">In Person</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Time"
                value={meetingForm.startTime}
                onChange={(e) => setMeetingForm({ ...meetingForm, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="End Time"
                value={meetingForm.endTime}
                onChange={(e) => setMeetingForm({ ...meetingForm, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={meetingForm.location}
                onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                placeholder="Meeting room, address, or virtual location"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Video Call Link"
                value={meetingForm.videoCallLink}
                onChange={(e) => setMeetingForm({ ...meetingForm, videoCallLink: e.target.value })}
                placeholder="Zoom, Teams, or other video call link"
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={projectMembers}
                getOptionLabel={(option) => option.name}
                value={meetingForm.attendees}
                onChange={(e, newValue) => setMeetingForm({ ...meetingForm, attendees: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Attendees"
                    placeholder="Select meeting attendees"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={meetingForm.isRecurring}
                    onChange={(e) => setMeetingForm({ ...meetingForm, isRecurring: e.target.checked })}
                  />
                }
                label="Recurring Meeting"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMeetingDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={editingMeeting ? handleUpdateMeeting : handleCreateMeeting}
            variant="contained"
          >
            {editingMeeting ? 'Update' : 'Schedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Minutes Dialog */}
      <Dialog open={minutesDialogOpen} onClose={() => setMinutesDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Minutes for "{selectedMeeting?.title}"</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Topic"
                value={minutesForm.topic}
                onChange={(e) => setMinutesForm({ ...minutesForm, topic: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Discussion"
                value={minutesForm.discussion}
                onChange={(e) => setMinutesForm({ ...minutesForm, discussion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Decisions (one per line)"
                value={minutesForm.decisions}
                onChange={(e) => setMinutesForm({ ...minutesForm, decisions: e.target.value })}
                placeholder="Decision 1&#10;Decision 2&#10;Decision 3"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMinutesDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleAddMinutes(selectedMeeting._id)} variant="contained">
            Add Minutes
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

export default MeetingManagement; 