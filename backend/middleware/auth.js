const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
exports.protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user ID from token (supports both 'id' and 'userId' fields)
        const userId = decoded.userId || decoded.id;

        // Try to find user - check User model first (for super_admin), then Student, then Admin
        let user = await User.findById(userId).select('-password');

        if (!user) {
            user = await Student.findById(userId).select('-password');
        }

        if (!user) {
            user = await Admin.findById(userId).select('-password');
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Attach user to request with proper role
        req.user = user;
        req.user.id = userId; // Ensure consistent ID field

        // Set role from user object or decoded token
        if (user.role) {
            req.user.role = user.role; // From User model (super_admin, etc.)
        } else {
            req.user.role = user.email ? 'student' : 'admin'; // Legacy detection
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

/**
 * Admin-only middleware
 */
exports.adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

/**
 * Optional auth - doesn't fail if no token
 * Useful for public routes that can show extra info if authenticated
 */
exports.optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            let user = await Student.findById(decoded.id).select('-password');

            if (!user) {
                user = await Admin.findById(decoded.id).select('-password');
            }

            if (user) {
                req.user = user;
                req.user.role = user.email ? 'student' : 'admin';
            }
        } catch (error) {
            // Token invalid, but continue anyway
        }
    }

    next();
};
