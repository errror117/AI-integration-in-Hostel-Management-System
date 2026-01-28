import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [newOrg, setNewOrg] = useState({
        name: '',
        subdomain: '',
        email: '',
        phone: '',
        address: '',
        subscriptionPlan: 'free'
    });

    const API_URL = window.API_BASE_URL || 'https://hostelease-api.onrender.com';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const [statsRes, orgsRes] = await Promise.all([
                axios.get(`${API_URL}/api/superadmin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/superadmin/organizations`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setStats(statsRes.data.data);
            setOrganizations(orgsRes.data.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            if (error.response?.status === 403) {
                alert('Access denied. Super Admin privileges required.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrganization = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/superadmin/organizations`, newOrg, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowCreateModal(false);
            setNewOrg({
                name: '',
                subdomain: '',
                email: '',
                phone: '',
                address: '',
                subscriptionPlan: 'free'
            });
            fetchDashboardData();
            alert('Organization created successfully!');
        } catch (error) {
            console.error('Error creating organization:', error);
            alert(error.response?.data?.message || 'Failed to create organization');
        }
    };

    const handleUpdateStatus = async (orgId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `${API_URL}/api/superadmin/organizations/${orgId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchDashboardData();
            alert(`Organization status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            active: '#10B981',
            trial: '#F59E0B',
            suspended: '#EF4444',
            cancelled: '#6B7280'
        };
        return colors[status] || '#6B7280';
    };

    const getPlanColor = (plan) => {
        const colors = {
            free: '#8B5CF6',
            starter: '#3B82F6',
            professional: '#F59E0B',
            enterprise: '#EF4444'
        };
        return colors[plan] || '#6B7280';
    };

    if (loading) {
        return (
            <div className="super-admin-dashboard loading">
                <motion.div
                    className="loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    ⚙️
                </motion.div>
                <p>Loading Super Admin Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="super-admin-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <div>
                        <h1>🔐 Super Admin Dashboard</h1>
                        <p>Manage all organizations and monitor system health</p>
                    </div>
                    <button
                        className="create-org-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        + Create Organization
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="dashboard-tabs">
                <button
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button
                    className={activeTab === 'organizations' ? 'active' : ''}
                    onClick={() => setActiveTab('organizations')}
                >
                    🏢 Organizations
                </button>
                <button
                    className={activeTab === 'analytics' ? 'active' : ''}
                    onClick={() => setActiveTab('analytics')}
                >
                    📈 Analytics
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && stats.overview && (
                <motion.div
                    className="overview-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="stats-grid">
                        <StatCard
                            icon="🏢"
                            title="Total Organizations"
                            value={stats.overview.totalOrganizations}
                            subtitle={`${stats.overview.activeOrganizations} active`}
                            color="#3B82F6"
                        />
                        <StatCard
                            icon="👥"
                            title="Total Students"
                            value={stats.overview.totalStudents}
                            subtitle="Across all organizations"
                            color="#10B981"
                        />
                        <StatCard
                            icon="👔"
                            title="Total Admins"
                            value={stats.overview.totalAdmins}
                            subtitle="System-wide"
                            color="#F59E0B"
                        />
                        <StatCard
                            icon="📢"
                            title="Total Complaints"
                            value={stats.overview.totalComplaints}
                            subtitle={`${stats.overview.pendingComplaints} pending`}
                            color="#EF4444"
                        />
                        <StatCard
                            icon="🏠"
                            title="Total Hostels"
                            value={stats.overview.totalHostels}
                            subtitle="Managed properties"
                            color="#8B5CF6"
                        />
                        <StatCard
                            icon="🎯"
                            title="Trial Organizations"
                            value={stats.overview.trialOrganizations}
                            subtitle="Potential conversions"
                            color="#EC4899"
                        />
                    </div>

                    {/* Subscription Breakdown */}
                    <div className="section-card">
                        <h3>📊 Subscription Breakdown</h3>
                        <div className="subscription-breakdown">
                            {(stats.subscriptionBreakdown || []).map((item) => (
                                <div key={item._id} className="subscription-item">
                                    <div className="sub-info">
                                        <span className="sub-name">{item._id || 'Unknown'}</span>
                                        <span className="sub-count">{item.count} organizations</span>
                                    </div>
                                    <div
                                        className="sub-badge"
                                        style={{ backgroundColor: getPlanColor(item._id) }}
                                    >
                                        {item.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Organizations */}
                    <div className="section-card">
                        <h3>🆕 Recent Organizations</h3>
                        <div className="recent-orgs-list">
                            {(stats.recentOrganizations || []).map((org) => (
                                <div key={org._id} className="recent-org-item">
                                    <div className="org-info">
                                        <h4>{org.name}</h4>
                                        <p>{org.slug || org.subdomain}.hostelease.com</p>
                                    </div>
                                    <div className="org-meta">
                                        <span
                                            className="plan-badge"
                                            style={{ backgroundColor: getPlanColor(org.subscription?.plan || org.subscriptionPlan) }}
                                        >
                                            {org.subscription?.plan || org.subscriptionPlan}
                                        </span>
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(org.subscription?.status || org.subscriptionStatus) }}
                                        >
                                            {org.subscription?.status || org.subscriptionStatus}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Organizations Tab */}
            {activeTab === 'organizations' && (
                <motion.div
                    className="organizations-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Organizations Header */}
                    <div className="organizations-header">
                        <div className="org-header-left">
                            <h2>🏢 Organizations ({organizations.length})</h2>
                            <span className="org-count-badge">
                                {organizations.filter(o => (o.subscription?.status || o.subscriptionStatus) === 'active').length} active,{' '}
                                {organizations.filter(o => (o.subscription?.status || o.subscriptionStatus) === 'trial').length} trial
                            </span>
                        </div>
                        <div className="org-header-controls">
                            <input
                                type="text"
                                placeholder="Search organizations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="org-search-input"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="org-filter-select"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="trial">Trial</option>
                                <option value="suspended">Suspended</option>
                            </select>
                            <button
                                className="refresh-btn"
                                onClick={fetchDashboardData}
                                title="Refresh data"
                            >
                                🔄 Sync
                            </button>
                        </div>
                    </div>
                    <div className="organizations-grid">
                        {organizations
                            .filter(org => {
                                const status = org.subscription?.status || org.subscriptionStatus || 'trial';
                                const matchesStatus = statusFilter === 'all' || status === statusFilter;
                                const matchesSearch = !searchQuery ||
                                    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (org.slug || org.subdomain || '').toLowerCase().includes(searchQuery.toLowerCase());
                                return matchesStatus && matchesSearch;
                            })
                            .map((org) => (
                                <OrganizationCard
                                    key={org._id}
                                    org={org}
                                    onUpdateStatus={handleUpdateStatus}
                                    onViewDetails={setSelectedOrg}
                                />
                            ))}
                    </div>
                </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && stats && (
                <motion.div
                    className="analytics-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="section-card">
                        <h3>📊 System Analytics</h3>
                        <div className="analytics-grid">
                            <div className="analytics-item">
                                <div className="analytics-label">Total Organizations</div>
                                <div className="analytics-value">{stats.overview?.totalOrganizations || organizations.length}</div>
                                <div className="analytics-detail">
                                    {stats.overview?.activeOrganizations || organizations.filter(o => (o.subscription?.status || o.subscriptionStatus) === 'active').length} active, {' '}
                                    {stats.overview?.trialOrganizations || organizations.filter(o => (o.subscription?.status || o.subscriptionStatus) === 'trial').length} trial
                                </div>
                            </div>
                            <div className="analytics-item">
                                <div className="analytics-label">Total Students</div>
                                <div className="analytics-value">{stats.overview?.totalStudents || 0}</div>
                                <div className="analytics-detail">Across all organizations</div>
                            </div>
                            <div className="analytics-item">
                                <div className="analytics-label">Total Admins</div>
                                <div className="analytics-value">{stats.overview?.totalAdmins || 0}</div>
                                <div className="analytics-detail">System administrators</div>
                            </div>
                            <div className="analytics-item">
                                <div className="analytics-label">Total Complaints</div>
                                <div className="analytics-value">{stats.overview?.totalComplaints || 0}</div>
                                <div className="analytics-detail">{stats.overview?.pendingComplaints || 0} pending</div>
                            </div>
                            <div className="analytics-item">
                                <div className="analytics-label">Total Hostels</div>
                                <div className="analytics-value">{stats.overview?.totalHostels || 0}</div>
                                <div className="analytics-detail">Managed properties</div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Breakdown Chart */}
                    <div className="section-card">
                        <h3>📈 Subscription Distribution</h3>
                        <div className="subscription-breakdown">
                            {stats.subscriptionBreakdown?.map((item) => (
                                <div key={item._id} className="subscription-item">
                                    <div className="sub-info">
                                        <span className="sub-name">{item._id || 'Unknown'}</span>
                                        <span className="sub-count">{item.count} organizations</span>
                                    </div>
                                    <div
                                        className="sub-badge"
                                        style={{ backgroundColor: getPlanColor(item._id) }}
                                    >
                                        {item.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* API Info */}
                    <div className="section-card">
                        <h3>ℹ️ System Information</h3>
                        <div className="system-info">
                            <p><strong>API URL:</strong> {API_URL}</p>
                            <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
                            <button className="refresh-btn" onClick={fetchDashboardData}>
                                🔄 Refresh Data
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Organization Details Modal */}
            {selectedOrg && (
                <div className="modal-overlay" onClick={() => setSelectedOrg(null)}>
                    <motion.div
                        className="modal-content org-details-modal"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <h2>🏢 {selectedOrg.name}</h2>
                        <div className="org-details">
                            <div className="detail-row">
                                <span className="detail-label">Subdomain:</span>
                                <span className="detail-value">{selectedOrg.slug || selectedOrg.subdomain}.hostelease.com</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Plan:</span>
                                <span className="detail-value plan-badge" style={{ backgroundColor: getPlanColor(selectedOrg.subscription?.plan || selectedOrg.subscriptionPlan) }}>
                                    {selectedOrg.subscription?.plan || selectedOrg.subscriptionPlan || 'free'}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status:</span>
                                <span className="detail-value status-badge" style={{ backgroundColor: getStatusColor(selectedOrg.subscription?.status || selectedOrg.subscriptionStatus) }}>
                                    {selectedOrg.subscription?.status || selectedOrg.subscriptionStatus || 'trial'}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{selectedOrg.contact?.email || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">ID:</span>
                                <span className="detail-value" style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{selectedOrg._id}</span>
                            </div>
                        </div>

                        <div className="org-stats-detail">
                            <h4>Statistics</h4>
                            <div className="stats-row">
                                <div className="stat-item">
                                    <span className="stat-num">{selectedOrg.stats?.students || 0}</span>
                                    <span className="stat-label">Students</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-num">{selectedOrg.stats?.admins || 0}</span>
                                    <span className="stat-label">Admins</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-num">{selectedOrg.stats?.hostels || 0}</span>
                                    <span className="stat-label">Hostels</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-num">{selectedOrg.stats?.complaints || 0}</span>
                                    <span className="stat-label">Complaints</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={() => handleUpdateStatus(selectedOrg._id, 'active')} className="action-btn success">
                                ✓ Set Active
                            </button>
                            <button onClick={() => handleUpdateStatus(selectedOrg._id, 'suspended')} className="action-btn danger">
                                ⏸ Suspend
                            </button>
                            <button onClick={() => setSelectedOrg(null)}>
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Create Organization Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <motion.div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <h2>Create New Organization</h2>
                        <form onSubmit={handleCreateOrganization}>
                            <div className="form-group">
                                <label>Organization Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newOrg.name}
                                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                                    placeholder="ABC Engineering College"
                                />
                            </div>
                            <div className="form-group">
                                <label>Subdomain *</label>
                                <input
                                    type="text"
                                    required
                                    value={newOrg.subdomain}
                                    onChange={(e) => setNewOrg({ ...newOrg, subdomain: e.target.value.toLowerCase() })}
                                    placeholder="abc-eng"
                                />
                                <small>{newOrg.subdomain}.hostelease.com</small>
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={newOrg.email}
                                    onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })}
                                    placeholder="admin@abc-eng.edu"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone *</label>
                                <input
                                    type="tel"
                                    required
                                    value={newOrg.phone}
                                    onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                                    placeholder="+91-9876543210"
                                />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <textarea
                                    value={newOrg.address}
                                    onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
                                    placeholder="City, State, Country"
                                    rows="2"
                                />
                            </div>
                            <div className="form-group">
                                <label>Subscription Plan *</label>
                                <select
                                    value={newOrg.subscriptionPlan}
                                    onChange={(e) => setNewOrg({ ...newOrg, subscriptionPlan: e.target.value })}
                                >
                                    <option value="free">Free (50 students)</option>
                                    <option value="starter">Starter (100 students)</option>
                                    <option value="professional">Professional (1000 students)</option>
                                    <option value="enterprise">Enterprise (10000 students)</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary">
                                    Create Organization
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon, title, value, subtitle, color }) => (
    <motion.div
        className="stat-card"
        whileHover={{ scale: 1.02 }}
        style={{ borderLeftColor: color }}
    >
        <div className="stat-icon" style={{ backgroundColor: `${color}20` }}>
            {icon}
        </div>
        <div className="stat-content">
            <h3>{title}</h3>
            <p className="stat-value">{value}</p>
            <p className="stat-subtitle">{subtitle}</p>
        </div>
    </motion.div>
);

// Organization Card Component
const OrganizationCard = ({ org, onUpdateStatus, onViewDetails }) => {
    const [showActions, setShowActions] = useState(false);

    // Handle both old flat format and new nested format
    const subscriptionPlan = org.subscription?.plan || org.subscriptionPlan || 'free';
    const subscriptionStatus = org.subscription?.status || org.subscriptionStatus || 'trial';
    const subdomain = org.slug || org.subdomain || 'unknown';

    return (
        <motion.div
            className="organization-card"
            whileHover={{ y: -5 }}
        >
            <div className="org-card-header">
                <div>
                    <h3>{org.name}</h3>
                    <p>{subdomain}.hostelease.com</p>
                </div>
                <button
                    className="actions-btn"
                    onClick={() => setShowActions(!showActions)}
                >
                    ⋮
                </button>
                {showActions && (
                    <div className="actions-menu">
                        <button onClick={() => onViewDetails(org)}>View Details</button>
                        <button onClick={() => onUpdateStatus(org._id, 'active')}>Set Active</button>
                        <button onClick={() => onUpdateStatus(org._id, 'suspended')}>Suspend</button>
                    </div>
                )}
            </div>

            <div className="org-stats">
                <div className="org-stat">
                    <span className="stat-label">Students</span>
                    <span className="stat-num">{org.stats?.students || 0}</span>
                </div>
                <div className="org-stat">
                    <span className="stat-label">Admins</span>
                    <span className="stat-num">{org.stats?.admins || 0}</span>
                </div>
                <div className="org-stat">
                    <span className="stat-label">Hostels</span>
                    <span className="stat-num">{org.stats?.hostels || 0}</span>
                </div>
                <div className="org-stat">
                    <span className="stat-label">Complaints</span>
                    <span className="stat-num">{org.stats?.complaints || 0}</span>
                </div>
            </div>

            <div className="org-footer">
                <span className="plan-badge">
                    {subscriptionPlan}
                </span>
                <span
                    className="status-indicator"
                    style={{ backgroundColor: subscriptionStatus === 'active' ? '#10B981' : '#F59E0B' }}
                >
                    {subscriptionStatus}
                </span>
            </div>
        </motion.div>
    );
};

export default SuperAdminDashboard;
