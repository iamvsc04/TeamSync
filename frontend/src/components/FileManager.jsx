import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Avatar,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../useAuth';

// File type icons mapping
const getFileIcon = (fileName) => {
  if (!fileName) return FileIcon;
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
      return ImageIcon;
    case 'pdf':
      return PdfIcon;
    case 'doc':
    case 'docx':
    case 'txt':
    case 'md':
    case 'rtf':
      return DocIcon;
    default:
      return FileIcon;
  }
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// File preview dialog
function FilePreviewDialog({ file, open, onClose }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!file) return null;

  const isImage = file.originalname?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  const isPdf = file.originalname?.match(/\.pdf$/i);

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError('Failed to load file preview');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">{file.originalname}</Typography>
            <Typography variant="body2" color="text.secondary">
              Uploaded by {file.uploader?.name || 'Unknown'} • {new Date(file.uploadedAt).toLocaleDateString()}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', minHeight: 400 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <Skeleton variant="rectangular" width="100%" height={400} />
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {isImage && (
            <img
              src={`http://localhost:5000/api/projects/${file.projectId}/documents/${file._id}/preview`}
              alt={file.originalname}
              style={{
                maxWidth: '100%',
                maxHeight: '600px',
                objectFit: 'contain',
                display: loading || error ? 'none' : 'block',
                margin: '0 auto'
              }}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {isPdf && (
            <iframe
              src={`http://localhost:5000/api/projects/${file.projectId}/documents/${file._id}/preview`}
              width="100%"
              height="600px"
              title={file.originalname}
              style={{ 
                display: loading || error ? 'none' : 'block',
                border: 'none'
              }}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {!isImage && !isPdf && !loading && !error && (
            <Box sx={{ py: 8 }}>
              <FileIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Preview not available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This file type cannot be previewed in the browser
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          startIcon={<DownloadIcon />}
          onClick={() => {
            const link = document.createElement('a');
            link.href = `http://localhost:5000/api/projects/${file.projectId}/documents/${file._id}/download`;
            link.download = file.originalname;
            link.click();
          }}
        >
          Download
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// Delete confirmation dialog
function DeleteConfirmDialog({ file, open, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(file);
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete File</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete "{file?.originalname}"? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button onClick={handleDelete} color="error" disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function FileManager({ projectId, files = [], onFileDeleted, viewMode = 'list' }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleMenuOpen = (event, file) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFile(null);
  };

  const handlePreview = (file) => {
    setSelectedFile(file);
    setPreviewOpen(true);
    handleMenuClose();
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/api/projects/${projectId}/documents/${file._id}/download`;
    link.download = file.originalname;
    link.click();
    handleMenuClose();
  };

  const handleDeleteClick = (file) => {
    setSelectedFile(file);
    setDeleteOpen(true);
    handleMenuClose();
  };

  const handleDelete = async (file) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/documents/${file._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      if (onFileDeleted) {
        onFileDeleted(file);
      }
    } catch (error) {
      throw error;
    }
  };

  if (!files || files.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No files uploaded
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload some files to see them here
        </Typography>
      </Paper>
    );
  }

  if (viewMode === 'grid') {
    return (
      <Box>
        <Grid container spacing={2}>
          {files.map((file) => {
            const IconComponent = getFileIcon(file.originalname);
            const isImage = file.originalname?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={file._id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => handlePreview(file)}
                >
                  <Box sx={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                    {isImage ? (
                      <img
                        src={`http://localhost:5000/api/projects/${projectId}/documents/${file._id}/preview`}
                        alt={file.originalname}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <Box
                      sx={{
                        display: isImage ? 'none' : 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        bgcolor: theme === 'dark' ? '#333' : '#f5f5f5',
                      }}
                    >
                      <IconComponent sx={{ fontSize: 48, color: 'primary.main' }} />
                    </Box>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 1)',
                        },
                      }}
                      size="small"
                      onClick={(e) => handleMenuOpen(e, file)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>
                  <CardContent sx={{ pb: 1 }}>
                    <Tooltip title={file.originalname}>
                      <Typography
                        variant="subtitle2"
                        noWrap
                        sx={{ fontWeight: 600 }}
                      >
                        {file.originalname}
                      </Typography>
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                      <Avatar sx={{ width: 20, height: 20 }}>
                        <PersonIcon sx={{ fontSize: 12 }} />
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {file.uploader?.name || 'Unknown'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </Typography>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handlePreview(selectedFile)}>
            <PreviewIcon sx={{ mr: 1 }} />
            Preview
          </MenuItem>
          <MenuItem onClick={() => handleDownload(selectedFile)}>
            <DownloadIcon sx={{ mr: 1 }} />
            Download
          </MenuItem>
          {user?.role === 'admin' && (
            <MenuItem onClick={() => handleDeleteClick(selectedFile)} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          )}
        </Menu>

        {/* Preview Dialog */}
        <FilePreviewDialog
          file={selectedFile}
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setSelectedFile(null);
          }}
        />

        {/* Delete Dialog */}
        <DeleteConfirmDialog
          file={selectedFile}
          open={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
            setSelectedFile(null);
          }}
          onConfirm={handleDelete}
        />
      </Box>
    );
  }

  // List view (default)
  return (
    <Box>
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Project Files ({files.length})
          </Typography>
        </Box>
        <Divider />
        <List>
          {files.map((file, index) => {
            const IconComponent = getFileIcon(file.originalname);
            return (
              <React.Fragment key={file._id}>
                <ListItem
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                  onClick={() => handlePreview(file)}
                >
                  <ListItemIcon>
                    <IconComponent color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{file.originalname}</Typography>
                        {file.size && (
                          <Chip
                            label={formatFileSize(file.size)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption">
                            {file.uploader?.name || 'Unknown'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuOpen(e, file)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < files.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handlePreview(selectedFile)}>
          <PreviewIcon sx={{ mr: 1 }} />
          Preview
        </MenuItem>
        <MenuItem onClick={() => handleDownload(selectedFile)}>
          <DownloadIcon sx={{ mr: 1 }} />
          Download
        </MenuItem>
        {user?.role === 'admin' && (
          <MenuItem onClick={() => handleDeleteClick(selectedFile)} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Preview Dialog */}
      <FilePreviewDialog
        file={selectedFile}
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedFile(null);
        }}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        file={selectedFile}
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedFile(null);
        }}
        onConfirm={handleDelete}
      />
    </Box>
  );
}