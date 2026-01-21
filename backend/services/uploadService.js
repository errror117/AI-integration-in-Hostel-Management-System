const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * File Upload Service
 * Handles file uploads for the hostel management system
 * Supports: Images, PDFs, Excel files
 */

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '..', 'uploads');
const dirs = ['profiles', 'complaints', 'documents', 'temp'];

dirs.forEach(dir => {
    const dirPath = path.join(uploadDir, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// File type validators
const fileFilters = {
    image: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mime = allowedTypes.test(file.mimetype);

        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'), false);
        }
    },

    document: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|xls|xlsx/;
        const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (ext) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, XLS, XLSX files are allowed!'), false);
        }
    },

    any: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx/;
        const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (ext) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed!'), false);
        }
    }
};

// Storage configuration for profile pictures
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(uploadDir, 'profiles'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Storage configuration for complaint attachments
const complaintStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(uploadDir, 'complaints'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `complaint-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Storage configuration for documents
const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(uploadDir, 'documents'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `doc-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File size limits (in bytes)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default

// Multer instances for different upload types
const uploaders = {
    // Profile picture upload (single image, max 2MB)
    profile: multer({
        storage: profileStorage,
        limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
        fileFilter: fileFilters.image
    }),

    // Complaint attachments (multiple images, max 5MB each)
    complaint: multer({
        storage: complaintStorage,
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: fileFilters.image
    }),

    // Document upload (single file, max 10MB)
    document: multer({
        storage: documentStorage,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
        fileFilter: fileFilters.document
    }),

    // Any file type (for bulk imports, etc.)
    any: multer({
        storage: documentStorage,
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: fileFilters.any
    })
};

/**
 * Helper function to delete a file
 */
function deleteFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

/**
 * Helper function to get file URL
 */
function getFileUrl(filename, type = 'profiles') {
    if (!filename) return null;
    return `/uploads/${type}/${filename}`;
}

/**
 * Helper function to validate image dimensions
 */
async function validateImageDimensions(filePath, maxWidth = 2000, maxHeight = 2000) {
    // This would require sharp or jimp library
    // For now, just return true
    return true;
}

/**
 * Middleware to handle upload errors
 */
function handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 5MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files. Maximum is 5 files.'
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }

    next();
}

module.exports = {
    uploaders,
    deleteFile,
    getFileUrl,
    validateImageDimensions,
    handleUploadError,
    uploadDir
};
