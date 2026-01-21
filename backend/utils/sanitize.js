/**
 * Input Sanitization Middleware
 * Prevents NoSQL injection and XSS attacks
 */

/**
 * Sanitizes string inputs to prevent XSS
 * @param {string} input - User input string
 * @returns {string} - Sanitized string
 */
exports.sanitizeString = (input) => {
    if (typeof input !== 'string') return input;

    // Remove potential HTML/script tags
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
};

/**
 * Sanitizes object recursively
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
exports.sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            // Skip MongoDB operators and internal fields
            if (key.startsWith('$') || key.startsWith('_')) {
                continue;
            }

            const value = obj[key];

            if (typeof value === 'string') {
                sanitized[key] = exports.sanitizeString(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = exports.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
    }

    return sanitized;
};

/**
 * Middleware to sanitize request body
 */
exports.sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = exports.sanitizeObject(req.body);
    }
    next();
};

/**
 * Middleware to sanitize query parameters
 */
exports.sanitizeQuery = (req, res, next) => {
    if (req.query && typeof req.query === 'object') {
        req.query = exports.sanitizeObject(req.query);
    }
    next();
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {object} - {valid: boolean, email: string, error: string}
 */
exports.validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }

    const sanitized = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(sanitized)) {
        return { valid: false, error: 'Invalid email format' };
    }

    if (sanitized.length > 100) {
        return { valid: false, error: 'Email too long' };
    }

    return { valid: true, email: sanitized };
};

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {object} - {valid: boolean, error: string}
 */
exports.validateStringLength = (str, minLength = 1, maxLength = 1000, fieldName = 'Field') => {
    if (typeof str !== 'string') {
        return { valid: false, error: `${fieldName} must be a string` };
    }

    const trimmed = str.trim();

    if (trimmed.length < minLength) {
        return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }

    if (trimmed.length > maxLength) {
        return { valid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
    }

    return { valid: true };
};

/**
 * Validate array input
 * @param {array} arr - Array to validate
 * @param {number} minLength - Minimum array length
 * @param {number} maxLength - Maximum array length
 * @param {string} fieldName - Field name for error message
 * @returns {object} - {valid: boolean, error: string}
 */
exports.validateArray = (arr, minLength = 0, maxLength = 100, fieldName = 'Array') => {
    if (!Array.isArray(arr)) {
        return { valid: false, error: `${fieldName} must be an array` };
    }

    if (arr.length < minLength) {
        return { valid: false, error: `${fieldName} must have at least ${minLength} items` };
    }

    if (arr.length > maxLength) {
        return { valid: false, error: `${fieldName} cannot exceed ${maxLength} items` };
    }

    return { valid: true };
};

/**
 * Prevent prototype pollution
 * @param {object} obj - Object to check
 * @returns {boolean} - True if safe
 */
exports.isSafeObject = (obj) => {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    if (typeof obj !== 'object' || obj === null) return true;

    for (const key in obj) {
        if (dangerousKeys.includes(key.toLowerCase())) {
            return false;
        }

        if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (!exports.isSafeObject(obj[key])) {
                return false;
            }
        }
    }

    return true;
};
