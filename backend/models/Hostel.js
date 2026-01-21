const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HostelSchema = new Schema({
    // Multi-tenancy - organization can have multiple hostels
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
    location: {
        type: String,
        required: true
    },
    rooms: {
        type: Number,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    vacant: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
})

// Indexes for multi-tenancy
HostelSchema.index({ organizationId: 1, name: 1 });

module.exports = Hostel = mongoose.model('Hostel', HostelSchema);
