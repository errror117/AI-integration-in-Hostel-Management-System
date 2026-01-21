const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    date: { type: Date, required: true, default: Date.now },
    mealType: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner'], required: true },
    menu: { type: String, required: true },
    calories: { type: Number },
    price: { type: Number }
}, {
    timestamps: true
});

MessSchema.index({ organizationId: 1, date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('Mess', MessSchema);
