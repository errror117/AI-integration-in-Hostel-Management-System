// Notice Controller - Multi-Tenant Version
const { validationResult } = require('express-validator');
const { Notice } = require('../models');

// Generate notice (AI-powered - placeholder)
exports.generateNotice = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { prompt, category, priority } = req.body;

        // This would integrate with OpenAI/Gemini for AI generation
        // For now, return a template

        const notice = new Notice({
            organizationId,
            title: `AI-Generated Notice`,
            content: `This notice was generated from: "${prompt}"\n\n(AI integration pending)`,
            category: category || 'general',
            priority: priority || 'medium',
            isAIGenerated: true,
            aiPrompt: prompt,
            createdBy: req.userId,
            status: 'draft'
        });

        await notice.save();

        res.status(201).json({
            success: true,
            notice,
            message: 'AI notice generation queued. Integrate AI service for full functionality.'
        });
    } catch (error) {
        console.error('Generate Notice Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Create notice
exports.createNotice = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const organizationId = req.organizationId;
        const { title, content, category, priority, targetAudience, targetHostel, expiresAt } = req.body;

        const notice = new Notice({
            organizationId,
            title,
            content,
            category,
            priority,
            targetAudience,
            targetHostel,
            expiresAt,
            createdBy: req.userId,
            status: 'draft'
        });

        await notice.save();

        res.status(201).json({ success: true, notice });
    } catch (error) {
        console.error('Create Notice Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get all notices for organization
exports.getAllNotices = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { status, category } = req.query;

        let query = { organizationId };
        if (status) query.status = status;
        if (category) query.category = category;

        const notices = await Notice.find(query)
            .populate('createdBy', ['name', 'email'])
            .sort({ publishedAt: -1, createdAt: -1 });

        res.json({ success: true, notices, count: notices.length });
    } catch (error) {
        console.error('Get Notices Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get notice by ID
exports.getNoticeById = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { id } = req.params;

        const notice = await Notice.findOne({ _id: id, organizationId })
            .populate('createdBy', ['name', 'email']);

        if (!notice) {
            return res.status(404).json({ success: false, error: 'Notice not found' });
        }

        // Increment view count
        notice.viewCount += 1;
        await notice.save();

        res.json({ success: true, notice });
    } catch (error) {
        console.error('Get Notice by ID Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Update notice
exports.updateNotice = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { id } = req.params;
        const updates = req.body;

        const notice = await Notice.findOneAndUpdate(
            { _id: id, organizationId },
            { ...updates, updatedAt: new Date() },
            { new: true }
        );

        if (!notice) {
            return res.status(404).json({ success: false, error: 'Notice not found' });
        }

        res.json({ success: true, notice });
    } catch (error) {
        console.error('Update Notice Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Publish notice
exports.publishNotice = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { id } = req.body;

        const notice = await Notice.findOneAndUpdate(
            { _id: id, organizationId },
            { status: 'published', publishedAt: new Date() },
            { new: true }
        );

        if (!notice) {
            return res.status(404).json({ success: false, error: 'Notice not found' });
        }

        // Emit real-time event
        req.app.get('io').to(`org_${organizationId}`).emit('notice:published', notice);

        res.json({ success: true, notice });
    } catch (error) {
        console.error('Publish Notice Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Delete notice
exports.deleteNotice = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { id } = req.params;

        const notice = await Notice.findOneAndDelete({ _id: id, organizationId });

        if (!notice) {
            return res.status(404).json({ success: false, error: 'Notice not found' });
        }

        res.json({ success: true, message: 'Notice deleted successfully' });
    } catch (error) {
        console.error('Delete Notice Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Acknowledge notice (for students)
exports.acknowledgeNotice = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { id } = req.params;
        const studentId = req.userId;

        const notice = await Notice.findOne({ _id: id, organizationId });

        if (!notice) {
            return res.status(404).json({ success: false, error: 'Notice not found' });
        }

        // Check if already acknowledged
        const alreadyAcknowledged = notice.acknowledgedBy.some(
            ack => ack.student.toString() === studentId
        );

        if (alreadyAcknowledged) {
            return res.status(400).json({ success: false, error: 'Already acknowledged' });
        }

        notice.acknowledgedBy.push({
            student: studentId,
            acknowledgedAt: new Date()
        });

        await notice.save();

        res.json({ success: true, message: 'Notice acknowledged successfully' });
    } catch (error) {
        console.error('Acknowledge Notice Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

module.exports = {
    generateNotice: exports.generateNotice,
    createNotice: exports.createNotice,
    getAllNotices: exports.getAllNotices,
    getNoticeById: exports.getNoticeById,
    updateNotice: exports.updateNotice,
    publishNotice: exports.publishNotice,
    deleteNotice: exports.deleteNotice,
    acknowledgeNotice: exports.acknowledgeNotice
};
