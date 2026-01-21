/**
 * Deep Sync Verification Script
 * Simulates a real user flow to ensure Admin Sync (Hostel ID) is working
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./utils/conn');
const chatbotController = require('./controllers/chatbotController');
const ConversationState = require('./models/ConversationState');
const Student = require('./models/Student');
const Complaint = require('./models/Complaint');
const Hostel = require('./models/Hostel'); // Ensure Model exists

// Mock Express
const mockRes = () => {
    const res = {};
    res.json = (data) => { res.data = data; return res; };
    return res;
};

// Mock User (Need a real user ID from DB or mock one that matches Student Schema)
// We will look up a student first
const runIntegrationTest = async () => {
    console.log("🔍 Starting Integration Sync Test...");
    await connectDB();
    if (mongoose.connection.readyState !== 1) await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        // 1. Find a valid student to test with
        const student = await Student.findOne().populate('user');
        if (!student || !student.user) {
            console.error("❌ No student found in DB to test sync. Skipping.");
            process.exit(0);
        }
        
        console.log(`👤 Testing as Student: ${student.name} (Hostel: ${student.hostel})`);
        const userId = student.user._id || student.user; // Handle populated vs unpopulated
        
        // Cleanup old state
        await ConversationState.deleteMany({ user: userId });

        // 2. Start Complaint Flow
        console.log("\n▶️ Step 1: User says 'Register Complaint'");
        const req1 = { body: { query: "Register Complaint", role: "student" }, user: { id: userId } };
        const res1 = mockRes();
        await chatbotController.processMessage(req1, res1);
        console.log("🤖 Bot:", res1.data.reply);

        // 3. User Provides Type
        console.log("\n▶️ Step 2: User says 'WiFi'");
        const req2 = { body: { query: "WiFi", role: "student" }, user: { id: userId } };
        const res2 = mockRes();
        await chatbotController.processMessage(req2, res2);
        console.log("🤖 Bot:", res2.data.reply);

        // 4. User Provides Description (Trigger Save)
        console.log("\n▶️ Step 3: User says 'Internet is very slow'");
        const req3 = { body: { query: "Internet is very slow and urgent", role: "student" }, user: { id: userId } };
        const res3 = mockRes();
        await chatbotController.processMessage(req3, res3);
        console.log("🤖 Bot:", res3.data.reply);

        // 5. Verification: Check DB for Complaint
        console.log("\n🔍 Verifying Database Sync...");
        const complaint = await Complaint.findOne({ student: userId }).sort({ date: -1 });
        
        if (complaint) {
            console.log("✅ Complaint Created:", complaint._id);
            console.log("   • Hostel ID:", complaint.hostel);
            console.log("   • Priority:", complaint.urgencyLevel);
            
            // CRITICAL CHECK: Does it have hostel ID?
            if (complaint.hostel && complaint.hostel.toString() === student.hostel.toString()) {
                console.log("✅ SYNC SUCCESS: Hostel ID matches Student Profile!");
                console.log("   (This complaint WILL appear in Admin Panel)");
            } else {
                console.error("❌ SYNC FAIL: Hostel ID missing or mismatch!");
            }
        } else {
            console.error("❌ SYNC FAIL: No complaint found in DB!");
        }

        // 6. Loop Break Test
        console.log("\n🧪 Loop Break Test...");
        // Start flow again
        await chatbotController.processMessage(req1, mockRes());
        // Say 'Cancel'
        const reqCancel = { body: { query: "Cancel", role: "student" }, user: { id: userId } };
        const resCancel = mockRes();
        await chatbotController.processMessage(reqCancel, resCancel);
        
        if (resCancel.data.intent === 'CANCELLED') {
            console.log("✅ Loop Break Success: User cancelled flow.");
        } else {
            console.error("❌ Loop Break Fail");
        }

    } catch (error) {
        console.error("🚨 Integration Error:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

runIntegrationTest();
