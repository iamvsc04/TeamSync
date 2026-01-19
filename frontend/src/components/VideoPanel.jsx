import React from "react";
import { Box, Typography } from "@mui/material";

// Minimal video panel stub. For now renders an iframe to the provided link.
export default function VideoPanel({ link }) {
  if (!link) {
    return (
      <Typography variant="body2" color="text.secondary">
        No video link provided.
      </Typography>
    );
  }
  return (
    <Box sx={{ position: "relative", width: "100%", pt: "56.25%" }}>
      <Box sx={{ position: "absolute", inset: 0 }}>
        <iframe
          title="Video Conference"
          src={link}
          style={{ border: 0, width: "100%", height: "100%" }}
          allow="camera; microphone; fullscreen; display-capture;"
        />
      </Box>
    </Box>
  );
}
