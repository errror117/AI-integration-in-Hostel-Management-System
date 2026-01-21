const { validationResult } = require('express-validator');
const { Suggestion } = require('../models');

// @route   POST api/suggestion/register
// @desc    Register suggestion
// @access  Protected
exports.registerSuggestion = async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), success });
    }

    const organizationId = req.organizationId;
    const { student, hostel, title, description } = req.body;

    try {
        const newSuggestion = new Suggestion({
            organizationId,
            student,
            hostel,
            title,
            description
        });
        await newSuggestion.save();

        // Emit real-time event (org-specific)
        const populated = await newSuggestion.populate('student', ['name', 'room_no']);
        req.app.get('io').to(`org_${organizationId}`).emit('suggestion:new', populated);

        success = true;
        res.json({ success, msg: 'Suggestion registered successfully', suggestion: populated });
    } catch (err) {
        console.error('Register Suggestion Error:', err.message);
        res.status(500).send('Server error');
    }
}

// @route   GET api/suggestion/by-hostel
// @desc    Get all suggestions by hostel id (within organization)
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
        const suggestions = await Suggestion.find({ organizationId, hostel })
            .populate('student', ['name', 'room_no', 'cms_id'])
            .sort({ date: -1 });

        success = true;
        res.json({ success, suggestions, count: suggestions.length });
    }
    catch (err) {
        console.error('Get Suggestions by Hostel Error:', err.message);
        res.status(500).send('Server error');
    }
}

// @route   GET api/suggestion/by-student
// @desc    Get all suggestions by student id (within organization)
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
        const suggestions = await Suggestion.find({ organizationId, student })
            .populate('hostel', ['name'])
            .sort({ date: -1 });

        success = true;
        res.json({ success, suggestions, count: suggestions.length });
    }
    catch (err) {
        console.error('Get Suggestions by Student Error:', err.message);
        res.status(500).send('Server error');
    }
}

// @route   GET api/suggestion/all
// @desc    Get all suggestions for organization
// @access  Protected (Admin only)
exports.getAllSuggestions = async (req, res) => {
    let success = false;

    try {
        const organizationId = req.organizationId;
        const { status } = req.query;

        let query = { organizationId };
        if (status) query.status = status;

        const suggestions = await Suggestion.find(query)
            .populate('student', ['name', 'room_no', 'cms_id'])
            .populate('hostel', ['name'])
            .sort({ date: -1 });

        success = true;
        res.json({ success, suggestions, count: suggestions.length });
    }
    catch (err) {
        console.error('Get All Suggestions Error:', err.message);
        res.status(500).send('Server error');
    }
}

// @route   PUT api/suggestion/update
// @desc    Update suggestion status
// @access  Protected (Admin only)
exports.updateSuggestion = async (req, res) => {
    let success = false;
    const { id, status } = req.body;
    const organizationId = req.organizationId;

    try {
        const suggestion = await Suggestion.findOneAndUpdate(
            { _id: id, organizationId },
            { status },
            { new: true }
        );

        if (!suggestion) {
            return res.status(404).json({ success, error: 'Suggestion not found' });
        }

        // Emit real-time event
        req.app.get('io').to(`org_${organizationId}`).emit('suggestion:updated', suggestion);

        success = true;
        res.json({ success, msg: 'Suggestion updated successfully', suggestion });
    }
    catch (err) {
        console.error('Update Suggestion Error:', err.message);
        res.status(500).send('Server error');
    }
}

module.exports = {
    registerSuggestion: exports.registerSuggestion,
    getbyhostel: exports.getbyhostel,
    getbystudent: exports.getbystudent,
    getAllSuggestions: exports.getAllSuggestions,
    updateSuggestion: exports.updateSuggestion
};