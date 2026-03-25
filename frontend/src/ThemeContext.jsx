import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.className = theme; // Set class on body for CSS variables
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: theme,
      primary: {
        main: '#6366f1',
      },
      secondary: {
        main: '#ec4899',
      },
      background: {
        default: theme === 'dark' ? '#0f172a' : '#f8fafc',
        paper: theme === 'dark' ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: theme === 'dark' ? '#f8fafc' : '#1e293b',
        secondary: theme === 'dark' ? '#94a3b8' : '#64748b',
      },
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      h1: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
      h2: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
      h3: { fontFamily: "'Outfit', sans-serif", fontWeight: 800 },
      h4: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
      h5: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
      h6: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none', // Remove MUI's default dark mode overlay
          },
        },
      },
    },
  }), [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MUIThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
