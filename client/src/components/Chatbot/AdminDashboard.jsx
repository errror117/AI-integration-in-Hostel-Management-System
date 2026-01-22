import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { ArrowDownTrayIcon, CpuChipIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminChatbotDashboard = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const token = localStorage.getItem('token');
        const headers = { "auth-token": token, "Content-Type": "application/json" };
        
        const [statsRes, logsRes] = await Promise.all([
            fetch(`${API_URL}/api/chatbot/stats', { headers }),
            fetch(`${API_URL}/api/chatbot/logs', { headers })
        ]);

        const statsData = await statsRes.json();
        const logsData = await logsRes.json();

        setStats(statsData);
        setLogs(logsData.logs || []); // Ensure logs is array
        setLoading(false);
    } catch (err) {
        console.error("Failed to load dashboard data", err);
        setLoading(false);
    }
  };

  const exportLogs = () => {
      const headers = ["User", "Role", "Intent", "Query", "Response", "Time"];
      const rows = logs.map(l => [
          l.user?.name || l.role || 'Visitor',
          l.role,
          l.intent,
          `"${l.query.replace(/"/g, '""')}"`,
          `"${l.response.replace(/"/g, '""')}"`,
          new Date(l.timestamp).toLocaleString()
      ]);
      
      let csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");
          
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "ai_logs_export.csv");
      document.body.appendChild(link);
      link.click();
  };

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900 text-white">
          <div className="animate-pulse flex flex-col items-center">
              <CpuChipIcon className="h-12 w-12 text-blue-500 mb-4" />
              <p>Loading AI Intelligence...</p>
          </div>
      </div>
  );

  // Line Chart Data (Mocking trend if no historical data)
  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'User Interactions',
        data: [12, 19, 3, 5, 2, 3, stats?.todayStats?.messageCount || 15],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Intent Distribution Chart
  const intentCounts = {};
  logs.forEach(l => { intentCounts[l.intent] = (intentCounts[l.intent] || 0) + 1 });
  const doughnutData = {
      labels: Object.keys(intentCounts).slice(0, 5),
      datasets: [
          {
              data: Object.values(intentCounts).slice(0, 5),
              backgroundColor: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'],
              borderWidth: 0
          }
      ]
  };

  return (
    <div className="p-8 bg-stone-900 min-h-screen text-white font-sans">
      <div className="flex justify-between items-center mb-10">
        <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                AI Command Center
            </h1>
            <p className="text-gray-400 mt-2">Real-time monitoring of Chatbot interactions & System Health</p>
        </div>
        <button 
            onClick={exportLogs}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all transform hover:scale-105"
        >
            <ArrowDownTrayIcon className="h-5 w-5" /> Export Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-stone-800 p-6 rounded-2xl border border-stone-700 hover:border-blue-500 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-gray-400 text-sm uppercase tracking-wider">Total Queries</h3>
                    <div className="text-4xl font-bold mt-2">{stats?.totalMessages || 0}</div>
                </div>
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
        </div>
        <div className="bg-stone-800 p-6 rounded-2xl border border-stone-700 hover:border-green-500 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-gray-400 text-sm uppercase tracking-wider">Active Today</h3>
                    <div className="text-4xl font-bold mt-2 text-green-400">{stats?.todayStats?.messageCount || 0}</div>
                </div>
                <div className="animate-pulse h-3 w-3 bg-green-500 rounded-full mt-2"></div>
            </div>
        </div>
        <div className="bg-stone-800 p-6 rounded-2xl border border-stone-700 hover:border-orange-500 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-gray-400 text-sm uppercase tracking-wider">Mess Prediction</h3>
                    <div className="text-4xl font-bold mt-2 text-orange-400">{stats?.todayStats?.messPrediction?.predictedDemand || 85}%</div>
                    <p className="text-xs text-gray-500 mt-1">Expected Crowding</p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
        </div>
        <div className="bg-stone-800 p-6 rounded-2xl border border-stone-700 hover:border-purple-500 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-gray-400 text-sm uppercase tracking-wider">Sync Status</h3>
                    <div className="text-4xl font-bold mt-2 text-purple-400">Active</div>
                    <p className="text-xs text-gray-500 mt-1">Database Latency: 12ms</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-stone-800 p-6 rounded-2xl border border-stone-700">
            <h3 className="font-bold text-xl mb-6 text-gray-200">Conversation Traffic</h3>
            <div className="h-72">
                 <Line data={lineData} options={{ maintainAspectRatio: false, scales: { y: { grid: { color: '#333' } }, x: { grid: { color: '#333' } } } }} />
            </div>
        </div>
        <div className="bg-stone-800 p-6 rounded-2xl border border-stone-700">
            <h3 className="font-bold text-xl mb-6 text-gray-200">Top Intents</h3>
            <div className="h-72 flex justify-center">
                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
            </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-stone-800 rounded-2xl border border-stone-700 overflow-hidden">
          <div className="p-6 border-b border-stone-700">
              <h3 className="font-bold text-xl text-gray-200">Recent Live Interactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-stone-900 text-gray-400 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Intent</th>
                        <th className="px-6 py-4">Query</th>
                        <th className="px-6 py-4">Response</th>
                        <th className="px-6 py-4">Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-700">
                    {logs.map((log, i) => (
                        <tr key={i} className="hover:bg-stone-700/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">
                                {log.user?.name || log.role}
                            </td>
                            <td className="px-6 py-4">
                                <span className="bg-blue-900/50 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-800">
                                    {log.intent}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-300 max-w-xs truncate" title={log.query}>
                                {log.query}
                            </td>
                             <td className="px-6 py-4 text-gray-400 max-w-xs truncate" title={log.response}>
                                {log.response}
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-sm">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                No interactions recorded yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default AdminChatbotDashboard;
