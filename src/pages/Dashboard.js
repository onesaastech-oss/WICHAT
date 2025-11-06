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
    FiBarChart2
} from 'react-icons/fi';

function Dashboard() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);


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

    // Sample data for metrics
    const metrics = [
        { title: "Total Chats", value: "1,248", change: "+12%", trend: "up" },
        { title: "Campaign Reach", value: "8,542", change: "+24%", trend: "up" },
        { title: "Templates Used", value: "47", change: "-3%", trend: "down" },
        { title: "Agent Response", value: "89%", change: "+5%", trend: "up" },
    ];

    // Recent activities
    const activities = [
        { id: 1, type: "Template", action: "Approved", name: "Order Confirmation", time: "10 min ago" },
        { id: 2, type: "Campaign", action: "Launched", name: "Summer Sale", time: "1 hour ago" },
        { id: 3, type: "Chat", action: "Assigned", name: "Customer #4582", time: "2 hours ago" },
    ];

    // User profile data
    const userProfile = {
        name: "Bmtax",
        email: "bmtax@example.com",
        plan: "Starter",
        status: "Active"
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
                    {/* Upgrade plan banner */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 mb-8 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold mb-2">Upgrade Your Plan</h2>
                            <p className="max-w-2xl">
                                Unlock more features, higher limits, and premium support with our Business plan.
                            </p>
                        </div>
                        <button className="bg-white text-indigo-600 font-medium px-6 py-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200">
                            Upgrade Now
                        </button>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {metrics.map((metric, index) => (
                            <MetricCard key={index} {...metric} />
                        ))}
                    </div>

                    {/* Two column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Left column - Features */}
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FeatureCard
                                    title="Live Chat"
                                    description="Centralize WhatsApp chats in one team inbox for seamless support."
                                    action="Go To Team Inbox"
                                    icon={<FiMessageSquare className="text-indigo-500" size={20} />}
                                    color="bg-indigo-50"
                                    compact
                                />
                                <FeatureCard
                                    title="Template"
                                    description="Create and manage approved templates for consistent messaging."
                                    action="Create Template"
                                    icon={<FiMail className="text-green-500" size={20} />}
                                    color="bg-green-50"
                                    compact
                                />
                                <FeatureCard
                                    title="Bot Reply"
                                    description="Automate replies to handle FAQs and offer 24/7 support."
                                    action="Create New Flow"
                                    icon={<FiZap className="text-yellow-500" size={20} />}
                                    color="bg-yellow-50"
                                    compact
                                />
                                <FeatureCard
                                    title="Virtual Event"
                                    description="Host and manage virtual events with WhatsApp integration."
                                    action="View Plan"
                                    icon={<FiCalendar className="text-purple-500" size={20} />}
                                    color="bg-purple-50"
                                    compact
                                />
                                <FeatureCard
                                    title="API Setup"
                                    description="Integrate WhatsApp API with your existing systems."
                                    action="Configure"
                                    icon={<FiSettings className="text-blue-500" size={20} />}
                                    color="bg-blue-50"
                                    compact
                                />
                                <FeatureCard
                                    title="Agents"
                                    description="Control team access and track agent performance."
                                    action="Manage Agents"
                                    icon={<FiUsers className="text-red-500" size={20} />}
                                    color="bg-red-50"
                                    compact
                                />
                            </div>
                            {/* Recent activity */}
                            <div className="bg-white rounded-xl shadow p-6 mt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                                <div className="space-y-4">
                                    {activities.map(activity => (
                                        <ActivityItem key={activity.id} {...activity} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right column - Profile and balances */}
                        <div className="space-y-6">
                            {/* Profile card */}
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
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

                            {/* Balance and limits card */}
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <FiBarChart2 className="mr-2 text-indigo-500" />
                                    Account Summary
                                </h3>
                                <div className="space-y-4">
                                    {balanceData.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                                            <span className="text-sm text-gray-600">{item.title}</span>
                                            <span className="font-semibold">{item.value} <span className="text-gray-400 text-xs">{item.unit}</span></span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-4 bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center">
                                    <FiCreditCard className="mr-2" size={16} />
                                    Add Funds
                                </button>
                            </div>

                            {/* Quick stats card */}
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Active Campaigns</span>
                                        <span className="font-semibold">3</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Online Agents</span>
                                        <span className="font-semibold">5/8</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Templates Used</span>
                                        <span className="font-semibold">47/100</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">API Calls Today</span>
                                        <span className="font-semibold">1,243/2,000</span>
                                    </div>
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
function MetricCard({ title, value, change, trend }) {
    return (
        <div className="bg-white rounded-xl shadow p-6 transition-all duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
            <div className={`mt-2 flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? (
                    <FiActivity className="w-4 h-4 mr-1 rotate-90 transition-transform duration-200" />
                ) : (
                    <FiActivity className="w-4 h-4 mr-1 -rotate-90 transition-transform duration-200" />
                )}
                {change}
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