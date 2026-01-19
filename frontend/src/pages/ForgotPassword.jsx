import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { useTheme } from "../ThemeContext";

export default function ForgotPassword() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    setLoading(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setMsg(
        "If that account exists, we sent a reset link. (Dev token in response)"
      );
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme === "dark" ? "#1a1a1a" : "#f5f5f5",
      }}
    >
      <Paper
        sx={{
          p: 4,
          width: 400,
          bgcolor: theme === "dark" ? "#2d2d2d" : "#fff",
        }}
      >
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Forgot Password
        </Typography>
        {msg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {msg}
          </Alert>
        )}
        {err && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {err}
          </Alert>
        )}
        <TextField
          label="Email"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={submit}
          disabled={loading || !email}
        >
          Send Reset Link
        </Button>
      </Paper>
    </Box>
  );
}
