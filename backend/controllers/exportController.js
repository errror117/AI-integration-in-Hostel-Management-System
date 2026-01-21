// Export Controller - Multi-Tenant Version
const { Student, Complaint, Invoice, Attendance, Suggestion, ChatLog } = require('../models');
const Parser = require('json2csv').Parser;

// Export students to CSV
exports.exportStudents = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const students = await Student.find({ organizationId }).select('-password -qrCode');

        if (!students || students.length === 0) {
            return res.status(404).json({ success: false, error: 'No students found' });
        }

        const fields = ['name', 'cms_id', 'email', 'batch', 'dept', 'course', 'room_no', 'contact'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(students);

        res.header('Content-Type', 'text/csv');
        res.attachment(`students_${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
    } catch (error) {
        console.error('Export Students Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Export complaints to CSV
exports.exportComplaints = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const complaints = await Complaint.find({ organizationId })
            .populate('student', ['name', 'cms_id'])
            .lean();

        if (!complaints || complaints.length === 0) {
            return res.status(404).json({ success: false, error: 'No complaints found' });
        }

        const formatted = complaints.map(c => ({
            student_name: c.student?.name || 'N/A',
            student_id: c.student?.cms_id || 'N/A',
            title: c.title,
            category: c.category,
            status: c.status,
            urgency: c.urgencyLevel,
            date: c.date
        }));

        const fields = ['student_name', 'student_id', 'title', 'category', 'status', 'urgency', 'date'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(formatted);

        res.header('Content-Type', 'text/csv');
        res.attachment(`complaints_${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
    } catch (error) {
        console.error('Export Complaints Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Export invoices toCSV
exports.exportInvoices = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const invoices = await Invoice.find({ organizationId })
            .populate('student', ['name', 'cms_id'])
            .lean();

        if (!invoices || invoices.length === 0) {
            return res.status(404).json({ success: false, error: 'No invoices found' });
        }

        const formatted = invoices.map(i => ({
            student_name: i.student?.name || 'N/A',
            student_id: i.student?.cms_id || 'N/A',
            title: i.title,
            amount: i.amount,
            status: i.status,
            date: i.date
        }));

        const fields = ['student_name', 'student_id', 'title', 'amount', 'status', 'date'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(formatted);

        res.header('Content-Type', 'text/csv');
        res.attachment(`invoices_${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
    } catch (error) {
        console.error('Export Invoices Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Export attendance to CSV
exports.exportAttendance = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { startDate, endDate } = req.query;

        let query = { organizationId };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendance = await Attendance.find(query)
            .populate('student', ['name', 'cms_id', 'room_no'])
            .lean();

        if (!attendance || attendance.length === 0) {
            return res.status(404).json({ success: false, error: 'No attendance records found' });
        }

        const formatted = attendance.map(a => ({
            student_name: a.student?.name || 'N/A',
            student_id: a.student?.cms_id || 'N/A',
            room_no: a.student?.room_no || 'N/A',
            status: a.status,
            date: a.date
        }));

        const fields = ['student_name', 'student_id', 'room_no', 'status', 'date'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(formatted);

        res.header('Content-Type', 'text/csv');
        res.attachment(`attendance_${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
    } catch (error) {
        console.error('Export Attendance Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Export suggestions to CSV
exports.exportSuggestions = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const suggestions = await Suggestion.find({ organizationId })
            .populate('student', ['name', 'cms_id'])
            .lean();

        if (!suggestions || suggestions.length === 0) {
            return res.status(404).json({ success: false, error: 'No suggestions found' });
        }

        const formatted = suggestions.map(s => ({
            student_name: s.student?.name || 'N/A',
            student_id: s.student?.cms_id || 'N/A',
            title: s.title,
            description: s.description,
            status: s.status,
            date: s.date
        }));

        const fields = ['student_name', 'student_id', 'title', 'description', 'status', 'date'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(formatted);

        res.header('Content-Type', 'text/csv');
        res.attachment(`suggestions_${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
    } catch (error) {
        console.error('Export Suggestions Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Export chat logs to CSV
exports.exportChatLogs = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const chatLogs = await ChatLog.find({ organizationId })
            .populate('user', ['name', 'email'])
            .lean();

        if (!chatLogs || chatLogs.length === 0) {
            return res.status(404).json({ success: false, error: 'No chat logs found' });
        }

        const formatted = chatLogs.map(c => ({
            user: c.user?.name || 'N/A',
            role: c.role,
            query: c.query,
            intent: c.intent,
            confidence: c.confidence,
            timestamp: c.timestamp
        }));

        const fields = ['user', 'role', 'query', 'intent', 'confidence', 'timestamp'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(formatted);

        res.header('Content-Type', 'text/csv');
        res.attachment(`chatlogs_${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
    } catch (error) {
        console.error('Export Chat Logs Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Export all data to CSV files (returns ZIP in real implementation)
exports.exportAll = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        // For now, return JSON with counts
        // In production, would create ZIP file with all CSVs
        const summary = {
            students: await Student.countDocuments({ organizationId }),
            complaints: await Complaint.countDocuments({ organizationId }),
            invoices: await Invoice.countDocuments({ organizationId }),
            attendance: await Attendance.countDocuments({ organizationId }),
            suggestions: await Suggestion.countDocuments({ organizationId }),
            chatLogs: await ChatLog.countDocuments({ organizationId })
        };

        res.json({
            success: true,
            message: 'Use individual export endpoints for each data type',
            availableExports: {
                students: `/api/export/students`,
                complaints: `/api/export/complaints`,
                invoices: `/api/export/invoices`,
                attendance: `/api/export/attendance`,
                suggestions: `/api/export/suggestions`,
                chatLogs: `/api/export/chatlogs`
            },
            dataCount: summary
        });
    } catch (error) {
        console.error('Export All Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

module.exports = {
    exportStudents: exports.exportStudents,
    exportComplaints: exports.exportComplaints,
    exportInvoices: exports.exportInvoices,
    exportAttendance: exports.exportAttendance,
    exportSuggestions: exports.exportSuggestions,
    exportChatLogs: exports.exportChatLogs,
    exportAll: exports.exportAll
};
