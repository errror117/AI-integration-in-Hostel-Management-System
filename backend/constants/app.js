/**
 * Application Constants
 * Centralized configuration for limits, timeouts, and magic numbers
 */

module.exports = {
    // Date and Time Limits
    DATES: {
        MAX_LEAVE_DAYS: 90,              // Maximum days for leave/mess-off
        TRIAL_PERIOD_DAYS: 14,           // Organization trial period
        PASSWORD_RESET_EXPIRY: 3600000,  // 1 hour in milliseconds
        SESSION_TIMEOUT: 86400000,       // 24 hours in milliseconds
        MAX_FUTURE_DAYS: 365,            // Max days in future for scheduling
    },

    // Pagination
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100,
        MIN_PAGE_SIZE: 5,
    },

    // String Length Limits
    STRING_LIMITS: {
        TITLE_MIN: 3,
        TITLE_MAX: 100,
        DESCRIPTION_MIN: 10,
        DESCRIPTION_MAX: 2000,
        NAME_MIN: 2,
        NAME_MAX: 100,
        EMAIL_MAX: 100,
        PHONE_LENGTH: 10,
        CNIC_LENGTH: 13,
        PASSWORD_MIN: 6,
        PASSWORD_MAX: 128,
    },

    // Organization Limits
    ORG_LIMITS: {
        FREE: {
            MAX_STUDENTS: 50,
            MAX_ADMINS: 2,
            MAX_HOSTELS: 1,
            STORAGE_MB: 100,
        },
        STARTER: {
            MAX_STUDENTS: 200,
            MAX_ADMINS: 5,
            MAX_HOSTELS: 3,
            STORAGE_MB: 500,
        },
        PROFESSIONAL: {
            MAX_STUDENTS: 1000,
            MAX_ADMINS: 20,
            MAX_HOSTELS: 10,
            STORAGE_MB: 5000,
        },
        ENTERPRISE: {
            MAX_STUDENTS: -1,  // Unlimited
            MAX_ADMINS: -1,    // Unlimited
            MAX_HOSTELS: -1,   // Unlimited
            STORAGE_MB: -1,    // Unlimited
        },
    },

    // File Upload Limits
    FILE_UPLOAD: {
        MAX_SIZE_MB: 5,
        MAX_SIZE_BYTES: 5 * 1024 * 1024,
        ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png'],
        ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
    },

    // Rate Limiting
    RATE_LIMITS: {
        LOGIN_ATTEMPTS: 5,
        LOGIN_WINDOW_MS: 900000,         // 15 minutes
        API_REQUESTS_PER_MIN: 100,
        API_WINDOW_MS: 60000,            // 1 minute
        PASSWORD_RESET_ATTEMPTS: 3,
        PASSWORD_RESET_WINDOW_MS: 3600000, // 1 hour
    },

    // Attendance
    ATTENDANCE: {
        MARK_BEFORE_HOURS: 24,           // Can mark attendance 24 hours before
        LATE_THRESHOLD_HOURS: 2,         // Consider late after 2 hours
    },

    // Invoice/Billing
    BILLING: {
        DUE_DAYS: 30,                    // Payment due in 30 days
        LATE_FEE_PERCENTAGE: 5,          // 5% late fee
        GRACE_PERIOD_DAYS: 7,            // 7-day grace period
    },

    // Mess Management
    MESS: {
        ADVANCE_BOOKING_DAYS: 7,         // Book mess-off 7 days in advance
        MIN_CANCEL_HOURS: 24,            // Cancel at least 24 hours before
        BILL_PER_DAY: 100,               // Daily mess charge (from mess.js)
    },

    // Complaint System  
    COMPLAINTS: {
        AUTO_CLOSE_DAYS: 30,             // Auto-close after 30 days
        ESCALATION_HOURS: 48,            // Escalate if not resolved in 48 hours
        MAX_ATTACHMENTS: 5,              // Maximum attachments per complaint
        PRIORITY_SCORE_MIN: 0,
        PRIORITY_SCORE_MAX: 100,
    },

    // Chatbot
    CHATBOT: {
        MAX_QUERY_LENGTH: 500,
        MIN_CONFIDENCE: 0.5,             // Minimum confidence for intent match
        HIGH_CONFIDENCE: 0.8,            // High confidence threshold
        MAX_CONTEXT_MESSAGES: 10,        // Remember last 10 messages
        RESPONSE_TIMEOUT_MS: 5000,       // 5 second timeout
    },

    // Security
    SECURITY: {
        BCRYPT_ROUNDS: 10,
        JWT_EXPIRY: '24h',
        REFRESH_TOKEN_EXPIRY: '7d',
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_DURATION_MS: 900000,     // 15 minutes
    },

    // Analytics
    ANALYTICS: {
        RETENTION_DAYS: 365,             // Keep analytics for 1 year
        AGGREGATION_INTERVAL_HOURS: 24,  // Daily aggregation
        TOP_ITEMS_LIMIT: 10,             // Show top 10 items
    },

    // Status Values
    STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected',
        SUSPENDED: 'suspended',
        CANCELLED: 'cancelled',
        TRIAL: 'trial',
    },

    // User Roles (Hierarchy: high to low)
    ROLES: {
        SUPER_ADMIN: 'super_admin',      // Platform administrator
        ORG_ADMIN: 'org_admin',          // Organization administrator
        SUB_ADMIN: 'sub_admin',          // Sub administrator (hostel warden)
        STUDENT: 'student',              // Regular student user
    },

    // Priority Levels
    PRIORITY: {
        CRITICAL: 'critical',
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low',
    },

    // HTTP Status Codes
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNPROCESSABLE: 422,
        TOO_MANY_REQUESTS: 429,
        SERVER_ERROR: 500,
    },

    // Error Messages
    ERRORS: {
        INVALID_ID: 'Invalid ID format',
        NOT_FOUND: 'Resource not found',
        UNAUTHORIZED: 'Unauthorized access',
        VALIDATION_FAILED: 'Validation failed',
        SERVER_ERROR: 'Internal server error',
        DUPLICATE_ENTRY: 'Duplicate entry',
        LIMIT_EXCEEDED: 'Limit exceeded',
    },
};
