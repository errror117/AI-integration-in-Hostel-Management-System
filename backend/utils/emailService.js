/**
 * Email Notification Service
 * Sends automated emails for complaints, leave requests, and password resets
 */

const nodemailer = require('nodemailer');

// Create transporter (configure based on your email provider)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Email templates
const templates = {
    complaintRegistered: (name, complaintId, priority) => ({
        subject: '✅ Complaint Registered - Hostel Management',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2196F3;">Complaint Registered Successfully</h2>
                <p>Hi <strong>${name}</strong>,</p>
                <p>Your complaint has been registered and our team will look into it.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Complaint ID:</strong> #${complaintId}</p>
                    <p><strong>Priority Score:</strong> ${priority}/100</p>
                    <p><strong>Status:</strong> Pending Review</p>
                </div>
                
                <p>We'll notify you once there's an update.</p>
                <p style="color: #666; font-size: 12px;">- Hostel Management Team</p>
            </div>
        `
    }),

    complaintResolved: (name, complaintId, title) => ({
        subject: '🎉 Complaint Resolved - Hostel Management',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4CAF50;">Complaint Resolved!</h2>
                <p>Hi <strong>${name}</strong>,</p>
                <p>Good news! Your complaint has been resolved.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Complaint ID:</strong> #${complaintId}</p>
                    <p><strong>Issue:</strong> ${title}</p>
                    <p><strong>Status:</strong> ✅ Resolved</p>
                </div>
                
                <p>Thank you for your patience!</p>
                <p style="color: #666; font-size: 12px;">- Hostel Management Team</p>
            </div>
        `
    }),

    leaveApproved: (name, leaveType, startDate, endDate) => ({
        subject: '✅ Leave Request Approved - Hostel Management',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4CAF50;">Leave Request Approved</h2>
                <p>Hi <strong>${name}</strong>,</p>
                <p>Your leave request has been approved.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Type:</strong> ${leaveType}</p>
                    <p><strong>From:</strong> ${startDate}</p>
                    <p><strong>To:</strong> ${endDate}</p>
                    <p><strong>Status:</strong> ✅ Approved</p>
                </div>
                
                <p>Have a safe trip!</p>
                <p style="color: #666; font-size: 12px;">- Hostel Management Team</p>
            </div>
        `
    }),

    leaveRejected: (name, leaveType, reason) => ({
        subject: '❌ Leave Request Rejected - Hostel Management',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f44336;">Leave Request Rejected</h2>
                <p>Hi <strong>${name}</strong>,</p>
                <p>We regret to inform you that your leave request has been rejected.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Type:</strong> ${leaveType}</p>
                    <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
                </div>
                
                <p>Please contact the hostel office for more information.</p>
                <p style="color: #666; font-size: 12px;">- Hostel Management Team</p>
            </div>
        `
    }),

    passwordReset: (name, resetToken) => ({
        subject: '🔑 Password Reset Request - Hostel Management',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #FF9800;">Password Reset Request</h2>
                <p>Hi <strong>${name}</strong>,</p>
                <p>We received a request to reset your password.</p>
                
                <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FF9800;">
                    <p><strong>Reset Token:</strong></p>
                    <p style="font-family: monospace; font-size: 16px; background: #fff; padding: 10px; border-radius: 3px;">${resetToken}</p>
                </div>
                
                <p>This token will expire in <strong>1 hour</strong>.</p>
                <p>If you didn't request this, please ignore this email.</p>
                
                <p style="color: #666; font-size: 12px;">- Hostel Management Team</p>
            </div>
        `
    }),

    invoiceGenerated: (name, amount, month, dueDate) => ({
        subject: `💳 Invoice Generated - ${month}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2196F3;">New Invoice Generated</h2>
                <p>Hi <strong>${name}</strong>,</p>
                <p>Your hostel invoice for ${month} has been generated.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Month:</strong> ${month}</p>
                    <p><strong>Amount:</strong> ₹${amount}</p>
                    <p><strong>Due Date:</strong> ${dueDate}</p>
                    <p><strong>Status:</strong> Pending Payment</p>
                </div>
                
                <p>Please pay before the due date to avoid late fees.</p>
                <p style="color: #666; font-size: 12px;">- Hostel Management Team</p>
            </div>
        `
    })
};

/**
 * Send email using predefined template
 * @param {string} to - Recipient email address
 * @param {string} templateName - Name of the template to use
 * @param  {...any} args - Template-specific arguments
 * @returns {Promise<boolean>} - Success status
 */
async function sendEmail(to, templateName, ...args) {
    // If email not configured, just log (for development)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`📧 Email would be sent to ${to} (${templateName}) - Email not configured`);
        return true; // Don't fail if email not configured
    }

    try {
        const template = templates[templateName](...args);

        await transporter.sendMail({
            from: `Hostel Management <${process.env.EMAIL_USER}>`,
            to,
            subject: template.subject,
            html: template.html
        });

        console.log(`📧 Email sent to ${to}: ${template.subject}`);
        return true;
    } catch (error) {
        console.error('📧 Email error:', error.message);
        // Don't throw error - email failure shouldn't break the app
        return false;
    }
}

/**
 * Send test email to verify configuration
 */
async function sendTestEmail(to) {
    return sendEmail(to, 'passwordReset', 'Test User', 'test-token-123');
}

module.exports = {
    sendEmail,
    sendTestEmail,
    templates
};
