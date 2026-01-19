import React, { useState } from "react";
import { Box, Paper, Tabs, Tab, Typography, useTheme } from "@mui/material";
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

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={600}
        sx={{ color: theme === "dark" ? "#fff" : "#333", mb: 3 }}
      >
        Notification Preferences
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: theme === "dark" ? "#ccc" : "#666" }}
      >
        Notification settings will be implemented in the next version.
      </Typography>
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
        sx={{ color: theme === "dark" ? "#999" : "#888" }}
      >
        Click the sun/moon icon to toggle between light and dark themes.
      </Typography>
    </Box>
  );
}

// Security Settings Component
function SecuritySettings() {
  const { theme } = useAppTheme();

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={600}
        sx={{ color: theme === "dark" ? "#fff" : "#333", mb: 3 }}
      >
        Security Settings
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: theme === "dark" ? "#ccc" : "#666" }}
      >
        Additional security settings will be implemented in the next version.
      </Typography>
    </Box>
  );
}

