import { API_BASE } from '../config/api';
import React, { useState } from "react";
import {

  Box,
  Alert,
  Snackbar,
  Slide,
  Typography,
  Link,
  LinearProgress,
  Chip,
  Zoom,
  IconButton,
} from "@mui/material";
import {

  CheckCircle,
  Error,
  Info,
  Warning,
  Security,
  Speed,
  Group,
} from "@mui/icons-material";
import AuthForm from "../components/AuthForm";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";


function SlideTransition({
  handleSignUp,
  isLoading,
  progress,
  notification,
  handleCloseNotification,
  features,
}) {
  return (
    <Box sx={{ position: "relative", minHeight: "100vh" }}>
      <AuthForm type="signup" onSubmit={handleSignUp} isLoading={isLoading} />
      {/* Progress Bar */}
      {isLoading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
          }}
        >
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                transition: "transform 0.6s ease-in-out",
              },
            }}
          />
        </Box>
      )}
      {/* Features Section */}
      <Box
        sx={{
          position: "absolute",
          top: 40,
          left: 40,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          gap: 2,
          opacity: 0,
          animation: "slideInLeft 1s ease-out 1.5s both",
          "@keyframes slideInLeft": {
            "0%": { opacity: 0, transform: "translateX(-50px)" },
            "100%": { opacity: 1, transform: "translateX(0)" },
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "rgba(255, 255, 255, 0.9)",
            fontWeight: 700,
            mb: 1,
            fontSize: "1.1rem",
          }}
        >
          Why Choose TeamSync?
        </Typography>
        {features.map((feature, index) => (
          <Zoom
            key={feature.title}
            in={true}
            timeout={500}
            style={{ transitionDelay: `${1800 + index * 200}ms` }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                borderRadius: 3,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                maxWidth: 280,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  transform: "translateX(5px)",
                  boxShadow: `0 8px 25px ${feature.color}40`,
                },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: feature.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "1.2rem",
                  flexShrink: 0,
                }}
              >
                {feature.icon}
              </Box>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.9)",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    lineHeight: 1.2,
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.8rem",
                    lineHeight: 1.3,
                  }}
                >
                  {feature.description}
                </Typography>
              </Box>
            </Box>
          </Zoom>
        ))}
      </Box>
      {/* Enhanced Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        TransitionComponent={Slide}
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

export default function SignUp() {
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignUp = async (formData) => {
    setIsLoading(true);
    setProgress(0);

    try {
      // Simulate progress steps
      const steps = [
        { progress: 25, message: "Validating information..." },
        { progress: 50, message: "Creating account..." },
        { progress: 75, message: "Setting up profile..." },
        { progress: 100, message: "Almost done..." },
      ];

      for (let step of steps) {
        setProgress(step.progress);
        setNotification({
          open: true,
          message: step.message,
          severity: "info",
        });
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      console.debug("Signup request sent with data:", formData);

      const data = await response.json();

      if (response.ok) {
        setNotification({
          open: true,
          message: `🎉 Welcome to TeamSync, ${formData.name}! Account created successfully!`,
          severity: "success",
        });

        // Auto-login after successful signup
        try {
          const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              role: formData.role,
            }),
          });
          if (!loginRes.ok) {
            throw new Error("Auto-login failed. Please login manually.");
          }
          const loginData = await loginRes.json();
          localStorage.setItem("token", loginData.token);
          login(loginData.user, loginData.user.role);
          navigate("/dashboard");
        } catch (autoLoginError) {
          setNotification({
            open: true,
            message: autoLoginError.message,
            severity: "error",
          });
        }
      } else {
        setNotification({
          open: true,
          message: data.message || "Signup failed. Please try again.",
          severity: "error",
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message:
          "An error occurred during signup. Please check your connection and try again.",
        severity: "error",
      });
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const features = [
    {
      icon: <Security />,
      title: "Secure",
      description: "End-to-end encryption",
      color: "#4CAF50",
    },
    {
      icon: <Speed />,
      title: "Fast",
      description: "Lightning-fast performance",
      color: "#FF9800",
    },
    {
      icon: <Group />,
      title: "Collaborative",
      description: "Work better together",
      color: "#2196F3",
    },
  ];

  return (
    <SlideTransition
      handleSignUp={handleSignUp}
      isLoading={isLoading}
      progress={progress}
      notification={notification}
      handleCloseNotification={handleCloseNotification}
      features={features}
    />
  );
}