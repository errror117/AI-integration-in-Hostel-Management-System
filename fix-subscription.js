// Check ABC Engineering organization subscription status
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkSubscription() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected\n');

        const Organization = require('./backend/models/Organization');
        const User = require('./backend/models/User');

        // Find ABC admin to get organizationId
        const abcAdmin = await User.findOne({ email: 'admin@abc-eng.edu' });

        if (!abcAdmin || !abcAdmin.organizationId) {
            console.log('❌ ABC Admin not found or has no organizationId');
            await mongoose.disconnect();
            return;
        }

        console.log('📊 ABC Admin organizationId:', abcAdmin.organizationId);

        // Get organization
        const org = await Organization.findById(abcAdmin.organizationId);

        if (!org) {
            console.log('❌ Organization not found!');
            await mongoose.disconnect();
            return;
        }

        console.log('\n🏢 Organization:', org.name);
        console.log('📧 Contact:', org.contactEmail);
        console.log('🔓 Active:', org.isActive);
        console.log('\n💳 Subscription:');
        console.log('  Plan:', org.subscription.plan);
        console.log('  Status:', org.subscription.status);
        console.log('  Trial End:', org.subscription.trialEndsAt);
        console.log('  Current Period End:', org.subscription.currentPeriodEnd);

        // Check if trial expired
        const now = new Date();
        const trialExpired = org.subscription.trialEndsAt && org.subscription.trialEndsAt < now;
        console.log('\n⚠️  Trial Expired:', trialExpired);

        // Fix: Activate subscription
        if (org.subscription.status !== 'active') {
            console.log('\n🔧 FIXING: Activating subscription...');
            org.subscription.status = 'active';
            org.subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
            await org.save();
            console.log('✅ Subscription activated!');
        }

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkSubscription();
