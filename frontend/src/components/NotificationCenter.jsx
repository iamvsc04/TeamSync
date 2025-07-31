import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  MarkEmailRead as MarkReadIcon,
  ClearAll as ClearAllIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Schedule as ScheduleIcon,
  Assignment as TaskIcon,
  MeetingRoom as MeetingIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  Folder as ProjectIcon,
} from '@mui/icons-material';
import { useTheme } from '../ThemeContext';

const NotificationCenter = ({ 
  open, 
  onClose, 
  notifications = [], 
  unreadNotifications = 0,
  setUnreadNotifications 
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [bulkActionAnchor, setBulkActionAnchor] = useState(null);

  const categories = [
    { value: 'all', label: 'All', icon: <NotificationsIcon /> },
    { value: 'tasks', label: 'Tasks', icon: <TaskIcon /> },
    { value: 'meetings', label: 'Meetings', icon: <MeetingIcon /> },
    { value: 'projects', label: 'Projects', icon: <ProjectIcon /> },
    { value: 'documents', label: 'Documents', icon: <DocumentIcon /> },
    { value: 'comments', label: 'Comments', icon: <InfoIcon /> },
    { value: 'system', label: 'System', icon: <InfoIcon /> },
  ];

  const priorityColors = {
    high: '#f44336',
    medium: '#ff9800',
    low: '#4caf50',
  };

  const typeIcons = {
    task_assigned: <TaskIcon />,
    task_completed: <SuccessIcon />,
    task_updated: <TaskIcon />,
    meeting_invitation: <MeetingIcon />,
    meeting_reminder: <ScheduleIcon />,
    meeting_cancelled: <ErrorIcon />,
    project_invitation: <PersonIcon />,
    join_request: <PersonIcon />,
    join_request_approved: <SuccessIcon />,
    join_request_rejected: <ErrorIcon />,
    document_uploaded: <DocumentIcon />,
    comment_added: <InfoIcon />,
    mention: <PersonIcon />,
    deadline_approaching: <ScheduleIcon />,
    overdue_task: <ErrorIcon />,
    system_announcement: <InfoIcon />,
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || notification.category === filterCategory;
    const matchesTab = activeTab === 0 ? true : 
                      activeTab === 1 ? !notification.isRead :
                      activeTab === 2 ? notification.isArchived : false;
    
    return matchesSearch && matchesCategory && matchesTab;
  });

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/mark-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Update local state
        setUnreadNotifications(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleArchive = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh notifications
        // You might want to add a callback to refresh the notifications list
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Refresh notifications
        // You might want to add a callback to refresh the notifications list
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedNotifications.length === 0) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      for (const notificationId of selectedNotifications) {
        const endpoint = action === 'mark-read' ? 'mark-read' : 
                        action === 'archive' ? 'archive' : '';
        
        if (endpoint) {
          await fetch(`http://localhost:5000/api/notifications/${notificationId}/${endpoint}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } else if (action === 'delete') {
          await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        }
      }
      
      setSelectedNotifications([]);
      setBulkActionAnchor(null);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme === 'dark' ? '#1a1a1a' : '#fff',
          color: theme === 'dark' ? '#fff' : '#333',
          minHeight: '70vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
        pb: 2,
        color: theme === 'dark' ? '#fff' : '#333',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon sx={{ color: theme === 'dark' ? '#fff' : '#333' }} />
          <Typography variant="h6" sx={{ color: theme === 'dark' ? '#fff' : '#333' }}>
            Notification Center
          </Typography>
          {unreadNotifications > 0 && (
            <Badge badgeContent={unreadNotifications} color="error">
              <Box />
            </Badge>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Bulk Actions">
            <IconButton
              onClick={(e) => setBulkActionAnchor(e.currentTarget)}
              disabled={selectedNotifications.length === 0}
              sx={{ color: theme === 'dark' ? '#fff' : '#333' }}
            >
              <MoreIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={bulkActionAnchor}
            open={Boolean(bulkActionAnchor)}
            onClose={() => setBulkActionAnchor(null)}
            PaperProps={{
              sx: {
                bgcolor: theme === 'dark' ? '#333' : '#fff',
                color: theme === 'dark' ? '#fff' : '#333',
              }
            }}
          >
            <MenuItem onClick={() => handleBulkAction('mark-read')} sx={{ color: theme === 'dark' ? '#fff' : '#333' }}>
              <MarkReadIcon sx={{ mr: 1, color: theme === 'dark' ? '#fff' : '#333' }} />
              Mark as Read
            </MenuItem>
            <MenuItem onClick={() => handleBulkAction('archive')} sx={{ color: theme === 'dark' ? '#fff' : '#333' }}>
              <ArchiveIcon sx={{ mr: 1, color: theme === 'dark' ? '#fff' : '#333' }} />
              Archive
            </MenuItem>
            <MenuItem onClick={() => handleBulkAction('delete')} sx={{ color: theme === 'dark' ? '#fff' : '#333' }}>
              <DeleteIcon sx={{ mr: 1, color: theme === 'dark' ? '#fff' : '#333' }} />
              Delete
            </MenuItem>
          </Menu>
          <IconButton onClick={onClose} sx={{ color: theme === 'dark' ? '#fff' : '#333' }}>
            <MoreIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}` }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme === 'dark' ? '#fff' : '#333' }} />
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#fff' : '#333',
                    '& fieldset': {
                      borderColor: theme === 'dark' ? '#555' : '#ccc',
                    },
                    '&:hover fieldset': {
                      borderColor: theme === 'dark' ? '#777' : '#999',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme === 'dark' ? '#1976d2' : '#1976d2',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme === 'dark' ? '#ccc' : '#666',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: theme === 'dark' ? '#ccc' : '#999',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: theme === 'dark' ? '#ccc' : '#666' }}>Category</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Category"
                  sx={{
                    color: theme === 'dark' ? '#fff' : '#333',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme === 'dark' ? '#555' : '#ccc',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme === 'dark' ? '#777' : '#999',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme === 'dark' ? '#1976d2' : '#1976d2',
                    },
                    '& .MuiSvgIcon-root': {
                      color: theme === 'dark' ? '#fff' : '#333',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: theme === 'dark' ? '#333' : '#fff',
                        color: theme === 'dark' ? '#fff' : '#333',
                      }
                    }
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value} sx={{ color: theme === 'dark' ? '#fff' : '#333' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: theme === 'dark' ? '#fff' : '#333' }}>
                          {category.icon}
                        </Box>
                        {category.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ 
            borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
            '& .MuiTab-root': {
              color: theme === 'dark' ? '#ccc' : '#666',
              '&.Mui-selected': {
                color: theme === 'dark' ? '#fff' : '#333',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme === 'dark' ? '#1976d2' : '#1976d2',
            },
          }}
        >
          <Tab label="All" />
          <Tab label={`Unread (${unreadNotifications})`} />
          <Tab label="Archived" />
        </Tabs>

        {loading && <LinearProgress />}

        <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ 
                fontSize: 48, 
                color: theme === 'dark' ? '#666' : '#999', 
                mb: 2 
              }} />
              <Typography variant="h6" sx={{ color: theme === 'dark' ? '#ccc' : '#666' }}>
                No notifications found
              </Typography>
              <Typography variant="body2" sx={{ color: theme === 'dark' ? '#999' : '#888' }}>
                {searchQuery || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'You\'re all caught up!'}
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredNotifications.map((notification) => (
                <ListItem
                  key={notification._id}
                  sx={{
                    borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#f0f0f0'}`,
                    bgcolor: notification.isRead 
                      ? 'transparent' 
                      : theme === 'dark' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)',
                    '&:hover': {
                      bgcolor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Box sx={{ 
                      color: typeIcons[notification.type] ? 'primary.main' : 'text.secondary',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {typeIcons[notification.type] || <NotificationsIcon />}
                    </Box>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: notification.isRead ? 400 : 600,
                            color: theme === 'dark' ? '#fff' : '#333',
                          }}
                        >
                          {notification.title}
                        </Typography>
                        {notification.priority && (
                          <Chip
                            label={notification.priority}
                            size="small"
                            sx={{
                              bgcolor: priorityColors[notification.priority],
                              color: 'white',
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme === 'dark' ? '#ccc' : '#666',
                            mb: 1,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{ color: theme === 'dark' ? '#999' : '#888' }}
                          >
                            {formatTimeAgo(notification.createdAt)}
                          </Typography>
                          {notification.category && (
                            <Chip
                              label={notification.category}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {!notification.isRead && (
                      <Tooltip title="Mark as Read">
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(notification._id)}
                        >
                          <MarkReadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Archive">
                      <IconButton
                        size="small"
                        onClick={() => handleArchive(notification._id)}
                      >
                        <ArchiveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(notification._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}` }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: theme === 'dark' ? '#fff' : '#333',
            '&:hover': {
              bgcolor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationCenter; 