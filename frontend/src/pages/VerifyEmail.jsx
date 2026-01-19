import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Container
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useTheme } from '../ThemeContext';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/verify-email/${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Email verified successfully! You can now log in to your account.');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to verify email. The link may be expired or invalid.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
      console.error('Email verification error:', error);
    }
  };

  const handleResendVerification = () => {
    // Navigate to login with a message to resend
    navigate('/login?resendVerification=true');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            textAlign: 'center',
            bgcolor: theme === 'dark' ? '#2d2d2d' : '#fff',
            maxWidth: 500,
            width: '100%',
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                color: '#1976d2',
                mb: 2,
              }}
            >
              TeamSync
            </Typography>
            <Typography variant="h5" gutterBottom>
              Email Verification
            </Typography>
          </Box>

          {status === 'verifying' && (
            <Box sx={{ py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>
                Verifying your email...
              </Typography>
              <Typography color="text.secondary">
                Please wait while we verify your email address.
              </Typography>
            </Box>
          )}

          {status === 'success' && (
            <Box sx={{ py: 4 }}>
              <CheckCircleIcon
                sx={{
                  fontSize: 80,
                  color: 'success.main',
                  mb: 3,
                }}
              />
              <Typography variant="h6" color="success.main" gutterBottom>
                Email Verified Successfully!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {message}
              </Typography>
              <Alert severity="success" sx={{ mb: 3 }}>
                Redirecting to login page in 3 seconds...
              </Alert>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ borderRadius: 2 }}
              >
                Go to Login
              </Button>
            </Box>
          )}

          {status === 'error' && (
            <Box sx={{ py: 4 }}>
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 3,
                }}
              />
              <Typography variant="h6" color="error.main" gutterBottom>
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                {message}
              </Alert>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={handleResendVerification}
                  sx={{ borderRadius: 2 }}
                >
                  Resend Verification
                </Button>
                <Button
                  variant="contained"
                  component={Link}
                  to="/login"
                  sx={{ borderRadius: 2 }}
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}