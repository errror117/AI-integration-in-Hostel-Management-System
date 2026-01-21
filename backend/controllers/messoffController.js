const { validationResult } = require('express-validator');
const { MessOff, Student } = require('../models/');
const { verifyToken } = require('../utils/auth');
const { isValidObjectId, validateDateRange, validateFutureDate, checkRecordExists, errorResponse, successResponse } = require('../utils/validators');

// @route   POST api/messoff/request
// @desc    Request for mess off
// @access  Protected
exports.requestMessOff = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ "message": errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { student, leaving_date, return_date } = req.body;

    // Validate student ObjectId
    if (!isValidObjectId(student)) {
        return res.status(400).json(errorResponse(false, 'Invalid student ID format'));
    }

    // Check if student exists in this organization
    const studentCheck = await checkRecordExists(Student, student, organizationId);
    if (!studentCheck.exists) {
        return res.status(404).json(errorResponse(false, studentCheck.error || 'Student not found', null, 404));
    }

    // Validate date range
    const dateRangeValidation = validateDateRange(leaving_date, return_date);
    if (!dateRangeValidation.valid) {
        return res.status(400).json(errorResponse(false, dateRangeValidation.error));
    }

    // Validate leaving date is not in the past
    const futureDateValidation = validateFutureDate(leaving_date, true); // Allow today
    if (!futureDateValidation.valid) {
        return res.status(400).json(errorResponse(false, futureDateValidation.error));
    }

    try {
        const messOff = new MessOff({
            organizationId,
            student,
            leaving_date,
            return_date
        });
        await messOff.save();

        // Emit real-time event (org-specific)
        const populated = await messOff.populate('student', ['name', 'room_no']);
        req.app.get('io').to(`org_${organizationId}`).emit('messoff:new', populated);

        return res.status(200).json(successResponse(
            { messOff: populated },
            'Mess off request sent successfully'
        ));
    } catch (err) {
        console.error('Request MessOff Error:', err.message);
        return res.status(500).json(errorResponse(false, 'Server error while creating mess-off request', err.message, 500));
    }
}

// @route   GET api/messoff/count
// @desc    Get count of mess off requests for student
// @access  Protected
exports.countMessOff = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { student } = req.body;

    try {
        let date = new Date();
        const list = await MessOff.find({
            organizationId,
            student,
            leaving_date: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lte: new Date(date.getFullYear(), date.getMonth() + 1, 0)
            }
        });

        let approved = await MessOff.find({
            organizationId,
            student,
            status: "Approved",
            leaving_date: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lte: new Date(date.getFullYear(), date.getMonth() + 1, 0)
            }
        });

        let days = 0;
        for (let i = 0; i < approved.length; i++) {
            days += (new Date(approved[i].return_date) - new Date(approved[i].leaving_date)) / (1000 * 60 * 60 * 24);
        }

        approved = days;

        success = true;
        return res.status(200).json({ success, list, approved });
    }
    catch (err) {
        console.error('Count MessOff Error:', err.message);
        return res.status(500).json({ success, "message": "Server Error" });
    }
}

// @route   GET api/messoff/list
// @desc    Get all mess off requests (for hostel within organization)
// @access  Protected (Admin)
exports.listMessOff = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { hostel } = req.body;

    try {
        // Get students from this hostel and organization
        const students = await Student.find({ organizationId, hostel }).select('_id');

        // Get pending requests (use direct comparison instead of regex)
        const list = await MessOff.find({
            organizationId,
            student: { $in: students },
            status: 'pending'
        }).populate('student', ['name', 'room_no']).sort({ request_date: -1 });

        // Calculate date range once and reuse
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const approved = await MessOff.countDocuments({
            organizationId,
            student: { $in: students },
            status: 'approved',
            leaving_date: { $gte: monthStart, $lte: monthEnd }
        });

        const rejected = await MessOff.countDocuments({
            organizationId,
            student: { $in: students },
            status: 'rejected',
            leaving_date: { $gte: monthStart, $lte: monthEnd }
        });

        success = true;
        return res.status(200).json({ success, list, approved, rejected });
    }
    catch (err) {
        console.error('MessOff List Error:', err.message);
        return res.status(500).json({ success, errors: [{ msg: "Server Error" }] });
    }
}

// @route   PUT api/messoff/update
// @desc    Update mess off request status
// @access  Protected (Admin)
exports.updateMessOff = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { id, status } = req.body;

    try {
        const messOff = await MessOff.findOneAndUpdate(
            { _id: id, organizationId },
            { status },
            { new: true }
        ).populate('student', ['name', 'room_no']);

        if (!messOff) {
            return res.status(404).json({ success, error: 'MessOff request not found' });
        }

        // Emit real-time event
        req.app.get('io').to(`org_${organizationId}`).emit('messoff:updated', messOff);

        success = true;
        return res.status(200).json({ success, messOff });
    }
    catch (err) {
        console.error('Update MessOff Error:', err.message);
        return res.status(500).json({ success, errors: [{ msg: "Server Error" }] });
    }
}

module.exports = {
    requestMessOff: exports.requestMessOff,
    countMessOff: exports.countMessOff,
    listMessOff: exports.listMessOff,
    updateMessOff: exports.updateMessOff
};