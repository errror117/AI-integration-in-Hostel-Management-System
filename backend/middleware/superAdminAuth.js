const User = require('../models/User');

// Middleware to check if user is super admin
exports.isSuperAdmin = async (req, res, next) => {
    try {
        // Check if user exists (should be set by auth middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Get user from database to check role
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has super_admin role
        if (user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin privileges required.'
            });
        }

        // User is super admin, proceed
        req.superAdmin = user;
        next();
    } catch (error) {
        console.error('Super Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authorization failed',
            error: error.message
        });
    }
};

// Optional: Middleware to log super admin actions
exports.logSuperAdminAction = (action) => {
    return (req, res, next) => {
        console.log(`[SUPER ADMIN] ${req.user?.name || 'Unknown'} - ${action} - ${new Date().toISOString()}`);
        next();
    };
};
