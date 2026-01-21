const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessOffSchema = new Schema({
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
    leaving_date: {
        type: Date,
        required: true
    },
    return_date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        default: 'pending'
    },
    request_date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

// Indexes for multi-tenancy
MessOffSchema.index({ organizationId: 1, student: 1 });
MessOffSchema.index({ organizationId: 1, status: 1 });
MessOffSchema.index({ organizationId: 1, leaving_date: 1 });

module.exports = MessOff = mongoose.model('MessOff', MessOffSchema);