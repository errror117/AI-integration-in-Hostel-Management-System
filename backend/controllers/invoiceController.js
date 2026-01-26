const { validationResult } = require('express-validator');
const { Invoice, MessOff, Student, Hostel, Organization } = require('../models');
const { Mess_bill_per_day } = require('../constants/mess');
const { isValidObjectId, checkRecordExists, errorResponse, successResponse } = require('../utils/validators');
const emailService = require('../services/emailService');

// @route   POST api/invoice/generate
// @desc    Generate invoices for hostel (within organization)
// @access  Protected (Admin)
exports.generateInvoices = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { hostel } = req.body;

    // Validate hostel ObjectId
    if (!isValidObjectId(hostel)) {
        return res.status(400).json(errorResponse(false, 'Invalid hostel ID format'));
    }

    // Check if hostel exists in this organization
    const hostelCheck = await checkRecordExists(Hostel, hostel, organizationId);
    if (!hostelCheck.exists) {
        return res.status(404).json(errorResponse(false, 'Hostel not found in organization', null, 404));
    }

    try {
        // Get students from THIS organization and hostel
        const students = await Student.find({ organizationId, hostel }).lean();

        if (students.length === 0) {
            return res.status(400).json({ success, errors: 'No students found in this hostel' });
        }

        const studentIds = students.map(s => s._id);

        // Calculate date ranges once
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const daysInLastMonth = lastMonthEnd.getDate();
        const baseAmount = Mess_bill_per_day * daysInLastMonth;

        // OPTIMIZED: Single query to get ALL existing invoices
        const existingInvoices = await Invoice.find({
            organizationId,
            student: { $in: studentIds },
            date: { $gte: monthStart }
        }).select('student').lean();

        // Create Set for O(1) lookup
        const existingInvoiceSet = new Set(
            existingInvoices.map(inv => inv.student.toString())
        );

        // Check if all students already have invoices
        if (existingInvoices.length >= students.length) {
            return res.status(400).json({ success, errors: 'Invoices already generated for this month' });
        }

        // OPTIMIZED: Single query to get ALL mess-offs at once
        const allMessOffs = await MessOff.find({
            organizationId,
            student: { $in: studentIds },
            status: { $regex: /^approved$/i },
            leaving_date: { $gte: lastMonthStart },
            return_date: { $lte: lastMonthEnd }
        }).lean();

        // Group mess-offs by student (O(n) in-memory operation)
        const messOffsByStudent = allMessOffs.reduce((acc, messOff) => {
            const studentId = messOff.student.toString();
            if (!acc[studentId]) acc[studentId] = [];
            acc[studentId].push(messOff);
            return acc;
        }, {});

        // Calculate invoices for students without existing ones
        const invoicesToCreate = students
            .filter(student => !existingInvoiceSet.has(student._id.toString()))
            .map(student => {
                let amount = baseAmount;
                const studentMessOffs = messOffsByStudent[student._id.toString()] || [];

                // Calculate deductions
                studentMessOffs.forEach(messOff => {
                    const leavingDate = new Date(messOff.leaving_date);
                    const returnDate = new Date(messOff.return_date);
                    const numberOfDays = Math.ceil((returnDate - leavingDate) / (1000 * 60 * 60 * 24));
                    amount -= Mess_bill_per_day * numberOfDays;
                });

                return {
                    organizationId,
                    student: student._id,
                    title: `Mess Fee - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
                    amount: Math.max(amount, 0),
                    status: 'pending'
                };
            });

        let count = 0;
        const errors_list = [];

        // OPTIMIZED: Batch insert all invoices at once
        if (invoicesToCreate.length > 0) {
            try {
                const result = await Invoice.insertMany(invoicesToCreate, { ordered: false });
                count = result.length;

                // Send email notifications to students (non-blocking)
                try {
                    const organization = await Organization.findById(organizationId);
                    if (organization) {
                        // Create student lookup map
                        const studentMap = students.reduce((acc, s) => {
                            acc[s._id.toString()] = s;
                            return acc;
                        }, {});

                        // Send emails asynchronously (don't await)
                        result.forEach(invoice => {
                            const student = studentMap[invoice.student.toString()];
                            if (student && student.email) {
                                emailService.sendInvoiceReminder(student, invoice, organization, 0);
                            }
                        });
                    }
                } catch (emailErr) {
                    console.log('Invoice email notifications skipped:', emailErr.message);
                }
            } catch (err) {
                // Handle partial success in bulk insert
                if (err.insertedDocs) {
                    count = err.insertedDocs.length;
                    errors_list.push(`Some invoices failed: ${err.message}`);
                } else {
                    errors_list.push(`Invoice creation failed: ${err.message}`);
                }
            }
        }

        if (count > 0) {
            success = true;
            req.app.get('io').to(`org_${organizationId}`).emit('invoice:generated', { hostel, count });
        }

        res.status(200).json({
            success,
            count,
            message: `Generated ${count} invoices successfully`,
            errors: errors_list.length > 0 ? errors_list : undefined
        });

    } catch (err) {
        console.error('Generate Invoices Error:', err.message);
        res.status(500).json({ success, errors: 'Server error' });
    }
}

// @route   GET api/invoice/by-hostel
// @desc    Get all invoices by hostel (within organization)
// @access  Protected
exports.getInvoicesbyid = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { hostel } = req.body;

    try {
        const students = await Student.find({ organizationId, hostel });
        const invoices = await Invoice.find({
            organizationId,
            student: { $in: students }
        }).populate('student', ['name', 'room_no', 'cms_id']);

        success = true;
        res.status(200).json({ success, invoices, count: invoices.length });
    }
    catch (err) {
        console.error('Get Invoices by Hostel Error:', err.message);
        res.status(500).send('Server error');
    }
}

// @route   GET api/invoice/by-student
// @desc    Get all invoices for student (within organization)
// @access  Protected
exports.getInvoices = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { student } = req.body;

    try {
        const invoices = await Invoice.find({ organizationId, student }).sort({ date: -1 });
        success = true;
        res.status(200).json({ success, invoices, count: invoices.length });
    }
    catch (err) {
        console.error('Get Student Invoices Error:', err.message);
        res.status(500).send('Server error');
    }
}

// @route   PUT api/invoice/update
// @desc    Update invoice status
// @access  Protected
exports.updateInvoice = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { student, status } = req.body;

    try {
        const invoice = await Invoice.findOneAndUpdate(
            {
                organizationId,
                student,
                date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            },
            { status },
            { new: true }
        );

        if (!invoice) {
            return res.status(404).json({ success, error: 'Invoice not found' });
        }

        req.app.get('io').to(`org_${organizationId}`).emit('invoice:updated', invoice);

        success = true;
        res.status(200).json({ success, invoice });
    }
    catch (err) {
        console.error('Update Invoice Error:', err.message);
        res.status(500).send('Server error');
    }
}

module.exports = {
    generateInvoices: exports.generateInvoices,
    getInvoicesbyid: exports.getInvoicesbyid,
    getInvoices: exports.getInvoices,
    updateInvoice: exports.updateInvoice
};
