import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Stack,
} from "@mui/material";

// Placeholder global search across tasks/projects/meetings
export default function GlobalSearch({ onSelect }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const runSearch = async (nextPage = 1) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/search?q=${encodeURIComponent(
          q
        )}&scope=${scope}&limit=${limit}&page=${nextPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      const out = [];
      (data.results?.projects || []).forEach((p) =>
        out.push({
          title: p.name,
          meta: `Project • ${p.status || "active"}`,
          kind: "project",
          id: p._id,
        })
      );
      (data.results?.tasks || []).forEach((t) =>
        out.push({
          title: t.title,
          meta: `Task • ${t.project?.name || ""}`,
          kind: "task",
          id: t._id,
        })
      );
      (data.results?.meetings || []).forEach((m) =>
        out.push({
          title: m.title,
          meta: `Meeting • ${m.project?.name || ""}`,
          kind: "meeting",
          id: m._id,
        })
      );
      setResults(out);
      setPage(data.page || nextPage);
    } catch (e) {
      setResults([
        { title: "Search failed", meta: "Please try again", kind: "error" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        Global Search
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search tasks, projects, meetings..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
        />
      </Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Scope</InputLabel>
          <Select
            label="Scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="projects">Projects</MenuItem>
            <MenuItem value="tasks">Tasks</MenuItem>
            <MenuItem value="meetings">Meetings</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Page size</InputLabel>
          <Select
            label="Page size"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={() => runSearch(1)}>
          Search
        </Button>
        <Button
          variant="outlined"
          onClick={() => runSearch(Math.max(page - 1, 1))}
          disabled={page <= 1}
        >
          Prev
        </Button>
        <Button variant="outlined" onClick={() => runSearch(page + 1)}>
          Next
        </Button>
      </Stack>
      <List>
        {results.map((r, i) => (
          <ListItem key={i} button onClick={() => onSelect && onSelect(r)}>
            <ListItemText
              primary={<Typography fontWeight={600}>{r.title}</Typography>}
              secondary={<Typography variant="caption">{r.meta}</Typography>}
            />
          </ListItem>
        ))}
      </List>
      {loading && (
        <Typography variant="caption" color="text.secondary">
          Searching…
        </Typography>
      )}
    </Paper>
  );
}
