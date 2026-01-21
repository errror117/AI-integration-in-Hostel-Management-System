const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * FAQ Embedding Model
 * Stores frequently asked questions with vector embeddings for semantic search
 * Can be shared across organizations or organization-specific
 */
const FAQEmbeddingSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        default: null, // null = shared across all organizations
        index: true
    },

    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['hostel_rules', 'mess_info', 'fees', 'facilities', 'complaints', 'permissions', 'general'],
        default: 'general'
    },
    keywords: [{
        type: String
    }],
    embedding: {
        type: [Number], // Vector representation for semantic search
        default: []
    },
    relevanceScore: {
        type: Number,
        default: 1.0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    helpfulCount: {
        type: Number,
        default: 0
    },
    notHelpfulCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
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

// Indexes for faster searches
FAQEmbeddingSchema.index({ organizationId: 1, category: 1, isActive: 1 });
FAQEmbeddingSchema.index({ keywords: 1 });

module.exports = mongoose.model('FAQEmbedding', FAQEmbeddingSchema);
