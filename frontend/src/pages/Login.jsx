import { API_BASE } from '../config/api';
import React, { useState } from "react";
import {
  Box,
  Alert,
  Snackbar,
  Slide,
  Typography,
  Link,
  Divider,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import AuthForm from "../components/AuthForm";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";


function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

export default function Login() {
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (formData) => {
    setIsLoading(true);

    try {
      // Real API call
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Login failed");
      }
      const data = await res.json();
      // Store token in localStorage
      localStorage.setItem("token", data.token);
      // Set user and role in context
      login(data.user, data.user.role);
      setNotification({
        open: true,
        message: `Welcome back, ${data.user.name}! 🎉`,
        severity: "success",
      });
      // Redirect to dashboard after success
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      setNotification({
        open: true,
        message: "Login failed. Please check your credentials.",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ position: "relative", minHeight: "100vh" }}>
      <AuthForm type="login" onSubmit={handleLogin} isLoading={isLoading} />

      {/* Enhanced Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          "& .MuiSnackbarContent-root": {
            borderRadius: 3,
            minWidth: 300,
          },
        }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{
            borderRadius: 3,
            fontWeight: 500,
            fontSize: "0.95rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            "& .MuiAlert-icon": {
              fontSize: "1.2rem",
            },
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
