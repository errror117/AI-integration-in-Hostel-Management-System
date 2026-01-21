const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubscriptionHistorySchema = new Schema({
    plan: String,
    status: String,
    startDate: Date,
    endDate: Date,
    amount: Number,
    reason: String
}, { _id: false });

const SubscriptionSchema = new Schema({
    // Multi-tenancy
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        unique: true,
        index: true
    },

    // Current Subscription
    currentPlan: {
        type: String,
        enum: ['free', 'starter', 'professional', 'enterprise'],
        default: 'free'
    },

    status: {
        type: String,
        enum: ['trial', 'active', 'past_due', 'cancelled', 'suspended', 'expired'],
        default: 'trial'
    },

    // Billing Cycle
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },

    // Dates
    trialStartDate: {
        type: Date,
        default: Date.now
    },
    trialEndDate: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    },
    subscriptionStartDate: Date,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelledAt: Date,
    suspendedAt: Date,

    // Pricing
    monthlyPrice: {
        type: Number,
        default: 0
    },
    yearlyPrice: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },

    // Payment
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'net_banking', 'wallet', 'other'],
        default: null
    },
    lastPaymentDate: Date,
    lastPaymentAmount: Number,
    nextBillingDate: Date,

    // Auto-renewal
    autoRenew: {
        type: Boolean,
        default: true
    },
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false
    },

    // Usage & Limits
    limits: {
        maxStudents: Number,
        maxAdmins: Number,
        maxRooms: Number,
        maxStorageMB: Number
    },

    currentUsage: {
        students: { type: Number, default: 0 },
        admins: { type: Number, default: 0 },
        rooms: { type: Number, default: 0 },
        storageMB: { type: Number, default: 0 }
    },

    // Features enabled
    features: {
        aiChatbot: { type: Boolean, default: true },
        analytics: { type: Boolean, default: false },
        customBranding: { type: Boolean, default: false },
        exportData: { type: Boolean, default: false },
        apiAccess: { type: Boolean, default: false },
        whiteLabel: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false },
        multiLanguage: { type: Boolean, default: false },
        smsNotifications: { type: Boolean, default: false }
    },

    // Payment Gateway Integration
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    razorpayCustomerId: String,
    razorpaySubscriptionId: String,

    // Billing
    billingEmail: String,
    billingName: String,
    billingAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
        gst: String // GST number for Indian businesses
    },

    // History
    history: [SubscriptionHistorySchema],

    // Notes
    notes: String,
    adminNotes: String // Internal notes by super admin

}, {
    timestamps: true
});

// Indexes
SubscriptionSchema.index({ organizationId: 1 }, { unique: true });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPlan: 1 });
SubscriptionSchema.index({ nextBillingDate: 1 });

// Virtual: Is trial active
SubscriptionSchema.virtual('isTrialActive').get(function () {
    return this.status === 'trial' && new Date() <= this.trialEndDate;
});

// Virtual: Days remaining in trial
SubscriptionSchema.virtual('trialDaysRemaining').get(function () {
    if (this.status !== 'trial') return 0;
    const now = new Date();
    const end = this.trialEndDate;
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual: Is subscription active
SubscriptionSchema.virtual('isActive').get(function () {
    return ['trial', 'active'].includes(this.status) &&
        (!this.cancelledAt || this.currentPeriodEnd > new Date());
});

// Method: Check if feature is available
SubscriptionSchema.methods.hasFeature = function (featureName) {
    return this.features[featureName] === true;
};

// Method: Check if usage limit is reached
SubscriptionSchema.methods.isLimitReached = function (limitType) {
    const limit = this.limits[`max${limitType.charAt(0).toUpperCase() + limitType.slice(1)}`];
    const usage = this.currentUsage[limitType.toLowerCase()];

    // -1 means unlimited
    if (limit === -1) return false;

    return usage >= limit;
};

// Method: Can add more (students/admins/etc)
SubscriptionSchema.methods.canAdd = function (type, count = 1) {
    const limitKey = `max${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const usageKey = type.toLowerCase();

    const limit = this.limits[limitKey];
    const currentUsage = this.currentUsage[usageKey] || 0;

    // -1 means unlimited
    if (limit === -1) return true;

    return (currentUsage + count) <= limit;
};

// Method: Upgrade plan
SubscriptionSchema.methods.upgrade = async function (newPlan, billingCycle = 'monthly') {
    const planPricing = Subscription.getPlanPricing(newPlan, billingCycle);

    // Add to history
    this.history.push({
        plan: this.currentPlan,
        status: this.status,
        startDate: this.currentPeriodStart,
        endDate: new Date(),
        reason: `Upgraded to ${newPlan}`
    });

    this.currentPlan = newPlan;
    this.billingCycle = billingCycle;
    this.status = 'active';
    this.limits = planPricing.limits;
    this.features = planPricing.features;
    this.monthlyPrice = planPricing.monthly;
    this.yearlyPrice = planPricing.yearly;
    this.currentPeriodStart = new Date();
    this.currentPeriodEnd = new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
    this.nextBillingDate = this.currentPeriodEnd;

    return this.save();
};

// Method: Downgrade plan
SubscriptionSchema.methods.downgrade = async function (newPlan) {
    // Schedule downgrade at period end
    this.cancelAtPeriodEnd = false; // Cancel the cancellation if any

    this.history.push({
        plan: this.currentPlan,
        status: this.status,
        startDate: this.currentPeriodStart,
        endDate: this.currentPeriodEnd,
        reason: `Scheduled downgrade to ${newPlan}`
    });

    // Will take effect at next billing
    this.notes = `Scheduled to downgrade to ${newPlan} on ${this.nextBillingDate}`;

    return this.save();
};

// Method: Cancel subscription
SubscriptionSchema.methods.cancel = async function (immediately = false) {
    if (immediately) {
        this.status = 'cancelled';
        this.cancelledAt = new Date();
        this.autoRenew = false;
    } else {
        // Cancel at period end
        this.cancelAtPeriodEnd = true;
        this.autoRenew = false;
    }

    this.history.push({
        plan: this.currentPlan,
        status: this.status,
        startDate: this.currentPeriodStart,
        endDate: immediately ? new Date() : this.currentPeriodEnd,
        reason: immediately ? 'Cancelled immediately' : 'Cancelled at period end'
    });

    return this.save();
};

// Method: Reactivate subscription
SubscriptionSchema.methods.reactivate = async function () {
    this.status = 'active';
    this.cancelledAt = null;
    this.suspendedAt = null;
    this.cancelAtPeriodEnd = false;
    this.autoRenew = true;

    return this.save();
};

// Static: Get plan pricing
SubscriptionSchema.statics.getPlanPricing = function (planName, billingCycle = 'monthly') {
    const plans = {
        free: {
            monthly: 0,
            yearly: 0,
            limits: {
                maxStudents: 50,
                maxAdmins: 1,
                maxRooms: 25,
                maxStorageMB: 100
            },
            features: {
                aiChatbot: true,
                analytics: false,
                customBranding: false,
                exportData: false,
                apiAccess: false,
                whiteLabel: false,
                prioritySupport: false
            }
        },
        starter: {
            monthly: 999, // INR
            yearly: 9999,
            limits: {
                maxStudents: 200,
                maxAdmins: 3,
                maxRooms: 100,
                maxStorageMB: 500
            },
            features: {
                aiChatbot: true,
                analytics: true,
                customBranding: false,
                exportData: true,
                apiAccess: false,
                whiteLabel: false,
                prioritySupport: false
            }
        },
        professional: {
            monthly: 4999,
            yearly: 49999,
            limits: {
                maxStudents: 1000,
                maxAdmins: 10,
                maxRooms: 500,
                maxStorageMB: 5000
            },
            features: {
                aiChatbot: true,
                analytics: true,
                customBranding: true,
                exportData: true,
                apiAccess: true,
                whiteLabel: false,
                prioritySupport: true
            }
        },
        enterprise: {
            monthly: 19999,
            yearly: 199999,
            limits: {
                maxStudents: -1, // Unlimited
                maxAdmins: -1,
                maxRooms: -1,
                maxStorageMB: -1
            },
            features: {
                aiChatbot: true,
                analytics: true,
                customBranding: true,
                exportData: true,
                apiAccess: true,
                whiteLabel: true,
                prioritySupport: true,
                multiLanguage: true,
                smsNotifications: true
            }
        }
    };

    return plans[planName] || plans.free;
};

// Static: Find expiring trials (for notifications)
SubscriptionSchema.statics.findExpiringTrials = function (days = 3) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.find({
        status: 'trial',
        trialEndDate: { $gte: now, $lte: futureDate }
    }).populate('organizationId');
};

// Static: Find subscriptions due for renewal
SubscriptionSchema.statics.findDueForRenewal = function (days = 3) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.find({
        status: 'active',
        autoRenew: true,
        nextBillingDate: { $gte: now, $lte: futureDate }
    }).populate('organizationId');
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);
