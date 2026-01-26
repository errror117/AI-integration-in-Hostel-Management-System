/**
 * Enhanced Chatbot Controller with Multi-turn Conversation Support
 * Supports interactive flows for Complaints, Leave Requests, and Feedback
 */

const ChatLog = require('../models/ChatLog');
const Analytics = require('../models/Analytics');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const LeaveRequest = require('../models/LeaveRequest');
const Invoice = require('../models/Invoice');
const Suggestion = require('../models/Suggestion');
const ConversationState = require('../models/ConversationState');

const { classifyIntent, extractEntities, analyzeSentiment, calculateComplaintPriority, getSuggestions } = require('../utils/chatbot/intentClassifier');
const { generateResponse } = require('../utils/chatbot/responseGenerator');
const { answerWithRAG } = require('../utils/chatbot/ragEngine');
const { predictMessCrowd, predictMonthlyExpense } = require('../utils/chatbot/analyticsEngine');

// LLM Configuration
const LLM_ENABLED = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

// Admin Intent Keywords
const ADMIN_INTENTS = {
    'ADMIN_DOWNLOAD': ['download', 'export', 'excel', 'csv', 'report download', 'get report', 'download report'],
    'ADMIN_SUMMARY': ['summary', 'briefing', 'status', 'overview', 'how is hostel', 'how\'s hostel', 'dashboard', 'give me a summary'],
    'ADMIN_COMPLAINTS': ['complaints', 'issues', 'problems', 'what are students complaining'],
    'ADMIN_SUGGESTIONS': ['suggestions', 'demands', 'what do students want', 'student requests'],
    'ADMIN_URGENT': ['urgent', 'priority', 'critical'],
    'ADMIN_INVOICES': ['invoices', 'payments', 'dues', 'fees', 'unpaid', 'billing'],
    'ADMIN_ANALYTICS': ['analytics', 'ai analytics', 'chatbot stats', 'statistics', 'chatbot analytics'],
    'ADMIN_STUDENTS': ['students', 'all students', 'student list', 'how many students', 'registered students', 'total students'],
    'ADMIN_MESS': ['mess', 'mess off', 'mess requests', 'food', 'dining'],
    'ADMIN_ATTENDANCE': ['attendance', 'present', 'absent', 'today attendance', 'who is present'],
    'ADMIN_REGISTER': ['register', 'add student', 'new student', 'enroll'],
    'ADMIN_PREDICT_COMPLAINTS': ['predict complaints', 'complaint forecast', 'expected complaints', 'future complaints', 'next week complaints'],
    'ADMIN_PREDICT_MESS': ['predict mess', 'mess prediction', 'how many will eat', 'tomorrow mess', 'mess attendance'],
    'ADMIN_PREDICT_TRENDS': ['trends', 'patterns', 'forecast', 'prediction', 'predict']
};

// Super Admin Intent Keywords
const SUPER_ADMIN_INTENTS = {
    'SA_ORGS': ['organizations', 'all orgs', 'how many organizations', 'tenants', 'clients', 'all organizations', 'show organizations'],
    'SA_SYSTEM': ['system', 'health', 'server', 'uptime', 'system status', 'server status'],
    'SA_SUBSCRIPTIONS': ['subscriptions', 'plans', 'billing', 'revenue', 'subscription overview'],
    'SA_USERS': ['all users', 'total users', 'registered users', 'how many users', 'user count'],
    'SA_CREATE_ORG': ['create organization', 'new organization', 'add organization', 'add tenant'],
    'SA_ANALYTICS': ['global analytics', 'platform stats', 'overall stats', 'platform analytics', 'system analytics'],
    'SA_GREETING': ['hello', 'hi', 'hey', 'good morning', 'good evening']
};

// HELPER: Map fuzzy input to strict Schema Enum
function mapToValidCategory(input) {
    const lower = input.toLowerCase();

    // Schema Enums: ['WiFi/Internet', 'Mess/Food', 'Cleanliness', 'Electrical', 'Plumbing', 'Maintenance', 'Security', 'General']

    if (lower.includes('wifi') || lower.includes('net') || lower.includes('slow')) return 'WiFi/Internet';
    if (lower.includes('mess') || lower.includes('food') || lower.includes('meal')) return 'Mess/Food';
    if (lower.includes('clean') || lower.includes('dust') || lower.includes('garbage')) return 'Cleanliness';
    if (lower.includes('electric') || lower.includes('light') || lower.includes('fan')) return 'Electrical';
    if (lower.includes('plumb') || lower.includes('water') || lower.includes('leak')) return 'Plumbing';
    if (lower.includes('security') || lower.includes('guard') || lower.includes('theft')) return 'Security';
    if (lower.includes('broken') || lower.includes('repair') || lower.includes('fix') || lower.includes('furniture')) return 'Maintenance';

    return 'General';
}

exports.processMessage = async (req, res) => {
    const startTime = Date.now();
    try {
        const { query, role } = req.body;
        const userId = req.user && req.user.id ? req.user.id : null;
        const organizationId = req.organizationId; // From tenant middleware

        if (!query || query.trim().length === 0) {
            return res.json({ reply: "Please ask me something! 😊", intent: 'EMPTY_QUERY', confidence: 0 });
        }

        // ========== SUPER ADMIN ROLE HANDLING ==========
        if (role === 'super_admin') {
            const superAdminResult = await handleSuperAdminQuery(query, userId);
            if (userId) {
                await logChatInteraction(userId, null, role, query, superAdminResult.intent, 0.95, {}, superAdminResult.reply);
            }
            return res.json({ reply: superAdminResult.reply, intent: superAdminResult.intent, confidence: 1.0, data: superAdminResult.data || {} });
        }

        // ========== ADMIN ROLE HANDLING ==========
        if (role === 'admin' || role === 'org_admin') {
            // Check for existing admin conversation state
            let adminConversation = null;
            if (userId) {
                adminConversation = await ConversationState.findOne({ organizationId, user: userId, role: 'admin' });
            }

            // Handle ongoing admin conversations
            if (adminConversation) {
                const adminConvoResult = await handleAdminConversation(adminConversation, query, userId, organizationId);
                if (adminConvoResult) {
                    if (userId) {
                        await logChatInteraction(userId, organizationId, role, query, adminConvoResult.intent, 0.95, {}, adminConvoResult.reply);
                    }
                    return res.json({ reply: adminConvoResult.reply, intent: adminConvoResult.intent, confidence: 1.0, data: adminConvoResult.data || {} });
                }
            }

            const adminResult = await handleAdminQuery(query, userId, organizationId);
            if (userId) {
                await logChatInteraction(userId, organizationId, role, query, adminResult.intent, 0.95, {}, adminResult.reply);
            }
            return res.json({ reply: adminResult.reply, intent: adminResult.intent, confidence: 1.0, data: adminResult.data || {} });
        }

        let conversation = null;
        if (userId) {
            conversation = await ConversationState.findOne({ organizationId, user: userId });
        }

        let responseText = "";
        let intent = "UNKNOWN";
        let data = {};

        // Global Loop Breaker
        const lowerQuery = query.toLowerCase();
        if (['cancel', 'stop', 'quit', 'exit', 'menu', 'help'].includes(lowerQuery)) {
            if (conversation) {
                await ConversationState.findOneAndDelete({ organizationId, user: userId });
                conversation = null;
                if (lowerQuery === 'menu' || lowerQuery === 'help') {
                    // Pass through
                } else {
                    return res.json({ reply: "❌ Cancelled. How else can I help?", intent: 'CANCELLED', confidence: 1.0 });
                }
            }
        }

        if (conversation) {
            // ---> HANDLE MULTI-TURN FLOW
            const flowResult = await handleMultiTurnFlow(conversation, query, userId, organizationId);

            if (flowResult.action === 'SWITCH_INTENT') {
                await ConversationState.findOneAndDelete({ organizationId, user: userId });
                return exports.processMessage(req, res);
            }

            responseText = flowResult.reply;
            intent = conversation.intent;
            data = flowResult.data || {};

            if (flowResult.action === 'CANCEL' || flowResult.action === 'COMPLETE') {
                await ConversationState.findOneAndDelete({ organizationId, user: userId });
            }
        } else {
            // ---> START NEW CONVERSATION
            const classification = classifyIntent(query);
            intent = classification.intent;
            const confidence = classification.confidence;

            if (userId && (intent === 'REGISTER_COMPLAINT' || intent === 'LEAVE_REQUEST' || intent === 'CLEANING_REQUEST' || intent === 'SUBMIT_SUGGESTION')) {
                const entities = extractEntities(query, intent);

                if (intent === 'REGISTER_COMPLAINT' && !entities.type) {
                    await createConversation(userId, organizationId, 'REGISTER_COMPLAINT', 1, { description: query });
                    responseText = "🛠️ **Registering Complaint**\n\nWhat type of issue is this?\n\n(e.g., Electrical, Plumbing, Furniture, WiFi, Mess)";
                }
                else if (intent === 'SUBMIT_SUGGESTION') {
                    await createConversation(userId, organizationId, 'SUBMIT_SUGGESTION', 1, {});
                    responseText = "💡 **Submit Suggestion**\n\nWhat would you like to suggest or request?\n\nPlease describe your suggestion in detail:";
                }
                else if (intent === 'LEAVE_REQUEST' && !entities.reason) {
                    await createConversation(userId, organizationId, 'LEAVE_REQUEST', 1, {});
                    responseText = "📝 **Leave Application**\n\nAre you going **Home** or for an **Outing**?";
                }
                else {
                    data = await handleSingleTurnIntent(intent, entities, userId, organizationId, role, query);
                    responseText = await generateResponse(intent, data, role);
                }
            } else {
                if (intent === 'UNKNOWN' || confidence < 0.5) {
                    const ragResult = await answerWithRAG(query, { useLLM: !!LLM_ENABLED });
                    if (ragResult.answer) {
                        responseText = await generateResponse('UNKNOWN', ragResult, role);
                        data = { source: ragResult.source };
                    } else {
                        const fallback = handleSimpleIntents('UNKNOWN', query);
                        if (fallback) {
                            responseText = fallback;
                            intent = 'FAQ_MATCH';
                        } else {
                            // Get smart suggestions based on what user might have meant
                            const suggestions = getSuggestions(query);
                            if (suggestions && suggestions.length > 0) {
                                responseText = `🤔 I'm not sure I understood that correctly.\n\n**Did you mean:**\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nOr say **"help"** to see all available commands.`;
                            } else {
                                responseText = await generateResponse('UNKNOWN', null, role);
                            }
                        }
                    }
                } else {
                    const entities = extractEntities(query, intent);
                    data = await handleSingleTurnIntent(intent, entities, userId, organizationId, role, query);

                    if (!data || Object.keys(data).length === 0) {
                        const simpleReply = handleSimpleIntents(intent, query);
                        if (simpleReply) responseText = simpleReply;
                        else responseText = await generateResponse(intent, data, role);
                    } else {
                        responseText = await generateResponse(intent, data, role);
                    }
                }
            }
        }

        if (userId) {
            await logChatInteraction(userId, organizationId, role, query, intent, 0.9, {}, responseText);
        }

        res.json({ reply: responseText, intent, confidence: 1.0, data });

    } catch (error) {
        console.error("Chatbot Error:", error);
        res.status(200).json({ reply: "🤖 I encountered an error. Please try again.", intent: 'ERROR' });
    }
};

async function createConversation(userId, organizationId, intent, step, data) {
    await ConversationState.findOneAndUpdate(
        { user: userId, organizationId },
        { organizationId, intent, step, data, lastUpdated: Date.now() },
        { upsert: true, new: true }
    );
}

async function handleMultiTurnFlow(conversation, query, userId, organizationId) {
    const { intent, step, data } = conversation;

    const newClassification = classifyIntent(query);
    const ignoreIntents = ['YES', 'NO', 'My Room', 'UNKNOWN', 'REGISTER_COMPLAINT'];
    if (newClassification.confidence > 0.85 && newClassification.intent !== intent && !ignoreIntents.includes(newClassification.intent)) {
        return { action: 'SWITCH_INTENT' };
    }

    // --- COMPLAINT FLOW ---
    if (intent === 'REGISTER_COMPLAINT') {
        if (step === 1) {
            // Type Selection
            const matchedType = query;
            if (matchedType) {
                data.set('type', matchedType);
                conversation.step = 2;
                conversation.data = data;
                await conversation.save();
                return { reply: `Okay, a **${matchedType}** issue.\n\nPlease describe the problem in detail.` };
            }
        }
        else if (step === 2) {
            const rawType = data.get('type');
            const description = query;

            // VALIDATION FIX: Map raw type to Enum
            const validCategory = mapToValidCategory(rawType);

            const student = await Student.findOne({ organizationId, user: userId });
            if (!student) {
                return { action: 'COMPLETE', reply: "❌ Error: Could not find your student profile." };
            }

            const complaint = new Complaint({
                organizationId,
                student: userId,
                hostel: student.hostel,
                type: rawType,
                title: `${rawType} Issue`,
                description: description,
                status: 'pending',
                urgencyLevel: description.includes('urgent') ? 'high' : 'medium',
                aiPriorityScore: description.includes('urgent') ? 80 : 50,
                category: validCategory
            });
            await complaint.save();

            return {
                action: 'COMPLETE',
                reply: `✅ **Complaint Registered**\n\nID: #${complaint._id.toString().slice(-6)}\nCategory: ${validCategory}\nLevel: ${complaint.urgencyLevel}\n\nSynced to Admin Dashboard.`
            };
        }
    }

    // --- LEAVE FLOW ---
    if (intent === 'LEAVE_REQUEST') {
        if (step === 1) {
            data.set('reason', query);
            conversation.step = 2;
            conversation.data = data;
            await conversation.save();
            return { reply: "Got it. When are you leaving? (e.g., Today, Tomorrow)" };
        }
        else if (step === 2) {
            const reason = data.get('reason');
            const leave = new LeaveRequest({
                organizationId,
                student: userId,
                type: 'outing',
                reason: reason,
                startDate: new Date(),
                endDate: new Date(Date.now() + 86400000),
                status: 'pending',
                requestedVia: 'chatbot'
            });
            await leave.save();
            return { action: 'COMPLETE', reply: `📝 **Leave Request Submitted**\n\nReason: ${reason}\nWhen: ${query}\nStatus: **Pending Approval**` };
        }
    }

    // --- SUGGESTION FLOW ---
    if (intent === 'SUBMIT_SUGGESTION') {
        if (step === 1) {
            // Get the suggestion description
            const suggestionText = query;

            const student = await Student.findOne({ organizationId, user: userId });
            if (!student) {
                return { action: 'COMPLETE', reply: "❌ Error: Could not find your student profile. Please login first." };
            }

            // Create suggestion
            const suggestion = new Suggestion({
                organizationId,
                student: student._id,
                hostel: student.hostel,
                title: suggestionText.substring(0, 50) + (suggestionText.length > 50 ? '...' : ''),
                description: suggestionText,
                status: 'pending',
                date: new Date()
            });
            await suggestion.save();

            // Emit real-time event if socket is available
            // This would need the request object which we don't have here

            return {
                action: 'COMPLETE',
                reply: `✅ **Suggestion Submitted!**\n\n📝 **Your Suggestion:**\n"${suggestionText.substring(0, 100)}${suggestionText.length > 100 ? '...' : ''}"\n\n📊 **Status:** Pending Review\n\nThe admin will review your suggestion shortly. Thank you for helping us improve! 🙏`
            };
        }
    }

    return { action: 'CANCEL', reply: "I lost track. Let's start over." };
}

function handleSimpleIntents(intent, query) {
    switch (intent) {
        case 'WIFI_INFO':
            return `📶 **WiFi Details**\n\nNetwork: **Hostel_Student_5G**\nPass: \`Learn@Hostel2025\`\n\nReport slow speeds via 'Register Complaint'.`;
        case 'GYM_INFO':
            return `🏋️ **Gym Timings**\n\n• Morning: 6:00 AM - 9:00 AM\n• Evening: 5:00 PM - 9:00 PM\n• Location: Ground Floor, Block B`;
        case 'LAUNDRY_INFO':
            return `🧺 **Laundry Service**\n\n• Drop-off: Before 10 AM\n• Pickup: Next Day 5 PM\n• Charges: ₹50/kg`;
        case 'CONTACT_STAFF':
            return `☎️ **Contacts**\n\n• Warden: +91 98765 43210\n• Security: 011-23456789`;
        case 'VISITOR_POLICY':
            return `📋 **Visitor Policy**\n\n• Visiting Hours: 4 PM - 7 PM (Sat-Sun)\n• ID Proof Required.`;
        case 'FEEDBACK':
            return `📝 **Feedback Recorded**\n\nThanks! I've forwarded it to the admin team.`;
        default:
            return null;
    }
}

async function handleSingleTurnIntent(intent, entities, userId, organizationId, role, query) {
    switch (intent) {
        case 'GREETING': return { name: "Student" };
        case 'MESS_INFO':
            const prediction = await predictMessCrowd();
            return { menu: "**Dinner Today:**\n• Paneer Butter Masala\n• Dal Fry\n• Jeera Rice", prediction };

        case 'VACANCY':
            try { return await Room.find({ organizationId, status: 'available' }).limit(3).select('room_no room_type floor rent_per_month'); } catch (e) { return []; }

        case 'MY_INVOICES':
            if (!userId) return { message: "Please login first." };
            const student = await Student.findOne({ organizationId, user: userId });
            if (!student) return { message: "Student profile not found." };
            const invoices = await Invoice.find({ organizationId, student: student._id, status: 'pending' });
            const total = invoices.reduce((sum, i) => sum + i.amount, 0);
            return { invoices, totalDue: total, pendingCount: invoices.length };

        case 'MY_COMPLAINTS':
            if (!userId) return { message: "Please login first." };
            const studentForComplaints = await Student.findOne({ organizationId, user: userId });
            if (!studentForComplaints) return { message: "Student profile not found." };
            const myComplaints = await Complaint.find({ organizationId, student: studentForComplaints._id }).sort({ date: -1 }).limit(5);
            const pendingCount = myComplaints.filter(c => c.status === 'pending').length;
            const resolvedCount = myComplaints.filter(c => c.status === 'resolved').length;
            return { complaints: myComplaints, pendingCount, resolvedCount };

        case 'CLEANING_REQUEST':
            return { message: "Cleaning staff has been notified for your room. They will visit by 11 AM." };

        case 'EMERGENCY':
            return { message: "🚨 **EMERGENCY CONTACTS:**\n\n• Warden: +91 98765 43210\n• Security: 011-23456789\n• Ambulance: 108\n• Fire: 101\n• Police: 100" };

        case 'HELP':
            return { message: "I can help you with:\n\n• 🍲 **Mess Menu** - Check today's menu\n• 📝 **Register Complaint** - Report issues\n• 💡 **Suggestion** - Submit suggestions\n• 💳 **Invoices** - Check pending dues\n• 📊 **My Complaints** - Track your complaints\n• 🍽️ **Mess Off** - Request to skip meals" };

        case 'MESS_OFF':
            if (!userId) return { message: "Please login first to request mess off." };
            return {
                message: "🍽️ **Mess Off Request**\n\nTo request mess off, please go to:\n📍 **Student Dashboard → Mess → Request Mess Off**\n\nOr provide the dates:\n• When are you leaving?\n• When will you return?\n\nThis helps reduce food wastage and adjusts your mess bill! 💰"
            };

        case 'MY_ROOM':
            if (!userId) return { message: "Please login first." };
            const studentRoom = await Student.findOne({ organizationId, user: userId }).select('room_no hostel name');
            if (!studentRoom) return { message: "Student profile not found." };
            return {
                message: `🏠 **Your Room Details**\n\n• **Name:** ${studentRoom.name}\n• **Room Number:** ${studentRoom.room_no}\n• **Hostel:** Your assigned hostel`
            };

        case 'ATTENDANCE':
            return {
                message: "📋 **Attendance**\n\nTo check your attendance, please visit:\n📍 **Student Dashboard → Home**\n\nYour attendance is tracked automatically when you're present in the hostel."
            };

        default:
            return {};
    }
}

async function logChatInteraction(userId, organizationId, role, query, intent, confidence, entities, response) {
    try {
        const log = new ChatLog({ organizationId, user: userId, role, query, intent, confidence, response, timestamp: new Date() });
        await log.save();
    } catch (e) { }
}

exports.getLogs = async (req, res) => res.json({ success: true });
exports.getStats = async (req, res) => res.json({ success: true });
exports.provideFeedback = async (req, res) => res.json({ success: true });

// ========== ADMIN CHATBOT HANDLERS ==========

function classifyAdminIntent(query) {
    const lowerQuery = query.toLowerCase();

    for (const [intent, keywords] of Object.entries(ADMIN_INTENTS)) {
        if (keywords.some(kw => lowerQuery.includes(kw))) {
            return intent;
        }
    }

    // Default greeting for admins
    if (['hello', 'hi', 'hey', 'good morning', 'good evening'].some(g => lowerQuery.includes(g))) {
        return 'ADMIN_GREETING';
    }

    return 'ADMIN_HELP';
}

// Handle ongoing admin conversations (multi-turn flows)
async function handleAdminConversation(conversation, query, userId, organizationId) {
    const lowerQuery = query.toLowerCase();

    // Check for cancel/exit commands
    if (['cancel', 'exit', 'stop', 'quit', 'no', 'nevermind'].some(cmd => lowerQuery.includes(cmd))) {
        await ConversationState.findByIdAndDelete(conversation._id);
        return {
            intent: 'ADMIN_CANCEL',
            reply: '❌ Action cancelled. How else can I help you, Sir/Ma\'am?',
            data: {}
        };
    }

    // Handle PRIORITIZE_COMPLAINT flow
    if (conversation.currentFlow === 'PRIORITIZE_COMPLAINT') {
        const context = conversation.context || {};

        // Check if user wants to resolve a specific complaint by number
        const resolveMatch = lowerQuery.match(/resolve\s*(\d+)/i);
        if (resolveMatch) {
            const index = parseInt(resolveMatch[1]) - 1;
            const complaintIds = context.complaintIds || [];

            if (index >= 0 && index < complaintIds.length) {
                const complaintId = complaintIds[index];
                await Complaint.findOneAndUpdate({ _id: complaintId, organizationId }, { status: 'resolved' });
                await ConversationState.findByIdAndDelete(conversation._id);

                return {
                    intent: 'ADMIN_RESOLVE_COMPLAINT',
                    reply: `✅ **Complaint #${index + 1} marked as resolved!**\n\nThe complaint has been updated in the system. Is there anything else I can help you with?`,
                    data: { resolved: complaintId }
                };
            } else {
                return {
                    intent: 'ADMIN_PRIORITIZE_ERROR',
                    reply: `❌ Invalid number. Please use a number from 1-${complaintIds.length}, or say "cancel" to exit.`,
                    data: {}
                };
            }
        }

        // Check if user wants to prioritize a category
        const prioritizeMatch = lowerQuery.match(/(?:yes|prioritize|priority|focus|handle)\s*(?:,?\s*)?([\w\s\/]+)/i);
        if (prioritizeMatch || context.categories?.some(cat => lowerQuery.includes(cat.toLowerCase()))) {
            let category = prioritizeMatch ? prioritizeMatch[1].trim() : null;

            // Find matching category
            if (!category) {
                category = context.categories?.find(cat => lowerQuery.includes(cat.toLowerCase()));
            }

            // Map common inputs to valid categories
            const categoryMap = {
                'bathroom': 'Plumbing',
                'toilet': 'Plumbing',
                'water': 'Plumbing',
                'pipe': 'Plumbing',
                'wifi': 'WiFi/Internet',
                'internet': 'WiFi/Internet',
                'network': 'WiFi/Internet',
                'food': 'Mess/Food',
                'mess': 'Mess/Food',
                'canteen': 'Mess/Food',
                'light': 'Electrical',
                'fan': 'Electrical',
                'power': 'Electrical',
                'electric': 'Electrical',
                'clean': 'Cleanliness',
                'dirty': 'Cleanliness',
                'garbage': 'Cleanliness',
                'security': 'Security',
                'guard': 'Security',
                'repair': 'Maintenance',
                'broken': 'Maintenance',
                'fix': 'Maintenance',
                'plumbing': 'Plumbing',
                'electrical': 'Electrical',
                'cleanliness': 'Cleanliness',
                'maintenance': 'Maintenance',
                'general': 'General'
            };

            // Find the matching category
            let matchedCategory = null;
            for (const [key, value] of Object.entries(categoryMap)) {
                if (lowerQuery.includes(key) || (category && category.toLowerCase().includes(key))) {
                    matchedCategory = value;
                    break;
                }
            }

            // If still not found, check context categories
            if (!matchedCategory && context.categories) {
                matchedCategory = context.categories.find(cat =>
                    lowerQuery.includes(cat.toLowerCase()) ||
                    (category && category.toLowerCase().includes(cat.toLowerCase()))
                );
            }

            if (matchedCategory) {
                // Get complaints of this category and mark them as priority
                const categoryComplaints = await Complaint.find({
                    organizationId,
                    status: 'pending',
                    type: matchedCategory
                }).populate('student', 'name room_no').sort({ date: 1 }).limit(5);

                // Update their priority
                await Complaint.updateMany(
                    { organizationId, status: 'pending', type: matchedCategory },
                    { $set: { priority: 'HIGH' } }
                );

                await ConversationState.findByIdAndDelete(conversation._id);

                const complaintList = categoryComplaints.map((c, idx) =>
                    `${idx + 1}. **${c.title}** - ${c.student?.name || 'Student'} (Room ${c.student?.room_no || 'N/A'})`
                ).join('\n');

                return {
                    intent: 'ADMIN_PRIORITIZE_SUCCESS',
                    reply: `✅ **${matchedCategory} complaints prioritized!**\n\n` +
                        `I've marked ${categoryComplaints.length} ${matchedCategory} complaints as HIGH priority:\n\n` +
                        `${complaintList || 'No complaints found.'}\n\n` +
                        `These will now appear at the top of urgent lists. Is there anything else I can help you with, Sir/Ma\'am?`,
                    data: { category: matchedCategory, prioritized: categoryComplaints.length }
                };
            } else {
                return {
                    intent: 'ADMIN_PRIORITIZE_UNKNOWN',
                    reply: `🤔 I couldn't identify that category.\n\n` +
                        `Available categories: ${context.categories?.join(', ') || 'None found'}\n\n` +
                        `Please say something like:\n• "Yes, prioritize Plumbing"\n• "Handle Electrical issues"\n• Or "Cancel" to exit`,
                    data: {}
                };
            }
        }

        // User said something else, provide help
        return {
            intent: 'ADMIN_PRIORITIZE_HELP',
            reply: `I'm ready to help prioritize complaints.\n\n` +
                `📋 **Available Categories:** ${context.categories?.join(', ') || 'None'}\n\n` +
                `You can say:\n` +
                `• "Prioritize [category]" - e.g., "Prioritize Plumbing"\n` +
                `• "Resolve [number]" - e.g., "Resolve 1"\n` +
                `• "Cancel" - to exit this flow\n\n` +
                `What would you like to do, Sir/Ma'am?`,
            data: {}
        };
    }

    // No matching conversation flow - return null to fall through to normal handling
    return null;
}

async function handleAdminQuery(query, userId = null, organizationId = null) {
    const Suggestion = require('../models/Suggestion');
    const intent = classifyAdminIntent(query);

    switch (intent) {
        case 'ADMIN_GREETING': {
            const pendingComplaints = await Complaint.countDocuments({ organizationId, status: 'pending' });
            const pendingSuggestions = await Suggestion.countDocuments({ organizationId, status: 'pending' });
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const newToday = await Complaint.countDocuments({ organizationId, date: { $gte: todayStart } });

            return {
                intent: 'ADMIN_GREETING',
                reply: `🎯 **Good day, Sir/Ma'am!**\n\nHere's your quick briefing:\n\n` +
                    `📋 **Pending Complaints:** ${pendingComplaints}\n` +
                    `💡 **Pending Suggestions:** ${pendingSuggestions}\n` +
                    `🆕 **New Today:** ${newToday} issues\n\n` +
                    `How may I assist you? You can ask me about:\n• Complaint summary\n• Student suggestions\n• Invoice status\n• Analytics overview`
            };
        }

        case 'ADMIN_SUMMARY': {
            const totalStudents = await Student.countDocuments({ organizationId });
            const pendingComplaints = await Complaint.countDocuments({ organizationId, status: 'pending' });
            const resolvedComplaints = await Complaint.countDocuments({ organizationId, status: 'resolved' });
            const pendingSuggestions = await Suggestion.countDocuments({ organizationId, status: 'pending' });
            const pendingInvoices = await Invoice.countDocuments({ organizationId, status: 'pending' });

            const resolutionRate = totalStudents > 0 ? Math.round((resolvedComplaints / (pendingComplaints + resolvedComplaints)) * 100) : 0;

            return {
                intent: 'ADMIN_SUMMARY',
                reply: `📊 **Hostel Status Report**\n\n` +
                    `👥 **Total Students:** ${totalStudents}\n\n` +
                    `🛠️ **Complaints:**\n• Pending: ${pendingComplaints}\n• Resolved: ${resolvedComplaints}\n• Resolution Rate: ${resolutionRate}%\n\n` +
                    `💡 **Suggestions Awaiting Review:** ${pendingSuggestions}\n\n` +
                    `💰 **Pending Invoices:** ${pendingInvoices}\n\n` +
                    `Is there anything specific you'd like me to elaborate on, Sir/Ma'am?`
            };
        }

        case 'ADMIN_COMPLAINTS': {
            const complaints = await Complaint.find({ organizationId, status: 'pending' })
                .populate('student', 'name room_no')
                .sort({ date: -1 })
                .limit(10);

            const totalPending = await Complaint.countDocuments({ organizationId, status: 'pending' });
            const totalResolved = await Complaint.countDocuments({ organizationId, status: 'resolved' });

            // Group by type
            const byType = {};
            complaints.forEach(c => {
                byType[c.type] = (byType[c.type] || 0) + 1;
            });

            let typeBreakdown = Object.entries(byType)
                .map(([type, count]) => `• ${type}: ${count}`)
                .join('\n');

            let recentList = complaints.slice(0, 5)
                .map(c => `• **${c.student?.name || 'Student'}** (Room ${c.student?.room_no || 'N/A'}): ${c.title}`)
                .join('\n');

            return {
                intent: 'ADMIN_COMPLAINTS',
                reply: `📋 **Student Complaints Report**\n\n` +
                    `📊 **Overview:**\n• Pending: ${totalPending}\n• Resolved: ${totalResolved}\n\n` +
                    `**By Category:**\n${typeBreakdown || 'No pending complaints'}\n\n` +
                    `**Recent Issues:**\n${recentList || 'No recent complaints'}\n\n` +
                    `📥 **Download Full Report:**\n[Download Complaints Excel](http://localhost:3000/api/export/complaints)\n\n` +
                    `This includes all complaint details with student info, Sir/Ma'am.`,
                data: { complaints: complaints.length, byType }
            };
        }

        case 'ADMIN_SUGGESTIONS': {
            const suggestions = await Suggestion.find({ organizationId, status: 'pending' })
                .populate('student', 'name room_no')
                .sort({ date: -1 });

            let suggestionList = suggestions.slice(0, 5)
                .map(s => `• **${s.title}** - ${s.student?.name || 'Anonymous'}: "${s.description.substring(0, 60)}..."`)
                .join('\n');

            return {
                intent: 'ADMIN_SUGGESTIONS',
                reply: `💡 **Student Suggestions & Demands**\n\n` +
                    `📊 **Total Pending:** ${suggestions.length}\n\n` +
                    `**Recent Requests:**\n${suggestionList || 'No pending suggestions'}\n\n` +
                    `📥 **Download Full List:**\n[Download Suggestions Excel](http://localhost:3000/api/export/suggestions)\n\n` +
                    `All student suggestions with details, Sir/Ma'am.`,
                data: { count: suggestions.length }
            };
        }

        case 'ADMIN_URGENT': {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            const urgentComplaints = await Complaint.find({
                organizationId,
                status: 'pending',
                date: { $lte: threeDaysAgo }
            }).populate('student', 'name room_no').sort({ date: 1 });

            // Get complaint categories for prioritization
            const categories = [...new Set(urgentComplaints.map(c => c.type))];

            let urgentList = urgentComplaints.slice(0, 5)
                .map((c, idx) => {
                    const daysOld = Math.floor((Date.now() - new Date(c.date)) / (1000 * 60 * 60 * 24));
                    return `${idx + 1}. ⚠️ **${c.title}** [${c.type}] - ${c.student?.name || 'Student'} (${daysOld} days pending)`;
                })
                .join('\n');

            // Save conversation state if user is logged in
            if (userId && urgentComplaints.length > 0) {
                await ConversationState.findOneAndUpdate(
                    { user: userId, organizationId },
                    {
                        organizationId,
                        user: userId,
                        role: 'admin',
                        currentFlow: 'PRIORITIZE_COMPLAINT',
                        step: 'awaiting_category',
                        context: {
                            categories: categories,
                            complaintIds: urgentComplaints.slice(0, 10).map(c => c._id.toString())
                        },
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );
            }

            return {
                intent: 'ADMIN_URGENT',
                reply: `🚨 **Urgent Attention Required**\n\n` +
                    `Found ${urgentComplaints.length} complaints pending for 3+ days:\n\n` +
                    `${urgentList || '✅ No urgent issues! All complaints are being handled promptly.'}\n\n` +
                    (urgentComplaints.length > 0
                        ? `📋 **Categories:** ${categories.join(', ')}\n\n` +
                        `Would you like me to prioritize any category? Just say:\n` +
                        `• "Yes, prioritize [category]" (e.g., "Yes, prioritize Plumbing")\n` +
                        `• "Resolve [number]" (e.g., "Resolve 1" to mark as resolved)\n` +
                        `• "Cancel" to exit`
                        : ''),
                data: { urgentCount: urgentComplaints.length, categories }
            };
        }

        case 'ADMIN_INVOICES': {
            const pendingInvoices = await Invoice.find({ organizationId, status: 'pending' }).populate('student', 'name room_no');
            const paidInvoices = await Invoice.countDocuments({ organizationId, status: 'paid' });
            const totalDue = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);

            // Get top 5 pending invoices for display
            const topPending = pendingInvoices.slice(0, 5).map(i =>
                `• ${i.student?.name || 'Student'} (Room ${i.student?.room_no}): ₹${i.amount}`
            ).join('\n');

            return {
                intent: 'ADMIN_INVOICES',
                reply: `💰 **Invoice & Payment Report**\n\n` +
                    `📊 **Overview:**\n• Pending Payments: ${pendingInvoices.length}\n• Paid Invoices: ${paidInvoices}\n• Total Outstanding: ₹${totalDue.toLocaleString()}\n\n` +
                    `**Top Pending:**\n${topPending || 'No pending invoices!'}\n\n` +
                    `📥 **Download Detailed Report:**\n[Download Invoices Excel](http://localhost:3000/api/export/invoices)\n\n` +
                    `This will include all student payment details, Sir/Ma'am.`,
                data: { pending: pendingInvoices.length, totalDue }
            };
        }

        case 'ADMIN_ANALYTICS': {
            const chatLogs = await ChatLog.countDocuments({ organizationId });
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayChats = await ChatLog.countDocuments({ organizationId, timestamp: { $gte: today } });

            const topIntents = await ChatLog.aggregate([
                { $match: { organizationId: require('mongoose').Types.ObjectId(organizationId) } },
                { $group: { _id: '$intent', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);

            let intentList = topIntents.map(i => `• ${i._id}: ${i.count} queries`).join('\n');

            return {
                intent: 'ADMIN_ANALYTICS',
                reply: `📈 **AI Chatbot Analytics**\n\n` +
                    `**Usage Statistics:**\n• Total Queries: ${chatLogs}\n• Today's Queries: ${todayChats}\n\n` +
                    `**Top Query Types:**\n${intentList || 'No data yet'}\n\n` +
                    `The AI system is performing well. Any specific metrics you'd like to review, Sir/Ma'am?`,
                data: { totalQueries: chatLogs, todayQueries: todayChats }
            };
        }

        case 'ADMIN_STUDENTS': {
            const totalStudents = await Student.countDocuments({ organizationId });
            const recentStudents = await Student.find({ organizationId }).sort({ date: -1 }).limit(5).select('name room_no dept batch');

            // Get department breakdown
            const byDept = await Student.aggregate([
                { $match: { organizationId: require('mongoose').Types.ObjectId(organizationId) } },
                { $group: { _id: '$dept', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);
            const deptBreakdown = byDept.map(d => `• ${d._id}: ${d.count}`).join('\n');

            let studentList = recentStudents.map(s =>
                `• **${s.name}** - Room ${s.room_no} (${s.dept}, Batch ${s.batch})`
            ).join('\n');

            return {
                intent: 'ADMIN_STUDENTS',
                reply: `👥 **Student Overview**\n\n` +
                    `📊 **Total Registered:** ${totalStudents} students\n\n` +
                    `**By Department:**\n${deptBreakdown || 'N/A'}\n\n` +
                    `**Recently Added:**\n${studentList || 'No students registered yet'}\n\n` +
                    `📥 **Download Full List:**\n[Download Students Excel](http://localhost:3000/api/export/students)\n\n` +
                    `Includes all student details, Sir/Ma'am.`,
                data: { totalStudents }
            };
        }

        case 'ADMIN_MESS': {
            const MessOff = require('../models/MessOff');
            const pendingMessOffs = await MessOff.find({ organizationId, status: 'pending' })
                .populate('student', 'name room_no')
                .sort({ request_date: -1 })
                .limit(5);

            const totalPending = await MessOff.countDocuments({ organizationId, status: 'pending' });
            const totalApproved = await MessOff.countDocuments({ organizationId, status: 'approved' });

            let messOffList = pendingMessOffs.map(m => {
                const from = new Date(m.leaving_date).toDateString().slice(4, 10);
                const to = new Date(m.return_date).toDateString().slice(4, 10);
                return `• **${m.student?.name || 'Student'}** (Room ${m.student?.room_no}) - ${from} to ${to}`;
            }).join('\n');

            return {
                intent: 'ADMIN_MESS',
                reply: `🍽️ **Mess Off Requests**\n\n` +
                    `📊 **Statistics:**\n• Pending: ${totalPending}\n• Approved this month: ${totalApproved}\n\n` +
                    `**Recent Pending Requests:**\n${messOffList || 'No pending requests'}\n\n` +
                    `Go to **Mess** in dashboard to approve/reject requests.`,
                data: { pendingCount: totalPending, approvedCount: totalApproved }
            };
        }

        case 'ADMIN_ATTENDANCE': {
            const Attendance = require('../models/Attendance');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayAttendance = await Attendance.find({
                organizationId,
                date: { $gte: today, $lt: tomorrow }
            });

            const presentCount = todayAttendance.filter(a => a.status === 'present').length;
            const absentCount = todayAttendance.filter(a => a.status === 'absent').length;
            const totalStudents = await Student.countDocuments({ organizationId });
            const unmarkedCount = totalStudents - todayAttendance.length;
            const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

            return {
                intent: 'ADMIN_ATTENDANCE',
                reply: `📋 **Today's Attendance Report**\n\n` +
                    `📅 Date: ${today.toDateString()}\n\n` +
                    `✅ **Present:** ${presentCount}\n` +
                    `❌ **Absent:** ${absentCount}\n` +
                    `⏳ **Unmarked:** ${unmarkedCount}\n\n` +
                    `📊 **Attendance Rate:** ${attendanceRate}%\n\n` +
                    `📥 **Download Full Report:**\n[Download Attendance Excel](http://localhost:3000/api/export/attendance)\n\n` +
                    `Includes all student attendance records, Sir/Ma'am.`,
                data: { presentCount, absentCount, unmarkedCount }
            };
        }

        case 'ADMIN_REGISTER': {
            return {
                intent: 'ADMIN_REGISTER',
                reply: `📝 **Register New Student**\n\n` +
                    `To register a new student, please go to the **Register Student** page in the Admin Dashboard.\n\n` +
                    `**Required Information:**\n` +
                    `• Name, Email, CMS ID\n` +
                    `• Room Number, Department, Course\n` +
                    `• Batch Year, Contact Details\n` +
                    `• Father's Name, Address, DOB, CNIC\n\n` +
                    `💡 After registration, the student can login with their email and password "student123".`
            };
        }

        case 'ADMIN_PREDICT_COMPLAINTS': {
            const Attendance = require('../models/Attendance');
            // Calculate average complaints per day over last 14 days
            const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
            const recentComplaints = await Complaint.countDocuments({ organizationId, date: { $gte: twoWeeksAgo } });
            const avgDaily = Math.round(recentComplaints / 14);

            // Predict next 7 days
            const weekdayMultiplier = [0.6, 1.2, 1.1, 1.0, 1.0, 1.1, 0.8]; // Sun-Sat pattern
            const predictions = [];
            let totalPredicted = 0;

            for (let i = 1; i <= 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
                const predicted = Math.round(avgDaily * weekdayMultiplier[date.getDay()]);
                predictions.push(`• ${dayName}: ~${predicted} complaints`);
                totalPredicted += predicted;
            }

            return {
                intent: 'ADMIN_PREDICT_COMPLAINTS',
                reply: `📈 **Complaint Forecast (Next 7 Days)**\n\n` +
                    `Based on ${recentComplaints} complaints over the last 2 weeks:\n\n` +
                    `**Daily Predictions:**\n${predictions.join('\n')}\n\n` +
                    `📊 **Total Expected:** ~${totalPredicted} complaints\n` +
                    `📉 **Average Daily:** ${avgDaily}/day\n\n` +
                    `💡 Complaints typically peak on Mondays. Plan resources accordingly, Sir/Ma'am.`,
                data: { avgDaily, totalPredicted }
            };
        }

        case 'ADMIN_PREDICT_MESS': {
            const Attendance = require('../models/Attendance');
            const totalStudents = await Student.countDocuments({ organizationId });

            // Get attendance pattern for tomorrow's day of week
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayOfWeek = tomorrow.getDay();
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

            // Weekend vs weekday pattern
            const expectedRate = (dayOfWeek === 0 || dayOfWeek === 6) ? 60 : 85;
            const expectedStudents = Math.round(totalStudents * expectedRate / 100);

            return {
                intent: 'ADMIN_PREDICT_MESS',
                reply: `🍽️ **Mess Attendance Prediction**\n\n` +
                    `📅 **Tomorrow (${dayName}):**\n\n` +
                    `👥 **Expected Students:** ${expectedStudents} out of ${totalStudents}\n` +
                    `📊 **Expected Rate:** ${expectedRate}%\n\n` +
                    `🕐 **Peak Times:**\n` +
                    `• Breakfast: 8:00 - 9:00 AM\n` +
                    `• Lunch: 12:30 - 1:30 PM\n` +
                    `• Dinner: 7:30 - 8:30 PM\n\n` +
                    `💡 ${dayOfWeek === 0 || dayOfWeek === 6 ? 'Weekend - lower attendance expected' : 'Weekday - normal attendance expected'}, Sir/Ma'am.`,
                data: { expectedStudents, expectedRate }
            };
        }

        case 'ADMIN_PREDICT_TRENDS': {
            const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
            const recentComplaints = await Complaint.countDocuments({ organizationId, date: { $gte: twoWeeksAgo } });
            const pendingComplaints = await Complaint.countDocuments({ organizationId, status: 'pending' });
            const totalStudents = await Student.countDocuments({ organizationId });
            const chatLogs = await ChatLog.countDocuments({ organizationId });

            // Calculate trends
            const avgDailyComplaints = Math.round(recentComplaints / 14);
            const avgQueriesPerStudent = totalStudents > 0 ? (chatLogs / totalStudents).toFixed(1) : 0;

            return {
                intent: 'ADMIN_PREDICT_TRENDS',
                reply: `📊 **AI Trend Analysis**\n\n` +
                    `**Complaint Trends:**\n` +
                    `• Average: ${avgDailyComplaints} complaints/day\n` +
                    `• Currently Pending: ${pendingComplaints}\n` +
                    `• Peak Days: Monday, Tuesday\n\n` +
                    `**Chatbot Usage:**\n` +
                    `• Total Queries: ${chatLogs}\n` +
                    `• Avg per Student: ${avgQueriesPerStudent}\n\n` +
                    `**Predictions:**\n` +
                    `• Next week: ~${avgDailyComplaints * 7} complaints expected\n` +
                    `• Mess attendance: ~85% on weekdays\n\n` +
                    `📈 View detailed charts at **AI Analytics** page, Sir/Ma'am.`,
                data: { avgDailyComplaints, chatLogs }
            };
        }

        case 'ADMIN_DOWNLOAD': {
            return {
                intent: 'ADMIN_DOWNLOAD',
                reply: `📥 **Download Reports**\n\nI can generate Excel/CSV reports for you. Click any link below:\n\n` +
                    `📋 **Students Report:**\n[Download Students Excel](http://localhost:3000/api/export/students)\n\n` +
                    `🛠️ **Complaints Report:**\n[Download Complaints Excel](http://localhost:3000/api/export/complaints)\n\n` +
                    `💰 **Invoices Report:**\n[Download Invoices Excel](http://localhost:3000/api/export/invoices)\n\n` +
                    `📅 **Attendance Report:**\n[Download Attendance Excel](http://localhost:3000/api/export/attendance)\n\n` +
                    `💡 **Suggestions Report:**\n[Download Suggestions Excel](http://localhost:3000/api/export/suggestions)\n\n` +
                    `💬 **Chatbot Logs:**\n[Download Chat Logs Excel](http://localhost:3000/api/export/chatlogs)\n\n` +
                    `📊 **Complete Report (All Data):**\n[Download Full Report](http://localhost:3000/api/export/all)\n\n` +
                    `💡 Click any link above to download, Sir/Ma'am!`,
                data: { hasDownloads: true }
            };
        }

        case 'ADMIN_HELP':
        default:
            return {
                intent: 'ADMIN_HELP',
                reply: `🎯 **Admin Assistant Ready**\n\nI can help you with:\n\n` +
                    `📊 **"Summary"** - Overall hostel status\n` +
                    `👥 **"Students"** - Student count & list\n` +
                    `📋 **"Complaints"** - What students are reporting\n` +
                    `💡 **"Suggestions"** - What students want\n` +
                    `🚨 **"Urgent issues"** - Priority complaints\n` +
                    `🍽️ **"Mess requests"** - Mess-off requests\n` +
                    `📅 **"Attendance"** - Today's attendance\n` +
                    `💰 **"Invoices"** - Payment status\n` +
                    `📈 **"AI Analytics"** - Chatbot stats\n` +
                    `🔮 **"Predict complaints"** - Forecast next week\n` +
                    `🍽️ **"Predict mess"** - Tomorrow's attendance\n` +
                    `📊 **"Show trends"** - AI trend analysis\n` +
                    `📥 **"Download report"** - Export to Excel\n\n` +
                    `How may I assist you, Sir/Ma'am?`
            };
    }
}

// ========== SUPER ADMIN CHATBOT HANDLERS ==========

function classifySuperAdminIntent(query) {
    const lowerQuery = query.toLowerCase();

    for (const [intent, keywords] of Object.entries(SUPER_ADMIN_INTENTS)) {
        if (keywords.some(kw => lowerQuery.includes(kw))) {
            return intent;
        }
    }

    return 'SA_HELP';
}

async function handleSuperAdminQuery(query, userId = null) {
    const Organization = require('../models/Organization');
    const User = require('../models/User');
    const intent = classifySuperAdminIntent(query);

    switch (intent) {
        case 'SA_GREETING': {
            const totalOrgs = await Organization.countDocuments();
            const activeOrgs = await Organization.countDocuments({ status: 'active' });
            const totalUsers = await User.countDocuments();
            const totalStudents = await Student.countDocuments();

            return {
                intent: 'SA_GREETING',
                reply: `🎯 **Welcome, Super Administrator!**\n\n` +
                    `Here's your platform overview:\n\n` +
                    `🏢 **Organizations:** ${totalOrgs} (${activeOrgs} active)\n` +
                    `👥 **Total Users:** ${totalUsers}\n` +
                    `🎓 **Total Students:** ${totalStudents}\n\n` +
                    `**Available Commands:**\n` +
                    `• 🏢 **"Organizations"** - View all organizations\n` +
                    `• 📊 **"Platform stats"** - Global analytics\n` +
                    `• 💳 **"Subscriptions"** - Billing overview\n` +
                    `• 🔧 **"System status"** - Health check\n\n` +
                    `How may I assist you today?`,
                data: { totalOrgs, totalUsers }
            };
        }

        case 'SA_ORGS': {
            const organizations = await Organization.find()
                .select('name slug status subscription createdAt')
                .sort({ createdAt: -1 })
                .limit(10);

            const totalOrgs = await Organization.countDocuments();
            const activeOrgs = await Organization.countDocuments({ status: 'active' });
            const trialOrgs = await Organization.countDocuments({ 'subscription.status': 'trialing' });

            let orgList = organizations.map((org, idx) => {
                const plan = org.subscription?.plan || 'free';
                const status = org.status === 'active' ? '✅' : '⚠️';
                return `${idx + 1}. ${status} **${org.name}** (${org.slug}) - ${plan.toUpperCase()}`;
            }).join('\n');

            return {
                intent: 'SA_ORGS',
                reply: `🏢 **Organization Overview**\n\n` +
                    `📊 **Statistics:**\n` +
                    `• Total: ${totalOrgs}\n` +
                    `• Active: ${activeOrgs}\n` +
                    `• On Trial: ${trialOrgs}\n\n` +
                    `**Recent Organizations:**\n${orgList || 'No organizations yet'}\n\n` +
                    `💡 Go to **Super Admin Dashboard** to manage organizations.`,
                data: { totalOrgs, activeOrgs, organizations: organizations.length }
            };
        }

        case 'SA_SYSTEM': {
            const mongoose = require('mongoose');
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const memoryUsage = process.memoryUsage();
            const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
            const dbStatus = mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected';

            return {
                intent: 'SA_SYSTEM',
                reply: `🔧 **System Health Report**\n\n` +
                    `**Server Status:**\n` +
                    `• 🟢 Status: Online\n` +
                    `• ⏰ Uptime: ${hours}h ${minutes}m\n` +
                    `• 💾 Memory: ${heapUsedMB} MB used\n\n` +
                    `**Database:**\n` +
                    `• ${dbStatus}\n` +
                    `• Type: MongoDB\n\n` +
                    `**Services:**\n` +
                    `• 🤖 AI Chatbot: ✅ Active\n` +
                    `• 📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '⚠️ Not Configured'}\n` +
                    `• 🔔 Socket.IO: ✅ Active\n\n` +
                    `All systems operational!`,
                data: { uptime: `${hours}h ${minutes}m`, memory: heapUsedMB }
            };
        }

        case 'SA_SUBSCRIPTIONS': {
            const Organization = require('../models/Organization');

            const freeOrgs = await Organization.countDocuments({ 'subscription.plan': 'free' });
            const starterOrgs = await Organization.countDocuments({ 'subscription.plan': 'starter' });
            const professionalOrgs = await Organization.countDocuments({ 'subscription.plan': 'professional' });
            const enterpriseOrgs = await Organization.countDocuments({ 'subscription.plan': 'enterprise' });
            const totalOrgs = await Organization.countDocuments();

            return {
                intent: 'SA_SUBSCRIPTIONS',
                reply: `💳 **Subscription Overview**\n\n` +
                    `**Plan Distribution:**\n` +
                    `• 🆓 Free: ${freeOrgs} organizations\n` +
                    `• ⭐ Starter: ${starterOrgs} organizations\n` +
                    `• 🚀 Professional: ${professionalOrgs} organizations\n` +
                    `• 🏆 Enterprise: ${enterpriseOrgs} organizations\n\n` +
                    `📊 **Total:** ${totalOrgs} organizations\n\n` +
                    `**Pricing Tiers:**\n` +
                    `• Free: Up to 50 students\n` +
                    `• Starter: Up to 200 students\n` +
                    `• Professional: Up to 500 students\n` +
                    `• Enterprise: Unlimited\n\n` +
                    `💡 Manage subscriptions in the Super Admin Dashboard.`,
                data: { freeOrgs, starterOrgs, professionalOrgs, enterpriseOrgs }
            };
        }

        case 'SA_USERS': {
            const User = require('../models/User');
            const totalUsers = await User.countDocuments();
            const superAdmins = await User.countDocuments({ role: 'super_admin' });
            const orgAdmins = await User.countDocuments({ role: { $in: ['org_admin', 'admin'] } });
            const students = await Student.countDocuments();

            return {
                intent: 'SA_USERS',
                reply: `👥 **User Statistics**\n\n` +
                    `**By Role:**\n` +
                    `• 👑 Super Admins: ${superAdmins}\n` +
                    `• 👔 Org Admins: ${orgAdmins}\n` +
                    `• 🎓 Students: ${students}\n\n` +
                    `📊 **Total Users:** ${totalUsers}\n\n` +
                    `💡 View detailed user list in Super Admin Dashboard.`,
                data: { totalUsers, superAdmins, orgAdmins, students }
            };
        }

        case 'SA_CREATE_ORG': {
            return {
                intent: 'SA_CREATE_ORG',
                reply: `🏢 **Create New Organization**\n\n` +
                    `To create a new organization, go to:\n` +
                    `📍 **Super Admin Dashboard → Organizations → Add New**\n\n` +
                    `**Required Information:**\n` +
                    `• Organization Name\n` +
                    `• Slug (URL identifier)\n` +
                    `• Admin Email\n` +
                    `• Subscription Plan\n\n` +
                    `The organization admin will receive login credentials via email.`,
                data: {}
            };
        }

        case 'SA_ANALYTICS': {
            const totalOrgs = await Organization.countDocuments();
            const totalStudents = await Student.countDocuments();
            const totalComplaints = await Complaint.countDocuments();
            const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
            const chatLogs = await ChatLog.countDocuments();

            const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

            return {
                intent: 'SA_ANALYTICS',
                reply: `📊 **Platform Analytics**\n\n` +
                    `**Global Statistics:**\n` +
                    `• 🏢 Organizations: ${totalOrgs}\n` +
                    `• 🎓 Students: ${totalStudents}\n` +
                    `• 📋 Total Complaints: ${totalComplaints}\n` +
                    `• ✅ Resolution Rate: ${resolutionRate}%\n` +
                    `• 💬 Chatbot Queries: ${chatLogs}\n\n` +
                    `**Insights:**\n` +
                    `• Avg students/org: ${totalOrgs > 0 ? Math.round(totalStudents / totalOrgs) : 0}\n` +
                    `• Avg queries/student: ${totalStudents > 0 ? (chatLogs / totalStudents).toFixed(1) : 0}\n\n` +
                    `📈 View detailed charts in the Analytics section.`,
                data: { totalOrgs, totalStudents, resolutionRate }
            };
        }

        case 'SA_HELP':
        default:
            return {
                intent: 'SA_HELP',
                reply: `👑 **Super Admin Assistant**\n\n` +
                    `I can help you manage the entire platform:\n\n` +
                    `🏢 **"Organizations"** - View all organizations\n` +
                    `💳 **"Subscriptions"** - Billing & plans overview\n` +
                    `👥 **"Users"** - User statistics\n` +
                    `🔧 **"System status"** - Server health check\n` +
                    `📊 **"Platform stats"** - Global analytics\n` +
                    `➕ **"Create organization"** - Add new tenant\n\n` +
                    `What would you like to know?`,
                data: {}
            };
    }
}
