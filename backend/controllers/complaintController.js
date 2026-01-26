const { validationResult } = require('express-validator');
const { Complaint, Student, Hostel, Organization } = require('../models');
const { isValidObjectId, checkRecordExists, errorResponse, successResponse } = require('../utils/validators');
const emailService = require('../services/emailService');

// @route   POST api/complaint/register
// @desc    Register complaint
// @access  Protected (requires organizationId from tenant middleware)
exports.registerComplaint = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId; // From tenant middleware
    const { student, hostel, type, title, description, category, urgencyLevel } = req.body;

    // Validate student ObjectId
    if (!isValidObjectId(student)) {
        return res.status(400).json(errorResponse(false, 'Invalid student ID format'));
    }

    // Validate hostel ObjectId
    if (!isValidObjectId(hostel)) {
        return res.status(400).json(errorResponse(false, 'Invalid hostel ID format'));
    }

    // Check if student exists in this organization
    const studentCheck = await checkRecordExists(Student, student, organizationId);
    if (!studentCheck.exists) {
        return res.status(404).json(errorResponse(false, 'Student not found in organization', null, 404));
    }

    // Check if hostel exists in this organization
    const hostelCheck = await checkRecordExists(Hostel, hostel, organizationId);
    if (!hostelCheck.exists) {
        return res.status(404).json(errorResponse(false, 'Hostel not found in organization', null, 404));
    }

    try {
        const newComplaint = new Complaint({
            organizationId,
            student,
            hostel,
            type,
            title,
            description,
            category: category || 'General',
            urgencyLevel: urgencyLevel || 'medium',
            status: 'pending'
        });

        await newComplaint.save();

        // Emit real-time event (only to users in this organization)
        const populatedComplaint = await newComplaint.populate('student', ['name', 'room_no']);

        req.app.get('io').to(`org_${organizationId}`).emit('complaint:new', populatedComplaint);

        res.json(successResponse(
            { complaint: populatedComplaint },
            'Complaint registered successfully'
        ));
    } catch (err) {
        console.error('Register Complaint Error:', err.message);
        res.status(500).json(errorResponse(false, 'Server error while registering complaint', err.message, 500));
    }
}

// @route   GET api/complaint/by-hostel
// @desc    Get all complaints by hostel id (within organization)
// @access  Protected
exports.getbyhostel = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { hostel } = req.body;

    try {
        // Only get complaints for THIS organization
        const complaints = await Complaint.find({
            organizationId,
            hostel
        })
            .populate('student', ['name', 'room_no', 'cms_id'])
            .sort({ date: -1 }); // Most recent first

        success = true;
        res.json({ success, complaints, count: complaints.length });
    }
    catch (err) {
        console.error('Get Complaints by Hostel Error:', err.message);
        res.status(500).send('Server error');
    }
}

// @route   GET api/complaint/by-student
// @desc    Get all complaints by student id (within organization)
// @access  Protected
exports.getbystudent = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { student } = req.body;

    try {
        // Only get complaints for THIS organization
        const complaints = await Complaint.find({
            organizationId,
            student
        }).sort({ date: -1 });

        success = true;
        res.json({ success, complaints, count: complaints.length });
    }
    catch (err) {
        console.error('Get Complaints by Student Error:', err.message);
        res.status(500).send('Server error');
    }
}

// @route   GET api/complaint/all
// @desc    Get all complaints for organization
// @access  Protected (Admin only)
exports.getAllComplaints = async (req, res) => {
    let success = false;

    try {
        const organizationId = req.organizationId;
        const { status, category, urgencyLevel } = req.query;

        let query = { organizationId };

        // Apply filters if provided
        if (status) query.status = status;
        if (category) query.category = category;
        if (urgencyLevel) query.urgencyLevel = urgencyLevel;

        const complaints = await Complaint.find(query)
            .populate('student', ['name', 'room_no', 'cms_id', 'email'])
            .populate('hostel', ['name'])
            .populate('assignedTo', ['name', 'email'])
            .sort({ aiPriorityScore: -1, date: -1 }); // Highest priority first

        // OPTIMIZED: Calculate stats in single pass - O(n) instead of O(4n)
        const stats = complaints.reduce((acc, c) => {
            acc.total++;
            switch (c.status) {
                case 'pending':
                    acc.pending++;
                    break;
                case 'in_progress':
                    acc.in_progress++;
                    break;
                case 'resolved':
                    acc.resolved++;
                    break;
                case 'high_priority':
                    acc.high_priority++;
                    break;
            }
            return acc;
        }, {
            total: 0,
            pending: 0,
            in_progress: 0,
            resolved: 0,
            high_priority: 0
        });

        success = true;
        res.json({ success, complaints, stats });
    }
    catch (err) {
        console.error('Get All Complaints Error:', err.message);
        res.status(500).send('Server error');
    }
}

// @route   PUT api/complaint/resolve
// @desc    Resolve complaint by complaint id
// @access  Protected (Admin only)
exports.resolve = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { id, resolutionNotes } = req.body;

    try {
        // Find complaint in THIS organization only
        const complaint = await Complaint.findOne({
            _id: id,
            organizationId
        });

        if (!complaint) {
            return res.status(404).json({
                success,
                errors: [{ msg: 'Complaint not found in your organization' }]
            });
        }

        // Update complaint status
        complaint.status = 'resolved';
        complaint.resolvedAt = new Date();
        complaint.resolutionTime = Math.floor((complaint.resolvedAt - complaint.date) / (1000 * 60)); // Minutes
        if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;

        await complaint.save();

        // Send email notification to student
        try {
            const student = await Student.findById(complaint.student);
            const organization = await Organization.findById(organizationId);
            if (student && organization) {
                emailService.sendComplaintUpdate(student, complaint, organization);
            }
        } catch (emailErr) {
            console.log('Email notification skipped:', emailErr.message);
        }

        // Emit real-time event (only to organization)
        req.app.get('io').to(`org_${organizationId}`).emit('complaint:updated', complaint);

        success = true;
        res.json({ success, complaint });
    }
    catch (err) {
        console.error('Resolve Complaint Error:', err.message);
        res.status(500).send('Server error');
    }
}

// @route   PUT api/complaint/update-status
// @desc    Update complaint status
// @access  Protected (Admin only)
exports.updateStatus = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { id, status, assignedTo } = req.body;

    try {
        const complaint = await Complaint.findOne({
            _id: id,
            organizationId
        });

        if (!complaint) {
            return res.status(404).json({
                success,
                errors: [{ msg: 'Complaint not found' }]
            });
        }

        complaint.status = status;
        if (assignedTo) complaint.assignedTo = assignedTo;
        complaint.updatedAt = new Date();

        await complaint.save();

        // Send email notification to student
        try {
            const student = await Student.findById(complaint.student);
            const organization = await Organization.findById(organizationId);
            if (student && organization) {
                emailService.sendComplaintUpdate(student, complaint, organization);
            }
        } catch (emailErr) {
            console.log('Email notification skipped:', emailErr.message);
        }

        // Emit real-time event
        req.app.get('io').to(`org_${organizationId}`).emit('complaint:updated', complaint);

        success = true;
        res.json({ success, complaint });
    }
    catch (err) {
        console.error('Update Complaint Status Error:', err.message);
        res.status(500).send('Server error');
    }
}

// @route   GET api/complaint/stats
// @desc    Get complaint statistics for organization
// @access  Protected (Admin only)
exports.getStats = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const [total, byStatus, byCategory, byUrgency, resolutionTimes] = await Promise.all([
            Complaint.countDocuments({ organizationId }),

            Complaint.aggregate([
                { $match: { organizationId: require('mongoose').Types.ObjectId(organizationId) } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            Complaint.aggregate([
                { $match: { organizationId: require('mongoose').Types.ObjectId(organizationId) } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]),

            Complaint.aggregate([
                { $match: { organizationId: require('mongoose').Types.ObjectId(organizationId) } },
                { $group: { _id: '$urgencyLevel', count: { $sum: 1 } } }
            ]),

            Complaint.aggregate([
                {
                    $match: {
                        organizationId: require('mongoose').Types.ObjectId(organizationId),
                        status: 'resolved',
                        resolutionTime: { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgResolutionTime: { $avg: '$resolutionTime' },
                        minResolutionTime: { $min: '$resolutionTime' },
                        maxResolutionTime: { $max: '$resolutionTime' }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            stats: {
                total,
                byStatus,
                byCategory,
                byUrgency,
                resolutionMetrics: resolutionTimes[0] || {
                    avgResolutionTime: 0,
                    minResolutionTime: 0,
                    maxResolutionTime: 0
                }
            }
        });
    } catch (err) {
        console.error('Get Complaint Stats Error:', err);
        res.status(500).send('Server error');
    }
}

module.exports = {
    registerComplaint: exports.registerComplaint,
    getbyhostel: exports.getbyhostel,
    getbystudent: exports.getbystudent,
    getAllComplaints: exports.getAllComplaints,
    resolve: exports.resolve,
    updateStatus: exports.updateStatus,
    getStats: exports.getStats
};