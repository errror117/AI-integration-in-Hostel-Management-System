/**
 * Comprehensive FAQ Seeding Script for Chatbot RAG
 * Seeds role-specific FAQs for Student, Admin, and Super Admin
 * Run: node utils/seedChatbotFAQs.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const FAQEmbedding = require('../models/FAQEmbedding');
const Organization = require('../models/Organization');

// ========== STUDENT FAQs ==========
const studentFAQs = [
    // Hostel Rules & Timings
    {
        question: "What are the hostel entry timings?",
        answer: "Hostel entry timings are:\n• Main Gate: 6:00 AM - 10:00 PM\n• Late entry requires permission\n• Weekend: Extended till 11:00 PM",
        category: "rules",
        keywords: ["timing", "entry", "gate", "hours", "curfew"]
    },
    {
        question: "What are the visitor visiting hours?",
        answer: "Visitors are allowed:\n• Weekdays: 4:00 PM - 7:00 PM\n• Weekends: 10:00 AM - 7:00 PM\n• Parents can visit anytime with prior notice\n• All visitors must register at the gate",
        category: "rules",
        keywords: ["visitor", "visiting", "guest", "parents", "friend"]
    },
    {
        question: "What items are not allowed in hostel?",
        answer: "Prohibited items include:\n• Electrical cooking appliances (heaters, cookers)\n• Alcohol and tobacco products\n• Weapons of any kind\n• Pets\n• Loud speakers/subwoofers",
        category: "rules",
        keywords: ["prohibited", "banned", "not allowed", "items", "rules"]
    },
    // Mess & Food
    {
        question: "What are the mess timings?",
        answer: "Mess timings:\n• Breakfast: 7:30 AM - 9:30 AM\n• Lunch: 12:30 PM - 2:30 PM\n• Snacks: 5:00 PM - 6:00 PM\n• Dinner: 7:30 PM - 9:30 PM",
        category: "mess",
        keywords: ["mess", "timing", "food", "breakfast", "lunch", "dinner"]
    },
    {
        question: "How do I apply for mess off?",
        answer: "To apply for mess off:\n1. Go to Student Dashboard\n2. Click on 'Mess Off' section\n3. Select dates you'll be away\n4. Submit the request\n\nYou'll get a refund for the days you're away. Apply at least 2 days in advance.",
        category: "mess",
        keywords: ["mess off", "skip", "leave", "not eating", "refund"]
    },
    {
        question: "Can I get special diet food?",
        answer: "Yes! We accommodate:\n• Vegetarian/Vegan options (available daily)\n• Medical dietary requirements (with doctor's note)\n• Religious dietary needs\n\nContact the mess manager or submit a request through the chatbot.",
        category: "mess",
        keywords: ["diet", "vegetarian", "vegan", "special", "food"]
    },
    // Complaints & Maintenance
    {
        question: "How do I register a complaint?",
        answer: "To register a complaint:\n1. Say 'I want to register a complaint' to the chatbot\n2. Select the category (Electrical, Plumbing, etc.)\n3. Describe the issue\n\nOr go to Dashboard → Complaints → New Complaint. Track status anytime!",
        category: "complaints",
        keywords: ["complaint", "register", "issue", "problem", "report"]
    },
    {
        question: "How long does it take to resolve complaints?",
        answer: "Resolution times depend on priority:\n• High Priority (urgent): Within 24 hours\n• Medium Priority: 2-3 days\n• Low Priority: Up to 1 week\n\nYou'll receive notifications on status updates.",
        category: "complaints",
        keywords: ["resolve", "time", "how long", "complaint", "wait"]
    },
    // WiFi & Internet
    {
        question: "What is the WiFi password?",
        answer: "WiFi Details:\n• Network: Hostel_Student_5G\n• Password: Learn@Hostel2025\n• Speed: Up to 100 Mbps\n\nFor slow internet issues, register a complaint or contact IT support.",
        category: "facilities",
        keywords: ["wifi", "password", "internet", "network", "5g"]
    },
    // Fees & Payments
    {
        question: "How do I pay hostel fees?",
        answer: "Payment methods:\n• Online: UPI, Net Banking, Cards\n• Offline: Cash/DD at hostel office\n• Due Date: 10th of every month\n\nCheck your invoice in Dashboard → Invoices. Late payment incurs 2% penalty.",
        category: "fees",
        keywords: ["pay", "fee", "payment", "invoice", "dues", "bill"]
    },
    {
        question: "What is the hostel fee structure?",
        answer: "Standard fee structure:\n• Room Rent: ₹5,000-8,000/month (varies by room type)\n• Mess Charges: ₹4,000/month\n• Electricity: As per usage\n• One-time Security Deposit: ₹10,000\n\nCheck Dashboard → Invoices for your exact charges.",
        category: "fees",
        keywords: ["fee", "structure", "rent", "charges", "cost", "price"]
    },
    // Leave & Permission
    {
        question: "How do I apply for leave?",
        answer: "To apply for leave:\n1. Go to Dashboard → Leave Requests\n2. Select leave type (Home/Outing)\n3. Enter dates and reason\n4. Submit for approval\n\nOr tell the chatbot 'I want to apply for leave'. Get approval before leaving!",
        category: "leave",
        keywords: ["leave", "apply", "home", "vacation", "permission"]
    },
    {
        question: "How do I get a gate pass?",
        answer: "Gate pass process:\n1. Apply through Dashboard → Permissions\n2. Select 'Night Out' or 'Day Out'\n3. Enter destination and contact\n4. Wait for warden approval\n\nApproved passes are shown at the gate. Emergency cases get quick approval.",
        category: "leave",
        keywords: ["gate pass", "permission", "night out", "outing"]
    },
    // Facilities
    {
        question: "What are the gym timings?",
        answer: "Gym Timings:\n• Morning: 6:00 AM - 9:00 AM\n• Evening: 5:00 PM - 9:00 PM\n• Location: Ground Floor, Block B\n• Closed on Sundays for maintenance",
        category: "facilities",
        keywords: ["gym", "workout", "timing", "fitness", "exercise"]
    },
    {
        question: "How does the laundry service work?",
        answer: "Laundry Service:\n• Drop-off: Before 10:00 AM\n• Pickup: Next day 5:00 PM\n• Charges: ₹50/kg\n• Location: Behind Block A\n\nDelicate items should be marked. Lost items are compensated.",
        category: "facilities",
        keywords: ["laundry", "washing", "clothes", "dry clean"]
    },
    // Emergency
    {
        question: "What are the emergency contacts?",
        answer: "🚨 EMERGENCY CONTACTS:\n• Warden: +91 98765 43210\n• Security: 011-23456789\n• Ambulance: 108\n• Fire: 101\n• Police: 100\n• Hospital (nearest): City Hospital - 2km",
        category: "emergency",
        keywords: ["emergency", "contact", "warden", "security", "ambulance", "help"]
    }
];

// ========== ADMIN FAQs ==========
const adminFAQs = [
    {
        question: "How do I manage student complaints efficiently?",
        answer: "Complaint management tips:\n1. Check 'Urgent' filter for priority issues\n2. Use bulk actions for similar complaints\n3. Set AI auto-priority (enabled in settings)\n4. Export reports weekly for analysis\n\nThe AI chatbot can give you a summary anytime - just ask 'Show complaint summary'.",
        category: "management",
        keywords: ["complaint", "manage", "efficient", "priority"]
    },
    {
        question: "How do I generate invoices for students?",
        answer: "Invoice generation:\n1. Go to Admin Dashboard → Invoices\n2. Click 'Generate Monthly Invoices'\n3. Select month and fee components\n4. Review and confirm\n\nInvoices are auto-sent to student emails. Bulk generation available for all students.",
        category: "invoices",
        keywords: ["invoice", "generate", "bill", "fee", "payment"]
    },
    {
        question: "How do I download reports?",
        answer: "To download reports:\n1. Ask the chatbot 'Download report'\n2. Or go to Dashboard → Reports\n3. Select report type (Students, Complaints, Invoices, Attendance)\n4. Choose format (Excel/CSV/PDF)\n\nReports can be scheduled for automatic weekly/monthly delivery.",
        category: "reports",
        keywords: ["download", "report", "excel", "export", "csv"]
    },
    {
        question: "How do I register a new student?",
        answer: "Student registration:\n1. Go to Admin Dashboard → Register Student\n2. Fill required fields (Name, Email, CMS ID, Room)\n3. System generates login credentials\n4. Student receives welcome email\n\nBulk registration available via Excel upload.",
        category: "students",
        keywords: ["register", "new", "student", "add", "enroll"]
    },
    {
        question: "How do I manage room allocations?",
        answer: "Room management:\n1. Go to Admin Dashboard → Rooms\n2. View occupancy status\n3. Click on a room to allocate/vacate\n4. Transfer students between rooms as needed\n\nThe system prevents over-allocation automatically.",
        category: "rooms",
        keywords: ["room", "allocate", "assign", "transfer", "vacant"]
    },
    {
        question: "How do I mark attendance?",
        answer: "Attendance marking:\n1. Go to Admin Dashboard → Attendance\n2. Select date and hostel/floor\n3. Mark present/absent for each student\n4. Submit attendance\n\nBulk marking and biometric integration available in Pro plan.",
        category: "attendance",
        keywords: ["attendance", "mark", "present", "absent"]
    },
    {
        question: "How do I approve leave requests?",
        answer: "Leave approval process:\n1. Go to Admin Dashboard → Leave Requests\n2. Review pending requests\n3. Check student history if needed\n4. Approve or Reject with comments\n\nStudents automatically receive notification of your decision.",
        category: "leave",
        keywords: ["leave", "approve", "reject", "request", "permission"]
    },
    {
        question: "Where can I see AI analytics?",
        answer: "AI Analytics Dashboard:\n1. Go to Admin Dashboard → AI Analytics\n2. View complaint predictions, trends, patterns\n3. See chatbot usage statistics\n4. Get AI-recommended actions\n\nOr ask the chatbot 'Show trends' or 'Predict complaints for next week'.",
        category: "analytics",
        keywords: ["analytics", "ai", "prediction", "trend", "insight"]
    }
];

// ========== SUPER ADMIN FAQs ==========
const superAdminFAQs = [
    {
        question: "How do I add a new organization?",
        answer: "To add a new organization:\n1. Go to Super Admin Dashboard → Organizations\n2. Click 'Add New Organization'\n3. Enter org name, slug, and admin email\n4. Select subscription plan\n5. Admin receives login credentials via email\n\nOr ask me 'Create organization' for guidance.",
        category: "organization",
        keywords: ["add", "new", "organization", "create", "tenant"]
    },
    {
        question: "What subscription plans are available?",
        answer: "Subscription Plans:\n\n🆓 **Free**: Up to 50 students, basic features\n⭐ **Starter** (₹2,999/mo): Up to 200 students, email support\n🚀 **Professional** (₹7,999/mo): Up to 500 students, AI analytics\n🏆 **Enterprise** (Custom): Unlimited, dedicated support\n\nAll plans include the AI chatbot.",
        category: "subscription",
        keywords: ["plan", "subscription", "pricing", "tier", "cost"]
    },
    {
        question: "How do I check system health?",
        answer: "System health check:\n1. Ask me 'System status'\n2. Or go to Super Admin Dashboard → System\n3. View server uptime, memory usage, DB status\n4. Check service health (Email, Socket.IO, AI)\n\nAlerts are sent automatically if any service goes down.",
        category: "system",
        keywords: ["health", "system", "status", "server", "uptime"]
    },
    {
        question: "How do I manage organization subscriptions?",
        answer: "Subscription management:\n1. Go to Super Admin Dashboard → Organizations\n2. Select an organization\n3. Click 'Manage Subscription'\n4. Upgrade/downgrade plan or extend trial\n\nPayment integration with Razorpay available for auto-billing.",
        category: "subscription",
        keywords: ["subscription", "manage", "upgrade", "billing", "plan"]
    },
    {
        question: "How do I view platform analytics?",
        answer: "Platform analytics:\n1. Ask me 'Platform stats' or 'Global analytics'\n2. Or go to Super Admin Dashboard → Analytics\n3. View cross-organization metrics\n4. Export monthly reports\n\nMetrics include: total users, complaints, resolution rates, chatbot usage.",
        category: "analytics",
        keywords: ["analytics", "platform", "stats", "metrics", "report"]
    },
    {
        question: "How do I suspend an organization?",
        answer: "To suspend an organization:\n1. Go to Super Admin Dashboard → Organizations\n2. Select the organization\n3. Click 'Suspend'\n4. Enter reason for suspension\n\nSuspended orgs lose access but data is preserved. Can be reactivated anytime.",
        category: "organization",
        keywords: ["suspend", "deactivate", "block", "organization"]
    }
];

// ========== GENERAL FAQs (All Roles) ==========
const generalFAQs = [
    {
        question: "How do I reset my password?",
        answer: "To reset your password:\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your registered email\n4. Check email for reset link\n5. Create new password\n\nLink expires in 1 hour. Contact support if issues persist.",
        category: "account",
        keywords: ["password", "reset", "forgot", "change", "login"]
    },
    {
        question: "How do I contact support?",
        answer: "Support channels:\n• Email: support@hostelease.com\n• Chat: Talk to AI assistant (me!) 24/7\n• Phone: Office hours only - check dashboard\n• Ticket: Dashboard → Help → Submit Ticket\n\nAI assistant resolves 80% of queries instantly!",
        category: "support",
        keywords: ["support", "help", "contact", "issue", "problem"]
    },
    {
        question: "What is Hostel Ease?",
        answer: "Hostel Ease is a complete hostel management platform featuring:\n• Student & room management\n• Complaint tracking with AI priority\n• Mess & attendance management\n• Invoicing & payments\n• AI-powered chatbot (that's me!)\n• Multi-organization support (SaaS)\n\nDesigned for colleges, universities, and hostels.",
        category: "about",
        keywords: ["hostel ease", "what is", "about", "features", "platform"]
    }
];

async function seedFAQs() {
    try {
        console.log('🌱 Starting FAQ seeding...\n');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all organizations
        const organizations = await Organization.find();

        if (organizations.length === 0) {
            console.log('⚠️  No active organizations found. Creating global FAQs only...');
        } else {
            console.log(`📋 Found ${organizations.length} active organizations\n`);
        }

        let totalCreated = 0;

        // Seed FAQs for each organization
        for (const org of organizations) {
            console.log(`🏢 Seeding FAQs for: ${org.name}`);

            // Student FAQs
            for (const faq of studentFAQs) {
                try {
                    await FAQEmbedding.findOneAndUpdate(
                        { organizationId: org._id, question: faq.question },
                        {
                            organizationId: org._id,
                            question: faq.question,
                            answer: faq.answer,
                            category: faq.category,
                            role: 'student',
                            keywords: faq.keywords,
                            isActive: true
                        },
                        { upsert: true, new: true }
                    );
                    totalCreated++;
                } catch (e) {
                    // Skip duplicates
                }
            }
            console.log(`   ✅ ${studentFAQs.length} student FAQs`);

            // Admin FAQs
            for (const faq of adminFAQs) {
                try {
                    await FAQEmbedding.findOneAndUpdate(
                        { organizationId: org._id, question: faq.question },
                        {
                            organizationId: org._id,
                            question: faq.question,
                            answer: faq.answer,
                            category: faq.category,
                            role: 'admin',
                            keywords: faq.keywords,
                            isActive: true
                        },
                        { upsert: true, new: true }
                    );
                    totalCreated++;
                } catch (e) {
                    // Skip duplicates
                }
            }
            console.log(`   ✅ ${adminFAQs.length} admin FAQs`);

            // General FAQs
            for (const faq of generalFAQs) {
                try {
                    await FAQEmbedding.findOneAndUpdate(
                        { organizationId: org._id, question: faq.question },
                        {
                            organizationId: org._id,
                            question: faq.question,
                            answer: faq.answer,
                            category: faq.category,
                            role: 'general',
                            keywords: faq.keywords,
                            isActive: true
                        },
                        { upsert: true, new: true }
                    );
                    totalCreated++;
                } catch (e) {
                    // Skip duplicates
                }
            }
            console.log(`   ✅ ${generalFAQs.length} general FAQs\n`);
        }

        // Seed Super Admin FAQs (global, no orgId)
        console.log('👑 Seeding Super Admin FAQs (global)...');
        for (const faq of superAdminFAQs) {
            try {
                await FAQEmbedding.findOneAndUpdate(
                    { organizationId: null, question: faq.question, role: 'super_admin' },
                    {
                        organizationId: null,
                        question: faq.question,
                        answer: faq.answer,
                        category: faq.category,
                        role: 'super_admin',
                        keywords: faq.keywords,
                        isActive: true
                    },
                    { upsert: true, new: true }
                );
                totalCreated++;
            } catch (e) {
                // Skip duplicates
            }
        }
        console.log(`   ✅ ${superAdminFAQs.length} super admin FAQs\n`);

        // Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ FAQ SEEDING COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const totalFAQs = await FAQEmbedding.countDocuments();
        console.log(`📊 Total FAQs in database: ${totalFAQs}`);
        console.log(`   • Student FAQs: ${studentFAQs.length} per org`);
        console.log(`   • Admin FAQs: ${adminFAQs.length} per org`);
        console.log(`   • General FAQs: ${generalFAQs.length} per org`);
        console.log(`   • Super Admin FAQs: ${superAdminFAQs.length} (global)`);
        console.log(`\n🎉 Chatbot knowledge base is now populated!`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Connection closed');
        process.exit(0);
    }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                                                            ║');
console.log('║     CHATBOT FAQ SEEDING - Role-Specific Knowledge Base    ║');
console.log('║                                                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

seedFAQs();
