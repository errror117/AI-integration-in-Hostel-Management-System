const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationStateSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    intent: {
        type: String,
        default: 'UNKNOWN'
    },
    currentFlow: {
        type: String,
        default: null
    },
    step: {
        type: Schema.Types.Mixed, // Allow string or number
        default: 0
    },
    data: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },
    context: {
        type: Schema.Types.Mixed,
        default: {}
    },
    lastUpdated: {
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

// Remove unique constraint and add compound index
ConversationStateSchema.index({ organizationId: 1, user: 1, role: 1 }, { unique: true });

// Auto-expire after 10 minutes of inactivity
ConversationStateSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model('ConversationState', ConversationStateSchema);
