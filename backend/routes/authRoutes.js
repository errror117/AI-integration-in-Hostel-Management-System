const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { login, changePassword, verifySession } = require('../controllers/authController');
const { sendEmail } = require('../utils/emailService');
const { createInitialSuperAdmin } = require('../controllers/setupController');
const User = require('../models/User');

// @route   POST api/auth/setup-superadmin
// @desc    Create initial super admin (ONE-TIME SETUP)
// @access  Public (will be disabled after first super admin is created)
router.post('/setup-superadmin', createInitialSuperAdmin);


// @route   POST api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').not().isEmpty()
], login);

// @route   POST api/auth/change-password
// @desc    Change password
// @access  Private
router.post('/change-password', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Old password is required').isLength({ min: 8 }),
    check('newPassword', 'New password of more than 8 character is required').isLength({ min: 8 })
], changePassword);

// @route   POST api/auth/verifysession
// @desc    Verify session
// @access  public
router.post('/verifysession', [
    check('token', 'Token is required').not().isEmpty()
], verifySession);

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
    check('email', 'Please include a valid email').isEmail()
], async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });

        // Always return success (security: don't reveal if email exists)
        if (!user) {
            return res.json({
                success: true,
                message: 'If this email is registered, a reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Get user name (try to get from student record)
        const Student = require('../models/Student');
        const student = await Student.findOne({ email });
        const userName = student ? student.name : email.split('@')[0];

        // Send email
        await sendEmail(email, 'passwordReset', userName, resetToken);

        res.json({
            success: true,
            message: 'If this email is registered, a reset link has been sent'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error. Please try again later.'
        });
    }
});

// @route   POST api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
    check('token', 'Token is required').not().isEmpty(),
    check('newPassword', 'Password must be at least 8 characters').isLength({ min: 8 })
], async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Find user with valid token
        const user = await User.findOne({
            resetToken: token,
            resetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset fields
        user.resetToken = undefined;
        user.resetExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error. Please try again later.'
        });
    }
});

module.exports = router;
