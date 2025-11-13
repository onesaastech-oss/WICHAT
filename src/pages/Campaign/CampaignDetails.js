import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../../component/Menu';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FiArrowLeft,
    FiEdit,
    FiTrash2,
    FiZap,
    FiUsers,
    FiMail,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiXCircle,
    FiSend,
    FiEye,
    FiTrendingUp,
    FiBarChart2,
    FiActivity,
    FiDownload,
    FiSearch,
    FiPhone,
    FiChevronLeft,
    FiChevronRight
} from 'react-icons/fi';
import moment from 'moment';

const CampaignDetails = () => {
    const navigate = useNavigate();
    const { campaignId } = useParams();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

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

    // Dummy campaign data - In real app, fetch based on campaignId
    const [campaign] = useState({
        id: campaignId || 'CAMP-001',
        name: 'Summer Sale 2024',
        template: 'Summer Promotion',
        templateId: 'TEMP-123',
        audience: 'All Contacts',
        audienceType: 'all',
        recipients: 1250,
        sent: 1180,
        delivered: 1150,
        read: 890,
        processing: 245,
        replied: 67,
        failed: 70,
        status: 'completed',
        createdDate: '2024-01-15T10:30:00',
        scheduledDate: '2024-01-16T09:00:00',
        startedDate: '2024-01-16T09:05:00',
        completedDate: '2024-01-16T10:15:00',
        createdBy: 'John Doe',
        description: 'Promotional campaign for summer sale with special discounts on all products.',
        message: '🎉 Summer Sale is here! Get up to 50% off on all products. Shop now and save big! Limited time offer.',
        variables: [
            { name: 'customer_name', value: '{{name}}' },
            { name: 'discount', value: '{{discount}}' }
        ]
    });

    // Dummy recipients data
    const [recipients] = useState([
        { id: 1, phone: '+1234567890', name: 'John Doe', status: 'read', date: '2024-01-16T09:15:00' },
        { id: 2, phone: '+1234567891', name: 'Jane Smith', status: 'delivered', date: '2024-01-16T09:16:00' },
        { id: 3, phone: '+1234567892', name: 'Mike Johnson', status: 'read', date: '2024-01-16T09:17:00' },
        { id: 4, phone: '+1234567893', name: 'Sarah Williams', status: 'sent', date: '2024-01-16T09:18:00' },
        { id: 5, phone: '+1234567894', name: 'David Brown', status: 'read', date: '2024-01-16T09:19:00' },
        { id: 6, phone: '+1234567895', name: 'Emily Davis', status: 'failed', date: '2024-01-16T09:20:00' },
        { id: 7, phone: '+1234567896', name: 'Robert Miller', status: 'delivered', date: '2024-01-16T09:21:00' },
        { id: 8, phone: '+1234567897', name: 'Lisa Wilson', status: 'read', date: '2024-01-16T09:22:00' },
        { id: 9, phone: '+1234567898', name: 'James Moore', status: 'sent', date: '2024-01-16T09:23:00' },
        { id: 10, phone: '+1234567899', name: 'Patricia Taylor', status: 'read', date: '2024-01-16T09:24:00' },
        { id: 11, phone: '+1234567900', name: 'Michael Anderson', status: 'delivered', date: '2024-01-16T09:25:00' },
        { id: 12, phone: '+1234567901', name: 'Linda Thomas', status: 'failed', date: '2024-01-16T09:26:00' },
        { id: 13, phone: '+1234567902', name: 'William Jackson', status: 'read', date: '2024-01-16T09:27:00' },
        { id: 14, phone: '+1234567903', name: 'Barbara White', status: 'sent', date: '2024-01-16T09:28:00' },
        { id: 15, phone: '+1234567904', name: 'Richard Harris', status: 'read', date: '2024-01-16T09:29:00' }
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
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                {config.icon}
                <span className="ml-2">{config.label}</span>
            </span>
        );
    };

    const getRecipientStatusBadge = (status) => {
        const statusConfig = {
            sent: {
                bg: 'bg-blue-100 dark:bg-blue-900',
                text: 'text-blue-800 dark:text-blue-200',
                icon: <FiSend className="w-3 h-3" />,
                label: 'Sent'
            },
            delivered: {
                bg: 'bg-green-100 dark:bg-green-900',
                text: 'text-green-800 dark:text-green-200',
                icon: <FiCheckCircle className="w-3 h-3" />,
                label: 'Delivered'
            },
            read: {
                bg: 'bg-purple-100 dark:bg-purple-900',
                text: 'text-purple-800 dark:text-purple-200',
                icon: <FiEye className="w-3 h-3" />,
                label: 'Read'
            },
            failed: {
                bg: 'bg-red-100 dark:bg-red-900',
                text: 'text-red-800 dark:text-red-200',
                icon: <FiXCircle className="w-3 h-3" />,
                label: 'Failed'
            }
        };

        const config = statusConfig[status] || statusConfig.sent;
  return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.icon}
                <span className="ml-1">{config.label}</span>
            </span>
        );
    };

    const filteredRecipients = recipients.filter(recipient => {
        const matchesSearch = recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             recipient.phone.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || recipient.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredRecipients.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRecipients = filteredRecipients.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    const deliveryRate = campaign.recipients > 0 ? ((campaign.delivered / campaign.recipients) * 100).toFixed(1) : 0;
    const readRate = campaign.delivered > 0 ? ((campaign.read / campaign.delivered) * 100).toFixed(1) : 0;
    const clickRate = campaign.read > 0 ? ((campaign.processing / campaign.read) * 100).toFixed(1) : 0;
    const replyRate = campaign.read > 0 ? ((campaign.replied / campaign.read) * 100).toFixed(1) : 0;

    const stats = [
        {
            title: 'Sent',
            value: campaign.sent.toLocaleString(),
            total: campaign.recipients.toLocaleString(),
            percentage: campaign.recipients > 0 ? ((campaign.sent / campaign.recipients) * 100).toFixed(1) : 0,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            icon: <FiSend className="w-5 h-5" />
        },
        {
            title: 'Delivered',
            value: campaign.delivered.toLocaleString(),
            total: campaign.sent.toLocaleString(),
            percentage: deliveryRate,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            icon: <FiCheckCircle className="w-5 h-5" />
        },
        {
            title: 'Read',
            value: campaign.read.toLocaleString(),
            total: campaign.delivered.toLocaleString(),
            percentage: readRate,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            icon: <FiEye className="w-5 h-5" />
        },
        {
            title: 'Processing',
            value: campaign.processing.toLocaleString(),
            total: campaign.read.toLocaleString(),
            percentage: clickRate,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            icon: <FiTrendingUp className="w-5 h-5" />
        },
        {
            title: 'Replied',
            value: campaign.replied.toLocaleString(),
            total: campaign.read.toLocaleString(),
            percentage: replyRate,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            icon: <FiActivity className="w-5 h-5" />
        },
        {
            title: 'Failed',
            value: campaign.failed.toLocaleString(),
            total: campaign.recipients.toLocaleString(),
            percentage: campaign.recipients > 0 ? ((campaign.failed / campaign.recipients) * 100).toFixed(1) : 0,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            icon: <FiXCircle className="w-5 h-5" />
        }
    ];

    const handleBack = () => {
        navigate('/campaigns');
    };

    const handleEdit = () => {
        // Navigate to edit page or open edit modal
        console.log('Edit campaign:', campaign.id);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this campaign?')) {
            console.log('Delete campaign:', campaign.id);
            navigate('/campaigns');
        }
    };

    const handleExport = () => {
        // Export campaign data
        console.log('Export campaign data:', campaign.id);
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
                        {/* Header Section */}
                        <div className="mb-6">
                            <button
                                onClick={handleBack}
                                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
                            >
                                <FiArrowLeft className="mr-2" size={20} />
                                Back to Campaigns
                            </button>

                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
                                            <FiZap size={24} />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {campaign.name}
                                            </h1>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {campaign.id}
                                            </p>
                                        </div>
                                    </div>
                                    {campaign.description && (
                                        <p className="text-gray-600 dark:text-gray-400 mt-2 ml-15">
                                            {campaign.description}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                                    {getStatusBadge(campaign.status)}
                                    {campaign.status === 'draft' && (
                                        <button
                                            onClick={handleEdit}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <FiEdit className="mr-2" size={16} />
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={handleExport}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <FiDownload className="mr-2" size={16} />
                                        Export
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        <FiTrash2 className="mr-2" size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {stats.map((stat, index) => (
                                <div key={index} className={`${stat.bgColor} rounded-lg p-4`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <div className={stat.color}>
                                                {stat.icon}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {stat.title}
                                            </span>
                                        </div>
                                        <span className={`text-lg font-bold ${stat.color}`}>
                                            {stat.percentage}%
                                        </span>
                                    </div>
                                    <div className="flex items-baseline space-x-2">
                                        <span className={`text-2xl font-bold ${stat.color}`}>
                                            {stat.value}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            / {stat.total}
                                        </span>
                                    </div>
                                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`${stat.color.replace('text-', 'bg-')} h-2 rounded-full transition-all duration-300`}
                                            style={{ width: `${stat.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Campaign Info */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Campaign Message Preview */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                        <FiMail className="mr-2 text-indigo-500" />
                                        Message Preview
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-indigo-500">
                                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                            {campaign.message}
                                        </p>
                                    </div>
                                    {campaign.variables && campaign.variables.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Variables:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {campaign.variables.map((variable, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                                                    >
                                                        {variable.name}: {variable.value}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Performance Chart Placeholder */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                        <FiBarChart2 className="mr-2 text-indigo-500" />
                                        Performance Over Time
                                    </h3>
                                    <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Chart visualization would go here
                                        </p>
                                    </div>
                                </div>

                                {/* Recipients Table */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                            <FiUsers className="mr-2 text-indigo-500" />
                                            Recipients ({filteredRecipients.length})
                                        </h3>
                                    </div>

                                    {/* Search and Filter */}
                                    <div className="mb-4 flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FiSearch className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search by name or phone..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:w-48">
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="sent">Sent</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="read">Read</option>
                                                <option value="failed">Failed</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Table Container with Fixed Height */}
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Name
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Phone
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {paginatedRecipients.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                                No recipients found
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        paginatedRecipients.map((recipient) => (
                                                            <tr key={recipient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {recipient.name}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                                                                        <FiPhone className="mr-2 text-gray-400" size={14} />
                                                                        {recipient.phone}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    {getRecipientStatusBadge(recipient.status)}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                    <div className="flex items-center">
                                                                        <FiCalendar className="mr-1" size={14} />
                                                                        {moment(recipient.date).format('MMM DD, YYYY [at] hh:mm A')}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Pagination Controls */}
                                    {filteredRecipients.length > 0 && (
                                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Show</span>
                                                <select
                                                    value={itemsPerPage}
                                                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                                                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                >
                                                    <option value="5">5</option>
                                                    <option value="10">10</option>
                                                    <option value="25">25</option>
                                                    <option value="50">50</option>
                                                    <option value="100">100</option>
                                                </select>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">entries</span>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredRecipients.length)} of {filteredRecipients.length} entries
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <FiChevronLeft size={16} />
                                                </button>

                                                {/* Page Numbers */}
                                                <div className="flex items-center space-x-1">
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                        // Show first page, last page, current page, and pages around current
                                                        if (
                                                            page === 1 ||
                                                            page === totalPages ||
                                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                                        ) {
                                                            return (
                                                                <button
                                                                    key={page}
                                                                    onClick={() => handlePageChange(page)}
                                                                    className={`px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                                                        currentPage === page
                                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                                    }`}
                                                                >
                                                                    {page}
                                                                </button>
                                                            );
                                                        } else if (
                                                            page === currentPage - 2 ||
                                                            page === currentPage + 2
                                                        ) {
                                                            return (
                                                                <span key={page} className="px-2 text-gray-500 dark:text-gray-400">
                                                                    ...
                                                                </span>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>

                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <FiChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Details */}
                            <div className="space-y-6">
                                {/* Campaign Details */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                        Campaign Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Template</p>
                                            <p className="font-medium text-gray-900 dark:text-white mt-1">
                                                {campaign.template}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Audience</p>
                                            <div className="flex items-center mt-1">
                                                <FiUsers className="mr-2 text-gray-400" size={16} />
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {campaign.audience}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Recipients</p>
                                            <p className="font-medium text-gray-900 dark:text-white mt-1">
                                                {campaign.recipients.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Created By</p>
                                            <p className="font-medium text-gray-900 dark:text-white mt-1">
                                                {campaign.createdBy}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                        <FiCalendar className="mr-2 text-indigo-500" />
                                        Timeline
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                                    <FiCalendar size={16} />
                                                </div>
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Created
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {moment(campaign.createdDate).format('MMM DD, YYYY [at] hh:mm A')}
                                                </p>
                                            </div>
                                        </div>
                                        {campaign.scheduledDate && (
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300">
                                                        <FiClock size={16} />
                                                    </div>
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        Scheduled
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {moment(campaign.scheduledDate).format('MMM DD, YYYY [at] hh:mm A')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {campaign.startedDate && (
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                                                        <FiZap size={16} />
                                                    </div>
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        Started
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {moment(campaign.startedDate).format('MMM DD, YYYY [at] hh:mm A')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {campaign.completedDate && (
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                                                        <FiCheckCircle size={16} />
                                                    </div>
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        Completed
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {moment(campaign.completedDate).format('MMM DD, YYYY [at] hh:mm A')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CampaignDetails;
