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
            {activeTab === 'overview' && stats && (
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
                            {stats.subscriptionBreakdown.map((item) => (
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
                            {stats.recentOrganizations.map((org) => (
                                <div key={org._id} className="recent-org-item">
                                    <div className="org-info">
                                        <h4>{org.name}</h4>
                                        <p>{org.subdomain}.hostelease.com</p>
                                    </div>
                                    <div className="org-meta">
                                        <span
                                            className="plan-badge"
                                            style={{ backgroundColor: getPlanColor(org.subscriptionPlan) }}
                                        >
                                            {org.subscriptionPlan}
                                        </span>
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(org.subscriptionStatus) }}
                                        >
                                            {org.subscriptionStatus}
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
                    <div className="organizations-grid">
                        {organizations.map((org) => (
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

    return (
        <motion.div
            className="organization-card"
            whileHover={{ y: -5 }}
        >
            <div className="org-card-header">
                <div>
                    <h3>{org.name}</h3>
                    <p>{org.subdomain}.hostelease.com</p>
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
                    <span className="stat-num">{org.stats.students}</span>
                </div>
                <div className="org-stat">
                    <span className="stat-label">Admins</span>
                    <span className="stat-num">{org.stats.admins}</span>
                </div>
                <div className="org-stat">
                    <span className="stat-label">Hostels</span>
                    <span className="stat-num">{org.stats.hostels}</span>
                </div>
                <div className="org-stat">
                    <span className="stat-label">Complaints</span>
                    <span className="stat-num">{org.stats.complaints}</span>
                </div>
            </div>

            <div className="org-footer">
                <span className="plan-badge">
                    {org.subscriptionPlan}
                </span>
                <span
                    className="status-indicator"
                    style={{ backgroundColor: org.subscriptionStatus === 'active' ? '#10B981' : '#F59E0B' }}
                >
                    {org.subscriptionStatus}
                </span>
            </div>
        </motion.div>
    );
};

export default SuperAdminDashboard;
