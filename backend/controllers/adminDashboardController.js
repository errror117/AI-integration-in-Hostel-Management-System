// Admin Dashboard Controller - Multi-Tenant Version
const { Student, Admin, Complaint, Suggestion, MessOff, Invoice, Attendance, LeaveRequest } = require('../models');

// Get comprehensive dashboard data
exports.getDashboard = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const [studentStats, complaintStats, attendanceStats, invoiceStats, recentActivity] = await Promise.all([
            {
                total: await Student.countDocuments({ organizationId }),
                active: await Student.countDocuments({ organizationId, isActive: true })
            },

            {
                total: await Complaint.countDocuments({ organizationId }),
                pending: await Complaint.countDocuments({ organizationId, status: 'pending' }),
                resolved: await Complaint.countDocuments({ organizationId, status: 'resolved' }),
                high_priority: await Complaint.countDocuments({ organizationId, urgencyLevel: 'high' })
            },

            {
                total: await Attendance.countDocuments({
                    organizationId,
                    date: {
                        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        $lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                })
            },

            {
                total: await Invoice.countDocuments({ organizationId }),
                pending: await Invoice.countDocuments({ organizationId, status: 'pending' }),
                paid: await Invoice.countDocuments({ organizationId, status: 'paid' })
            },

            Complaint.find({ organizationId })
                .sort({ date: -1 })
                .limit(10)
                .populate('student', ['name', 'room_no'])
        ]);

        res.json({
            success: true,
            dashboard: {
                students: studentStats,
                complaints: complaintStats,
                attendance: attendanceStats,
                invoices: invoiceStats,
                recentActivity
            }
        });
    } catch (error) {
        console.error('Get Dashboard Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get all submissions (complaints, suggestions, leave requests)
exports.getAllSubmissions = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { filter, limit = 50, sortBy = 'date', includeChat } = req.query;

        const limitNum = parseInt(limit);

        const [complaints, suggestions, leaveRequests] = await Promise.all([
            Complaint.find({ organizationId })
                .populate('student', ['name', 'cms_id', 'room_no'])
                .sort({ [sortBy]: -1 })
                .limit(limitNum),

            Suggestion.find({ organizationId })
                .populate('student', ['name', 'cms_id', 'room_no'])
                .sort({ [sortBy]: -1 })
                .limit(limitNum),

            LeaveRequest.find({ organizationId })
                .populate('student', ['name', 'cms_id', 'room_no'])
                .sort({ [sortBy]: -1 })
                .limit(limitNum)
        ]);

        // Combine and sort all submissions
        const allSubmissions = [
            ...complaints.map(c => ({ ...c.toObject(), type: 'complaint' })),
            ...suggestions.map(s => ({ ...s.toObject(), type: 'suggestion' })),
            ...leaveRequests.map(l => ({ ...l.toObject(), type: 'leave_request' }))
        ];

        // Sort by date
        allSubmissions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

        res.json({
            success: true,
            submissions: allSubmissions.slice(0, limitNum),
            count: {
                total: allSubmissions.length,
                complaints: complaints.length,
                suggestions: suggestions.length,
                leaveRequests: leaveRequests.length
            }
        });
    } catch (error) {
        console.error('Get All Submissions Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get submission details
exports.getSubmissionDetails = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { type, id } = req.params;

        let submission;

        switch (type) {
            case 'complaint':
                submission = await Complaint.findOne({ _id: id, organizationId })
                    .populate('student', ['name', 'cms_id', 'email', 'contact', 'room_no'])
                    .populate('assignedTo', ['name', 'email']);
                break;

            case 'suggestion':
                submission = await Suggestion.findOne({ _id: id, organizationId })
                    .populate('student', ['name', 'cms_id', 'email', 'contact', 'room_no']);
                break;

            case 'leave_request':
                submission = await LeaveRequest.findOne({ _id: id, organizationId })
                    .populate('student', ['name', 'cms_id', 'email', 'contact', 'room_no'])
                    .populate('reviewedBy', ['name', 'email']);
                break;

            default:
                return res.status(400).json({ success: false, error: 'Invalid submission type' });
        }

        if (!submission) {
            return res.status(404).json({ success: false, error: 'Submission not found' });
        }

        res.json({ success: true, submission, type });
    } catch (error) {
        console.error('Get Submission Details Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Update submission status
exports.updateSubmissionStatus = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { type, id } = req.params;
        const { status, notes } = req.body;

        let submission;

        switch (type) {
            case 'complaint':
                submission = await Complaint.findOneAndUpdate(
                    { _id: id, organizationId },
                    { status, resolutionNotes: notes },
                    { new: true }
                );
                break;

            case 'suggestion':
                submission = await Suggestion.findOneAndUpdate(
                    { _id: id, organizationId },
                    { status },
                    { new: true }
                );
                break;

            case 'leave_request':
                submission = await LeaveRequest.findOneAndUpdate(
                    { _id: id, organizationId },
                    {
                        status,
                        reviewNotes: notes,
                        reviewedBy: req.userId,
                        reviewedAt: new Date()
                    },
                    { new: true }
                );
                break;

            default:
                return res.status(400).json({ success: false, error: 'Invalid submission type' });
        }

        if (!submission) {
            return res.status(404).json({ success: false, error: 'Submission not found' });
        }

        // Emit real-time event
        req.app.get('io').to(`org_${organizationId}`).emit(`${type}:updated`, submission);

        res.json({ success: true, submission });
    } catch (error) {
        console.error('Update Submission Status Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

module.exports = {
    getDashboard: exports.getDashboard,
    getAllSubmissions: exports.getAllSubmissions,
    getSubmissionDetails: exports.getSubmissionDetails,
    updateSubmissionStatus: exports.updateSubmissionStatus
};
