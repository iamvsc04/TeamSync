import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Paper,
  Fade,
  Slide,
  Grow,
  IconButton,
  InputAdornment,
  Chip,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
  AdminPanelSettings,
  Group,
} from "@mui/icons-material";

const roles = [
  {
    value: "admin",
    label: "Admin",
    icon: <AdminPanelSettings />,
    color: "#ff6b6b",
    description: "Full access control",
  },
  {
    value: "member",
    label: "Member",
    icon: <Group />,
    color: "#4ecdc4",
    description: "Standard access",
  },
];

export default function AuthForm({ type, onSubmit }) {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';
  const [form, setForm] = useState({
    email: "",
    password: "",
    ...(type === "signup" && { name: "", role: "member" }),
  });
  const [visible, setVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldFocus, setFieldFocus] = useState({});
  const [submitAnimation, setSubmitAnimation] = useState(false);
  const [particleAnimation, setParticleAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
      setParticleAnimation(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitAnimation(true);

    setTimeout(() => {
      onSubmit(form);
      setSubmitAnimation(false);
    }, 800);
  };

  const handleFocus = (field) => {
    setFieldFocus({ ...fieldFocus, [field]: true });
  };

  const handleBlur = (field) => {
    setFieldFocus({ ...fieldFocus, [field]: false });
  };

  const getFieldIcon = (field) => {
    switch (field) {
      case "name":
        return <Person />;
      case "email":
        return <Email />;
      case "password":
        return <Lock />;
      default:
        return null;
    }
  };

  const selectedRole = roles.find((role) => role.value === form.role);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        maxWidth: "100vw",
        overflowX: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(78, 205, 196, 0.3) 0%, transparent 50%),
          linear-gradient(135deg, #667eea 0%, #764ba2 100%)
        `,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: particleAnimation
            ? `
            radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 20%),
            radial-gradient(circle at 90% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 20%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 30%)
          `
            : "none",
          animation: particleAnimation ? "float 20s infinite linear" : "none",
          "@keyframes float": {
            "0%": { transform: "translateY(0px) rotate(0deg)" },
            "50%": { transform: "translateY(-20px) rotate(180deg)" },
            "100%": { transform: "translateY(0px) rotate(360deg)" },
          },
        },
      }}
    >
      <Fade in={visible} timeout={800}>
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Slide direction="up" in={visible} timeout={1000}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 4 },
                width: "100%",
                maxWidth: 480,
                height: "auto",
                borderRadius: 6,
                background: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                border: "none",
                boxShadow: "none",
                margin: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Grow in={visible} timeout={1200}>
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      fontSize: { xs: "2rem", sm: "2.5rem" },
                      letterSpacing: "0.5px",
                      fontFamily: "'Poppins', sans-serif",
                      mb: 1,
                      textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    TeamSync
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 2,
                        background: "linear-gradient(90deg, #667eea, #764ba2)",
                        borderRadius: 1,
                        animation: "expand 1s ease-out 1s both",
                        "@keyframes expand": {
                          "0%": { width: 0 },
                          "100%": { width: 40 },
                        },
                      }}
                    />
                    <Typography
                      variant="h5"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        fontSize: "1.3rem",
                        opacity: 0,
                        animation: "fadeInUp 0.8s ease-out 1.2s both",
                        "@keyframes fadeInUp": {
                          "0%": { opacity: 0, transform: "translateY(20px)" },
                          "100%": { opacity: 1, transform: "translateY(0)" },
                        },
                      }}
                    >
                      {type === "login" ? "Welcome Back" : "Join Us"}
                    </Typography>
                    <Box
                      sx={{
                        width: 40,
                        height: 2,
                        background: "linear-gradient(90deg, #764ba2, #667eea)",
                        borderRadius: 1,
                        animation: "expand 1s ease-out 1s both",
                      }}
                    />
                  </Box>
                </Box>
              </Grow>

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  "& .MuiTextField-root": {
                    mb: 2.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "& input": {
                        color: isDark ? "#fff" : "inherit",
                        "&::placeholder": {
                          color: isDark ? "rgba(255, 255, 255, 0.5)" : "inherit",
                        },
                      },
                      "& input:-webkit-autofill": {
                        WebkitBoxShadow: `0 0 0 1000px ${isDark ? "#1e293b" : "#fff"} inset !important`,
                        WebkitTextFillColor: isDark ? "#fff" : "inherit !important",
                        borderRadius: "inherit",
                      },
                      "&:hover": {
                        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.9)",
                        transform: "translateY(-2px)",
                        boxShadow: isDark ? "0 8px 25px rgba(0, 0, 0, 0.4)" : "0 8px 25px rgba(0, 0, 0, 0.1)",
                      },
                      "&.Mui-focused": {
                        background: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 1)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 25px rgba(102, 126, 234, 0.25)",
                      },
                    },
                  },
                }}
              >
                {type === "signup" && (
                  <Slide direction="right" in={visible} timeout={1000}>
                    <TextField
                      label="Full Name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      onFocus={() => handleFocus("name")}
                      onBlur={() => handleBlur("name")}
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box
                              sx={{
                                color: fieldFocus.name
                                  ? "primary.main"
                                  : "text.secondary",
                                transition: "color 0.3s",
                                transform: fieldFocus.name
                                  ? "scale(1.1)"
                                  : "scale(1)",
                              }}
                            >
                              {getFieldIcon("name")}
                            </Box>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputLabel-root": {
                          color: fieldFocus.name
                            ? "primary.main"
                            : "text.secondary",
                          fontWeight: 500,
                        },
                      }}
                    />
                  </Slide>
                )}

                <Slide direction="right" in={visible} timeout={1200}>
                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => handleFocus("email")}
                    onBlur={() => handleBlur("email")}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              color: fieldFocus.email
                                ? "primary.main"
                                : "text.secondary",
                              transition: "color 0.3s",
                              transform: fieldFocus.email
                                ? "scale(1.1)"
                                : "scale(1)",
                            }}
                          >
                            {getFieldIcon("email")}
                          </Box>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        color: fieldFocus.email
                          ? "primary.main"
                          : "text.secondary",
                        fontWeight: 500,
                      },
                    }}
                  />
                </Slide>

                <Slide direction="right" in={visible} timeout={1400}>
                  <TextField
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => handleFocus("password")}
                    onBlur={() => handleBlur("password")}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              color: fieldFocus.password
                                ? "primary.main"
                                : "text.secondary",
                              transition: "color 0.3s",
                              transform: fieldFocus.password
                                ? "scale(1.1)"
                                : "scale(1)",
                            }}
                          >
                            {getFieldIcon("password")}
                          </Box>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{
                              color: "text.secondary",
                              transition: "all 0.3s",
                              "&:hover": {
                                color: "primary.main",
                                transform: "scale(1.1)",
                              },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        color: fieldFocus.password
                          ? "primary.main"
                          : "text.secondary",
                        fontWeight: 500,
                      },
                    }}
                  />
                </Slide>

                <Slide direction="right" in={visible} timeout={1600}>
                  <Box>
                    {type === "signup" && (
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 1,
                            color: "text.secondary",
                            fontWeight: 500,
                            fontSize: "0.9rem",
                          }}
                        >
                          Select Your Role
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                          {roles.map((role) => (
                            <Chip
                              key={role.value}
                              icon={role.icon}
                              label={role.label}
                              onClick={() =>
                                setForm({ ...form, role: role.value })
                              }
                              variant={
                                form.role === role.value ? "filled" : "outlined"
                              }
                              sx={{
                                flex: 1,
                                height: 48,
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                transition:
                                  "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                cursor: "pointer",
                                border: `2px solid ${
                                  form.role === role.value
                                    ? role.color
                                    : "rgba(0,0,0,0.1)"
                                }`,
                                background:
                                  form.role === role.value
                                    ? `linear-gradient(135deg, ${role.color}15, ${role.color}25)`
                                    : isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
                                color:
                                  form.role === role.value
                                    ? role.color
                                    : isDark ? "rgba(255, 255, 255, 0.7)" : "text.secondary",
                                "&:hover": {
                                  transform: "translateY(-2px)",
                                  boxShadow: `0 8px 25px ${role.color}40`,
                                  background: isDark ? "rgba(255, 255, 255, 0.1)" : `linear-gradient(135deg, ${role.color}20, ${role.color}30)`,
                                },
                                "& .MuiChip-icon": {
                                  color: "inherit",
                                },
                              }}
                            />
                          ))}
                        </Box>
                        {selectedRole && (
                          <Fade in={true} timeout={500}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: selectedRole.color,
                                textAlign: "center",
                                fontSize: "0.85rem",
                                fontWeight: 500,
                                mb: 1,
                              }}
                            >
                              {selectedRole.description}
                            </Typography>
                          </Fade>
                        )}
                      </>
                    )}
                  </Box>
                </Slide>

                <Slide direction="up" in={visible} timeout={1800}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={submitAnimation}
                    sx={{
                      mt: 2,
                      py: 1.8,
                      borderRadius: 3,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      textTransform: "none",
                      letterSpacing: "0.5px",
                      background: submitAnimation
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      boxShadow: "0 8px 32px rgba(102, 126, 234, 0.4)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 12px 40px rgba(102, 126, 234, 0.5)",
                        background:
                          "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
                      },
                      "&:active": {
                        transform: "translateY(0)",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: submitAnimation ? "0%" : "-100%",
                        width: "100%",
                        height: "100%",
                        background:
                          "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                        transition: "left 0.8s ease-in-out",
                      },
                    }}
                  >
                    {submitAnimation ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            border: "2px solid rgba(255, 255, 255, 0.3)",
                            borderTop: "2px solid white",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            "@keyframes spin": {
                              "0%": { transform: "rotate(0deg)" },
                              "100%": { transform: "rotate(360deg)" },
                            },
                          }}
                        />
                        Processing...
                      </Box>
                    ) : (
                      `${type === "login" ? "Sign In" : "Create Account"}`
                    )}
                  </Button>
                </Slide>
                {/* Redirection text for signup */}
                {type === "signup" && (
                  <Box sx={{ mt: 2.5, textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", fontSize: "0.97rem" }}
                    >
                      Already have an account?{" "}
                      <a
                        href="/login"
                        style={{
                          color: isDark ? "#818cf8" : "#667eea",
                          textDecoration: "underline",
                          fontWeight: 500,
                        }}
                      >
                        Login here
                      </a>
                    </Typography>
                  </Box>
                )}
                {/* Redirection text for login */}
                {type === "login" && (
                  <Box sx={{ mt: 2.5, textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", fontSize: "0.97rem" }}
                    >
                      Don't have an account?{" "}
                      <a
                        href="/signup"
                        style={{
                          color: isDark ? "#818cf8" : "#667eea",
                          textDecoration: "underline",
                          fontWeight: 500,
                        }}
                      >
                        Create it now
                      </a>
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Slide>
        </Box>
      </Fade>
    </Box>
  );
}
