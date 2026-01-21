const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
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
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

// Indexes for multi-tenancy
AttendanceSchema.index({ organizationId: 1, student: 1, date: 1 });
AttendanceSchema.index({ organizationId: 1, date: -1 });
AttendanceSchema.index({ organizationId: 1, status: 1 });

module.exports = Attendance = mongoose.model('Attendance', AttendanceSchema);