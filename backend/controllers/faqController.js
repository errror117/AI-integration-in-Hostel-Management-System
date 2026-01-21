// FAQ Controller - Multi-Tenant Version
const { FAQEmbedding } = require('../models');

// Get all FAQs (shared + organization-specific)
exports.getAllFAQs = async (req, res) => {
    try {
        const organizationId = req.organizationId || null; // May not have org if public route
        const { category } = req.query;

        let query = {
            isActive: true
        };

        // If has organizationId, get shared + org-specific
        if (organizationId) {
            query.$or = [
                { organizationId: null }, // Shared FAQs
                { organizationId } // Organization-specific FAQs
            ];
        } else {
            // Public access - only shared FAQs
            query.organizationId = null;
        }

        if (category) query.category = category;

        const faqs = await FAQEmbedding.find(query).sort({ relevanceScore: -1 });

        res.json({ success: true, faqs, count: faqs.length });
    } catch (error) {
        console.error('Get FAQs Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get FAQ by ID
exports.getFAQById = async (req, res) => {
    try {
        const { id } = req.params;
        const faq = await FAQEmbedding.findById(id);

        if (!faq) {
            return res.status(404).json({ success: false, error: 'FAQ not found' });
        }

        res.json({ success: true, faq });
    } catch (error) {
        console.error('Get FAQ by ID Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Create organization-specific FAQ
exports.createFAQ = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { question, answer, category, keywords } = req.body;

        const faq = new FAQEmbedding({
            organizationId, // Organization-specific
            question,
            answer,
            category,
            keywords,
            isActive: true
        });

        await faq.save();

        res.status(201).json({ success: true, faq });
    } catch (error) {
        console.error('Create FAQ Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Update FAQ
exports.updateFAQ = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { id } = req.params;
        const updates = req.body;

        const faq = await FAQEmbedding.findOneAndUpdate(
            { _id: id, organizationId }, // Only update org's own FAQs
            updates,
            { new: true }
        );

        if (!faq) {
            return res.status(404).json({ success: false, error: 'FAQ not found or access denied' });
        }

        res.json({ success: true, faq });
    } catch (error) {
        console.error('Update FAQ Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Delete FAQ
exports.deleteFAQ = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { id } = req.params;

        const faq = await FAQEmbedding.findOneAndDelete({ _id: id, organizationId });

        if (!faq) {
            return res.status(404).json({ success: false, error: 'FAQ not found or access denied' });
        }

        res.json({ success: true, message: 'FAQ deleted successfully' });
    } catch (error) {
        console.error('Delete FAQ Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Bulk upload FAQs
exports.bulkUploadFAQs = async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { faqs } = req.body;

        if (!Array.isArray(faqs)) {
            return res.status(400).json({ success: false, error: 'FAQs must be an array' });
        }

        const created = await FAQEmbedding.insertMany(
            faqs.map(faq => ({ ...faq, organizationId, isActive: true }))
        );

        res.status(201).json({ success: true, count: created.length, faqs: created });
    } catch (error) {
        console.error('Bulk Upload FAQs Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Regenerate embeddings (placeholder - would integrate with AI service)
exports.regenerateEmbeddings = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        // This would call your embedding service (OpenAI, Gemini, etc.)
        // For now, just return success

        res.json({
            success: true,
            message: 'Embedding regeneration queued',
            note: 'This feature requires AI service integration'
        });
    } catch (error) {
        console.error('Regenerate Embeddings Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Provide feedback on FAQ
exports.feedbackFAQ = async (req, res) => {
    try {
        const { id } = req.params;
        const { helpful } = req.body;

        const faq = await FAQEmbedding.findById(id);

        if (!faq) {
            return res.status(404).json({ success: false, error: 'FAQ not found' });
        }

        if (helpful) {
            faq.helpfulCount += 1;
        } else {
            faq.notHelpfulCount += 1;
        }

        await faq.save();

        res.json({ success: true, message: 'Feedback recorded' });
    } catch (error) {
        console.error('FAQ Feedback Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

module.exports = {
    getAllFAQs: exports.getAllFAQs,
    getFAQById: exports.getFAQById,
    createFAQ: exports.createFAQ,
    updateFAQ: exports.updateFAQ,
    deleteFAQ: exports.deleteFAQ,
    bulkUploadFAQs: exports.bulkUploadFAQs,
    regenerateEmbeddings: exports.regenerateEmbeddings,
    feedbackFAQ: exports.feedbackFAQ
};
