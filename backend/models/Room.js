const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    hostel: {
        type: Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },

    room_no: { type: Number, required: true },
    floor: { type: Number, required: true },
    room_type: { type: String, enum: ['Single', 'Double', 'Triple'], required: true },
    status: { type: String, enum: ['available', 'occupied'], default: 'available' },
    rent_per_month: { type: Number, required: true },
    capacity: { type: Number, default: 3 },
    occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, {
    timestamps: true
});

// Compound indexes - room_no unique per hostel per organization
RoomSchema.index({ organizationId: 1, hostel: 1, room_no: 1 }, { unique: true });
RoomSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Room', RoomSchema);
