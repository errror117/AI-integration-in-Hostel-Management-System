const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    // Organization & Multi-tenancy
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: function () {
            // Super admin doesn't need organizationId
            return this.role !== 'super_admin';
        },
        index: true
    },

    // Authentication
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },

    // Role Hierarchy (replaces isAdmin boolean)
    role: {
        type: String,
        enum: ['super_admin', 'org_admin', 'sub_admin', 'student'],
        default: 'student',
        required: true,
        index: true
    },

    // Legacy field for backward compatibility (will be removed later)
    isAdmin: {
        type: Boolean,
        default: function () {
            return ['super_admin', 'org_admin', 'sub_admin'].includes(this.role);
        }
    },

    // Password Reset
    resetToken: {
        type: String
    },
    resetExpires: {
        type: Date
    },

    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    },

    // Last Login Tracking
    lastLogin: {
        type: Date
    },
    lastLoginIP: {
        type: String
    },

    // Account Creation
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

// Indexes for performance
UserSchema.index({ email: 1, organizationId: 1 });
UserSchema.index({ role: 1, organizationId: 1 });
UserSchema.index({ isActive: 1 });

// Virtual to check if user is any type of admin
UserSchema.virtual('isAnyAdmin').get(function () {
    return ['super_admin', 'org_admin', 'sub_admin'].includes(this.role);
});

// Method to check if user has permission
UserSchema.methods.hasRole = function (...roles) {
    return roles.includes(this.role);
};

// Method to check if user belongs to organization
UserSchema.methods.belongsToOrganization = function (orgId) {
    if (this.role === 'super_admin') return true; // Super admin has access to all
    return this.organizationId && this.organizationId.toString() === orgId.toString();
};

module.exports = User = mongoose.model('User', UserSchema);
