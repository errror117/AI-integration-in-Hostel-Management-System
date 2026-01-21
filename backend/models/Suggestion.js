const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SuggestionSchema = new Schema({
    // Multi-tenancy
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
        default: 'pending'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

// Indexes for multi-tenancy
SuggestionSchema.index({ organizationId: 1, status: 1 });
SuggestionSchema.index({ organizationId: 1, student: 1 });
SuggestionSchema.index({ organizationId: 1, date: -1 });

module.exports = Suggestion = mongoose.model('Suggestion', SuggestionSchema);