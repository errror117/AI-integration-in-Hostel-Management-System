const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatLogSchema = new Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        required: true
    },
    query: {
        type: String,
        required: true
    },
    intent: {
        type: String,
        required: true
    },
    confidence: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    },
    entities: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },
    response: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    meta: {
        responseTime: Number,
        tokensUsed: Number,
        sentiment: String,
        wasHelpful: Boolean,
        feedbackGiven: Boolean
    },
    conversationContext: [{
        intent: String,
        query: String,
        timestamp: Date
    }],
    usedRAG: {
        type: Boolean,
        default: false
    },
    ragSource: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for analytics queries
ChatLogSchema.index({ organizationId: 1, timestamp: -1 });
ChatLogSchema.index({ organizationId: 1, intent: 1 });
ChatLogSchema.index({ organizationId: 1, user: 1, timestamp: -1 });

module.exports = mongoose.model('ChatLog', ChatLogSchema);
