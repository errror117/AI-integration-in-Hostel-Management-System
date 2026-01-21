/**
 * Input Validation Middleware
 * Common validation rules for routes
 */

const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg
            }))
        });
    }
    next();
};

// Common validation rules
const validators = {
    // Email validation
    email: body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    // Password validation
    password: body('password')
        .trim()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),

    // Complaint validation
    complaint: {
        title: body('title')
            .trim()
            .isLength({ min: 5, max: 200 })
            .withMessage('Title must be between 5 and 200 characters'),
        description: body('description')
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Description must be between 10 and 1000 characters'),
        type: body('type')
            .optional()
            .isIn(['WiFi/Internet', 'Electrical', 'Plumbing', 'Mess/Food', 'Cleanliness', 'AC/Heating', 'General', 'Security', 'Maintenance'])
            .withMessage('Invalid complaint type')
    },

    // Leave request validation
    leave: {
        type: body('type')
            .isIn(['overnight', 'weekend', 'long_leave', 'late_night'])
            .withMessage('Invalid leave type'),
        reason: body('reason')
            .trim()
            .isLength({ min: 5, max: 500 })
            .withMessage('Reason must be between 5 and 500 characters'),
        startDate: body('startDate')
            .isISO8601()
            .withMessage('Invalid start date format'),
        endDate: body('endDate')
            .isISO8601()
            .withMessage('Invalid end date format')
    },

    // Suggestion validation
    suggestion: {
        title: body('title')
            .trim()
            .isLength({ min: 5, max: 200 })
            .withMessage('Title must be between 5 and 200 characters'),
        description: body('description')
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Description must be between 10 and 1000 characters')
    },

    // MongoDB ObjectId validation
    objectId: (paramName = 'id') => param(paramName)
        .isMongoId()
        .withMessage('Invalid ID format'),

    // Chatbot message validation
    chatbot: {
        query: body('query')
            .trim()
            .isLength({ min: 1, max: 500 })
            .withMessage('Query must be between 1 and 500 characters')
    }
};

module.exports = {
    validators,
    handleValidationErrors
};
