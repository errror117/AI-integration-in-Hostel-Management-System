const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RequestSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    cms_id: {
        type: Number,
        required: true
        // Unique within organization
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

RequestSchema.index({ organizationId: 1, cms_id: 1 }, { unique: true });

module.exports = Request = mongoose.model('Request', RequestSchema);