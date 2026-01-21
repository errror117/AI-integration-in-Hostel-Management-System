/**
 * Enhanced Response Generator with LLM Support
 * Generates context-aware, dynamic responses with markdown formatting
 */

const { generateLLMAnswer } = require('./ragEngine');

/**
 * Generate response based on intent and data
 * @param {string} intent - Classified intent
 * @param {object} data - Response data
 * @param {string} role - User role (student/admin)
 * @param {object} options - Additional options (useLLM, apiKey, etc.)
 * @returns {string} - Generated response
 */
async function generateResponse(intent, data, role, options = {}) {
    const { useLLM = false, llmApiKey = null } = options;

    // Icon mapping
    const icons = {
        GREETING: "👋",
        MESS_INFO: "🍲",
        VACANCY: "🛏️",
        REGISTER_COMPLAINT: "🛠️",
        LATE_NIGHT_PERMISSION: "🌙",
        LEAVE_REQUEST: "📝",
        MESS_OFF: "🍽️",
        HELP: "💡",
        UNKNOWN: "🤔",
        PROFANITY: "🚫",
        GENERATE_NOTICE: "📢",
        ROOM_RECOMMENDATION: "✨",
        STUDY_PARTNER: "📚",
        EXPENSE_PREDICTOR: "💰",
        WEEKLY_SUMMARY: "📊",
        MY_COMPLAINTS: "📋",
        MY_INVOICES: "💳"
    };

    const icon = icons[intent] || "🤖";

    // Handle RAG-based responses
    if (data && data.source === 'faq') {
        return `${icon} ${data.answer}\n\n💡 *From FAQ: ${data.question}*`;
    }

    if (data && data.source === 'llm_rag') {
        return `${icon} ${data.answer}`;
    }

    // Intent-specific responses
    switch (intent) {
        case 'GREETING':
            const name = data?.name || (role === 'admin' ? 'Admin' : 'Student');
            return `${icon} Hello **${name}**! I'm your AI Hostel Assistant. How can I help you today?\n\n💡 Try asking:\n• "Show my room"\n• "What's for lunch?"\n• "Register a complaint"\n• "Weekly summary"`;

        case 'MY_ROOM':
            if (!data || data.room_no === "Not Assigned") {
                return `${icon} You don't seem to have a room assigned yet. Please contact the admin office.`;
            }
            return `${icon} **Your Room Details:**\n• Room Number: **${data.room_no}**\n• Hostel: ${data.hostel || 'N/A'}`;

        case 'VACANCY':
            if (!data || data.length === 0) {
                return `${icon} **No rooms available** right now. Please check back later or contact the admin.`;
            }
            const roomsList = data.map(r =>
                `• **Room ${r.room_no}** - ${r.room_type} (Floor ${r.floor}) - ₹${r.rent_per_month}/month`
            ).join('\n');
            return `${icon} **Available Rooms:**\n${roomsList}\n\n💡 Contact admin to book a room!`;

        case 'MESS_INFO':
            if (!data) return `${icon} Mess information is currently unavailable.`;
            const prediction = data.prediction || {};
            return `${icon} **Today's Mess Menu:**\n${data.menu}\n\n📊 **Crowd Prediction:**\n• Expected occupancy: **${prediction.predictedDemand}%**\n• Best time to visit: **${prediction.bestTime}**\n\n💡 Plan your meal to avoid rush hours!`;

        case 'REGISTER_COMPLAINT':
            if (!data) return `${icon} Failed to register complaint. Please try again.`;

            // Handle "please login" message
            if (data.message) {
                return `${icon} ${data.message}\n\n💡 Login to register complaints and track their status.`;
            }

            // Handle error case
            if (data.error) {
                return `${icon} ${data.error}`;
            }

            // Handle successful registration
            const urgentBadge = data.urgencyLevel === 'critical' || data.urgencyLevel === 'high'
                ? `\n🔥 **Marked as ${data.urgencyLevel.toUpperCase()} priority!**`
                : '';
            return `${icon} **Complaint Registered Successfully!**\n• ID: #${data.id.toString().slice(-6)}\n• Priority Score: ${data.aiPriorityScore || 50}/100\n• Status: ${data.status}${urgentBadge}\n\n✅ We'll resolve this as soon as possible!`;

        case 'MY_COMPLAINTS':
            if (!data || !data.complaints) {
                return `${icon} You have no complaints registered. If you're facing any issues, feel free to tell me!`;
            }
            if (data.message) {
                return `${icon} ${data.message}`;
            }
            if (data.complaints.length === 0) {
                return `${icon} You have no complaints registered yet. Say "register a complaint" to report an issue!`;
            }
            const complaintsList = data.complaints.map(c =>
                `• **#${c._id.toString().slice(-6)}** - ${c.title || c.type} (${c.status})`
            ).join('\n');
            return `${icon} **Your Recent Complaints:**\n${complaintsList}\n\n📊 **Summary:** ⚠️ Pending: ${data.pendingCount} | ✅ Resolved: ${data.resolvedCount}`;


        case 'MY_INVOICES':
            if (!data || data.message) {
                return `${icon} ${data?.message || 'Unable to fetch invoices'}`;
            }
            const invoiceList = data.invoices.slice(0, 5).map(inv =>
                `• ${inv.title}: ₹${inv.amount} (${inv.status})`
            ).join('\n');
            return `${icon} **Your Invoices:**\n${invoiceList}\n\n💰 **Total Pending:** ₹${data.totalDue}\n✅ Paid: ${data.paidCount} | ⚠️ Pending: ${data.pendingCount}`;

        case 'LATE_NIGHT_PERMISSION':
        case 'LEAVE_REQUEST':
            if (!data) return `${icon} Failed to submit request. Please try again.`;
            const warningMsg = data.warning ? `⚠️ ${data.warning}\n\n` : '';
            const autoApproved = data.autoApproved ? '\n✅ **Auto-approved!**' : '';
            return `${icon} **Permission Request Submitted!**\n${warningMsg}• Reason: ${data.reason}\n• Status: ${data.status || 'Pending'}${autoApproved}\n\n📌 Check your dashboard for updates.`;

        case 'MESS_OFF':
            if (!data) return `${icon} Failed to register mess-off. Please try again.`;
            return `${icon} **Mess-Off Registered!**\n• Duration: ${data.duration}\n• Status: ${data.status}\n\n💰 Your mess fees will be adjusted accordingly.`;

        case 'GENERATE_NOTICE':
            if (!data) return `${icon} Unable to generate notice. Please provide more details.`;
            return `${icon} **AI-Generated Notice Draft:**\n\n---\n${data.draft}\n---\n\n📝 Topic: ${data.topic}\n💡 You can edit and publish this notice from the admin dashboard.`;

        case 'ROOM_RECOMMENDATION':
            if (!data) return `${icon} No room recommendations available at the moment.`;
            return `${icon} **Room Recommendation:**\n${data.recommendation}\n\n💡 This is based on your preferences and past feedback.`;

        case 'HELP':
            return `${icon} **I'm your Smart Hostel Assistant!** 🏠\n\n**Here's what I can do for you:**\n\n📋 **Complaints:**\n• \"Register a complaint\" - File a new issue\n• \"Show my complaints\" - View your complaints\n\n💡 **Suggestions:**\n• \"I have a suggestion\" - Submit an idea\n\n🍲 **Mess:**\n• \"What's the mess menu?\" - Today's food\n• \"Request mess off\" - Skip meals\n\n💰 **Payments:**\n• \"Show my invoices\" - View dues\n\n📅 **Attendance:**\n• \"My attendance\" - Check records\n\n🏠 **General:**\n• \"WiFi password\" - Network info\n• \"Gym timings\" - Facility hours\n• \"Visiting hours\" - Guest policy\n• \"Emergency\" - Emergency contacts\n\n💬 **Just type naturally!** I understand sentences like:\n• "I want to file a complaint"\n• "Show me my pending bills"\n• "What's for dinner?"`;

        case 'STUDY_PARTNER':
            return `${icon} ${data?.msg || 'Study partner feature is coming soon!'}`;

        case 'EXPENSE_PREDICTOR':
            if (!data) return `${icon} Unable to predict expenses at the moment.`;
            return `${icon} **Monthly Expense Prediction:**\n• Estimated Amount: **₹${data.predictedAmount}**\n• Breakdown:\n  - Rent: ₹${data.breakdown?.rent || 0}\n  - Mess: ₹${data.breakdown?.mess || 0}\n  - Others: ₹${data.breakdown?.miscellaneous || 0}\n\n💡 ${data.reasoning}`;

        case 'WEEKLY_SUMMARY':
            if (!data) return `${icon} Analytics data is currently being processed.`;
            return `${icon} **Weekly Summary:**\n\n${data.summary || 'No summary available'}\n\n📊 View detailed analytics in the dashboard.`;

        case 'PROFANITY':
            return `${icon} Please use respectful language. I'm here to help! 😊`;

        case 'BYE':
            return `${icon} Goodbye! Feel free to reach out anytime you need help. Take care! 👋`;

        case 'UNKNOWN':
            // Try to provide helpful fallback
            return `${icon} I'm not quite sure what you're asking. Could you rephrase that?\n\n💡 Try asking about:\n• Room details\n• Mess menu\n• Complaints\n• Permissions\n• Type "help" to see all features`;

        default:
            return `${icon} Request processed. ${data?.message || ''}`;
    }
}

/**
 * Generate conversational response with context
 */
function generateContextualResponse(intent, data, conversationHistory) {
    // Use conversation history to make responses more natural
    const recentIntents = conversationHistory.map(h => h.intent);

    // If user keeps asking same thing, acknowledge
    if (recentIntents.filter(i => i === intent).length > 2) {
        return "I've answered this a few times. Is there something specific you'd like to know?";
    }

    return generateResponse(intent, data, 'student');
}

module.exports = {
    generateResponse,
    generateContextualResponse
};
