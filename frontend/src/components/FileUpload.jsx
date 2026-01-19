import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AttachFile as AttachIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '../ThemeContext';

// File type icons mapping
const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return ImageIcon;
    case 'pdf':
      return PdfIcon;
    case 'doc':
    case 'docx':
    case 'txt':
      return DocIcon;
    default:
      return FileIcon;
  }
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// File preview component
function FilePreview({ file, open, onClose }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isImage = file && file.originalname?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = file && file.originalname?.match(/\.pdf$/i);
  const isText = file && file.originalname?.match(/\.(txt|md)$/i);

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError('Failed to load file preview');
  };

  if (!file) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{file.originalname}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', minHeight: 200 }}>
          {loading && <CircularProgress sx={{ mt: 4 }} />}
          
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
                maxHeight: '500px',
                objectFit: 'contain',
                display: loading ? 'none' : 'block'
              }}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {isPdf && (
            <iframe
              src={`http://localhost:5000/api/projects/${file.projectId}/documents/${file._id}/preview`}
              width="100%"
              height="500px"
              title={file.originalname}
              style={{ display: loading ? 'none' : 'block' }}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {!isImage && !isPdf && !loading && !error && (
            <Box sx={{ py: 4 }}>
              <FileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Preview not available for this file type
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click download to view the file
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

export default function FileUpload({ 
  projectId, 
  onUploadSuccess, 
  maxFiles = 5, 
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [
    'image/*',
    'application/pdf',
    '.doc',
    '.docx',
    '.txt',
    '.md',
    '.csv',
    '.xlsx',
    '.xls'
  ]
}) {
  const { theme } = useTheme();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles) => {
    setError('');
    const validFiles = [];
    const errors = [];

    newFiles.forEach(file => {
      // Check file count
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max ${formatFileSize(maxFileSize)})`);
        return;
      }

      // Check if file already exists
      if (files.some(f => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name}: File already selected`);
        return;
      }

      validFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        error: null,
        uploaded: false
      });
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        if (fileData.uploaded) continue;

        const formData = new FormData();
        formData.append('file', fileData.file);

        try {
          // Update progress
          setFiles(prev => prev.map(f => 
            f.id === fileData.id ? { ...f, progress: 0 } : f
          ));

          const response = await fetch(`http://localhost:5000/api/projects/${projectId}/documents`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
          }

          const result = await response.json();
          
          // Mark as uploaded
          setFiles(prev => prev.map(f => 
            f.id === fileData.id ? { ...f, progress: 100, uploaded: true, error: null } : f
          ));

          if (onUploadSuccess) {
            onUploadSuccess(result);
          }

        } catch (error) {
          setFiles(prev => prev.map(f => 
            f.id === fileData.id ? { ...f, error: error.message, progress: 0 } : f
          ));
        }
      }
    } catch (error) {
      setError('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setError('');
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  return (
    <Box>
      {/* Drop Zone */}
      <Paper
        sx={{
          p: 3,
          border: `2px dashed ${dragActive ? 'primary.main' : 'grey.400'}`,
          bgcolor: dragActive 
            ? (theme === 'dark' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)')
            : (theme === 'dark' ? '#2d2d2d' : '#fafafa'),
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme === 'dark' ? '#3d3d3d' : '#f0f0f0',
          }
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          style={{ display: 'none' }}
        />
        
        <Box sx={{ textAlign: 'center' }}>
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {dragActive ? 'Drop files here' : 'Drag & drop files here'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            or click to browse files
          </Typography>
          <Button variant="outlined" startIcon={<AttachIcon />}>
            Choose Files
          </Button>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Max {maxFiles} files • {formatFileSize(maxFileSize)} per file
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Paper sx={{ mt: 2 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Selected Files ({files.length}/{maxFiles})
            </Typography>
            <Box>
              <Button onClick={clearFiles} size="small" sx={{ mr: 1 }}>
                Clear All
              </Button>
              <Button
                variant="contained"
                onClick={uploadFiles}
                disabled={uploading || files.every(f => f.uploaded)}
                startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </Box>
          </Box>
          <Divider />
          <List>
            {files.map((fileData) => {
              const IconComponent = getFileIcon(fileData.file.name);
              return (
                <ListItem key={fileData.id}>
                  <ListItemIcon>
                    <IconComponent color={fileData.uploaded ? 'success' : 'primary'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{fileData.file.name}</Typography>
                        {fileData.uploaded && <Chip label="Uploaded" size="small" color="success" />}
                        {fileData.error && <Chip label="Failed" size="small" color="error" />}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption">
                          {formatFileSize(fileData.file.size)}
                        </Typography>
                        {fileData.error && (
                          <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                            • {fileData.error}
                          </Typography>
                        )}
                        {fileData.progress > 0 && fileData.progress < 100 && (
                          <LinearProgress
                            variant="determinate"
                            value={fileData.progress}
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {fileData.uploaded && (
                        <Tooltip title="Preview">
                          <IconButton 
                            size="small" 
                            onClick={() => handlePreview(fileData)}
                          >
                            <PreviewIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Remove">
                        <IconButton 
                          size="small" 
                          onClick={() => removeFile(fileData.id)}
                          disabled={uploading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

      {/* File Preview Dialog */}
      <FilePreview
        file={previewFile}
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewFile(null);
        }}
      />
    </Box>
  );
}