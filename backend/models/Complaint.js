const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ComplaintSchema = new Schema({
    // Multi-tenancy - CRITICAL for data isolation
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    student: {
        type: Schema.Types.ObjectId,
        ref: 'Student'
    },
    hostel: {
        type: Schema.Types.ObjectId,
        ref: 'Hostel'
    },
    type: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'closed', 'high_priority'],
        default: 'pending'
    },
    category: {
        type: String,
        enum: ['WiFi/Internet', 'Mess/Food', 'Cleanliness', 'Electrical', 'Plumbing', 'Maintenance', 'Security', 'General'],
        default: 'General'
    },
    aiPriorityScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },
    urgencyLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    aiTags: [{
        type: String
    }],
    sentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative'],
        default: 'neutral'
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'Admin'
    },
    resolvedAt: {
        type: Date
    },
    resolutionTime: {
        type: Number
    },
    resolutionNotes: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
})

// Performance indexes for multi-tenancy
ComplaintSchema.index({ organizationId: 1, status: 1 });
ComplaintSchema.index({ organizationId: 1, category: 1 });
ComplaintSchema.index({ organizationId: 1, urgencyLevel: 1 });
ComplaintSchema.index({ organizationId: 1, student: 1 });
ComplaintSchema.index({ organizationId: 1, date: -1 }); // Most recent first
ComplaintSchema.index({ organizationId: 1, aiPriorityScore: -1 }); // Highest priority first

module.exports = Complaint = mongoose.model('Complaint', ComplaintSchema);
