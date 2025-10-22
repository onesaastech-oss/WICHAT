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

function AgentManagement() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [currentAgent, setCurrentAgent] = useState(null);

    // Form states
    const [newAgent, setNewAgent] = useState({
        firstName: '',
        lastName: '',
        mobileNumber: '',
        username: '',
        email: '',
        password: '',
        permissions: {
            administrative: {
                configuration: false,
                subscription: false,
                teamMembers: false
            },
            manageContacts: {
                manageContacts: false,
                groups: false,
                customContactFields: false
            },
            manageCampaigns: {
                createCampaigns: false,
                executeCampaigns: false,
                scheduleCampaigns: false
            },
            messaging: {
                chat: false,
                syncTemplates: false
            },
            manageTemplates: {
                createTemplates: false,
                editTemplates: false,
                deleteTemplates: false
            },
            assignedChatOnly: false,
            manageBotReplies: {
                botReplies: false,
                flows: false
            }
        }
    });

    const [formErrors, setFormErrors] = useState({});

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

    // Fetch agents data (simulated)
    useEffect(() => {
        const fetchAgents = async () => {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Mock data for agents
                const mockAgents = [
                    { 
                        id: 1, 
                        firstName: 'John', 
                        lastName: 'Doe', 
                        mobileNumber: '+1234567890', 
                        username: 'johndoe',
                        email: 'john@example.com',
                        password: 'hashedpassword',
                        permissions: {
                            administrative: { configuration: true, subscription: false, teamMembers: true },
                            manageContacts: { manageContacts: true, groups: true, customContactFields: false },
                            manageCampaigns: { createCampaigns: true, executeCampaigns: true, scheduleCampaigns: false },
                            messaging: { chat: true, syncTemplates: true },
                            manageTemplates: { createTemplates: false, editTemplates: true, deleteTemplates: false },
                            assignedChatOnly: true,
                            manageBotReplies: { botReplies: false, flows: true }
                        },
                        createdOn: '2023-06-15' 
                    },
                    { 
                        id: 2, 
                        firstName: 'Jane', 
                        lastName: 'Smith', 
                        mobileNumber: '+441234567890', 
                        username: 'janesmith',
                        email: 'jane@example.com',
                        password: 'hashedpassword',
                        permissions: {
                            administrative: { configuration: false, subscription: false, teamMembers: false },
                            manageContacts: { manageContacts: true, groups: false, customContactFields: false },
                            manageCampaigns: { createCampaigns: false, executeCampaigns: true, scheduleCampaigns: false },
                            messaging: { chat: true, syncTemplates: false },
                            manageTemplates: { createTemplates: false, editTemplates: false, deleteTemplates: false },
                            assignedChatOnly: false,
                            manageBotReplies: { botReplies: false, flows: false }
                        },
                        createdOn: '2023-06-10' 
                    }
                ];

                setAgents(mockAgents);
            } catch (error) {
                console.error('Failed to fetch agents:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAgents();
    }, []);

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
    const handleDeleteAgent = (agentId) => {
        setCurrentAgent(agents.find(agent => agent.id === agentId));
        setShowDeleteModal(true);
    };

    // Confirm delete
    const confirmDelete = () => {
        setAgents(agents.filter(agent => agent.id !== currentAgent.id));
        setShowDeleteModal(false);
        setCurrentAgent(null);
    };

    // Handle add agent
    const handleAddAgent = () => {
        setNewAgent({
            firstName: '',
            lastName: '',
            mobileNumber: '',
            username: '',
            email: '',
            password: '',
            permissions: {
                administrative: {
                    configuration: false,
                    subscription: false,
                    teamMembers: false
                },
                manageContacts: {
                    manageContacts: false,
                    groups: false,
                    customContactFields: false
                },
                manageCampaigns: {
                    createCampaigns: false,
                    executeCampaigns: false,
                    scheduleCampaigns: false
                },
                messaging: {
                    chat: false,
                    syncTemplates: false
                },
                manageTemplates: {
                    createTemplates: false,
                    editTemplates: false,
                    deleteTemplates: false
                },
                assignedChatOnly: false,
                manageBotReplies: {
                    botReplies: false,
                    flows: false
                }
            }
        });
        setFormErrors({});
        setShowAddModal(true);
    };

    // Handle edit agent
    const handleEditAgent = (agent) => {
        setCurrentAgent(agent);
        setNewAgent({
            firstName: agent.firstName,
            lastName: agent.lastName,
            mobileNumber: agent.mobileNumber,
            username: agent.username,
            email: agent.email,
            password: agent.password,
            permissions: {...agent.permissions}
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Handle view agent
    const handleViewAgent = (agent) => {
        setCurrentAgent(agent);
        setShowViewModal(true);
    };

    // Handle input change for forms
    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        
        // Handle nested permission fields
        if (name.includes('.')) {
            const [category, field] = name.split('.');
            setNewAgent(prev => ({
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [category]: {
                        ...prev.permissions[category],
                        [field]: type === 'checkbox' ? checked : value
                    }
                }
            }));
        } else {
            setNewAgent(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        // Clear error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    }, [formErrors]);

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!newAgent.firstName.trim()) {
            errors.firstName = 'First name is required';
        }
        if (!newAgent.lastName.trim()) {
            errors.lastName = 'Last name is required';
        }
        if (!newAgent.mobileNumber.trim()) {
            errors.mobileNumber = 'Mobile number is required';
        } else if (!/^\+\d{1,15}$/.test(newAgent.mobileNumber)) {
            errors.mobileNumber = 'Please enter a valid mobile number with country code (e.g., +1234567890)';
        }
        if (!newAgent.username.trim()) {
            errors.username = 'Username is required';
        }
        if (!newAgent.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(newAgent.email)) {
            errors.email = 'Email address is invalid';
        }
        if (!newAgent.password.trim()) {
            errors.password = 'Password is required';
        } else if (newAgent.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save new agent
    const saveNewAgent = () => {
        if (validateForm()) {
            const newAgentObj = {
                id: agents.length + 1,
                ...newAgent,
                createdOn: new Date().toISOString().split('T')[0]
            };
            setAgents([...agents, newAgentObj]);
            setShowAddModal(false);
            setNewAgent({
                firstName: '',
                lastName: '',
                mobileNumber: '',
                username: '',
                email: '',
                password: '',
                permissions: {
                    administrative: {
                        configuration: false,
                        subscription: false,
                        teamMembers: false
                    },
                    manageContacts: {
                        manageContacts: false,
                        groups: false,
                        customContactFields: false
                    },
                    manageCampaigns: {
                        createCampaigns: false,
                        executeCampaigns: false,
                        scheduleCampaigns: false
                    },
                    messaging: {
                        chat: false,
                        syncTemplates: false
                    },
                    manageTemplates: {
                        createTemplates: false,
                        editTemplates: false,
                        deleteTemplates: false
                    },
                    assignedChatOnly: false,
                    manageBotReplies: {
                        botReplies: false,
                        flows: false
                    }
                }
            });
        }
    };

    // Save edited agent
    const saveEditedAgent = () => {
        if (validateForm()) {
            const updatedAgents = agents.map(agent =>
                agent.id === currentAgent.id
                    ? { ...agent, ...newAgent }
                    : agent
            );
            setAgents(updatedAgents);
            setShowEditModal(false);
            setCurrentAgent(null);
            setNewAgent({
                firstName: '',
                lastName: '',
                mobileNumber: '',
                username: '',
                email: '',
                password: '',
                permissions: {
                    administrative: {
                        configuration: false,
                        subscription: false,
                        teamMembers: false
                    },
                    manageContacts: {
                        manageContacts: false,
                        groups: false,
                        customContactFields: false
                    },
                    manageCampaigns: {
                        createCampaigns: false,
                        executeCampaigns: false,
                        scheduleCampaigns: false
                    },
                    messaging: {
                        chat: false,
                        syncTemplates: false
                    },
                    manageTemplates: {
                        createTemplates: false,
                        editTemplates: false,
                        deleteTemplates: false
                    },
                    assignedChatOnly: false,
                    manageBotReplies: {
                        botReplies: false,
                        flows: false
                    }
                }
            });
        }
    };

    // Handle permission category toggle
    const togglePermissionCategory = (category) => {
        const allPermissions = Object.keys(newAgent.permissions[category]).reduce((acc, key) => {
            acc[key] = !Object.values(newAgent.permissions[category]).some(val => val);
            return acc;
        }, {});

        setNewAgent(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [category]: allPermissions
            }
        }));
    };

    // Modal component for reusability
    const Modal = React.memo(({ isOpen, onClose, title, children, actions }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                <div className="relative mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white transform transition-all duration-300 scale-95 opacity-0 animate-modal-in">
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
    });

    // Permission section component
    const PermissionSection = ({ title, category, permissions }) => (
        <div className="border rounded-md p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{title}</h4>
                <button
                    type="button"
                    onClick={() => togglePermissionCategory(category)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                    {Object.values(permissions).some(val => val) ? 'Deselect All' : 'Select All'}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                        <input
                            type="checkbox"
                            id={`${category}.${key}`}
                            name={`${category}.${key}`}
                            checked={value}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`${category}.${key}`} className="ml-2 block text-sm text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirm Delete"
                actions={
                    <>
                        <button
                            className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={confirmDelete}
                        >
                            Delete
                        </button>
                    </>
                }
            >
                <div className="px-4 py-3">
                    <p className="text-sm text-gray-500">
                        Are you sure you want to delete the agent "{currentAgent?.firstName} {currentAgent?.lastName}"? This action cannot be undone.
                    </p>
                </div>
            </Modal>

            {/* Add Agent Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add New Agent"
                actions={
                    <>
                        <button
                            className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => setShowAddModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={saveNewAgent}
                        >
                            Save Agent
                        </button>
                    </>
                }
            >
                <div className="px-4 py-3 space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                                type="text"
                                name="firstName"
                                value={newAgent.firstName}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter first name"
                            />
                            {formErrors.firstName && <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                                type="text"
                                name="lastName"
                                value={newAgent.lastName}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter last name"
                            />
                            {formErrors.lastName && <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                        <input
                            type="text"
                            name="mobileNumber"
                            value={newAgent.mobileNumber}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="+1234567890"
                        />
                        {formErrors.mobileNumber && <p className="mt-1 text-sm text-red-600">{formErrors.mobileNumber}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                        <input
                            type="text"
                            name="username"
                            value={newAgent.username}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.username ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter username"
                        />
                        {formErrors.username && <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={newAgent.email}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter email"
                        />
                        {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={newAgent.password}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.password ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter password"
                        />
                        {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                    </div>

                    <div className="pt-4 border-t mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
                        
                        <PermissionSection 
                            title="Administrative" 
                            category="administrative" 
                            permissions={newAgent.permissions.administrative} 
                        />
                        
                        <PermissionSection 
                            title="Manage Contacts" 
                            category="manageContacts" 
                            permissions={newAgent.permissions.manageContacts} 
                        />
                        
                        <PermissionSection 
                            title="Manage Campaigns" 
                            category="manageCampaigns" 
                            permissions={newAgent.permissions.manageCampaigns} 
                        />
                        
                        <PermissionSection 
                            title="Messaging" 
                            category="messaging" 
                            permissions={newAgent.permissions.messaging} 
                        />
                        
                        <PermissionSection 
                            title="Manage Templates" 
                            category="manageTemplates" 
                            permissions={newAgent.permissions.manageTemplates} 
                        />
                        
                        <div className="border rounded-md p-4 mb-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="assignedChatOnly"
                                    name="assignedChatOnly"
                                    checked={newAgent.permissions.assignedChatOnly}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="assignedChatOnly" className="ml-2 block text-sm text-gray-900">
                                    Assigned Chat Only (Restrict users to assigned chat only, unless they will have access to all chats)
                                </label>
                            </div>
                        </div>
                        
                        <PermissionSection 
                            title="Manage Bot Replies and Flows" 
                            category="manageBotReplies" 
                            permissions={newAgent.permissions.manageBotReplies} 
                        />
                    </div>
                </div>
            </Modal>

            {/* Edit Agent Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Agent"
                actions={
                    <>
                        <button
                            className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => setShowEditModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={saveEditedAgent}
                        >
                            Save Changes
                        </button>
                    </>
                }
            >
                <div className="px-4 py-3 space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                                type="text"
                                name="firstName"
                                value={newAgent.firstName}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {formErrors.firstName && <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                                type="text"
                                name="lastName"
                                value={newAgent.lastName}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {formErrors.lastName && <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                        <input
                            type="text"
                            name="mobileNumber"
                            value={newAgent.mobileNumber}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {formErrors.mobileNumber && <p className="mt-1 text-sm text-red-600">{formErrors.mobileNumber}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                        <input
                            type="text"
                            name="username"
                            value={newAgent.username}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.username ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {formErrors.username && <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={newAgent.email}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={newAgent.password}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.password ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Leave blank to keep current password"
                        />
                        {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                    </div>

                    <div className="pt-4 border-t mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
                        
                        <PermissionSection 
                            title="Administrative" 
                            category="administrative" 
                            permissions={newAgent.permissions.administrative} 
                        />
                        
                        <PermissionSection 
                            title="Manage Contacts" 
                            category="manageContacts" 
                            permissions={newAgent.permissions.manageContacts} 
                        />
                        
                        <PermissionSection 
                            title="Manage Campaigns" 
                            category="manageCampaigns" 
                            permissions={newAgent.permissions.manageCampaigns} 
                        />
                        
                        <PermissionSection 
                            title="Messaging" 
                            category="messaging" 
                            permissions={newAgent.permissions.messaging} 
                        />
                        
                        <PermissionSection 
                            title="Manage Templates" 
                            category="manageTemplates" 
                            permissions={newAgent.permissions.manageTemplates} 
                        />
                        
                        <div className="border rounded-md p-4 mb-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="edit-assignedChatOnly"
                                    name="assignedChatOnly"
                                    checked={newAgent.permissions.assignedChatOnly}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="edit-assignedChatOnly" className="ml-2 block text-sm text-gray-900">
                                    Assigned Chat Only (Restrict users to assigned chat only, unless they will have access to all chats)
                                </label>
                            </div>
                        </div>
                        
                        <PermissionSection 
                            title="Manage Bot Replies and Flows" 
                            category="manageBotReplies" 
                            permissions={newAgent.permissions.manageBotReplies} 
                        />
                    </div>
                </div>
            </Modal>

            {/* View Agent Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Agent Details"
                actions={
                    <button
                        className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => setShowViewModal(false)}
                    >
                        Close
                    </button>
                }
            >
                {currentAgent && (
                    <div className="px-4 py-3 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <p className="text-sm text-gray-900">{currentAgent.firstName}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <p className="text-sm text-gray-900">{currentAgent.lastName}</p>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                            <p className="text-sm text-gray-900">{currentAgent.mobileNumber}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <p className="text-sm text-gray-900">{currentAgent.username}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <p className="text-sm text-gray-900">{currentAgent.email}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Created On</label>
                            <p className="text-sm text-gray-900">{currentAgent.createdOn}</p>
                        </div>
                        
                        <div className="pt-4 border-t mt-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
                            
                            <div className="space-y-4">
                                {Object.entries(currentAgent.permissions).map(([category, permissions]) => (
                                    <div key={category} className="border rounded-md p-4">
                                        <h4 className="font-medium text-gray-900 mb-2 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {typeof permissions === 'object' ? (
                                                Object.entries(permissions).map(([key, value]) => (
                                                    <div key={key} className="flex items-center">
                                                        {value ? (
                                                            <FiCheckSquare className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <FiSquare className="h-4 w-4 text-gray-300" />
                                                        )}
                                                        <span className="ml-2 text-sm text-gray-700 capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center">
                                                    {permissions ? (
                                                        <FiCheckSquare className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <FiSquare className="h-4 w-4 text-gray-300" />
                                                    )}
                                                    <span className="ml-2 text-sm text-gray-700 capitalize">
                                                        {category.replace(/([A-Z])/g, ' $1').trim()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Main content */}
            <div className="pt-16 md:pl-64">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
                    {/* Page header */}
                    <div className="md:flex md:items-center md:justify-between mb-6">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                Agent Management
                            </h2>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
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
                                            Username
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created On
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
                                        currentAgents.map((agent) => (
                                            <tr key={agent.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                <FiUser className="h-6 w-6 text-indigo-600" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {agent.firstName} {agent.lastName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{agent.email}</div>
                                                    <div className="text-sm text-gray-500">{agent.mobileNumber}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{agent.username}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{agent.createdOn}</div>
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
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            onClick={() => handleEditAgent(agent)}
                                                        >
                                                            <FiEdit size={18} />
                                                        </button>
                                                        <button
                                                            className="text-red-600 hover:text-red-900"
                                                            onClick={() => handleDeleteAgent(agent.id)}
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