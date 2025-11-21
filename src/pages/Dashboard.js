import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
import {
    FiMessageSquare,
    FiMail,
    FiSettings,
    FiUsers,
    FiZap,
    FiCalendar,
    FiActivity,
    FiCreditCard,
    FiUser,
    FiBarChart2,
    FiCheckCircle,
    FiXCircle,
    FiSend,
    FiClock,
    FiAlertCircle,
    FiTrendingUp,
    FiFileText,
    FiUserCheck,
    FiUserX,
    FiBriefcase,
    FiPlus
} from 'react-icons/fi';
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';

function Dashboard() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [tokens, setTokens] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    // Get user data and check project count
    const getUserData = () => {
        try {
            const userData = localStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing userData from localStorage:', error);
            return null;
        }
    };

    const userData = getUserData();
    const hasProjects = userData && userData.project_count > 0;

    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    // Load tokens from storage
    useEffect(() => {
        const loadTokens = () => {
            try {
                if (typeof window === 'undefined') return;
                const storages = [localStorage, sessionStorage];
                for (const storage of storages) {
                    try {
                        const data = storage?.getItem('userData');
                        if (data) {
                            const parsed = JSON.parse(data);
                            if (parsed && typeof parsed === 'object') {
                                setTokens(parsed);
                                return;
                            }
                        }
                    } catch (storageError) {
                        console.error('Failed to parse tokens from storage:', storageError);
                    }
                }
                setTokens(null);
            } catch (e) {
                console.error('Failed to load tokens:', e);
            }
        };
        loadTokens();
    }, []);

    // Fetch dashboard data from API
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!tokens?.token || !tokens?.username) {
                setLoading(false);
                return;
            }

            // If user has no projects, skip API call and show zero data
            if (!hasProjects) {
                setLoading(false);
                setError(null);
                setDashboardData({
                    campaign: {
                        total: 0,
                        message: {
                            total: 0,
                            sent: 0,
                            pending: 0,
                            delivered: 0,
                            read: 0,
                            failed: 0
                        }
                    },
                    chat: { total: 0 },
                    contact: { total: 0 },
                    template: {
                        total: 0,
                        approved: 0,
                        pending: 0,
                        rejected: 0
                    }
                });
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const payload = {
                    project_id: tokens.selected_project_id,
                };

                const { data, key } = Encrypt(payload);
                const data_pass = JSON.stringify({ data, key });

                const response = await axios.post(
                    'https://api.w1chat.com/project/dashboard',
                    data_pass,
                    {
                        headers: {
                            'token': tokens.token,
                            'username': tokens.username,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response?.data?.error && response?.data?.data) {
                    setDashboardData(response.data.data);
                } else {
                    setError(response?.data?.message || 'Failed to fetch dashboard data');
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError('Failed to fetch dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [tokens, hasProjects]);

    // Prevent background scrolling when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [mobileMenuOpen]);

    // Prepare main metrics from API data
    const mainMetrics = dashboardData ? [
        { 
            title: "Total Campaigns", 
            value: dashboardData.campaign?.total?.toLocaleString() || "0", 
            icon: <FiZap className="w-6 h-6" />,
            color: "bg-blue-500",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600"
        },
        { 
            title: "Total Chats", 
            value: dashboardData.chat?.total?.toLocaleString() || "0", 
            icon: <FiMessageSquare className="w-6 h-6" />,
            color: "bg-green-500",
            bgColor: "bg-green-50",
            textColor: "text-green-600"
        },
        { 
            title: "Total Contacts", 
            value: dashboardData.contact?.total?.toLocaleString() || "0", 
            icon: <FiUsers className="w-6 h-6" />,
            color: "bg-purple-500",
            bgColor: "bg-purple-50",
            textColor: "text-purple-600"
        },
        { 
            title: "Total Templates", 
            value: dashboardData.template?.total?.toLocaleString() || "0", 
            icon: <FiFileText className="w-6 h-6" />,
            color: "bg-orange-500",
            bgColor: "bg-orange-50",
            textColor: "text-orange-600"
        },
    ] : [
        { title: "Total Campaigns", value: "0", icon: <FiZap className="w-6 h-6" />, color: "bg-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-600" },
        { title: "Total Chats", value: "0", icon: <FiMessageSquare className="w-6 h-6" />, color: "bg-green-500", bgColor: "bg-green-50", textColor: "text-green-600" },
        { title: "Total Contacts", value: "0", icon: <FiUsers className="w-6 h-6" />, color: "bg-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-600" },
        { title: "Total Templates", value: "0", icon: <FiFileText className="w-6 h-6" />, color: "bg-orange-500", bgColor: "bg-orange-50", textColor: "text-orange-600" },
    ];

    // Campaign message metrics
    const campaignMessageMetrics = dashboardData?.campaign?.message ? [
        {
            title: "Total Messages",
            value: dashboardData.campaign.message.total?.toLocaleString() || "0",
            icon: <FiMail className="w-5 h-5" />,
            color: "text-blue-600",
            bgColor: "bg-blue-100"
        },
        {
            title: "Sent",
            value: dashboardData.campaign.message.sent?.toLocaleString() || "0",
            icon: <FiSend className="w-5 h-5" />,
            color: "text-green-600",
            bgColor: "bg-green-100"
        },
        {
            title: "Pending",
            value: dashboardData.campaign.message.pending?.toLocaleString() || "0",
            icon: <FiClock className="w-5 h-5" />,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100"
        },
        {
            title: "Delivered",
            value: dashboardData.campaign.message.delivered?.toLocaleString() || "0",
            icon: <FiCheckCircle className="w-5 h-5" />,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100"
        },
        {
            title: "Read",
            value: dashboardData.campaign.message.read?.toLocaleString() || "0",
            icon: <FiActivity className="w-5 h-5" />,
            color: "text-indigo-600",
            bgColor: "bg-indigo-100"
        },
        {
            title: "Failed",
            value: dashboardData.campaign.message.failed?.toLocaleString() || "0",
            icon: <FiAlertCircle className="w-5 h-5" />,
            color: "text-red-600",
            bgColor: "bg-red-100"
        }
    ] : [];

    // Template status metrics
    const templateMetrics = dashboardData?.template ? [
        {
            title: "Approved",
            value: dashboardData.template.approved?.toLocaleString() || "0",
            icon: <FiUserCheck className="w-5 h-5" />,
            color: "text-green-600",
            bgColor: "bg-green-100",
            percentage: dashboardData.template.total > 0 ? Math.round((dashboardData.template.approved / dashboardData.template.total) * 100) : 0
        },
        {
            title: "Pending",
            value: dashboardData.template.pending?.toLocaleString() || "0",
            icon: <FiClock className="w-5 h-5" />,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
            percentage: dashboardData.template.total > 0 ? Math.round((dashboardData.template.pending / dashboardData.template.total) * 100) : 0
        },
        {
            title: "Rejected",
            value: dashboardData.template.rejected?.toLocaleString() || "0",
            icon: <FiUserX className="w-5 h-5" />,
            color: "text-red-600",
            bgColor: "bg-red-100",
            percentage: dashboardData.template.total > 0 ? Math.round((dashboardData.template.rejected / dashboardData.template.total) * 100) : 0
        }
    ] : [];

    // Recent activities
    const activities = [
        { id: 1, type: "dummy", action: "Approved", name: "Order Confirmation", time: "10 min ago" },
        { id: 2, type: "dummy", action: "Launched", name: "Summer Sale", time: "1 hour ago" },
        { id: 3, type: "dummy", action: "Assigned", name: "Customer #4582", time: "2 hours ago" },
    ];

    // User profile data
    const userProfile = {
        name: "Bmtax",
        email: "bmtax@example.com",
        plan: "Starter",
        status: "Active",
        verified: true // Change to false for unverified
    };

    // Balance and limits data
    const balanceData = [
        { title: "Live Chat Balance", value: "1,243", unit: "chats" },
        { title: "Daily Limit", value: "2,000", unit: "chats" },
        { title: "Current Balance", value: "$124.50", unit: "USD" }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            />
            <Sidebar
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            />

            {/* Main content */}
            <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
                    {/* No Projects Warning */}
                    {!hasProjects && (
                        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <FiBriefcase className="h-6 w-6 text-amber-400" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-lg font-medium text-amber-800 mb-2">
                                        No Projects Found for Your ID
                                    </h3>
                                    <div className="text-sm text-amber-700 mb-4">
                                        <p>
                                            You need to create at least one project to access Live Chat, Templates, and Campaigns features. 
                                            Create your first project to unlock the full dashboard experience and start managing your communications.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <a
                                            href="/projects"
                                            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                                        >
                                            <FiPlus className="mr-2" size={16} />
                                            Create New Project
                                        </a>
                                        <a
                                            href="/projects"
                                            className="inline-flex items-center px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                                        >
                                            <FiBriefcase className="mr-2" size={16} />
                                            View Projects Page
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upgrade plan banner */}


                    {/* Main Metrics */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {[1, 2, 3, 4].map((index) => (
                                <div key={index} className="bg-white rounded-xl shadow p-6 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
                            <p className="text-red-600">{error}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {mainMetrics.map((metric, index) => (
                                <EnhancedMetricCard key={index} {...metric} />
                            ))}
                        </div>
                    )}

                    {/* Campaign Message Analytics */}
                    {!loading && !error && dashboardData?.campaign?.message && (
                        <div className="mb-8">
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                    <FiBarChart2 className="mr-2 text-blue-500" />
                                    Campaign Message Analytics
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {campaignMessageMetrics.map((metric, index) => (
                                        <MessageMetricCard key={index} {...metric} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Template Status Overview */}
                    {!loading && !error && dashboardData?.template && (
                        <div className="mb-8">
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                    <FiFileText className="mr-2 text-orange-500" />
                                    Template Status Overview
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {templateMetrics.map((metric, index) => (
                                        <TemplateStatusCard key={index} {...metric} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Two column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Left column - Analytics and Activity */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Performance Overview */}
                            {!loading && !error && dashboardData && (
                                <div className="bg-white rounded-xl shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                        <FiTrendingUp className="mr-2 text-green-500" />
                                        Performance Overview
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Campaign Performance */}
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-3">Campaign Performance</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Success Rate</span>
                                                    <span className="font-semibold text-green-600">
                                                        {dashboardData.campaign?.message?.total > 0 
                                                            ? Math.round(((dashboardData.campaign.message.sent + dashboardData.campaign.message.delivered) / dashboardData.campaign.message.total) * 100)
                                                            : 0}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Delivery Rate</span>
                                                    <span className="font-semibold text-blue-600">
                                                        {dashboardData.campaign?.message?.sent > 0 
                                                            ? Math.round((dashboardData.campaign.message.delivered / dashboardData.campaign.message.sent) * 100)
                                                            : 0}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Read Rate</span>
                                                    <span className="font-semibold text-purple-600">
                                                        {dashboardData.campaign?.message?.delivered > 0 
                                                            ? Math.round((dashboardData.campaign.message.read / dashboardData.campaign.message.delivered) * 100)
                                                            : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Template Approval */}
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-3">Template Approval</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Approval Rate</span>
                                                    <span className="font-semibold text-green-600">
                                                        {dashboardData.template?.total > 0 
                                                            ? Math.round((dashboardData.template.approved / dashboardData.template.total) * 100)
                                                            : 0}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Pending Review</span>
                                                    <span className="font-semibold text-yellow-600">{dashboardData.template?.pending || 0}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Rejection Rate</span>
                                                    <span className="font-semibold text-red-600">
                                                        {dashboardData.template?.total > 0 
                                                            ? Math.round((dashboardData.template.rejected / dashboardData.template.total) * 100)
                                                            : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent activity */}
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <FiActivity className="mr-2 text-indigo-500" />
                                    Recent Activity
                                </h3>
                                <div className="space-y-4">
                                    {activities.map(activity => (
                                        <ActivityItem key={activity.id} {...activity} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right column - Profile */}
                        <div className="space-y-6">
                            {/* Profile card */}
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <FiUser className="mr-2 text-indigo-500" />
                                    Profile Information
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium">{userProfile.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{userProfile.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Verification Status</p>
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium">
                                                {userProfile.verified ? 'Verified' : 'Unverified'}
                                            </p>
                                            {userProfile.verified ? (
                                                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                    <FiCheckCircle className="mr-1" size={14} />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                                    <FiXCircle className="mr-1" size={14} />
                                                    Unverified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Current Plan</p>
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium">{userProfile.plan}</p>
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                {userProfile.status}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="w-full mt-4 text-indigo-600 font-medium text-sm hover:text-indigo-800 transition-colors duration-200 flex items-center justify-center">
                                        Edit Profile <FiSettings className="ml-1" size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reusable components
function EnhancedMetricCard({ title, value, icon, color, bgColor, textColor }) {
    return (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 transition-all duration-200 hover:shadow-lg hover:scale-105">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 leading-tight">{title}</h3>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">{value}</p>
                </div>
                <div className={`p-2 sm:p-2.5 rounded-lg ${bgColor} flex-shrink-0`}>
                    <div className={`${textColor} w-5 h-5 sm:w-6 sm:h-6`}>
                        {React.cloneElement(icon, { className: 'w-full h-full' })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MessageMetricCard({ title, value, icon, color, bgColor }) {
    return (
        <div className="bg-white border rounded-lg p-4 transition-all duration-200 hover:shadow-md">
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${bgColor} mb-3`}>
                <div className={color}>
                    {icon}
                </div>
            </div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">{title}</h4>
            <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
    );
}

function TemplateStatusCard({ title, value, icon, color, bgColor, percentage }) {
    return (
        <div className="bg-white border rounded-lg p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${bgColor}`}>
                    <div className={color}>
                        {icon}
                    </div>
                </div>
                <span className={`text-sm font-semibold ${color}`}>{percentage}%</span>
            </div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div 
                    className={`h-2 rounded-full transition-all duration-300 ${bgColor.replace('bg-', 'bg-').replace('-100', '-500')}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}

function FeatureCard({ title, description, action, icon, color, compact = false }) {
    return (
        <div className={`bg-white rounded-xl shadow overflow-hidden transition-all duration-200 hover:shadow-md ${compact ? 'h-full' : ''}`}>
            <div className={`p-3 ${color} transition-colors duration-200`}>
                {icon}
            </div>
            <div className={`p-4 ${compact ? 'h-[calc(100%-52px)] flex flex-col' : ''}`}>
                <h3 className="text-md font-medium text-gray-900 mb-2">{title}</h3>
                <p className={`text-gray-600 ${compact ? 'text-sm mb-3 flex-grow' : 'mb-4'}`}>{description}</p>
                <a href="#" className="text-indigo-600 font-medium text-sm hover:text-indigo-800 transition-colors duration-200 inline-flex items-center">
                    {action} <span className="ml-1">→</span>
                </a>
            </div>
        </div>
    );
}

function ActivityItem({ type, action, name, time }) {
    return (
        <div className="flex items-start transition-all duration-200 hover:bg-gray-50 p-2 rounded-lg">
            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-2 transition-colors duration-200">
                {type === "Template" && <FiMail className="text-indigo-600" size={18} />}
                {type === "Campaign" && <FiZap className="text-indigo-600" size={18} />}
                {type === "Chat" && <FiMessageSquare className="text-indigo-600" size={18} />}
            </div>
            <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                    {action} <span className="text-indigo-600">{name}</span>
                </p>
                <p className="text-sm text-gray-500">{time}</p>
            </div>
        </div>
    );
}

export default Dashboard;