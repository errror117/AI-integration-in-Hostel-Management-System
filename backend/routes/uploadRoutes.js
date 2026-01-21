// Import required modules
const express = require('express');
const router = express.Router();
const { uploaders, handleUploadError, getFileUrl } = require('../services/uploadService');
const { protect: authenticateToken } = require('../middleware/authMiddleware');
const Student = require('../models/Student');
const User = require('../models/User');
const Admin = require('../models/Admin');

// ==================================================================
// ROUTE 1: Upload Profile Picture
// ==================================================================
// Endpoint: POST /api/upload/profile
// Purpose: Allow users to upload their profile picture
// Access: Private (requires login)
// File: Single image file (max 2MB)

router.post('/profile',
    authenticateToken, // Step 1: Verify user is logged in
    (req, res, next) => {
        // Step 2: Handle file upload with error checking
        uploaders.profile.single('profilePicture')(req, res, (err) => {
            if (err) {
                return handleUploadError(err, req, res, next);
            }
            next();
        });
    },
    async (req, res) => {
        // Step 3: Process the uploaded file
        try {
            // Check if file was actually uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            // Get user information
            const userId = req.user.id;
            const role = req.user.role;
            const profilePictureUrl = getFileUrl(req.file.filename, 'profiles');

            // Update profile picture in database based on user role
            if (role === 'student') {
                await Student.findOneAndUpdate(
                    { user: userId },
                    { profilePicture: profilePictureUrl },
                    { new: true }
                );
            } else if (role === 'org_admin' || role === 'sub_admin') {
                await Admin.findOneAndUpdate(
                    { user: userId },
                    { profilePicture: profilePictureUrl },
                    { new: true }
                );
            }

            // Send success response
            res.json({
                success: true,
                message: 'Profile picture uploaded successfully',
                fileUrl: profilePictureUrl,
                filename: req.file.filename
            });
        } catch (error) {
            console.error('Profile upload error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload profile picture'
            });
        }
    }
);

// ==================================================================
// ROUTE 2: Upload Complaint Attachments
// ==================================================================
// Endpoint: POST /api/upload/complaint
// Purpose: Allow users to attach images to complaints
// Access: Private (requires login)
// Files: Multiple images (max 5 files, 5MB each)

router.post('/complaint',
    authenticateToken, // Step 1: Verify user is logged in
    (req, res, next) => {
        // Step 2: Handle multiple file upload with error checking
        uploaders.complaint.array('attachments', 5)(req, res, (err) => {
            if (err) {
                return handleUploadError(err, req, res, next);
            }
            next();
        });
    },
    async (req, res) => {
        // Step 3: Process the uploaded files
        try {
            // Check if files were actually uploaded
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No files uploaded'
                });
            }

            // Generate URLs for all uploaded files
            const fileUrls = req.files.map(file => getFileUrl(file.filename, 'complaints'));

            // Send success response with file URLs
            res.json({
                success: true,
                message: `${req.files.length} file(s) uploaded successfully`,
                files: fileUrls,
                count: req.files.length
            });
        } catch (error) {
            console.error('Complaint upload error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload complaint attachments'
            });
        }
    }
);

// ==================================================================
// ROUTE 3: Upload Document
// ==================================================================
// Endpoint: POST /api/upload/document
// Purpose: Allow admins to upload documents (PDF, Excel, etc.)
// Access: Private (requires login - typically for admins)
// File: Single document file (max 10MB)

router.post('/document',
    authenticateToken, // Step 1: Verify user is logged in
    (req, res, next) => {
        // Step 2: Handle document upload with error checking
        uploaders.document.single('document')(req, res, (err) => {
            if (err) {
                return handleUploadError(err, req, res, next);
            }
            next();
        });
    },
    async (req, res) => {
        // Step 3: Process the uploaded document
        try {
            // Check if document was actually uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            // Generate URL for the uploaded document
            const documentUrl = getFileUrl(req.file.filename, 'documents');

            // Send success response
            res.json({
                success: true,
                message: 'Document uploaded successfully',
                fileUrl: documentUrl,
                filename: req.file.filename,
                originalName: req.file.originalname
            });
        } catch (error) {
            console.error('Document upload error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload document'
            });
        }
    }
);

// ==================================================================
// ROUTE 4: Bulk Student Upload
// ==================================================================
// Endpoint: POST /api/upload/bulk-students
// Purpose: Allow admins to upload Excel file for bulk student import
// Access: Private (Admin only)
// File: Single Excel file (max 5MB)

router.post('/bulk-students',
    authenticateToken, // Step 1: Verify user is logged in
    (req, res, next) => {
        // Step 2: Handle Excel file upload with error checking
        uploaders.any.single('studentFile')(req, res, (err) => {
            if (err) {
                return handleUploadError(err, req, res, next);
            }
            next();
        });
    },
    async (req, res) => {
        // Step 3: Process the uploaded Excel file
        try {
            // Check if user is an admin
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. Admin only.'
                });
            }

            // Check if file was actually uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            // TODO: Parse the Excel file and import students
            // For now, just acknowledge receipt

            // Send success response
            res.json({
                success: true,
                message: 'File uploaded successfully. Processing...',
                filename: req.file.filename,
                originalName: req.file.originalname,
                note: 'Bulk import feature will be implemented next'
            });
        } catch (error) {
            console.error('Bulk upload error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload file'
            });
        }
    }
);

// Export the router to be used in the main app
module.exports = router;
