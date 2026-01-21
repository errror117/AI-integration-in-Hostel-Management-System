import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28FFF", "#FF6B6B"];

export default function AIPredictions() {
    const [loading, setLoading] = useState(true);
    const [predictions, setPredictions] = useState(null);
    const [chatStats, setChatStats] = useState(null);

    useEffect(() => {
        fetchPredictions();
    }, []);

    const fetchPredictions = async () => {
        try {
            // Fetch prediction data
            const res = await fetch("http://localhost:3000/api/analytics/predictions");
            const data = await res.json();
            if (data.success) {
                setPredictions(data.data);
            }

            // Fetch chatbot stats
            const chatRes = await fetch("http://localhost:3000/api/analytics/chatbot-stats");
            const chatData = await chatRes.json();
            if (chatData.success) {
                setChatStats(chatData.data);
            }
        } catch (err) {
            console.error("Error fetching predictions:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-white text-xl">🔮 Loading AI Predictions...</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-neutral-950 min-h-screen text-white overflow-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">🔮 AI Predictions & Analytics</h1>
                <button
                    onClick={fetchPredictions}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Queries"
                    value={chatStats?.totalQueries || 0}
                    icon="💬"
                    color="blue"
                />
                <StatCard
                    title="Today's Queries"
                    value={chatStats?.todayQueries || 0}
                    icon="📊"
                    color="green"
                />
                <StatCard
                    title="Predicted Complaints"
                    value={predictions?.nextWeekComplaints || 0}
                    icon="⚠️"
                    subtext="Next 7 days"
                    color="orange"
                />
                <StatCard
                    title="Mess Attendance"
                    value={`${predictions?.messAttendance || 85}%`}
                    icon="🍽️"
                    subtext="Tomorrow"
                    color="purple"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Complaint Trend Prediction */}
                <div className="bg-neutral-900 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">📈 Complaint Volume Forecast</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={predictions?.complaintTrend || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="date" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#333', border: 'none' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="actual"
                                stackId="1"
                                stroke="#0088FE"
                                fill="#0088FE"
                                fillOpacity={0.6}
                                name="Actual"
                            />
                            <Area
                                type="monotone"
                                dataKey="predicted"
                                stackId="2"
                                stroke="#00C49F"
                                fill="#00C49F"
                                fillOpacity={0.3}
                                strokeDasharray="5 5"
                                name="Predicted"
                            />
                            <Legend />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Intents */}
                <div className="bg-neutral-900 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">🎯 Top Query Types</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={chatStats?.topIntents || []}
                                dataKey="count"
                                nameKey="_id"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {(chatStats?.topIntents || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Daily Traffic */}
                <div className="bg-neutral-900 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">📊 Daily Chatbot Traffic</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chatStats?.dailyTraffic || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="day" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                            <Bar dataKey="queries" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Attendance Prediction */}
                <div className="bg-neutral-900 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">📅 Weekly Attendance Pattern</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={predictions?.attendancePattern || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="day" stroke="#888" />
                            <YAxis stroke="#888" domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="rate"
                                stroke="#00C49F"
                                strokeWidth={2}
                                name="Attendance %"
                                dot={{ fill: '#00C49F' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Insights Section */}
            <div className="mt-6 bg-neutral-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">💡 AI Insights</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <InsightCard
                        icon="📈"
                        title="Complaint Trend"
                        insight={predictions?.insights?.complaintTrend || "Complaints peak on Mondays"}
                    />
                    <InsightCard
                        icon="🍽️"
                        title="Mess Prediction"
                        insight={predictions?.insights?.messPrediction || "Expected 85% attendance tomorrow"}
                    />
                    <InsightCard
                        icon="⚠️"
                        title="Risk Alert"
                        insight={predictions?.insights?.riskAlert || "3 students have irregular attendance"}
                    />
                </div>
            </div>

            {/* Recent Interactions */}
            <div className="mt-6 bg-neutral-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">💬 Recent Chatbot Interactions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-neutral-700">
                                <th className="p-3">User</th>
                                <th className="p-3">Query</th>
                                <th className="p-3">Intent</th>
                                <th className="p-3">Confidence</th>
                                <th className="p-3">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(chatStats?.recentLogs || []).slice(0, 5).map((log, i) => (
                                <tr key={i} className="border-b border-neutral-800 hover:bg-neutral-800">
                                    <td className="p-3">{log.user?.name || 'Student'}</td>
                                    <td className="p-3 truncate max-w-xs">{log.query}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 bg-blue-600 rounded text-sm">
                                            {log.intent}
                                        </span>
                                    </td>
                                    <td className="p-3">{Math.round((log.confidence || 0) * 100)}%</td>
                                    <td className="p-3 text-gray-400">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, icon, subtext, color }) {
    const colorClasses = {
        blue: 'from-blue-600 to-blue-800',
        green: 'from-green-600 to-green-800',
        orange: 'from-orange-600 to-orange-800',
        purple: 'from-purple-600 to-purple-800'
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 rounded-lg`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm opacity-80">{title}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                    {subtext && <p className="text-xs opacity-70 mt-1">{subtext}</p>}
                </div>
                <span className="text-3xl">{icon}</span>
            </div>
        </div>
    );
}

// Insight Card Component
function InsightCard({ icon, title, insight }) {
    return (
        <div className="bg-neutral-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{icon}</span>
                <span className="font-semibold">{title}</span>
            </div>
            <p className="text-gray-400 text-sm">{insight}</p>
        </div>
    );
}
