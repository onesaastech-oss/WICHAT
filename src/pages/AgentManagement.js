import React, { useState, useEffect, useCallback } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { Link } from 'react-router-dom';
import {
    FiMessageSquare,
    FiMail,
    FiSettings,
    FiUsers,
    FiZap,
    FiCalendar,
    FiActivity,
    FiPlus,
    FiDownload,
    FiUpload,
    FiEdit,
    FiTrash2,
    FiChevronLeft,
    FiChevronRight,
    FiUserPlus,
    FiCheckSquare,
    FiSquare,
    FiChevronDown,
    FiX,
    FiUser,
    FiFile,
    FiSave,
    FiEye,
    FiKey,
    FiLock
} from 'react-icons/fi';
import { Encrypt } from './encryption/payload-encryption';
import axios from 'axios';
import { LuRefreshCcwDot } from 'react-icons/lu';
import { MdEdit } from 'react-icons/md';

// Modal component outside to prevent rerenders
const Modal = ({ isOpen, onClose, title, children, actions, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl'
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className={`relative mx-auto p-5 border w-full ${sizeClasses[size]} shadow-lg rounded-md bg-white transform transition-all duration-300 scale-95 opacity-0 animate-modal-in`}>
                <div className="mt-3">
                    <div className="flex items-center justify-between pb-3 border-b">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                            <FiX className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="mt-4 max-h-96 overflow-y-auto">
                        {children}
                    </div>
                    <div className="items-center px-4 py-3 mt-4 flex justify-end space-x-4 border-t">
                        {actions}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Add Agent Form Component - Updated with fetch button and agent details preview
const AddAgentForm = React.memo(({
    newAgent,
    formErrors,
    addingAgent,
    fetchingAgent,
    fetchedAgent,
    onInputChange,
    permissionOptions,
    onFetchAgent
}) => (
    <div className="px-4 py-3 space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <div className="flex space-x-2">
                <input
                    type="email"
                    name="email"
                    value={newAgent.email}
                    onChange={onInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                    placeholder="Enter agent's email"
                    disabled={addingAgent || fetchingAgent}
                />
                <button
                    onClick={onFetchAgent}
                    disabled={!newAgent.email || fetchingAgent || addingAgent}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {fetchingAgent ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Fetching...
                        </div>
                    ) : (
                        'Fetch'
                    )}
                </button>
            </div>
            {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
            <p className="mt-1 text-xs text-gray-500">
                Enter the email address of the agent and click "Fetch" to get their details
            </p>
        </div>

        {/* Agent Details Preview */}
        {fetchedAgent && (
            <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Agent Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="font-medium">Name:</span> {fetchedAgent.name}
                    </div>
                    <div>
                        <span className="font-medium">Mobile:</span> {fetchedAgent.mobile}
                    </div>
                    <div>
                        <span className="font-medium">Status:</span>
                        <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${fetchedAgent.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {fetchedAgent.status ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium">Email ID:</span> {fetchedAgent.email}
                    </div>
                </div>
            </div>
        )}

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Permission Level *</label>
            <select
                name="permission_id"
                value={newAgent.permission}
                onChange={onInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.permission ? 'border-red-500' : 'border-gray-300'
                    }`}
                disabled={addingAgent || !fetchedAgent}
                required
            >
                {permissionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {formErrors.permission && <p className="mt-1 text-sm text-red-600">{formErrors.permission}</p>}
            {!fetchedAgent && (
                <p className="mt-1 text-xs text-yellow-600">
                    Please fetch agent details first to select permission level
                </p>
            )}
        </div>
    </div>
));

function AgentManagement() {
    const [tokens, setTokens] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [permissionOptions, setPermissionOptions] = useState([]);

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [currentAgent, setCurrentAgent] = useState(null);

    // Form states
    const [newAgent, setNewAgent] = useState({
        email: '',
        permission_id: ''
    });

    // Delete confirmation state
    const [deleteEmail, setDeleteEmail] = useState('');
    const [deleteError, setDeleteError] = useState('');

    // Loading state for add agent
    const [addingAgent, setAddingAgent] = useState(false);
    const [fetchingAgent, setFetchingAgent] = useState(false);
    const [fetchedAgent, setFetchedAgent] = useState(null);

    const [selectedPermission, setSelectedPermission] = useState('');
    const [formErrors, setFormErrors] = useState({});

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

    const fetchPermissions = async () => {
        try {
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/permission/list',
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const res_data = response.data;

            var arr = [
                {
                    value: '',
                    label: '-Select-'
                }
            ];
            if (res_data?.data && res_data?.data.length > 0) {
                res_data?.data.forEach(element => {
                    arr.push({
                        value: element.permission_id,
                        label: element.name,
                    })
                });
            }

            setPermissionOptions(arr)

        } catch (error) {
            alert('Failed to load permission list');
        }
    };

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/agent/list',
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const res_data = response.data;
            console.log(res_data);

            if (res_data.error) {
                alert(res_data.error);
            }

            if (res_data.data && res_data.count > 0) {
                setAgents(res_data.data);
            }

            setLoading(false);

        } catch (error) {
            alert('Failed to load agent list');
        }
    };

    // Fetch agent by email - UPDATED to use your API
    const fetchAgentByEmail = async (email) => {
        try {
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
                email: email
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/agent/fetch-agent', // Updated endpoint
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const res_data = response.data;

            if (res_data.error) {
                throw new Error(res_data.error);
            }

            if (res_data.data) {
                return res_data.data; // Return the first agent found
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch agent by email:', error);
            throw error;
        }
    };

    // Fetch agent by mapping_id for view modal
    const fetchAgentByMappingId = async (mappingId) => {
        try {
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
                mapping_id: mappingId
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/agent/mapping', // Assuming this endpoint exists
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const res_data = response.data;

            if (res_data.error) {
                throw new Error(res_data.error);
            }

            if (res_data.data && res_data.data.length > 0) {
                return res_data.data[0];
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch agent by mapping ID:', error);
            // Fallback to local data if API fails
            return agents.find(agent => agent.mapping_id === mappingId) || null;
        }
    };

    useEffect(() => {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const parsedData = JSON.parse(userData);
            setTokens(parsedData);
        }
    }, []);

    useEffect(() => {
        if (tokens) {
            fetchAgents();
            fetchPermissions();
        }
    }, [tokens]);

    // Get current agents for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAgents = agents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(agents.length / itemsPerPage);

    // Change page
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Handle delete agent
    const handleDeleteAgent = (agentEmail) => {
        setCurrentAgent(agents.find(agent => agent.email === agentEmail));
        setDeleteEmail('');
        setDeleteError('');
        setShowDeleteModal(true);
    };

    // Handle delete email input change
    const handleDeleteEmailChange = (e) => {
        const value = e.target.value;
        setDeleteEmail(value);

        if (currentAgent && value !== currentAgent.email) {
            setDeleteError('Email does not match');
        } else {
            setDeleteError('');
        }
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!currentAgent || deleteEmail !== currentAgent.email) {
            setDeleteError('Please enter the correct email to confirm deletion');
            return;
        }


        try {
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
                mapping_id: currentAgent?.mapping_id,
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/agent/delete', // Assuming this endpoint exists
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const res_data = response.data;
            console.log(res_data);

            if (res_data?.error) {
                throw new Error(res_data?.error);
            }

            if (res_data?.msg) {
                alert(res_data?.msg);
                return null;
            }
        } catch (error) {
            console.log('Failed to delete agent:', error);
        } finally {
            fetchAgents();
            setShowDeleteModal(false);
            setCurrentAgent(null);
            setDeleteEmail('');
            setDeleteError('');
        }
    };

    // Handle add agent
    const handleAddAgent = () => {
        setNewAgent({
            email: '',
            permission_id: ''
        });
        setFormErrors({});
        setFetchedAgent(null);
        setShowAddModal(true);
    };

    // Handle fetch agent details
    const handleFetchAgent = async () => {
        if (!newAgent.email.trim()) {
            setFormErrors({ email: 'Email is required' });
            return;
        }

        setFetchingAgent(true);
        setFormErrors({});

        try {
            const agentDetails = await fetchAgentByEmail(newAgent.email);

            if (!agentDetails) {
                setFormErrors({ email: 'No agent found with this email address' });
                return;
            }

            // Check if agent already exists in the list
            if (agents.some(agent => agent.email === newAgent.email)) {
                setFormErrors({ email: 'Agent with this email already exists' });
                return;
            }

            setFetchedAgent(agentDetails);
        } catch (error) {
            setFormErrors({ email: error.message || 'Failed to fetch agent details. Please try again.' });
        } finally {
            setFetchingAgent(false);
        }
    };

    // Handle view agent - UPDATED to filter by mapping_id
    const handleViewAgent = async (agent) => {
        try {
            // Fetch the latest agent data by mapping_id
            const agentDetails = await fetchAgentByMappingId(agent.mapping_id);
            setCurrentAgent(agentDetails || agent); // Use fetched data or fallback to current agent data
            setShowViewModal(true);
        } catch (error) {
            console.error('Failed to fetch agent details:', error);
            // Fallback to the current agent data if API call fails
            setCurrentAgent(agent);
            setShowViewModal(true);
        }
    };

    // Handle permission change
    const handlePermissionChange = (agent) => {
        setCurrentAgent(agent);
        setSelectedPermission(agent?.permission?.permission_id);
        setShowPermissionModal(true);
    };

    // Save permission change
    const savePermissionChange = async () => {

        if (selectedPermission == '') {
            return;
        }

        try {
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
                mapping_id: currentAgent?.mapping_id,
                permission_id: selectedPermission
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/agent/change-permission', // Updated endpoint
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const res_data = response.data;

            if (res_data.error) {
                throw new Error(res_data.error);
            }

            if (res_data.msg) {
                fetchAgents();
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch agent by email:', error);
            throw error;
        } finally {
            setShowPermissionModal(false);
            setCurrentAgent(null);
        }




    };

    // Handle input change for forms
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;

        setNewAgent(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        setFormErrors(prev => ({
            ...prev,
            [name]: ''
        }));

        // Clear fetched agent when email changes
        if (name === 'email') {
            setFetchedAgent(null);
        }
    }, []);

    // Handle permission selection change
    const handlePermissionSelectChange = useCallback((e) => {
        setSelectedPermission(e.target.value);
    }, []);

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!newAgent.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(newAgent.email)) {
            errors.email = 'Email address is invalid';
        }

        if (!fetchedAgent) {
            errors.email = 'Please fetch agent details first';
        }

        if (!newAgent.permission_id) {
            errors.permission = 'Permission level is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save new agent - updated to use fetched agent details
    const saveNewAgent = async () => {
        if (!validateForm()) return;

        setAddingAgent(true);
        try {

            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
                email: newAgent?.email,
                permission_id: newAgent?.permission_id,
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/agent/add', // Updated endpoint
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const res_data = response.data;
            if (res_data?.error) {
                alert(res_data?.error);
            }

            if (res_data.msg) {
                alert(res_data.msg);
                fetchAgents();
            }


            setShowAddModal(false);
            setNewAgent({
                email: '',
                permission: ''
            });
            setFetchedAgent(null);
        } catch (error) {
            console.error('Failed to add agent:', error);
            setFormErrors({ general: 'Failed to add agent. Please try again.' });
        } finally {
            setAddingAgent(false);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get permission label from value
    const getPermissionLabel = (permission) => {
        if (!permission) return 'Unknown';

        const permissionValue = permission.permission_id || permission.name || permission;
        const permissionOption = permissionOptions.find(opt =>
            opt.value === permissionValue.toLowerCase() ||
            opt.label.toLowerCase().includes(permissionValue.toLowerCase())
        );
        return permissionOption ? permissionOption.label : permissionValue;
    };

    // Modal actions
    const addModalActions = (
        <>
            <button
                className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setShowAddModal(false)}
                disabled={addingAgent}
            >
                Cancel
            </button>
            <button
                className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={saveNewAgent}
                disabled={addingAgent || !fetchedAgent}
            >
                {addingAgent ? (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                    </div>
                ) : (
                    'Add Agent'
                )}
            </button>
        </>
    );

    const permissionModalActions = (
        <>
            <button
                className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowPermissionModal(false)}
            >
                Cancel
            </button>
            <button
                className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={savePermissionChange}
                disabled={selectedPermission == '' ? true : false}
            >
                Save Changes
            </button>
        </>
    );

    const deleteModalActions = (
        <>
            <button
                className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowDeleteModal(false)}
            >
                Cancel
            </button>
            <button
                className={`px-4 py-2 text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${deleteEmail === currentAgent?.email
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-400 cursor-not-allowed'
                    }`}
                onClick={confirmDelete}
                disabled={deleteEmail !== currentAgent?.email}
            >
                Delete Agent
            </button>
        </>
    );

    const viewModalActions = (
        <button
            className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowViewModal(false)}
        >
            Close
        </button>
    );

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


            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirm Delete"
                actions={deleteModalActions}
            >
                <div className="px-4 py-3">
                    <p className="text-sm text-gray-500 mb-4">
                        Are you sure you want to delete the agent "<strong>{currentAgent?.name}</strong>"? This action cannot be undone.
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        To confirm, please type the agent's email address: <strong>{currentAgent?.email}</strong>
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Email</label>
                        <input
                            type="email"
                            value={deleteEmail}
                            onChange={handleDeleteEmailChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${deleteError ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter agent's email to confirm"
                        />
                        {deleteError && <p className="mt-1 text-sm text-red-600">{deleteError}</p>}
                    </div>
                </div>
            </Modal>

            {/* Add Agent Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => !addingAgent && setShowAddModal(false)}
                title="Add New Agent"
                actions={addModalActions}
            >
                <AddAgentForm
                    newAgent={newAgent}
                    formErrors={formErrors}
                    addingAgent={addingAgent}
                    fetchingAgent={fetchingAgent}
                    fetchedAgent={fetchedAgent}
                    onInputChange={handleInputChange}
                    permissionOptions={permissionOptions}
                    onFetchAgent={handleFetchAgent}
                />
            </Modal>

            {/* Permission Change Modal */}
            <Modal
                isOpen={showPermissionModal}
                onClose={() => setShowPermissionModal(false)}
                title="Change Agent Permissions"
                actions={permissionModalActions}
            >
                <div className="px-4 py-3 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Permission Level for {currentAgent?.name}
                        </label>
                        <select
                            value={selectedPermission}
                            onChange={handlePermissionSelectChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            {permissionOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="text-sm text-gray-500">
                        <p>This will update the agent's permission level and adjust their access rights accordingly.</p>
                    </div>
                </div>
            </Modal>

            {/* View Agent Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Agent Details"
                size="md"
                actions={viewModalActions}
            >
                {currentAgent && (
                    <div className="px-4 py-3 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <p className="text-sm text-gray-900">{currentAgent.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <p className="text-sm text-gray-900">
                                        {currentAgent.status ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Inactive
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                    <p className="text-sm text-gray-900">{currentAgent.mobile}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <p className="text-sm text-gray-900">{currentAgent.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Permission Information */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Permission Level</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <p className="text-sm text-gray-900">{getPermissionLabel(currentAgent.permission)} <button class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded" onClick={() => {
                                        handlePermissionChange(currentAgent);
                                        setShowViewModal(false);
                                    }}>
                                        <MdEdit />
                                    </button></p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Information */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Created On</label>
                                    <p className="text-sm text-gray-900">{formatDate(currentAgent.create_date)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Modified</label>
                                    <p className="text-sm text-gray-900">{formatDate(currentAgent.modify_date)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Created By Section */}
                        {currentAgent.create_by && (
                            <div className="pt-4 border-t">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Created By</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <p className="text-sm text-gray-900">{currentAgent.create_by.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                        <p className="text-sm text-gray-900">{currentAgent.create_by.mobile}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modified By Section */}
                        {currentAgent.modify_by && (
                            <div className="pt-4 border-t">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Modified By</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <p className="text-sm text-gray-900">{currentAgent.modify_by.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                        <p className="text-sm text-gray-900">{currentAgent.modify_by.mobile}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Main content */}
            <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
                    {/* Page header */}
                    <div className="md:flex md:items-center md:justify-between mb-6">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                Agent Management
                            </h2>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4 gap-2">
                            <button
                                onClick={() => {
                                    fetchAgents();
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <LuRefreshCcwDot className="mr-2" />
                                Refresh
                            </button>
                            <button
                                onClick={handleAddAgent}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <FiUserPlus className="mr-2" />
                                Add Agent
                            </button>
                        </div>
                    </div>

                    {/* Agents table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Agent
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact Info
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Permission
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        // Skeleton loading rows
                                        Array.from({ length: itemsPerPage }).map((_, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <div className="h-6 bg-gray-200 rounded w-6 animate-pulse"></div>
                                                        <div className="h-6 bg-gray-200 rounded w-6 animate-pulse"></div>
                                                        <div className="h-6 bg-gray-200 rounded w-6 animate-pulse"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        // Actual data rows
                                        currentAgents.map((agent, index) => (
                                            <tr key={agent.mapping_id || agent.email || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                <FiUser className="h-6 w-6 text-indigo-600" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {agent.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{agent.email}</div>
                                                    <div className="text-sm text-gray-500">{agent.mobile}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {agent.status ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{getPermissionLabel(agent.permission)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            onClick={() => handleViewAgent(agent)}
                                                        >
                                                            <FiEye size={18} />
                                                        </button>
                                                        <button
                                                            className="text-green-600 hover:text-green-900"
                                                            onClick={() => handlePermissionChange(agent)}
                                                        >
                                                            <FiKey size={18} />
                                                        </button>
                                                        <button
                                                            className="text-red-600 hover:text-red-900"
                                                            onClick={() => handleDeleteAgent(agent.email)}
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

                        {/* Pagination */}
                        {!loading && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                                            <span className="font-medium">
                                                {Math.min(indexOfLastItem, agents.length)}
                                            </span>{' '}
                                            of <span className="font-medium">{agents.length}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => paginate(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium 
                          ${currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                <span className="sr-only">Previous</span>
                                                <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                                            </button>

                                            {/* Page numbers */}
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => paginate(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                            ${currentPage === page
                                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    {page}
                                                </button>
                                            ))}

                                            <button
                                                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium 
                          ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                <span className="sr-only">Next</span>
                                                <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS for animations */}
            <style jsx>
                {`
                @keyframes modalIn {
                0% {
                    transform: scale(0.95);
                    opacity: 0;
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
                }
                .animate-modal-in {
                animation: modalIn 0.2s ease-out forwards;
                }
            `}
            </style>
        </div>
    );
}

export default AgentManagement;