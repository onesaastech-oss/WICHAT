import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
    FiChevronRight,
    FiLoader
} from 'react-icons/fi';
import moment from 'moment';
import axios from 'axios';
import { Encrypt } from '../encryption/payload-encryption';

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
    const [tokens, setTokens] = useState(null);
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [lastId, setLastId] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const lastIdRef = useRef(0);

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

    // Determine status from API response
    const getMessageStatus = (message) => {
        if (message.failed_reason) {
            return 'failed';
        }
        // If status field exists in response, use it
        if (message.status) {
            return message.status;
        }
        // Infer status from available fields
        if (message.wamid && !message.send_date) {
            return 'pending';
        }
        if (message.send_date) {
            // Default to sent if we have send_date but no other indicators
            return 'sent';
        }
        return 'pending';
    };

    // Fetch campaign messages from API
    const fetchCampaignMessages = useCallback(async (reset = false, currentLastId = null) => {
        if (!tokens?.token || !tokens?.username || !campaignId) {
            setLoading(false);
            return;
        }

        try {
            if (reset) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setError(null);

            const lastIdToUse = reset ? 0 : (currentLastId !== null ? currentLastId : lastIdRef.current);

            const payload = {
                project_id: tokens.projects?.[0]?.project_id || '',
                last_id: lastIdToUse,
                status: statusFilter,
                campaign_id: campaignId
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/campaign/campaign-messages',
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response?.data?.error) {
                const apiMessages = response?.data?.data || [];
                
                // Map API response to recipients format
                const mappedRecipients = apiMessages.map((message) => {
                    // Extract name from component parameters if available
                    let name = 'Unknown';
                    if (message.component && message.component.length > 0) {
                        const bodyComponent = message.component.find(c => c.type === 'body');
                        if (bodyComponent && bodyComponent.parameters && bodyComponent.parameters.length > 0) {
                            const textParam = bodyComponent.parameters.find(p => p.type === 'text');
                            if (textParam && textParam.text) {
                                name = textParam.text;
                            }
                        }
                    }
                    // Fallback to create_by name if available
                    if (name === 'Unknown' && message.create_by && message.create_by.name) {
                        name = message.create_by.name;
                    }

                    return {
                        id: message.unique_id,
                        phone: message.number,
                        name: name,
                        status: getMessageStatus(message),
                        date: message.send_date || message.create_date,
                        templateName: message.template_name,
                        templateId: message.template_id,
                        wamid: message.wamid,
                        failedReason: message.failed_reason,
                        createBy: message.create_by,
                        createDate: message.create_date,
                        sendDate: message.send_date
                    };
                });

                if (reset) {
                    setRecipients(mappedRecipients);
                } else {
                    setRecipients(prev => [...prev, ...mappedRecipients]);
                }

                const newLastId = response?.data?.last_id || 0;
                setLastId(newLastId);
                lastIdRef.current = newLastId;
                setHasMore(response?.data?.has_more || false);
            } else {
                setError(response?.data?.message || 'Failed to fetch campaign messages');
            }
        } catch (err) {
            console.error('Failed to fetch campaign messages:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch campaign messages');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [tokens?.token, tokens?.username, tokens?.projects, campaignId, statusFilter]);

    // Fetch messages when component mounts or dependencies change
    useEffect(() => {
        if (tokens?.token && tokens?.username && campaignId) {
            fetchCampaignMessages(true, 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokens?.token, tokens?.username, campaignId, statusFilter]);

    // Load more messages when scrolling (if needed)
    const loadMoreMessages = useCallback(() => {
        if (hasMore && !loadingMore && !loading) {
            fetchCampaignMessages(false, lastId);
        }
    }, [hasMore, loadingMore, loading, lastId, fetchCampaignMessages]);

    // Campaign data extracted from messages (limited data available from API)
    const campaignData = useMemo(() => {
        if (recipients.length === 0) {
            return {
                id: campaignId || 'N/A',
                name: campaignId || 'Campaign',
                template: null,
                templateId: null,
                createdBy: null,
                createdDate: null
            };
        }

        // Extract data from first message
        const firstRecipient = recipients[0];
        return {
            id: campaignId || 'N/A',
            name: campaignId || 'Campaign',
            template: firstRecipient.templateName || null,
            templateId: firstRecipient.templateId || null,
            createdBy: firstRecipient.createBy?.name || null,
            createdDate: firstRecipient.createDate || null
        };
    }, [recipients, campaignId]);


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
            pending: {
                bg: 'bg-yellow-100 dark:bg-yellow-900',
                text: 'text-yellow-800 dark:text-yellow-200',
                icon: <FiClock className="w-3 h-3" />,
                label: 'Pending'
            },
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

    // Calculate counts from recipients data
    const campaignStats = useMemo(() => {
        const total = recipients.length;
        const pending = recipients.filter(r => r.status === 'pending').length;
        const sent = recipients.filter(r => r.status === 'sent').length;
        const delivered = recipients.filter(r => r.status === 'delivered').length;
        const read = recipients.filter(r => r.status === 'read').length;
        const failed = recipients.filter(r => r.status === 'failed').length;

        return {
            total,
            pending,
            sent,
            delivered,
            read,
            failed
        };
    }, [recipients]);

    const deliveryRate = campaignStats.sent > 0 ? ((campaignStats.delivered / campaignStats.sent) * 100).toFixed(1) : 0;
    const readRate = campaignStats.delivered > 0 ? ((campaignStats.read / campaignStats.delivered) * 100).toFixed(1) : 0;
    const sentRate = campaignStats.total > 0 ? ((campaignStats.sent / campaignStats.total) * 100).toFixed(1) : 0;
    const pendingRate = campaignStats.total > 0 ? ((campaignStats.pending / campaignStats.total) * 100).toFixed(1) : 0;
    const failedRate = campaignStats.total > 0 ? ((campaignStats.failed / campaignStats.total) * 100).toFixed(1) : 0;

    const stats = [
        {
            title: 'All',
            value: campaignStats.total.toLocaleString(),
            total: campaignStats.total.toLocaleString(),
            percentage: 100,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            icon: <FiUsers className="w-5 h-5" />
        },
        {
            title: 'Pending',
            value: campaignStats.pending.toLocaleString(),
            total: campaignStats.total.toLocaleString(),
            percentage: pendingRate,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            icon: <FiClock className="w-5 h-5" />
        },
        {
            title: 'Sent',
            value: campaignStats.sent.toLocaleString(),
            total: campaignStats.total.toLocaleString(),
            percentage: sentRate,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            icon: <FiSend className="w-5 h-5" />
        },
        {
            title: 'Delivered',
            value: campaignStats.delivered.toLocaleString(),
            total: campaignStats.sent.toLocaleString(),
            percentage: deliveryRate,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            icon: <FiCheckCircle className="w-5 h-5" />
        },
        {
            title: 'Read',
            value: campaignStats.read.toLocaleString(),
            total: campaignStats.delivered.toLocaleString(),
            percentage: readRate,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            icon: <FiEye className="w-5 h-5" />
        },
        {
            title: 'Failed',
            value: campaignStats.failed.toLocaleString(),
            total: campaignStats.total.toLocaleString(),
            percentage: failedRate,
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
        console.log('Edit campaign:', campaignData.id);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this campaign?')) {
            console.log('Delete campaign:', campaignData.id);
            navigate('/campaigns');
        }
    };

    const handleExport = () => {
        // Export campaign data
        console.log('Export campaign data:', campaignData.id);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
            <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
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
                                                Campaign Details
                                            </h1>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
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
                                                <option value="pending">Pending</option>
                                                <option value="sent">Sent</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="read">Read</option>
                                                <option value="failed">Failed</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                                        </div>
                                    )}

                                    {/* Table Container with Fixed Height */}
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                            {loading ? (
                                                <div className="flex items-center justify-center py-12">
                                                    <FiLoader className="animate-spin text-indigo-600 dark:text-indigo-400" size={24} />
                                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading messages...</span>
                                                </div>
                                            ) : (
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
                                                            {recipients.some(r => r.failedReason) && (
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                    Failed Reason
                                                                </th>
                                                            )}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {paginatedRecipients.length === 0 ? (
                                                        <tr>
                                                                <td colSpan={recipients.some(r => r.failedReason) ? 5 : 4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
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
                                                                        {recipient.templateName && (
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                                {recipient.templateName}
                                                                            </div>
                                                                        )}
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
                                                                    {recipients.some(r => r.failedReason) && (
                                                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                            {recipient.failedReason ? (
                                                                                <span className="text-red-600 dark:text-red-400" title={recipient.failedReason}>
                                                                                    {recipient.failedReason.length > 50 
                                                                                        ? recipient.failedReason.substring(0, 50) + '...' 
                                                                                        : recipient.failedReason}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-400">-</span>
                                                                            )}
                                                                        </td>
                                                                    )}
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                            )}
                                        </div>
                                    </div>

                                    {/* Load More Button */}
                                    {hasMore && !loading && !loadingMore && (
                                        <div className="mt-4 flex justify-center">
                                            <button
                                                onClick={loadMoreMessages}
                                                className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 border border-indigo-300 dark:border-indigo-700 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}

                                    {loadingMore && (
                                        <div className="mt-4 flex justify-center">
                                            <FiLoader className="animate-spin text-indigo-600 dark:text-indigo-400" size={20} />
                                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading more...</span>
                                        </div>
                                    )}

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
                                                {campaignData.template || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Recipients</p>
                                            <p className="font-medium text-gray-900 dark:text-white mt-1">
                                                {campaignStats.total.toLocaleString()}
                                            </p>
                                        </div>
                                        {campaignData.createdBy && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Created By</p>
                                            <p className="font-medium text-gray-900 dark:text-white mt-1">
                                                    {campaignData.createdBy}
                                                </p>
                                            </div>
                                        )}
                                        {campaignData.createdDate && (
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Created Date</p>
                                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                                    {moment(campaignData.createdDate).format('MMM DD, YYYY [at] hh:mm A')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

    );
};

export default CampaignDetails;
