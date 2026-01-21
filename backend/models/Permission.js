const mongoose = require('mongoose');
const { Schema } = mongoose;

const PermissionSchema = new Schema({
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
        enum: ['late_night', 'visitor', 'leave'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    fromDate: {
        type: Date
    },
    toDate: {
        type: Date
    },
    visitorName: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

PermissionSchema.index({ organizationId: 1, student: 1, status: 1 });
PermissionSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Permission', PermissionSchema);
