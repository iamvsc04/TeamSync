const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Multer storage backed by Cloudinary.
 * - Documents are stored under the "teamsync/projects" folder.
 * - resource_type: 'auto'  → handles images, PDFs, Word docs, CSVs, etc.
 * - After upload, req.files[n].path  = CDN URL (use for preview/download)
 *                 req.files[n].filename = public_id (use for deletion)
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'teamsync/projects',
    resource_type: 'auto',
    // Preserve the original filename (without extension) as the public_id suffix
    public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
    // Allow a broad set of file types
    allowed_formats: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
      'pdf',
      'doc', 'docx',
      'xls', 'xlsx',
      'ppt', 'pptx',
      'txt', 'md', 'csv',
    ],
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/**
 * Delete a file from Cloudinary by its public_id.
 * resource_type must match how it was uploaded ('image' or 'raw').
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
}

module.exports = { upload, cloudinary, deleteFromCloudinary };
