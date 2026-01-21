const { validationResult } = require('express-validator');
const { Student, Attendance } = require('../models');
const { isValidObjectId, checkRecordExists, errorResponse, successResponse } = require('../utils/validators');

const markAttendance = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success, errors: errors.array() });
    }

    const organizationId = req.organizationId;
    const { student, status } = req.body;

    // Validate student ObjectId
    if (!isValidObjectId(student)) {
        return res.status(400).json(errorResponse(false, 'Invalid student ID format'));
    }

    // Check if student exists in this organization
    const studentCheck = await checkRecordExists(Student, student, organizationId);
    if (!studentCheck.exists) {
        return res.status(404).json(errorResponse(false, 'Student not found in organization', null, 404));
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Check if attendance already marked today for this organization
    const alreadyattendance = await Attendance.findOne({
        organizationId,
        student,
        date: { $gte: todayStart, $lt: todayEnd }
    });

    if (alreadyattendance) {
        return res.status(409).json({ success, error: 'Attendance already marked' });
    }

    try {
        const attendance = new Attendance({
            organizationId,
            student,
            status
        });
        const result = await attendance.save();

        // Emit real-time event (org-specific)
        req.app.get('io').to(`org_${organizationId}`).emit('attendance:marked', result);

        success = true;
        res.status(201).json({ success, result });
    } catch (err) {
        console.error('Mark Attendance Error:', err.message);
        res.status(500).json({ success, error: err.message });
    }
}

const getAttendance = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success, errors: errors.array() });
    }

    const organizationId = req.organizationId;
    const { student } = req.body;

    try {
        const attendance = await Attendance.find({ organizationId, student }).sort({ date: -1 });
        success = true;
        res.status(200).json({ success, attendance, count: attendance.length });
    }
    catch (err) {
        console.error('Get Attendance Error:', err.message);
        res.status(500).json({ success, error: err.message });
    }
}

const updateAttendance = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const organizationId = req.organizationId;
    const { student, status } = req.body;

    try {
        const attendance = await Attendance.findOneAndUpdate(
            { organizationId, student, date: Date.now() },
            { status },
            { new: true }
        );
        res.status(200).json(attendance);
    }
    catch (err) {
        console.error('Update Attendance Error:', err.message);
        res.status(500).json({ error: err.message });
    }
}

const getHostelAttendance = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success, errors: errors.array() });
    }

    const organizationId = req.organizationId;
    const { hostel } = req.body;

    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        // OPTIMIZED: Get only student IDs from this hostel and organization
        const students = await Student.find({ organizationId, hostel }).select('_id').lean();
        const studentIds = students.map(s => s._id);

        const attendance = await Attendance.find({
            organizationId,
            student: { $in: studentIds },
            date: { $gte: todayStart, $lt: todayEnd }
        }).populate('student', ['_id', 'name', 'room_no', 'cms_id']);

        success = true;
        res.status(200).json({ success, attendance, count: attendance.length });
    }
    catch (err) {
        console.error('Get Hostel Attendance Error:', err.message);
        res.status(500).json({ success, error: err.message });
    }
}

const markAllAttendance = async (req, res) => {
    let success = false;
    const { students, status, hostel } = req.body;
    const organizationId = req.organizationId;

    if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ success, error: 'No students provided' });
    }

    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        // OPTIMIZED: Single query to find all existing attendance records
        const existingAttendance = await Attendance.find({
            organizationId,
            student: { $in: students },
            date: { $gte: todayStart, $lt: todayEnd }
        }).select('student').lean();

        // Create a Set of student IDs who already have attendance marked (O(1) lookup)
        const markedStudentIds = new Set(
            existingAttendance.map(att => att.student.toString())
        );

        // Filter students who need attendance marked
        const studentsToMark = students.filter(
            studentId => !markedStudentIds.has(studentId.toString())
        );

        let markedCount = 0;

        // OPTIMIZED: Use insertMany for batch insert (single DB operation)
        if (studentsToMark.length > 0) {
            const attendanceRecords = studentsToMark.map(studentId => ({
                organizationId,
                student: studentId,
                status: status,
                date: new Date()
            }));

            const result = await Attendance.insertMany(attendanceRecords, { ordered: false });
            markedCount = result.length;
        }

        // Emit real-time event
        req.app.get('io').to(`org_${organizationId}`).emit('attendance:bulkMarked', {
            hostel,
            status,
            count: markedCount
        });

        success = true;
        res.status(200).json({
            success,
            message: `Marked ${markedCount} students as ${status}`,
            count: markedCount
        });
    } catch (err) {
        console.error('Mark All Attendance Error:', err.message);
        res.status(500).json({ success, error: err.message });
    }
}

module.exports = {
    markAttendance,
    getAttendance,
    updateAttendance,
    getHostelAttendance,
    markAllAttendance
}
