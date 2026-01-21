/**
 * Analytics Engine
 * Provides statistical analysis and predictions for hostel management
 */

const ChatLog = require('../../models/ChatLog');
const Complaint = require('../../models/Complaint');
const Analytics = require('../../models/Analytics');
const MessOff = require('../../models/MessOff');

/**
 * Generate weekly chatbot usage summary
 */
async function getWeeklyChatbotStats(startDate = null) {
    try {
        const weekAgo = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const logs = await ChatLog.find({
            timestamp: { $gte: weekAgo }
        });

        // Intent distribution
        const intentCounts = {};
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
        let totalResponseTime = 0;
        let lowConfidenceCount = 0;

        logs.forEach(log => {
            // Count intents
            intentCounts[log.intent] = (intentCounts[log.intent] || 0) + 1;

            // Count sentiments
            if (log.meta && log.meta.sentiment) {
                sentimentCounts[log.meta.sentiment]++;
            }

            // Response time
            if (log.meta && log.meta.responseTime) {
                totalResponseTime += log.meta.responseTime;
            }

            // Low confidence
            if (log.confidence && log.confidence < 0.5) {
                lowConfidenceCount++;
            }
        });

        return {
            period: 'week',
            totalMessages: logs.length,
            intentDistribution: intentCounts,
            sentimentDistribution: sentimentCounts,
            avgResponseTime: logs.length > 0 ? totalResponseTime / logs.length : 0,
            lowConfidenceRate: logs.length > 0 ? (lowConfidenceCount / logs.length) * 100 : 0,
            peakUsageDay: getPeakUsageDay(logs)
        };
    } catch (error) {
        console.error('Error getting weekly stats:', error);
        return null;
    }
}

/**
 * Get peak usage day from logs
 */
function getPeakUsageDay(logs) {
    const dayCounts = {};
    logs.forEach(log => {
        const day = new Date(log.timestamp).toLocaleDateString();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    let maxDay = null;
    let maxCount = 0;
    for (const [day, count] of Object.entries(dayCounts)) {
        if (count > maxCount) {
            maxCount = count;
            maxDay = day;
        }
    }

    return { day: maxDay, count: maxCount };
}

/**
 * Analyze complaint trends
 */
async function getComplaintTrends(days = 30) {
    try {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const complaints = await Complaint.find({
            date: { $gte: startDate }
        });

        // Category distribution
        const categoryCount = {};
        const urgencyCount = { low: 0, medium: 0, high: 0, critical: 0 };
        const statusCount = {};
        let totalResolutionTime = 0;
        let resolvedCount = 0;

        complaints.forEach(complaint => {
            // Category
            const cat = complaint.category || complaint.type || 'General';
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;

            // Urgency
            if (complaint.urgencyLevel) {
                urgencyCount[complaint.urgencyLevel]++;
            }

            // Status
            statusCount[complaint.status] = (statusCount[complaint.status] || 0) + 1;

            // Resolution time
            if (complaint.resolvedAt && complaint.resolutionTime) {
                totalResolutionTime += complaint.resolutionTime;
                resolvedCount++;
            }
        });

        return {
            period: `${days} days`,
            totalComplaints: complaints.length,
            categoryDistribution: categoryCount,
            urgencyDistribution: urgencyCount,
            statusDistribution: statusCount,
            avgResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : null,
            resolutionRate: complaints.length > 0 ? (resolvedCount / complaints.length) * 100 : 0
        };
    } catch (error) {
        console.error('Error analyzing complaints:', error);
        return null;
    }
}

/**
 * Predict mess crowd based on historical data
 */
async function predictMessCrowd(targetDate = new Date()) {
    try {
        const hour = targetDate.getHours();
        const dayOfWeek = targetDate.getDay();

        // Base prediction on time of day
        let baseCrowd = 50;

        // Meal times
        if (hour >= 7 && hour <= 9) baseCrowd = 85; // Breakfast
        else if (hour >= 12 && hour <= 14) baseCrowd = 90; // Lunch
        else if (hour >= 19 && hour <= 21) baseCrowd = 95; // Dinner

        // Weekend adjustment
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            baseCrowd -= 15; // Less crowd on weekends
        }

        // Get historical mess-off data
        const messOffCount = await MessOff.countDocuments({
            from_date: { $lte: targetDate },
            to_date: { $gte: targetDate },
            status: 'approved'
        });

        // Adjust for mess-offs (assuming 200 total students)
        const adjustedCrowd = Math.max(0, Math.min(100, baseCrowd - (messOffCount / 2)));

        // Best time recommendation
        let bestTime = '2:00 PM';
        if (hour >= 7 && hour <= 9) bestTime = '9:30 AM';
        else if (hour >= 12 && hour <= 14) bestTime = '1:45 PM';
        else if (hour >= 19 && hour <= 21) bestTime = '8:30 PM';

        return {
            predictedCrowd: Math.round(adjustedCrowd),
            confidence: 0.75,
            bestTime,
            reasoning: `Based on ${hour}:00 hour and ${messOffCount} students on mess-off`
        };
    } catch (error) {
        console.error('Error predicting mess crowd:', error);
        return {
            predictedCrowd: 50,
            confidence: 0.3,
            bestTime: 'Unknown'
        };
    }
}

/**
 * Predict monthly expenses for a student
 */
async function predictMonthlyExpense(studentId) {
    try {
        // This is a simplified prediction
        // In a real system, you'd analyze historical invoice data

        const baseRent = 3000; // Average rent
        const baseMessFees = 2500; // Average mess fees
        const miscellaneous = 500; // Other charges

        // Inflation factor (2% monthly)
        const inflationFactor = 1.02;

        const predicted = Math.round((baseRent + baseMessFees + miscellaneous) * inflationFactor);

        return {
            predictedAmount: predicted,
            breakdown: {
                rent: baseRent,
                mess: baseMessFees,
                miscellaneous: miscellaneous
            },
            confidence: 0.7,
            reasoning: 'Based on average fees and 2% inflation adjustment'
        };
    } catch (error) {
        console.error('Error predicting expense:', error);
        return null;
    }
}

/**
 * Generate comprehensive analytics summary
 */
async function generateAnalyticsSummary(period = 'week') {
    try {
        const chatbotStats = await getWeeklyChatbotStats();
        const complaintTrends = await getComplaintTrends(period === 'week' ? 7 : 30);
        const messPrediction = await predictMessCrowd();

        return {
            period,
            generatedAt: new Date(),
            chatbot: chatbotStats,
            complaints: complaintTrends,
            messCrowd: messPrediction,
            summary: generateTextSummary(chatbotStats, complaintTrends)
        };
    } catch (error) {
        console.error('Error generating summary:', error);
        return null;
    }
}

/**
 * Generate human-readable text summary
 */
function generateTextSummary(chatbotStats, complaintTrends) {
    const parts = [];

    if (chatbotStats) {
        parts.push(`📊 **Chatbot Activity**: ${chatbotStats.totalMessages} messages this week.`);
        parts.push(`Top intent: ${getTopIntent(chatbotStats.intentDistribution)}.`);
    }

    if (complaintTrends) {
        parts.push(`🛠️ **Complaints**: ${complaintTrends.totalComplaints} total, ${complaintTrends.resolutionRate.toFixed(1)}% resolved.`);
        parts.push(`Most common: ${getTopCategory(complaintTrends.categoryDistribution)}.`);
    }

    return parts.join(' ');
}

function getTopIntent(intentDist) {
    let topIntent = 'UNKNOWN';
    let maxCount = 0;
    for (const [intent, count] of Object.entries(intentDist)) {
        if (count > maxCount) {
            maxCount = count;
            topIntent = intent;
        }
    }
    return topIntent;
}

function getTopCategory(categoryDist) {
    let topCat = 'General';
    let maxCount = 0;
    for (const [cat, count] of Object.entries(categoryDist)) {
        if (count > maxCount) {
            maxCount = count;
            topCat = cat;
        }
    }
    return topCat;
}

module.exports = {
    getWeeklyChatbotStats,
    getComplaintTrends,
    predictMessCrowd,
    predictMonthlyExpense,
    generateAnalyticsSummary
};
