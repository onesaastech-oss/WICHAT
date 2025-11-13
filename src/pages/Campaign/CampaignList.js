import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../../component/Menu';
import { useNavigate } from 'react-router-dom';
import {
    FiPlus,
    FiSearch,
    FiEdit,
    FiTrash2,
    FiEye,
    FiZap,
    FiUsers,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiXCircle
} from 'react-icons/fi';
import moment from 'moment';

const CampaignList = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

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

    // Dummy campaign data
    const [campaigns] = useState([
        {
            id: 'CAMP-001',
            name: 'Summer Sale 2024',
            template: 'Summer Promotion',
            audience: 'All Contacts',
            recipients: 1250,
            sent: 1180,
            delivered: 1150,
            read: 890,
            status: 'completed',
            createdDate: '2024-01-15T10:30:00',
            scheduledDate: '2024-01-16T09:00:00',
            completedDate: '2024-01-16T10:15:00'
        },
        {
            id: 'CAMP-002',
            name: 'New Product Launch',
            template: 'Product Announcement',
            audience: 'VIP Customers',
            recipients: 450,
            sent: 450,
            delivered: 435,
            read: 320,
            status: 'completed',
            createdDate: '2024-01-12T14:20:00',
            scheduledDate: '2024-01-13T10:00:00',
            completedDate: '2024-01-13T10:30:00'
        },
        {
            id: 'CAMP-003',
            name: 'Weekly Newsletter',
            template: 'Newsletter Template',
            audience: 'Subscribed Users',
            recipients: 3200,
            sent: 0,
            delivered: 0,
            read: 0,
            status: 'scheduled',
            createdDate: '2024-01-18T09:15:00',
            scheduledDate: '2024-01-20T08:00:00',
            completedDate: null
        },
        {
            id: 'CAMP-004',
            name: 'Holiday Greetings',
            template: 'Holiday Message',
            audience: 'All Contacts',
            recipients: 2100,
            sent: 2100,
            delivered: 2050,
            read: 1650,
            status: 'completed',
            createdDate: '2023-12-20T11:00:00',
            scheduledDate: '2023-12-25T00:00:00',
            completedDate: '2023-12-25T01:30:00'
        },
        {
            id: 'CAMP-005',
            name: 'Customer Feedback Request',
            template: 'Feedback Survey',
            audience: 'Recent Customers',
            recipients: 680,
            sent: 0,
            delivered: 0,
            read: 0,
            status: 'draft',
            createdDate: '2024-01-19T15:45:00',
            scheduledDate: null,
            completedDate: null
        },
        {
            id: 'CAMP-006',
            name: 'Flash Sale Alert',
            template: 'Sale Notification',
            audience: 'Premium Members',
            recipients: 890,
            sent: 890,
            delivered: 875,
            read: 720,
            status: 'completed',
            createdDate: '2024-01-10T08:30:00',
            scheduledDate: '2024-01-10T12:00:00',
            completedDate: '2024-01-10T12:45:00'
        },
        {
            id: 'CAMP-007',
            name: 'Account Verification',
            template: 'Verification Request',
            audience: 'Unverified Users',
            recipients: 340,
            sent: 340,
            delivered: 320,
            read: 180,
            status: 'completed',
            createdDate: '2024-01-08T13:20:00',
            scheduledDate: '2024-01-08T14:00:00',
            completedDate: '2024-01-08T14:20:00'
        },
        {
            id: 'CAMP-008',
            name: 'Event Invitation',
            template: 'Event Invite',
            audience: 'Local Contacts',
            recipients: 520,
            sent: 0,
            delivered: 0,
            read: 0,
            status: 'failed',
            createdDate: '2024-01-17T10:00:00',
            scheduledDate: '2024-01-18T09:00:00',
            completedDate: null
        }
    ]);

    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: {
                bg: 'bg-green-100',
                text: 'text-green-800',
                icon: <FiCheckCircle className="w-4 h-4" />,
                label: 'Completed'
            },
            scheduled: {
                bg: 'bg-blue-100',
                text: 'text-blue-800',
                icon: <FiClock className="w-4 h-4" />,
                label: 'Scheduled'
            },
            draft: {
                bg: 'bg-gray-100',
                text: 'text-gray-800',
                icon: <FiClock className="w-4 h-4" />,
                label: 'Draft'
            },
            failed: {
                bg: 'bg-red-100',
                text: 'text-red-800',
                icon: <FiXCircle className="w-4 h-4" />,
                label: 'Failed'
            }
        };

        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.icon}
                <span className="ml-1">{config.label}</span>
            </span>
        );
    };

    const filteredCampaigns = campaigns.filter(campaign => {
        const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.template.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleCreateCampaign = () => {
        navigate('/create-campaign');
    };

    const handleViewCampaign = (campaignId) => {
        navigate(`/campaign/${campaignId}`);
    };

    const handleEditCampaign = (campaignId) => {
        // Navigate to edit campaign page
        console.log('Edit campaign:', campaignId);
    };

    const handleDeleteCampaign = (campaignId) => {
        // Handle delete campaign
        if (window.confirm('Are you sure you want to delete this campaign?')) {
            console.log('Delete campaign:', campaignId);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            />

            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'lg:ml-16' : 'lg:ml-64'}`}>
                <Header
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                    isMinimized={isMinimized}
                    setIsMinimized={setIsMinimized}
                />

                <main className="mt-16 flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Manage and track your WhatsApp campaigns
                                    </p>
                                </div>
                                <div className="mt-4 sm:mt-0">
                                    <button
                                        onClick={handleCreateCampaign}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                    >
                                        <FiPlus className="mr-2" size={18} />
                                        Create Campaign
                                    </button>
                                </div>
                            </div>
                        </div>


                        {/* Summary Stats */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Campaigns</div>
                                <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{campaigns.length}</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</div>
                                <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                    {campaigns.filter(c => c.status === 'completed').length}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled</div>
                                <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {campaigns.filter(c => c.status === 'scheduled').length}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Recipients</div>
                                <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                                    {campaigns.reduce((sum, c) => sum + c.recipients, 0).toLocaleString()}
                                </div>
                            </div>
                        </div>



                        {/* Search and Filter Bar */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4 mt-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiSearch className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search campaigns..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div className="sm:w-48">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="completed">Completed</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="draft">Draft</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Campaigns Table */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Campaign
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Template
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Audience
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Recipients
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredCampaigns.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No campaigns found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCampaigns.map((campaign) => (
                                                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
                                                                <FiZap size={20} />
                                                            </div>
                                                            <div className="ml-4">
                                                                <button
                                                                    onClick={() => handleViewCampaign(campaign.id)}
                                                                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                                                                >
                                                                    {campaign.name}
                                                                </button>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {campaign.id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white">{campaign.template}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                                                            <FiUsers className="mr-1" size={16} />
                                                            {campaign.audience}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white">
                                                            <div className="font-medium">{campaign.recipients.toLocaleString()}</div>
                                                            {campaign.status === 'completed' && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {campaign.delivered} delivered, {campaign.read} read
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getStatusBadge(campaign.status)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center">
                                                            <FiCalendar className="mr-1" size={14} />
                                                            {moment(campaign.createdDate).format('MMM DD, YYYY')}
                                                        </div>
                                                        {campaign.scheduledDate && (
                                                            <div className="text-xs mt-1">
                                                                Scheduled: {moment(campaign.scheduledDate).format('MMM DD, HH:mm')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleViewCampaign(campaign.id)}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                title="View campaign"
                                                            >
                                                                <FiEye size={18} />
                                                            </button>
                                                            {campaign.status === 'draft' && (
                                                                <button
                                                                    onClick={() => handleEditCampaign(campaign.id)}
                                                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                                    title="Edit campaign"
                                                                >
                                                                    <FiEdit size={18} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteCampaign(campaign.id)}
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                title="Delete campaign"
                                                            >
                                                                <FiTrash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                    </div>
                </main>
            </div>
        </div>
    );
};

export default CampaignList;
