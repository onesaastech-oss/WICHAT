import React, { useState, useEffect, useCallback } from 'react';
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
    FiXCircle,
    FiAlertCircle
} from 'react-icons/fi';
import moment from 'moment';
import axios from 'axios';
import { Encrypt } from '../encryption/payload-encryption';

const CampaignList = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tokens, setTokens] = useState(null);
    const [lastId, setLastId] = useState(0);
    const [hasMore, setHasMore] = useState(false);

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

    // Fetch campaigns from API
    const fetchCampaigns = useCallback(async (reset = false, currentLastId = null) => {
        if (!tokens?.token || !tokens?.username) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Use provided lastId, or get from state, or reset to 0
            const lastIdToUse = reset ? 0 : (currentLastId !== null ? currentLastId : lastId);

            const payload = {
                project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                last_id: lastIdToUse,
                status: filterStatus // filterStatus already uses API values: 'all', 'complete', 'pending', 'stopped'
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/campaign/list',
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
                const apiCampaigns = response?.data?.data || [];
                
                // Map API response to component format
                const mappedCampaigns = apiCampaigns.map(campaign => {
                    // Map status: API uses 'pending'/'complete'/'stopped', component uses 'scheduled'/'completed'/'failed'
                    let status = campaign.status;
                    if (status === 'pending') status = 'scheduled';
                    else if (status === 'complete') status = 'completed';
                    else if (status === 'stopped') status = 'failed';

                    // Get audience source
                    const audienceSource = campaign.source === 'excel' ? 'Excel Upload' : 
                                         campaign.source === 'sheet' ? 'Google Sheet' : 
                                         campaign.source === 'group' ? 'Contact Groups' : 
                                         'Custom';

                    return {
                        id: campaign.campaign_id,
                        name: campaign.name,
                        template: campaign.template?.template_name || 'N/A',
                        audience: audienceSource,
                        recipients: parseInt(campaign.recipients?.total || 0),
                        sent: parseInt(campaign.recipients?.sent || 0),
                        delivered: parseInt(campaign.recipients?.delivered || 0),
                        read: parseInt(campaign.recipients?.read || 0),
                        status: status,
                        createdDate: campaign.create_date,
                        scheduledDate: null, // API doesn't provide this
                        completedDate: campaign.status === 'complete' ? campaign.modify_date : null,
                        hasError: campaign.has_error,
                        errorFile: campaign.error_file
                    };
                });

                if (reset) {
                    setCampaigns(mappedCampaigns);
                } else {
                    setCampaigns(prev => [...prev, ...mappedCampaigns]);
                }

                setLastId(response?.data?.last_id || 0);
                setHasMore(response?.data?.has_more || false);
            } else {
                setError(response?.data?.message || 'Failed to fetch campaigns');
                setCampaigns([]);
            }
        } catch (err) {
            console.error('Error fetching campaigns:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch campaigns');
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    }, [tokens, filterStatus]); // Removed lastId to avoid infinite loop - we use it from state when needed

    // Fetch campaigns when tokens are loaded or filter changes
    useEffect(() => {
        if (tokens?.token && tokens?.username) {
            setLastId(0);
            fetchCampaigns(true);
        }
    }, [tokens?.token, tokens?.username, filterStatus, fetchCampaigns]);

    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: {
                bg: 'bg-green-100 dark:bg-green-900',
                text: 'text-green-800 dark:text-green-200',
                icon: <FiCheckCircle className="w-4 h-4" />,
                label: 'Completed'
            },
            scheduled: {
                bg: 'bg-blue-100 dark:bg-blue-900',
                text: 'text-blue-800 dark:text-blue-200',
                icon: <FiClock className="w-4 h-4" />,
                label: 'Scheduled'
            },
            pending: {
                bg: 'bg-yellow-100 dark:bg-yellow-900',
                text: 'text-yellow-800 dark:text-yellow-200',
                icon: <FiClock className="w-4 h-4" />,
                label: 'Pending'
            },
            draft: {
                bg: 'bg-gray-100 dark:bg-gray-700',
                text: 'text-gray-800 dark:text-gray-200',
                icon: <FiClock className="w-4 h-4" />,
                label: 'Draft'
            },
            failed: {
                bg: 'bg-red-100 dark:bg-red-900',
                text: 'text-red-800 dark:text-red-200',
                icon: <FiXCircle className="w-4 h-4" />,
                label: 'Failed'
            },
            stopped: {
                bg: 'bg-red-100 dark:bg-red-900',
                text: 'text-red-800 dark:text-red-200',
                icon: <FiXCircle className="w-4 h-4" />,
                label: 'Stopped'
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
        
        // Map filter status to component status values
        let matchesStatus = true;
        if (filterStatus !== 'all') {
            if (filterStatus === 'complete') {
                matchesStatus = campaign.status === 'completed';
            } else if (filterStatus === 'pending') {
                matchesStatus = campaign.status === 'scheduled' || campaign.status === 'pending';
            } else if (filterStatus === 'stopped') {
                matchesStatus = campaign.status === 'failed' || campaign.status === 'stopped';
            } else {
                matchesStatus = campaign.status === filterStatus;
            }
        }
        
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
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</div>
                                <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {campaigns.filter(c => c.status === 'scheduled' || c.status === 'pending').length}
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
                                        <option value="complete">Completed</option>
                                        <option value="pending">Pending</option>
                                        <option value="stopped">Stopped</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex items-center">
                                    <FiAlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                                </div>
                            </div>
                        )}

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
                                        {loading ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                                        <span className="ml-2">Loading campaigns...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredCampaigns.length === 0 ? (
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
                                                                <div className="flex items-center">
                                                                <button
                                                                    onClick={() => handleViewCampaign(campaign.id)}
                                                                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                                                                >
                                                                    {campaign.name}
                                                                </button>
                                                                    {campaign.hasError && (
                                                                        <a
                                                                            href={campaign.errorFile}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                                            title="View error file"
                                                                        >
                                                                            <FiAlertCircle size={16} />
                                                                        </a>
                                                                    )}
                                                                </div>
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
                                                            {(campaign.status === 'draft' || campaign.status === 'scheduled' || campaign.status === 'pending') && (
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
                            {/* Load More Button */}
                            {hasMore && !loading && (
                                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
                                    <button
                                        onClick={() => fetchCampaigns(false, lastId)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Load More
                                    </button>
                                </div>
                            )}
                        </div>


                    </div>
                </main>
            </div>
        </div>
    );
};

export default CampaignList;
