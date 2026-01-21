const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Service for Hostel Management System
 * Handles all email notifications across the platform
 */

class EmailService {
    constructor() {
        // Initialize transporter
        this.transporter = nodemailer.createTransport({
            service: 'gmail', // Can change to SendGrid, AWS SES, etc.
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Verify connection
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service ready to send messages');
        } catch (error) {
            console.log('⚠️  Email service not configured:', error.message);
            console.log('   Set EMAIL_USER and EMAIL_PASSWORD in .env to enable emails');
        }
    }

    /**
     * Send welcome email to new student
     */
    async sendWelcomeEmail(student, organization, credentials) {
        const subject = `Welcome to ${organization.name} Hostel!`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .credentials { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
                    .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to ${organization.name}!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${student.name},</h2>
                        <p>We're excited to have you as part of our hostel community!</p>
                        
                        <div class="credentials">
                            <h3>📝 Your Login Credentials</h3>
                            <p><strong>Email:</strong> ${student.email}</p>
                            <p><strong>Password:</strong> ${credentials.password}</p>
                            <p><strong>CMS ID:</strong> ${student.cms_id}</p>
                            <p><strong>Room Number:</strong> ${student.room_no}</p>
                        </div>

                        <p><strong>⚠️ Important:</strong> Please change your password after first login for security.</p>

                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/student-login" class="button">
                            Login to Your Account
                        </a>

                        <h3>🏠 What You Can Do:</h3>
                        <ul>
                            <li>✅ Submit complaints and track their status</li>
                            <li>✅ Request mess-off when needed</li>
                            <li>✅ Apply for leave</li>
                            <li>✅ View and pay invoices</li>
                            <li>✅ Chat with our AI assistant 24/7</li>
                        </ul>

                        <p>If you have any questions, our AI chatbot is always available to help!</p>
                        
                        <p>Best regards,<br>
                        <strong>${organization.name} Management</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from ${organization.name} Hostel Management System</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(student.email, subject, html);
    }

    /**
     * Send complaint status update email
     */
    async sendComplaintUpdate(student, complaint, organization) {
        const statusEmoji = {
            'pending': '⏳',
            'in_progress': '🔧',
            'resolved': '✅',
            'rejected': '❌'
        };

        const subject = `${statusEmoji[complaint.status]} Complaint Status Update - #${complaint._id.toString().slice(-6)}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: ${complaint.status === 'resolved' ? '#10b981' : '#667eea'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .complaint-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
                    .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
                    .status-pending { background: #fbbf24; color: #78350f; }
                    .status-in_progress { background: #3b82f6; color: white; }
                    .status-resolved { background: #10b981; color: white; }
                    .status-rejected { background: #ef4444; color: white; }
                    .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${statusEmoji[complaint.status]} Complaint Status Updated</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${student.name},</h2>
                        <p>Your complaint has been updated!</p>
                        
                        <div class="complaint-box">
                            <p><strong>Complaint ID:</strong> #${complaint._id.toString().slice(-6)}</p>
                            <p><strong>Category:</strong> ${complaint.category || complaint.type}</p>
                            <p><strong>Description:</strong> ${complaint.description || complaint.title}</p>
                            <p><strong>Status:</strong> <span class="status status-${complaint.status}">${complaint.status.toUpperCase().replace('_', ' ')}</span></p>
                            ${complaint.adminNotes ? `<p><strong>Admin Notes:</strong> ${complaint.adminNotes}</p>` : ''}
                        </div>

                        ${complaint.status === 'resolved' ?
                '<p>✅ <strong>Great news!</strong> Your complaint has been resolved. Thank you for your patience!</p>' :
                complaint.status === 'in_progress' ?
                    '<p>🔧 <strong>We\'re on it!</strong> Our team is actively working on resolving your complaint.</p>' :
                    '<p>We appreciate your feedback and will keep you updated on the progress.</p>'
            }

                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student-dashboard/complaints" class="button">
                            View Complaint Details
                        </a>

                        <p>Best regards,<br>
                        <strong>${organization.name} Management</strong></p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(student.email, subject, html);
    }

    /**
     * Send invoice reminder email
     */
    async sendInvoiceReminder(student, invoice, organization, daysOverdue = 0) {
        const subject = daysOverdue > 0 ?
            `⚠️ Invoice Overdue - Payment Required` :
            `📋 Invoice Due - ${organization.name}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: ${daysOverdue > 0 ? '#ef4444' : '#667eea'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .invoice-box { background: white; padding: 20px; border-left: 4px solid ${daysOverdue > 0 ? '#ef4444' : '#667eea'}; margin: 20px 0; }
                    .amount { font-size: 32px; font-weight: bold; color: #667eea; }
                    .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
                    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${daysOverdue > 0 ? '⚠️ Payment Overdue' : '📋 Invoice Reminder'}</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${student.name},</h2>
                        ${daysOverdue > 0 ?
                `<div class="warning">
                                <strong>⚠️ Payment Overdue:</strong> Your invoice is ${daysOverdue} days overdue. Please make payment as soon as possible to avoid late fees.
                            </div>` :
                '<p>This is a friendly reminder about your pending invoice.</p>'
            }
                        
                        <div class="invoice-box">
                            <p><strong>Invoice ID:</strong> #${invoice._id ? invoice._id.toString().slice(-6) : 'N/A'}</p>
                            <p><strong>Amount Due:</strong></p>
                            <div class="amount">₹${invoice.amount ? invoice.amount.toLocaleString() : '0'}</div>
                            <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Description:</strong> ${invoice.description || 'Monthly hostel fees'}</p>
                        </div>

                        <p><strong>Payment Methods:</strong></p>
                        <ul>
                            <li>💳 Online Payment (Coming Soon)</li>
                            <li>🏦 Bank Transfer</li>
                            <li>💵 Cash at Office</li>
                        </ul>

                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student-dashboard/invoices" class="button">
                            View Invoice Details
                        </a>

                        <p>If you've already paid, please ignore this reminder.</p>
                        
                        <p>Best regards,<br>
                        <strong>${organization.name} Accounts Department</strong></p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(student.email, subject, html);
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(user, resetToken, organization) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        const subject = `🔐 Password Reset Request - ${organization?.name || 'Hostel Management'}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
                    .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <h2>Hello,</h2>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        
                        <a href="${resetUrl}" class="button">Reset Password</a>

                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong><br>
                            • This link expires in 1 hour<br>
                            • If you didn't request this, please ignore this email<br>
                            • Never share this link with anyone
                        </div>

                        <p>Or copy and paste this link into your browser:</p>
                        <p style="background: white; padding: 10px; word-break: break-all;">${resetUrl}</p>
                        
                        <p>Best regards,<br>
                        <strong>${organization?.name || 'Hostel Management'} Security Team</strong></p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(user.email, subject, html);
    }

    /**
     * Send leave request notification to admin
     */
    async sendLeaveRequestNotification(admin, student, leaveRequest, organization) {
        const subject = `🏖️ New Leave Request - ${student.name}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .request-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
                    .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏖️ New Leave Request</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${admin.name},</h2>
                        <p>A new leave request requires your approval.</p>
                        
                        <div class="request-box">
                            <p><strong>Student:</strong> ${student.name} (${student.cms_id})</p>
                            <p><strong>Room:</strong> ${student.room_no}</p>
                            <p><strong>Reason:</strong> ${leaveRequest.reason}</p>
                            <p><strong>From:</strong> ${new Date(leaveRequest.startDate).toLocaleDateString()}</p>
                            <p><strong>To:</strong> ${new Date(leaveRequest.endDate).toLocaleDateString()}</p>
                            <p><strong>Duration:</strong> ${leaveRequest.duration || 'N/A'} days</p>
                        </div>

                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin-dashboard/leave-requests" class="button">
                            Review Request
                        </a>
                        
                        <p>Best regards,<br>
                        <strong>${organization.name} System</strong></p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(admin.email, subject, html);
    }

    /**
     * Core email sending function
     */
    async sendEmail(to, subject, html) {
        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.EMAIL_FROM_NAME || 'Hostel Management'}" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html
            });

            console.log(`✉️  Email sent to ${to}: ${subject}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Email failed to ${to}:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
module.exports = new EmailService();
