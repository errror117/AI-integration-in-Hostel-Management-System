const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Notice Model
 * Stores AI-generated and manual notices/announcements
 */
const NoticeSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'mess', 'maintenance', 'fees', 'event', 'emergency', 'rules'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    targetAudience: {
        type: String,
        enum: ['all', 'students', 'specific_hostel', 'specific_room'],
        default: 'all'
    },
    targetHostel: {
        type: Schema.Types.ObjectId,
        ref: 'Hostel'
    },
    isAIGenerated: {
        type: Boolean,
        default: false
    },
    aiPrompt: {
        type: String // Original prompt used to generate (if AI-generated)
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    publishedAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    viewCount: {
        type: Number,
        default: 0
    },
    acknowledgmentRequired: {
        type: Boolean,
        default: false
    },
    acknowledgedBy: [{
        student: { type: Schema.Types.ObjectId, ref: 'Student' },
        acknowledgedAt: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for multi-tenancy
NoticeSchema.index({ organizationId: 1, status: 1, publishedAt: -1 });
NoticeSchema.index({ organizationId: 1, category: 1, priority: 1 });

module.exports = mongoose.model('Notice', NoticeSchema);
