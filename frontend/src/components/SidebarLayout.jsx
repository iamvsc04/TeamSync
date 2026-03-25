import React, {useEffect , useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { API_BASE } from '../config/api';
import {
  Box,
  Button,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Paper,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip,
  Popover,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useAuth } from '../useAuth';
import { useTheme as useAppTheme } from '../ThemeContext';

const drawerWidth = 280;

export default function SidebarLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useAppTheme();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notiAnchorEl, setNotiAnchorEl] = useState(null);
  const [welcomeAnchor, setWelcomeAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hasShownWelcome = localStorage.getItem("teamSync_welcomeShown");
    if (!hasShownWelcome) {
      // Delay welcome popover to avoid conflict with tour
      setTimeout(() => {
        setWelcomeAnchor(document.querySelector('.sidebar-header'));
      }, 3000);
    }
  }, []);

  const handleWelcomeClose = () => {
    setWelcomeAnchor(null);
    localStorage.setItem("teamSync_welcomeShown", "true");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotiMenuOpen = (event) => {
    setNotiAnchorEl(event.currentTarget);
  };

  const handleNotiMenuClose = () => {
    setNotiAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Projects', icon: <FolderIcon />, path: '/dashboard/projects' },
    ...(user?.role !== 'admin' ? [{ text: 'Tasks', icon: <AssignmentIcon />, path: '/dashboard/tasks' }] : []),
    { text: 'Meetings', icon: <EventIcon />, path: '/dashboard/meetings' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/dashboard/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: theme === 'dark' ? '#1e293b' : '#fff' }}>
      <Box className="sidebar-header" sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: isCollapsed ? 'none' : 'block',
          }}
        >
          TeamSync
        </Typography>
        <IconButton 
          className="sidebar-toggle"
          onClick={isMobile ? handleDrawerToggle : toggleSidebar} 
          sx={{ color: 'text.secondary' }}
        >
          {isCollapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ opacity: 0.1 }} />
      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          const targetClass = item.text === 'Dashboard' ? 'sidebar-dashboard' : 
                             item.text === 'Projects' ? 'sidebar-projects' : 
                             item.text === 'Settings' ? 'sidebar-settings' : '';
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                className={targetClass}
                onClick={isMobile ? handleDrawerToggle : undefined}
                sx={{
                  borderRadius: '12px',
                  bgcolor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(99, 102, 241, 0.15)' : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{ opacity: isCollapsed ? 0 : 1 }}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      {!isCollapsed && (
        <Box sx={{ p: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0)}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle2" noWrap fontWeight={700}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.email}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );

  const activeDrawerWidth = isCollapsed ? 80 : drawerWidth;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${activeDrawerWidth}px)` },
          ml: { md: `${activeDrawerWidth}px` },
          bgcolor: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" noWrap component="div" sx={{ color: 'text.primary', fontWeight: 700 }}>
              {menuItems.find(item => location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path)))?.text || 'TeamSync'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Toggle Theme">
              <IconButton onClick={toggleTheme} sx={{ color: 'text.primary' }}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton onClick={handleNotiMenuOpen} sx={{ color: 'text.primary' }}>
                <Badge badgeContent={notifications.filter(n => !n.isRead).length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={notiAnchorEl}
              open={Boolean(notiAnchorEl)}
              onClose={handleNotiMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: '12px',
                  minWidth: 320,
                  maxWidth: 320,
                  maxHeight: 400,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  p: 0
                },
              }}
            >
              <Box p={2} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
              </Box>
              <List sx={{ p: 0 }}>
                {notifications.length === 0 ? (
                  <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                    <Typography color="text.secondary">No new notifications</Typography>
                  </ListItem>
                ) : (
                  notifications.slice(0, 5).map((noti) => (
                    <ListItem 
                      key={noti._id} 
                      disablePadding 
                      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      <ListItemButton sx={{ py: 1.5 }}>
                        <ListItemText
                          primary={noti.message}
                          secondary={new Date(noti.createdAt).toLocaleDateString()}
                          primaryTypographyProps={{ 
                            variant: 'body2', 
                            fontWeight: noti.isRead ? 400 : 700,
                            sx: { mb: 0.5 }
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </List>
              <Box p={1} textAlign="center">
                <Button 
                  fullWidth 
                  size="small" 
                  onClick={() => { handleNotiMenuClose(); navigate('/dashboard/reports'); }}
                  sx={{ textTransform: 'none' }}
                >
                  View all notifications
                </Button>
              </Box>
            </Menu>
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ p: 0.5, border: '2px solid transparent', '&:hover': { borderColor: 'primary.main' } }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.name?.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: '12px',
                  minWidth: 180,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ 
          width: { md: activeDrawerWidth }, 
          flexShrink: { md: 0 },
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: activeDrawerWidth,
              borderRight: '1px solid',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              transition: (theme) => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              overflowX: 'hidden',
              bgcolor: theme === 'dark' ? '#1e293b' : '#fff',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Popover
        open={Boolean(welcomeAnchor)}
        anchorEl={welcomeAnchor}
        onClose={handleWelcomeClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 3,
            maxWidth: 300,
            borderRadius: '16px',
            bgcolor: 'primary.main',
            color: '#fff',
            boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.4)',
            ml: 2,
          }
        }}
      >
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Welcome to TeamSync! 🚀
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
          Your production-grade workspace is ready. Let's take a quick tour to get you started.
        </Typography>
        <Button 
          variant="contained" 
          size="small" 
          fullWidth
          onClick={handleWelcomeClose}
          sx={{ 
            bgcolor: '#fff', 
            color: 'primary.main',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
          }}
        >
          Got it!
        </Button>
      </Popover>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          width: { md: `calc(100% - ${activeDrawerWidth}px)` },
          mt: '64px',
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
