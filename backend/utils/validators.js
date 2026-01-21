// Validation Helper Functions
const mongoose = require('mongoose');

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId
 */
exports.isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validates if a date is valid and not null/undefined
 * @param {Date|string} date - The date to validate
 * @returns {boolean} - True if valid date
 */
exports.isValidDate = (date) => {
    if (!date) return false;
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate);
};

/**
 * Validates if a date range is valid (start before end)
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {object} - { valid: boolean, error: string }
 */
exports.validateDateRange = (startDate, endDate) => {
    if (!exports.isValidDate(startDate)) {
        return { valid: false, error: 'Invalid start date' };
    }

    if (!exports.isValidDate(endDate)) {
        return { valid: false, error: 'Invalid end date' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        return { valid: false, error: 'Start date must be before end date' };
    }

    // Check if date range is not too long (max 90 days for mess-off)
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
        return { valid: false, error: 'Date range cannot exceed 90 days' };
    }

    return { valid: true };
};

/**
 * Validates if a date is not in the past
 * @param {Date|string} date - The date to validate
 * @param {boolean} allowToday - Allow today's date
 * @returns {object} - { valid: boolean, error: string }
 */
exports.validateFutureDate = (date, allowToday = false) => {
    if (!exports.isValidDate(date)) {
        return { valid: false, error: 'Invalid date' };
    }

    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day

    if (allowToday) {
        if (inputDate < today) {
            return { valid: false, error: 'Date cannot be in the past' };
        }
    } else {
        if (inputDate <= today) {
            return { valid: false, error: 'Date must be in the future' };
        }
    }

    return { valid: true };
};

/**
 * Checks if a record exists in the database
 * @param {Model} Model - Mongoose model
 * @param {string} id - Record ID
 * @param {string} organizationId - Organization ID for multi-tenancy
 * @returns {Promise<object>} - { exists: boolean, record: object, error: string }
 */
exports.checkRecordExists = async (Model, id, organizationId = null) => {
    if (!exports.isValidObjectId(id)) {
        return { exists: false, error: 'Invalid ID format' };
    }

    try {
        const query = { _id: id };
        if (organizationId) {
            query.organizationId = organizationId;
        }

        const record = await Model.findOne(query).lean();

        if (!record) {
            return { exists: false, error: `${Model.modelName} not found` };
        }

        return { exists: true, record };
    } catch (error) {
        return { exists: false, error: `Database error: ${error.message}` };
    }
};

/**
 * Standardized error response format
 * @param {boolean} success - Success status
 * @param {string} message - Error message
 * @param {Array|Object} errors - Detailed errors
 * @param {number} statusCode - HTTP status code (optional)
 * @returns {object} - Standardized error object
 */
exports.errorResponse = (success = false, message, errors = null, statusCode = 400) => {
    const response = {
        success,
        message,
        timestamp: new Date().toISOString()
    };

    if (errors) {
        response.errors = Array.isArray(errors) ? errors : [errors];
    }

    if (statusCode) {
        response.statusCode = statusCode;
    }

    return response;
};

/**
 * Standardized success response format
 * @param {object} data - Response data
 * @param {string} message - Success message
 * @returns {object} - Standardized success object
 */
exports.successResponse = (data, message = 'Success') => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};
