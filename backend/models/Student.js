const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
  // Multi-tenancy - CRITICAL for data isolation
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  name: {
    type: String,
    required: true,
  },
  cms_id: {
    type: Number,
    required: true,
    // Note: cms_id should be unique within organization, not globally
    // We'll add compound index below
    unique: true,
  },
  room_no: {
    type: Number,
    required: true,
  },
  batch: {
    type: Number,
    required: true,
  },
  dept: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    // Email should be unique within organization
    lowercase: true,
    trim: true,
    unique: true,
  },
  father_name: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  cnic: {
    type: String,
    required: true,
    // CNIC should be unique within organization
    unique: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  hostel: {
    type: Schema.Types.ObjectId,
    ref: "hostel",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  qrCode: {
    type: String,
    default: null, // base64 string of QR image
  },
});

// Compound indexes for multi-tenancy
// Ensure cms_id is unique within organization (not globally)
StudentSchema.index({ organizationId: 1, cms_id: 1 }, { unique: true });
// Ensure email is unique within organization
StudentSchema.index({ organizationId: 1, email: 1 }, { unique: true });
// Ensure CNIC is unique within organization
StudentSchema.index({ organizationId: 1, cnic: 1 }, { unique: true });
// Performance index for common queries
StudentSchema.index({ organizationId: 1, hostel: 1 });
StudentSchema.index({ organizationId: 1, batch: 1 });

module.exports = mongoose.model('Student', StudentSchema);
