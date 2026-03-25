import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import { useAuth } from "../useAuth";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  useTheme,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import UserProfile from "../components/UserProfile";
import { useTheme as useAppTheme } from "../ThemeContext";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const { theme, toggleTheme } = useAppTheme();
  const muiTheme = useTheme();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: "Profile", icon: <PersonIcon />, component: <UserProfile /> },
    {
      label: "Notifications",
      icon: <NotificationsIcon />,
      component: <NotificationsSettings />,
    },
    {
      label: "Appearance",
      icon: <PaletteIcon />,
      component: <AppearanceSettings />,
    },
    {
      label: "Security",
      icon: <SecurityIcon />,
      component: <SecuritySettings />,
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 3 }}>
        <Typography
          variant="h3"
          fontWeight={700}
          sx={{
            mb: 4,
            textAlign: "center",
            color: theme === "dark" ? "#fff" : "#333",
          }}
        >
          Settings
        </Typography>

        <Paper
          sx={{
            bgcolor: theme === "dark" ? "#2d2d2d" : "#fff",
            borderRadius: 2,
            boxShadow:
              theme === "dark"
                ? "0 4px 20px rgba(0,0,0,0.3)"
                : "0 4px 20px rgba(0,0,0,0.1)",
            border: `1px solid ${theme === "dark" ? "#444" : "#e0e0e0"}`,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: `1px solid ${
                theme === "dark" ? "#444" : "#e0e0e0"
              }`,
              "& .MuiTab-root": {
                color: theme === "dark" ? "#ccc" : "#666",
                "&.Mui-selected": {
                  color: muiTheme.palette.primary.main,
                },
              },
              "& .MuiTabs-indicator": {
                bgcolor: muiTheme.palette.primary.main,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
            ))}
          </Tabs>

          {tabs.map((tab, index) => (
            <TabPanel key={index} value={activeTab} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </Paper>
      </Box>
    </Box>
  );
}

// Notifications Settings Component
function NotificationsSettings() {
  const { theme } = useAppTheme();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskUpdates: true,
  });

  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        emailNotifications: user.preferences.emailNotifications ?? true,
        pushNotifications: user.preferences.pushNotifications ?? true,
        taskUpdates: user.preferences.taskUpdates ?? true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setPreferences({
      ...preferences,
      [e.target.name]: e.target.checked,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Notification preferences saved successfully.");
        setUser(data);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to save preferences.");
      }
    } catch {
      setError("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={600}
        sx={{ color: theme === "dark" ? "#fff" : "#333", mb: 3 }}
      >
        Notification Preferences
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
        <Paper sx={{ p: 2, bgcolor: theme === "dark" ? "#333" : "#f5f5f5" }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.emailNotifications}
                onChange={handleChange}
                name="emailNotifications"
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500} sx={{ color: theme === "dark" ? "#fff" : "#333" }}>
                  Email Notifications
                </Typography>
                <Typography variant="body2" sx={{ color: theme === "dark" ? "#aaa" : "#666" }}>
                  Receive daily summaries and important alerts via email.
                </Typography>
              </Box>
            }
            sx={{ m: 0, width: "100%", justifyContent: "space-between", flexDirection: "row-reverse" }}
          />
        </Paper>

        <Paper sx={{ p: 2, bgcolor: theme === "dark" ? "#333" : "#f5f5f5" }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.pushNotifications}
                onChange={handleChange}
                name="pushNotifications"
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500} sx={{ color: theme === "dark" ? "#fff" : "#333" }}>
                  Push Notifications
                </Typography>
                <Typography variant="body2" sx={{ color: theme === "dark" ? "#aaa" : "#666" }}>
                  Allow in-app push notifications for live updates.
                </Typography>
              </Box>
            }
            sx={{ m: 0, width: "100%", justifyContent: "space-between", flexDirection: "row-reverse" }}
          />
        </Paper>

        <Paper sx={{ p: 2, bgcolor: theme === "dark" ? "#333" : "#f5f5f5" }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.taskUpdates}
                onChange={handleChange}
                name="taskUpdates"
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500} sx={{ color: theme === "dark" ? "#fff" : "#333" }}>
                  Task Updates
                </Typography>
                <Typography variant="body2" sx={{ color: theme === "dark" ? "#aaa" : "#666" }}>
                  Get notified when tasks assigned to you are modified or completed.
                </Typography>
              </Box>
            }
            sx={{ m: 0, width: "100%", justifyContent: "space-between", flexDirection: "row-reverse" }}
          />
        </Paper>
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <CircularProgress size={24} /> : "Save Preferences"}
      </Button>
    </Box>
  );
}

// Appearance Settings Component
function AppearanceSettings() {
  const { theme, toggleTheme } = useAppTheme();

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={600}
        sx={{ color: theme === "dark" ? "#fff" : "#333", mb: 3 }}
      >
        Appearance
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Typography
          variant="body1"
          sx={{ color: theme === "dark" ? "#ccc" : "#666" }}
        >
          Current theme: {theme === "dark" ? "Dark" : "Light"}
        </Typography>
        <Typography
          variant="h4"
          sx={{ cursor: "pointer" }}
          onClick={toggleTheme}
        >
          {theme === "dark" ? "🌞" : "🌙"}
        </Typography>
      </Box>

      <Typography
        variant="body2"
        sx={{ color: theme === "dark" ? "#999" : "#888", mb: 4 }}
      >
        Click the sun/moon icon to toggle between light and dark themes.
      </Typography>

      <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: theme === 'dark' ? '#333' : '#eee' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>Onboarding</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Need a refresher? You can restart the guided tour to see the key features again.
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => {
            localStorage.removeItem('teamSync_tourCompleted');
            window.location.reload();
          }}
          sx={{ borderRadius: '8px' }}
        >
          Restart Guided Tour
        </Button>
      </Box>
    </Box>
  );
}

// Security Settings Component
function SecuritySettings() {
  const { theme } = useAppTheme();
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
  });

  useEffect(() => {
    if (user?.security) {
      setSecurity({
        twoFactorEnabled: user.security.twoFactorEnabled ?? false,
        loginAlerts: user.security.loginAlerts ?? true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setSecurity({
      ...security,
      [e.target.name]: e.target.checked,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ security }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Security settings saved successfully.");
        setUser(data);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to save settings.");
      }
    } catch {
      setError("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={600}
        sx={{ color: theme === "dark" ? "#fff" : "#333", mb: 3 }}
      >
        Security Settings
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
        <Paper sx={{ p: 2, bgcolor: theme === "dark" ? "#333" : "#f5f5f5" }}>
          <FormControlLabel
            control={
              <Switch
                checked={security.twoFactorEnabled}
                onChange={handleChange}
                name="twoFactorEnabled"
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500} sx={{ color: theme === "dark" ? "#fff" : "#333" }}>
                  Two-Factor Authentication (2FA)
                </Typography>
                <Typography variant="body2" sx={{ color: theme === "dark" ? "#aaa" : "#666" }}>
                  Require a verification code when logging in from unrecognized devices.
                </Typography>
              </Box>
            }
            sx={{ m: 0, width: "100%", justifyContent: "space-between", flexDirection: "row-reverse" }}
          />
        </Paper>

        <Paper sx={{ p: 2, bgcolor: theme === "dark" ? "#333" : "#f5f5f5" }}>
          <FormControlLabel
            control={
              <Switch
                checked={security.loginAlerts}
                onChange={handleChange}
                name="loginAlerts"
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500} sx={{ color: theme === "dark" ? "#fff" : "#333" }}>
                  Unrecognized Login Alerts
                </Typography>
                <Typography variant="body2" sx={{ color: theme === "dark" ? "#aaa" : "#666" }}>
                  Get an email if someone signs into your account from an unrecognized device.
                </Typography>
              </Box>
            }
            sx={{ m: 0, width: "100%", justifyContent: "space-between", flexDirection: "row-reverse" }}
          />
        </Paper>
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <CircularProgress size={24} /> : "Save Security Details"}
      </Button>
    </Box>
  );
}
