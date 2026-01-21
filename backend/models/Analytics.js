const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnalyticsSchema = new Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    date: {
        type: String, // Format YYYY-MM-DD for easy grouping
        required: true
        // Unique per organization
    },
    messageCount: {
        type: Number,
        default: 0
    },
    mostCommonIntents: [{
        intent: String,
        count: Number
    }],
    activeUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    messPrediction: {
        predictedDemand: Number,
        actualAttendance: Number
    },
    busiestHour: {
        hour: Number,
        count: Number
    }
}, {
    timestamps: true
});

// Compound index: date unique per organization
AnalyticsSchema.index({ organizationId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', AnalyticsSchema);
