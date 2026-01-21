const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrganizationSchema = new Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        // Used for subdomain: slug.hostelease.com
        match: /^[a-z0-9-]+$/
    },
    type: {
        type: String,
        enum: ['university', 'college', 'hostel', 'dormitory', 'other'],
        default: 'hostel'
    },

    // Contact Information
    contact: {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String
        },
        website: String
    },

    // Subscription & Billing
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'starter', 'professional', 'enterprise'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['trial', 'active', 'suspended', 'cancelled', 'expired'],
            default: 'trial'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        trialEndsAt: {
            type: Date,
            default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
        },
        currentPeriodStart: Date,
        currentPeriodEnd: Date,
        cancelAtPeriodEnd: {
            type: Boolean,
            default: false
        },
        billingEmail: String,
        stripeCustomerId: String,
        stripeSubscriptionId: String
    },

    // Plan Limits
    limits: {
        maxStudents: {
            type: Number,
            default: 50 // Free plan limit
        },
        maxAdmins: {
            type: Number,
            default: 1
        },
        maxRooms: {
            type: Number,
            default: 25
        },
        maxStorageMB: {
            type: Number,
            default: 100 // 100 MB for free plan
        }
    },

    // Usage Tracking
    usage: {
        studentCount: {
            type: Number,
            default: 0
        },
        adminCount: {
            type: Number,
            default: 0
        },
        roomCount: {
            type: Number,
            default: 0
        },
        storageMB: {
            type: Number,
            default: 0
        }
    },

    // Feature Flags
    features: {
        aiChatbot: {
            type: Boolean,
            default: true
        },
        analytics: {
            type: Boolean,
            default: false // Only paid plans
        },
        customBranding: {
            type: Boolean,
            default: false // Professional and above
        },
        exportData: {
            type: Boolean,
            default: false
        },
        apiAccess: {
            type: Boolean,
            default: false // Enterprise only
        },
        whiteLabel: {
            type: Boolean,
            default: false // Enterprise only
        },
        multiLanguage: {
            type: Boolean,
            default: false
        },
        smsNotifications: {
            type: Boolean,
            default: false
        }
    },

    // Custom Branding
    branding: {
        logo: {
            type: String,
            default: null // URL to uploaded logo
        },
        favicon: {
            type: String,
            default: null
        },
        primaryColor: {
            type: String,
            default: '#4F46E5' // Indigo
        },
        secondaryColor: {
            type: String,
            default: '#10B981' // Green
        },
        tagline: {
            type: String,
            maxlength: 100
        },
        welcomeMessage: {
            type: String,
            maxlength: 500
        }
    },

    // Domain Configuration
    domain: {
        subdomain: {
            type: String,
            // Auto-populated from slug
        },
        customDomain: {
            type: String,
            default: null // e.g., hostel.university.edu
        },
        customDomainVerified: {
            type: Boolean,
            default: false
        }
    },

    // Settings
    settings: {
        timezone: {
            type: String,
            default: 'Asia/Kolkata'
        },
        currency: {
            type: String,
            default: 'INR'
        },
        dateFormat: {
            type: String,
            default: 'DD/MM/YYYY'
        },
        language: {
            type: String,
            default: 'en'
        },
        // Hostel-specific settings
        messTimings: {
            breakfast: { start: String, end: String },
            lunch: { start: String, end: String },
            snacks: { start: String, end: String },
            dinner: { start: String, end: String }
        },
        checkInTime: String,
        checkOutTime: String,
        autoApproveComplaints: {
            type: Boolean,
            default: false
        }
    },

    // Status & Metadata
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: Date,

    // Onboarding
    onboarding: {
        completed: {
            type: Boolean,
            default: false
        },
        currentStep: {
            type: Number,
            default: 1
        },
        steps: {
            basicInfo: { type: Boolean, default: false },
            adminSetup: { type: Boolean, default: false },
            hostelSetup: { type: Boolean, default: false },
            customization: { type: Boolean, default: false }
        }
    },

    // Audit fields
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    lastModifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    // Soft delete
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Indexes for performance
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ 'subscription.status': 1 });
OrganizationSchema.index({ isActive: 1 });
OrganizationSchema.index({ 'contact.email': 1 });
OrganizationSchema.index({ createdAt: -1 });

// Virtual for full subdomain
OrganizationSchema.virtual('fullSubdomain').get(function () {
    return `${this.slug}.hostelease.com`;
});

// Method to check if organization can add more students
OrganizationSchema.methods.canAddStudents = function (count = 1) {
    return (this.usage.studentCount + count) <= this.limits.maxStudents;
};

// Method to check if organization can add more admins
OrganizationSchema.methods.canAddAdmins = function (count = 1) {
    return (this.usage.adminCount + count) <= this.limits.maxAdmins;
};

// Method to check if trial has expired
OrganizationSchema.methods.isTrialExpired = function () {
    if (this.subscription.status !== 'trial') return false;
    return new Date() > this.subscription.trialEndsAt;
};

// Method to check if subscription is active
OrganizationSchema.methods.isSubscriptionActive = function () {
    return ['trial', 'active'].includes(this.subscription.status) &&
        !this.isTrialExpired() &&
        this.isActive;
};

// Method to check if feature is enabled
OrganizationSchema.methods.hasFeature = function (featureName) {
    return this.features[featureName] === true;
};

// Pre-save hook to set subdomain from slug
OrganizationSchema.pre('save', function (next) {
    if (this.isModified('slug')) {
        this.domain.subdomain = this.slug;
    }
    next();
});

// Static method to find active organizations
OrganizationSchema.statics.findActive = function () {
    return this.find({
        isActive: true,
        deletedAt: null,
        'subscription.status': { $in: ['trial', 'active'] }
    });
};

// Static method to get plan limits
OrganizationSchema.statics.getPlanLimits = function (planName) {
    const plans = {
        free: {
            maxStudents: 50,
            maxAdmins: 1,
            maxRooms: 25,
            maxStorageMB: 100,
            features: {
                aiChatbot: true,
                analytics: false,
                customBranding: false,
                exportData: false,
                apiAccess: false,
                whiteLabel: false
            }
        },
        starter: {
            maxStudents: 200,
            maxAdmins: 3,
            maxRooms: 100,
            maxStorageMB: 500,
            features: {
                aiChatbot: true,
                analytics: true,
                customBranding: false,
                exportData: true,
                apiAccess: false,
                whiteLabel: false
            }
        },
        professional: {
            maxStudents: 1000,
            maxAdmins: 10,
            maxRooms: 500,
            maxStorageMB: 5000,
            features: {
                aiChatbot: true,
                analytics: true,
                customBranding: true,
                exportData: true,
                apiAccess: true,
                whiteLabel: false
            }
        },
        enterprise: {
            maxStudents: -1, // Unlimited
            maxAdmins: -1,
            maxRooms: -1,
            maxStorageMB: -1,
            features: {
                aiChatbot: true,
                analytics: true,
                customBranding: true,
                exportData: true,
                apiAccess: true,
                whiteLabel: true
            }
        }
    };

    return plans[planName] || plans.free;
};

module.exports = mongoose.model('Organization', OrganizationSchema);
