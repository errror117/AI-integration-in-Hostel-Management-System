const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminSchema = new Schema({
    // Multi-tenancy - CRITICAL for data isolation
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
        // Email should be unique within organization
    },
    father_name: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    cnic: {
        type: String,
        required: true
        // CNIC should be unique within organization
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    hostel: {
        type: Schema.Types.ObjectId,
        ref: 'Hostel'
    },
    date: {
        type: Date,
        default: Date.now
    }
})

// Compound indexes for multi-tenancy
AdminSchema.index({ organizationId: 1, email: 1 }, { unique: true });
AdminSchema.index({ organizationId: 1, cnic: 1 }, { unique: true });
AdminSchema.index({ organizationId: 1, hostel: 1 });

module.exports = Admin = mongoose.model('Admin', AdminSchema);