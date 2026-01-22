import React, { useEffect, useState } from "react";
import {

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28FFF", "#FF6B6B"];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [chatStats, setChatStats] = useState(null);
  const [messPredictions, setMessPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch hostel stats
      const statsRes = await fetch(`${API_URL}/api/student/stats");
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData);

      // Fetch predictions
      const predRes = await fetch(`${API_URL}/api/analytics/predictions");
      const predData = await predRes.json();
      if (predData.success) setPredictions(predData.data);

      // Fetch chatbot stats
      const chatRes = await fetch(`${API_URL}/api/analytics/chatbot-stats");
      const chatData = await chatRes.json();
      if (chatData.success) setChatStats(chatData.data);

      // Fetch mess predictions
      const messRes = await fetch(`${API_URL}/api/analytics/mess-predictions");
      const messData = await messRes.json();
      if (messData.success) setMessPredictions(messData.data);

    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl animate-pulse">📊 Loading Analytics...</div>
      </div>
    );
  }

  // Prepare hostel data
  const pieData = stats?.hostels?.map((h) => ({ name: h.name, value: h.occupied })) || [];
  const barDept = stats?.byDept?.map((d) => ({ name: d._id || "Unknown", value: d.count })) || [];
  const barHostels = stats?.hostels?.map((h) => ({ name: h.name, occupied: h.occupied, vacant: h.vacant })) || [];

  return (
    <div className="p-6 bg-neutral-950 min-h-screen text-white overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📊 AI Analytics & Predictions</h1>
        <button
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center gap-2"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['overview', 'predictions', 'mess', 'chatbot'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === tab
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
              }`}
          >
            {tab === 'overview' && '📈 Overview'}
            {tab === 'predictions' && '🔮 AI Predictions'}
            {tab === 'mess' && '🍽️ Mess Predictions'}
            {tab === 'chatbot' && '💬 Chatbot Analytics'}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Chatbot Queries"
          value={chatStats?.totalQueries || 0}
          icon="💬"
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-80 bg-neutral-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">🏢 Occupied Beds by Hostel</h3>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-80 bg-neutral-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">🎓 Students by Department</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={barDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-80 bg-neutral-900 p-4 rounded-lg col-span-2">
            <h3 className="font-semibold mb-2">🏠 Hostel Occupancy</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={barHostels}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                <Legend />
                <Bar dataKey="occupied" stackId="a" fill="#0088FE" name="Occupied" />
                <Bar dataKey="vacant" stackId="a" fill="#00C49F" name="Vacant" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-neutral-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">📈 Complaint Volume Forecast</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={predictions?.complaintTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#0088FE"
                  fill="#0088FE"
                  fillOpacity={0.6}
                  name="Actual"
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
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

          <div className="bg-neutral-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">📅 Weekly Attendance Pattern</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={predictions?.attendancePattern || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#00C49F"
                  strokeWidth={3}
                  name="Attendance %"
                  dot={{ fill: '#00C49F', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="bg-neutral-900 p-4 rounded-lg col-span-2">
            <h3 className="text-lg font-semibold mb-4">💡 AI Insights</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <InsightCard
                icon="📈"
                title="Complaint Trend"
                insight={predictions?.insights?.complaintTrend || "Analyzing patterns..."}
              />
              <InsightCard
                icon="🍽️"
                title="Mess Prediction"
                insight={predictions?.insights?.messPrediction || "Calculating attendance..."}
              />
              <InsightCard
                icon="⚠️"
                title="Risk Alert"
                insight={predictions?.insights?.riskAlert || "No alerts"}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mess Predictions Tab */}
      {activeTab === 'mess' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Day-wise Crowd Chart */}
          <div className="bg-neutral-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">📅 Day-wise Mess Crowd</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={messPredictions?.dayWiseCrowd || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="shortDay" stroke="#888" />
                <YAxis stroke="#888" label={{ value: '%', position: 'insideLeft', fill: '#888' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#333', border: 'none' }}
                  formatter={(value, name) => [`${value}%`, 'Attendance']}
                />
                <Bar dataKey="percentage" fill="#8884d8" radius={[4, 4, 0, 0]}>
                  {messPredictions?.dayWiseCrowd?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isWeekend ? '#FF8042' : '#00C49F'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#00C49F] rounded"></span> Weekdays</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#FF8042] rounded"></span> Weekends</span>
            </div>
          </div>

          {/* Meal-wise Crowd Chart */}
          <div className="bg-neutral-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">🕐 Meal-wise Crowd</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={messPredictions?.mealCrowd || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis type="number" stroke="#888" domain={[0, 100]} />
                <YAxis type="category" dataKey="meal" stroke="#888" width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#333', border: 'none' }}
                  formatter={(value, name) => [`${value}% (${messPredictions?.mealCrowd?.find(m => m.percentage === value)?.expectedCrowd || 0} students)`, 'Expected']}
                />
                <Bar dataKey="percentage" fill="#0088FE" radius={[0, 4, 4, 0]}>
                  {messPredictions?.mealCrowd?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.crowdLevel === 'Very High' ? '#FF6B6B' :
                        entry.crowdLevel === 'High' ? '#FFBB28' :
                          entry.crowdLevel === 'Moderate' ? '#00C49F' : '#0088FE'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tomorrow's Prediction */}
          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">🔮 Tomorrow's Prediction</h3>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">
                {messPredictions?.tomorrowPrediction?.percentage || 0}%
              </div>
              <div className="text-xl text-gray-300 mb-2">
                {messPredictions?.tomorrowPrediction?.day || 'Loading...'}
              </div>
              <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${messPredictions?.tomorrowPrediction?.crowdLevel === 'Very High' ? 'bg-red-500/30 text-red-300' :
                  messPredictions?.tomorrowPrediction?.crowdLevel === 'High' ? 'bg-yellow-500/30 text-yellow-300' :
                    messPredictions?.tomorrowPrediction?.crowdLevel === 'Moderate' ? 'bg-green-500/30 text-green-300' :
                      'bg-blue-500/30 text-blue-300'
                }`}>
                {messPredictions?.tomorrowPrediction?.crowdLevel || 'Moderate'} Crowd Expected
              </div>
              <div className="mt-4 text-gray-400">
                Expected: ~{messPredictions?.tomorrowPrediction?.avgAttendance || 0} students
              </div>
            </div>
          </div>

          {/* Meal Times Info */}
          <div className="bg-neutral-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">⏰ Meal Timings & Peak Hours</h3>
            <div className="space-y-3">
              {messPredictions?.mealCrowd?.map((meal, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {meal.meal === 'Breakfast' ? '🌅' :
                        meal.meal === 'Lunch' ? '☀️' :
                          meal.meal === 'Snacks' ? '🍪' : '🌙'}
                    </span>
                    <div>
                      <div className="font-semibold">{meal.meal}</div>
                      <div className="text-sm text-gray-400">{meal.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{meal.percentage}%</div>
                    <div className="text-xs text-gray-400">Peak: {meal.peakTime}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-neutral-900 p-4 rounded-lg col-span-2">
            <h3 className="text-lg font-semibold mb-4">💡 Mess Insights & Recommendations</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {messPredictions?.insights?.map((insight, idx) => (
                <div key={idx} className="p-3 bg-neutral-800 rounded-lg text-sm">
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Analytics Tab */}
      {activeTab === 'chatbot' && (
        <div className="grid md:grid-cols-2 gap-6">
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

          {/* Recent Interactions */}
          <div className="bg-neutral-900 p-4 rounded-lg col-span-2">
            <h3 className="text-lg font-semibold mb-4">💬 Recent Chatbot Interactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="p-3">Query</th>
                    <th className="p-3">Intent</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(chatStats?.recentLogs || []).slice(0, 8).map((log, i) => (
                    <tr key={i} className="border-b border-neutral-800 hover:bg-neutral-800">
                      <td className="p-3 truncate max-w-xs">{log.query}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-600 rounded text-sm">
                          {log.intent}
                        </span>
                      </td>
                      <td className="p-3">{Math.round((log.confidence || 0) * 100)}%</td>
                      <td className="p-3 text-gray-400 text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
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
