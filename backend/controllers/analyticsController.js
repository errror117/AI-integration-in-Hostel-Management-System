// Analytics Controller - Multi-Tenant Version
const { Analytics, Student, Complaint, Attendance, ChatLog, MessOff } = require('../models');
const mongoose = require('mongoose');

// Get organization analytics
exports.getAnalytics = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { date } = req.query;

        const targetDate = date || new Date().toISOString().split('T')[0];
        const analytics = await Analytics.findOne({ organizationId, date: targetDate });

        res.json({ success: true, analytics });
    } catch (error) {
        console.error('Get Analytics Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get dashboard summary
exports.getSummary = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const [totalStudents, totalComplaints, pendingComplaints, todayAttendance] = await Promise.all([
            Student.countDocuments({ organizationId }),
            Complaint.countDocuments({ organizationId }),
            Complaint.countDocuments({ organizationId, status: 'pending' }),
            Attendance.countDocuments({
                organizationId,
                date: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            })
        ]);

        res.json({
            success: true,
            summary: {
                students: totalStudents,
                complaints: totalComplaints,
                pendingComplaints,
                todayAttendance
            }
        });
    } catch (error) {
        console.error('Get Summary Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get chatbot statistics
exports.getChatbotStats = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const stats = await ChatLog.aggregate([
            { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
            {
                $group: {
                    _id: '$intent',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({ success: true, stats });
    } catch (error) {
        console.error('Get Chatbot Stats Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get chatbot analytics
exports.getChatbotAnalytics = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const totalChats = await ChatLog.countDocuments({ organizationId });
        const intents = await ChatLog.aggregate([
            { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
            { $group: { _id: '$intent', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({ success: true, totalChats, topIntents: intents });
    } catch (error) {
        console.error('Get Chatbot Analytics Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get complaint analytics
exports.getComplaintAnalytics = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const [total, byStatus, byCategory] = await Promise.all([
            Complaint.countDocuments({ organizationId }),

            Complaint.aggregate([
                { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            Complaint.aggregate([
                { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ])
        ]);

        res.json({ success: true, total, byStatus, byCategory });
    } catch (error) {
        console.error('Get Complaint Analytics Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get mess prediction
exports.getMessPrediction = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        // Simple prediction based on mess-off requests
        const totalStudents = await Student.countDocuments({ organizationId });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const messOffCount = await MessOff.countDocuments({
            organizationId,
            status: 'approved',
            leaving_date: { $lte: tomorrow },
            return_date: { $gte: tomorrow }
        });

        const predictedAttendees = totalStudents - messOffCount;

        res.json({
            success: true,
            prediction: {
                totalStudents,
                messOffCount,
                predictedAttendees,
                date: tomorrow.toISOString().split('T')[0]
            }
        });
    } catch (error) {
        console.error('Get Mess Prediction Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get mess predictions (plural - for charts)
exports.getMessPredictions = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const days = parseInt(req.query.days) || 7;

        const predictions = [];
        const totalStudents = await Student.countDocuments({ organizationId });

        for (let i = 0; i < days; i++) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + i);

            const messOffCount = await MessOff.countDocuments({
                organizationId,
                status: 'approved',
                leaving_date: { $lte: targetDate },
                return_date: { $gte: targetDate }
            });

            predictions.push({
                date: targetDate.toISOString().split('T')[0],
                totalStudents,
                messOffCount,
                predictedAttendees: totalStudents - messOffCount
            });
        }

        res.json({ success: true, predictions });
    } catch (error) {
        console.error('Get Mess Predictions Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get expense prediction
exports.getExpensePrediction = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        // Placeholder for expense prediction
        const totalStudents = await Student.countDocuments({ organizationId });
        const avgExpensePerStudent = 150; // Example value

        res.json({
            success: true,
            prediction: {
                totalStudents,
                avgExpensePerStudent,
                predictedMonthlyExpense: totalStudents * avgExpensePerStudent,
                note: 'Integrate with actual expense tracking for accurate predictions'
            }
        });
    } catch (error) {
        console.error('Get Expense Prediction Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get predictions (general)
exports.getPredictions = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const [messPredict, expensePredict] = await Promise.all([
            this.getMessPrediction({ organizationId }, { json: data => data }),
            this.getExpensePrediction({ organizationId }, { json: data => data })
        ]);

        res.json({
            success: true,
            predictions: {
                mess: messPredict,
                expense: expensePredict
            }
        });
    } catch (error) {
        console.error('Get Predictions Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Export report
exports.exportReport = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const report = {
            generatedAt: new Date(),
            students: await Student.countDocuments({ organizationId }),
            complaints: await Complaint.countDocuments({ organizationId }),
            attendance: await Attendance.countDocuments({ organizationId }),
            chats: await ChatLog.countDocuments({ organizationId })
        };

        res.json({ success: true, report });
    } catch (error) {
        console.error('Export Report Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

module.exports = {
    getAnalytics: exports.getAnalytics,
    getSummary: exports.getSummary,
    getChatbotStats: exports.getChatbotStats,
    getChatbotAnalytics: exports.getChatbotAnalytics,
    getComplaintAnalytics: exports.getComplaintAnalytics,
    getMessPrediction: exports.getMessPrediction,
    getMessPredictions: exports.getMessPredictions,
    getExpensePrediction: exports.getExpensePrediction,
    getPredictions: exports.getPredictions,
    exportReport: exports.exportReport
};
