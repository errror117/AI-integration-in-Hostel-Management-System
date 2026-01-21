import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, DoughnutChart, PieChart, colorSchemes } from '../Charts';

/**
 * Enhanced Analytics Dashboard with Charts
 * Shows comprehensive hostel statistics with visual representations
 */

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // Replace with actual API call
            // const response = await fetch('/api/analytics');
            // const data = await response.json();

            // Demo data for now
            const demoData = {
                complaints: {
                    byStatus: { pending: 12, in_progress: 8, resolved: 45, rejected: 3 },
                    byCategory: {
                        'WiFi/Internet': 15,
                        'Plumbing': 12,
                        'Electrical': 10,
                        'Mess/Food': 8,
                        'Cleanliness': 7,
                        'Maintenance': 6
                    },
                    trend: [5, 8, 12, 7, 10, 15, 12] // Last 7 days
                },
                students: {
                    total: 400,
                    byDepartment: {
                        'Computer Science': 120,
                        'Electrical': 90,
                        'Mechanical': 80,
                        'Civil': 70,
                        'Chemical': 40
                    },
                    attendance: [385, 390, 388, 392, 387, 395, 390] // Last 7 days
                },
                invoices: {
                    paid: 350,
                    pending: 50,
                    revenue: 2500000
                },
                mess: {
                    messOff: [45, 52, 48, 50, 55, 60, 58] // Last 7 days
                }
            };

            setStats(demoData);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-stone-900">
                <div className="text-white text-xl">Loading analytics...</div>
            </div>
        );
    }

    // Chart Data Configurations

    // Complaints Trend Line Chart
    const complaintsTrendData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'New Complaints',
                data: stats.complaints.trend,
                borderColor: colorSchemes.primary[0],
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    // Complaints by Status Doughnut Chart
    const complaintsByStatusData = {
        labels: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
        datasets: [
            {
                data: [
                    stats.complaints.byStatus.pending,
                    stats.complaints.byStatus.in_progress,
                    stats.complaints.byStatus.resolved,
                    stats.complaints.byStatus.rejected
                ],
                backgroundColor: [
                    colorSchemes.warning[0],
                    colorSchemes.info[0],
                    colorSchemes.success[0],
                    colorSchemes.danger[0]
                ],
                borderWidth: 2,
                borderColor: '#1c1917'
            }
        ]
    };

    // Complaints by Category Bar Chart
    const complaintsByCategoryData = {
        labels: Object.keys(stats.complaints.byCategory),
        datasets: [
            {
                label: 'Complaints',
                data: Object.values(stats.complaints.byCategory),
                backgroundColor: colorSchemes.rainbow,
                borderWidth: 0
            }
        ]
    };

    // Students by Department Pie Chart
    const studentsByDeptData = {
        labels: Object.keys(stats.students.byDepartment),
        datasets: [
            {
                data: Object.values(stats.students.byDepartment),
                backgroundColor: colorSchemes.primary,
                borderWidth: 2,
                borderColor: '#1c1917'
            }
        ]
    };

    // Attendance Trend Line Chart
    const attendanceTrendData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Present Students',
                data: stats.students.attendance,
                borderColor: colorSchemes.success[0],
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    // Mess Off Trend Bar Chart
    const messOffTrendData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Mess Off Requests',
                data: stats.mess.messOff,
                backgroundColor: colorSchemes.info[0],
                borderWidth: 0
            }
        ]
    };

    return (
        <div className="p-6 bg-stone-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">📊 Analytics Dashboard</h1>
                <p className="text-gray-400">Visual insights and trends for your hostel</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 text-white">
                    <div className="text-sm opacity-80">Total Students</div>
                    <div className="text-4xl font-bold mt-2">{stats.students.total}</div>
                    <div className="text-sm mt-2">↑ 5% from last month</div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 text-white">
                    <div className="text-sm opacity-80">Active Complaints</div>
                    <div className="text-4xl font-bold mt-2">
                        {stats.complaints.byStatus.pending + stats.complaints.byStatus.in_progress}
                    </div>
                    <div className="text-sm mt-2">↓ 12% from last week</div>
                </div>

                <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 text-white">
                    <div className="text-sm opacity-80">Resolved Issues</div>
                    <div className="text-4xl font-bold mt-2">{stats.complaints.byStatus.resolved}</div>
                    <div className="text-sm mt-2">↑ 23% from last week</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg p-6 text-white">
                    <div className="text-sm opacity-80">Pending Payments</div>
                    <div className="text-4xl font-bold mt-2">₹{(stats.invoices.revenue / 100000).toFixed(1)}L</div>
                    <div className="text-sm mt-2">{stats.invoices.pending} invoices</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Complaints Trend */}
                <div className="bg-stone-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">📈 Complaints Trend (7 Days)</h2>
                    <LineChart data={complaintsTrendData} height={300} />
                </div>

                {/* Complaints by Status */}
                <div className="bg-stone-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">🎯 Complaints by Status</h2>
                    <DoughnutChart data={complaintsByStatusData} height={300} />
                </div>

                {/* Complaints by Category */}
                <div className="bg-stone-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">📊 Complaints by Category</h2>
                    <BarChart data={complaintsByCategoryData} height={300} />
                </div>

                {/* Students by Department */}
                <div className="bg-stone-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">🎓 Students by Department</h2>
                    <PieChart data={studentsByDeptData} height={300} />
                </div>

                {/* Attendance Trend */}
                <div className="bg-stone-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">✅ Attendance Trend</h2>
                    <LineChart data={attendanceTrendData} height={300} />
                </div>

                {/* Mess Off Requests */}
                <div className="bg-stone-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">🍽️ Mess Off Requests</h2>
                    <BarChart data={messOffTrendData} height={300} />
                </div>
            </div>

            {/* Insights Section */}
            <div className="mt-8 bg-stone-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">💡 Key Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-stone-700 rounded p-4">
                        <div className="text-green-400 font-semibold mb-2">✅ Positive Trend</div>
                        <p className="text-gray-300 text-sm">
                            Complaint resolution rate increased by 23% this week. Great job!
                        </p>
                    </div>
                    <div className="bg-stone-700 rounded p-4">
                        <div className="text-yellow-400 font-semibold mb-2">⚠️ Attention Needed</div>
                        <p className="text-gray-300 text-sm">
                            WiFi/Internet issues are the top complaint category. Consider investigating.
                        </p>
                    </div>
                    <div className="bg-stone-700 rounded p-4">
                        <div className="text-blue-400 font-semibold mb-2">📊 Statistics</div>
                        <p className="text-gray-300 text-sm">
                            Average response time to complaints is 4.2 hours - 15% faster than target.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
