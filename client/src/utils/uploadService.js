// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Generic file upload function
 * @param {string} endpoint - Upload endpoint (e.g., '/upload/profile')
 * @param {File|File[]} files - File or array of files to upload
 * @param {string} fieldName - Form field name (e.g., 'profilePicture', 'attachments')
 * @param {object} additionalData - Optional additional form data
 * @returns {Promise} - Upload response
 */
export const uploadFile = async (endpoint, files, fieldName, additionalData = {}) => {
    try {
        // Create FormData object
        const formData = new FormData();

        // Add files to FormData
        if (Array.isArray(files)) {
            // Multiple files
            files.forEach(file => {
                formData.append(fieldName, file);
            });
        } else {
            // Single file
            formData.append(fieldName, files);
        }

        // Add any additional data
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        // Get auth token from localStorage
        const token = localStorage.getItem('token');

        // Make upload request
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        return data;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};

/**
 * Upload profile picture
 * @param {File} file - Image file
 * @returns {Promise} - Upload response with fileUrl
 */
export const uploadProfilePicture = async (file) => {
    return uploadFile('/upload/profile', file, 'profilePicture');
};

/**
 * Upload complaint attachments
 * @param {File[]} files - Array of image files (max 5)
 * @returns {Promise} - Upload response with file URLs array
 */
export const uploadComplaintAttachments = async (files) => {
    return uploadFile('/upload/complaint', files, 'attachments');
};

/**
 * Upload document
 * @param {File} file - Document file (PDF, Excel, etc.)
 * @returns {Promise} - Upload response with fileUrl
 */
export const uploadDocument = async (file) => {
    return uploadFile('/upload/document', file, 'document');
};

/**
 * Upload bulk students Excel file
 * @param {File} file - Excel file
 * @returns {Promise} - Upload response
 */
export const uploadBulkStudents = async (file) => {
    return uploadFile('/upload/bulk-students', file, 'studentFile');
};

export default {
    uploadFile,
    uploadProfilePicture,
    uploadComplaintAttachments,
    uploadDocument,
    uploadBulkStudents
};
