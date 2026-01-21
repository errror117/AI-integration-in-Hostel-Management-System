const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Leave Request Model
 * Stores leave/permission requests made via chatbot or manual forms
 */
const LeaveRequestSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    student: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    type: {
        type: String,
        enum: ['late_night', 'overnight', 'weekend', 'long_leave', 'mess_off'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    destination: {
        type: String
    },
    contactDuringLeave: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'auto_approved'],
        default: 'pending'
    },
    aiValidation: {
        isValid: { type: Boolean, default: true },
        reason: String,
        autoApprovalEligible: { type: Boolean, default: false }
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin'
    },
    reviewedAt: {
        type: Date
    },
    reviewNotes: {
        type: String
    },
    requestedVia: {
        type: String,
        enum: ['chatbot', 'form', 'app'],
        default: 'chatbot'
    },
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
LeaveRequestSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
LeaveRequestSchema.index({ organizationId: 1, student: 1, status: 1 });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
