import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { Encrypt } from './encryption/payload-encryption';
import axios from 'axios';
import moment from 'moment/moment';
import {
    FiEdit,
    FiSettings,
    FiX,
    FiAlertCircle,
    FiSave,
    FiUser,
    FiMail,
    FiPhone,
    FiCalendar,
    FiCheck,
    FiSquare
} from 'react-icons/fi';

function PermissionsList() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [createFormData, setCreateFormData] = useState({
        name: '',
        remark: ''
    });
    const [editFormData, setEditFormData] = useState({
        name: '',
        remark: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [permissionSettings, setPermissionSettings] = useState([]);
    const [tokens, setTokens] = useState(null);

    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    // Available permissions list with proper mapping to API keys
    const availablePermissions = [
        { permission: "create contact", apiKey: "contact_create", status: false },
        { permission: "edit contact", apiKey: "contact_edit", status: false },
        { permission: "delete contact", apiKey: "contact_delete", status: false },
        { permission: "view contact", apiKey: "contact_view", status: false },
        { permission: "create template", apiKey: "template_create", status: false },
        { permission: "edit template", apiKey: "template_edit", status: false },
        { permission: "delete template", apiKey: "template_delete", status: false },
        { permission: "view all chat", apiKey: "all_chat_view", status: false },
        { permission: "broadcast access", apiKey: "broadcast_access", status: false },
        { permission: "setting access", apiKey: "setting_access", status: false },
    ];

    // Ref to track scroll position
    const scrollContainerRef = useRef(null);
    const scrollPositionRef = useRef(0);

    // Prevent background scrolling when mobile menu or any modal is open
    useEffect(() => {
        if (mobileMenuOpen || isCreateModalOpen || isEditModalOpen || isSettingsModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [mobileMenuOpen, isCreateModalOpen, isEditModalOpen, isSettingsModalOpen]);

    // Get user tokens from localStorage
    useEffect(() => {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const parsedData = JSON.parse(userData);
            setTokens(parsedData);
        }
    }, []);

    const fetchPermissions = async () => {
        setPermissions([]);
        setLoading(true);
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

            if (res_data.error) {
                alert(res_data.error);
            }

            if (res_data.msg) {
                if (res_data.count > 0) {
                    setPermissions(res_data.data);
                } else {
                    setPermissions([]);
                }
            }

        } catch (error) {
            alert('Failed to load permission list');
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch when tokens are available
    useEffect(() => {
        if (tokens) {
            fetchPermissions();
        }
    }, [tokens]);

    // Create Permission Functions
    const handleCreate = () => {
        setCreateFormData({ name: '', remark: '' });
        setIsCreateModalOpen(true);
    };

    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;
        setCreateFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
                name: createFormData.name,
                remark: createFormData.remark
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/permission/create',
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
                alert(res_data.error);
                return;
            }

            if (res_data.msg) {
                await fetchPermissions();
                setIsCreateModalOpen(false);
                setCreateFormData({ name: '', remark: '' });
                alert('Permission created successfully!');
            }

        } catch (error) {
            console.error('Error creating permission:', error);
            alert('Error creating permission. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    // Edit Permission Functions
    const handleEdit = (permission) => {
        setEditingPermission(permission);
        setEditFormData({
            name: permission.name,
            remark: permission.remark
        });
        setIsEditModalOpen(true);
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
                permission_id: editingPermission.permission_id,
                name: editFormData.name,
                remark: editFormData.remark
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/permission/edit',
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
                return;
            }

            if (res_data.msg) {
                await fetchPermissions();
                setIsEditModalOpen(false);
                setEditFormData({ name: '', remark: '' });
                setEditingPermission(null);
                alert('Permission updated successfully!');
            }

        } catch (error) {
            console.error('Error updating permission:', error);
            alert('Error updating permission. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    // Settings Functions
    const handleSettings = (permission) => {
        setSelectedPermission(permission);

        // Map the permission settings from API response to our format
        const mappedSettings = availablePermissions.map(item => ({
            ...item,
            status: permission.permissions?.[item.apiKey] || false
        }));

        setPermissionSettings(mappedSettings);
        setIsSettingsModalOpen(true);
    };

    // FIXED: Optimized toggle function that doesn't cause full re-render
    const handleSettingToggle = useCallback((permissionName) => {
        setPermissionSettings(prevSettings => {
            const newSettings = prevSettings.map(setting =>
                setting.permission === permissionName
                    ? { ...setting, status: !setting.status }
                    : setting
            );

            // Save scroll position before state update
            if (scrollContainerRef.current) {
                scrollPositionRef.current = scrollContainerRef.current.scrollTop;
            }

            return newSettings;
        });
    }, []);

    // Restore scroll position after state update
    useEffect(() => {
        if (scrollContainerRef.current && scrollPositionRef.current > 0) {
            const restoreScroll = setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = scrollPositionRef.current;
                }
            }, 0);

            return () => clearTimeout(restoreScroll);
        }
    }, [permissionSettings]);

    const handleSelectAll = useCallback(() => {
        // Save scroll position before update
        if (scrollContainerRef.current) {
            scrollPositionRef.current = scrollContainerRef.current.scrollTop;
        }

        setPermissionSettings(prevSettings =>
            prevSettings.map(setting => ({ ...setting, status: true }))
        );
    }, []);

    const handleDeselectAll = useCallback(() => {
        // Save scroll position before update
        if (scrollContainerRef.current) {
            scrollPositionRef.current = scrollContainerRef.current.scrollTop;
        }

        setPermissionSettings(prevSettings =>
            prevSettings.map(setting => ({ ...setting, status: false }))
        );
    }, []);

    const handleSaveSettings = async () => {
        setFormLoading(true);
        try {
            // Convert permissionSettings to the API format
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
                permission_id: selectedPermission.permission_id,
            };

            permissionSettings.forEach(setting => {
                payload[setting.apiKey] = setting.status;
            });

            console.log(payload);

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/permission/set-access',
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
                return;
            }

            if (res_data.msg) {
                await fetchPermissions();
                setIsSettingsModalOpen(false);
                setSelectedPermission(null);
                alert(res_data.msg);
            }

        } catch (error) {
            console.log('Error saving permission settings:', error);
            alert('Error saving permission settings. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    // Close modal functions
    const closeCreateModal = () => setIsCreateModalOpen(false);
    const closeEditModal = () => setIsEditModalOpen(false);
    const closeSettingsModal = () => setIsSettingsModalOpen(false);

    // Skeleton loader component
    const SkeletonRow = () => (
        <tr>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex space-x-2">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </td>
        </tr>
    );

    // Permission Toggle Switch Component - FIXED: More stable component
    const PermissionToggle = React.memo(({ permission, checked, onChange, disabled }) => {
        const handleClick = useCallback(() => {
            onChange(permission);
        }, [onChange, permission]);

        return (
            <button
                type="button"
                disabled={disabled}
                onClick={handleClick}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        );
    });

    // Permission List Component - FIXED: Simplified without complex scroll handling
    const PermissionList = React.memo(({ permissions, onToggle, disabled, onSelectAll, onDeselectAll }) => {
        return (
            <div>
                {/* Bulk Actions */}
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-700">Manage Permissions</span>
                    <div className="space-x-2">
                        <button
                            type="button"
                            onClick={onSelectAll}
                            disabled={disabled}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Select All
                        </button>
                        <button
                            type="button"
                            onClick={onDeselectAll}
                            disabled={disabled}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>

                {/* Permission Settings List - FIXED: Simple container without internal scroll management */}
                <div
                    ref={scrollContainerRef}
                    className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4"
                >
                    {permissions.map((setting) => (
                        <div key={setting.apiKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                                {setting.permission}
                            </span>
                            <PermissionToggle
                                permission={setting.permission}
                                checked={setting.status}
                                onChange={onToggle}
                                disabled={disabled}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    });

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
                    {/* Header with title and create button */}
                    <div className="md:flex md:items-center md:justify-between mb-6">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                Permissions
                            </h2>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <button
                                type="button"
                                onClick={handleCreate}
                                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Create Permission
                            </button>
                        </div>
                    </div>

                    {/* Permissions Table */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg" style={{ overflowX: 'auto' }}>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SI No.
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Remark
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Agent Count
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Modify By
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Modify Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    // Show skeleton loaders while loading
                                    Array.from({ length: 7 }).map((_, index) => (
                                        <SkeletonRow key={index} />
                                    ))
                                ) : (
                                    // Show actual data
                                    permissions.map((permission, index) => (
                                        <tr key={permission.permission_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {permission.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4" style={{ maxWidth: '200px' }}>
                                                <div className="text-sm text-gray-500">
                                                    {permission.remark}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {permission.agent_count}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {permission?.modify_by?.name}<br /><small className='text-blue-900'>{permission?.modify_by?.mobile} [{permission?.modify_by?.type?.toUpperCase()}]</small>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {moment(permission?.modify_date, "YYYY-MM-DD H:i:s").format("DD/MM/YYYY")}
                                                    <br />
                                                    {moment(permission?.modify_date).format("DD/MM/YYYY hh:mm:ss A")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(permission)}
                                                        className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                                                        title="Edit Permission"
                                                    >
                                                        <FiEdit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSettings(permission)}
                                                        className="text-green-600 hover:text-green-900 transition-colors duration-200"
                                                        title="Set Permissions"
                                                    >
                                                        <FiSettings className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty state */}
                    {!loading && permissions.length === 0 && (
                        <div className="text-center py-12">
                            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No permissions</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new permission.</p>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Create Permission
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Permission Modal */}
            {isCreateModalOpen && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative max-h-[90vh] overflow-y-auto">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    disabled={formLoading}
                                    onClick={closeCreateModal}
                                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    <span className="sr-only">Close</span>
                                    <FiX className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit}>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 pr-6">
                                            Create New Permission
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="create-name" className="block text-sm font-medium text-gray-700">
                                                    Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    id="create-name"
                                                    required
                                                    disabled={formLoading}
                                                    value={createFormData.name}
                                                    onChange={handleCreateInputChange}
                                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border disabled:opacity-50 disabled:cursor-not-allowed"
                                                    placeholder="Enter permission name"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="create-remark" className="block text-sm font-medium text-gray-700">
                                                    Remark
                                                </label>
                                                <textarea
                                                    name="remark"
                                                    id="create-remark"
                                                    rows="3"
                                                    disabled={formLoading}
                                                    value={createFormData.remark}
                                                    onChange={handleCreateInputChange}
                                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border disabled:opacity-50 disabled:cursor-not-allowed"
                                                    placeholder="Enter remark"
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {formLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Permission'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={formLoading}
                                        onClick={closeCreateModal}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Permission Modal */}
            {isEditModalOpen && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative max-h-[90vh] overflow-y-auto">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    disabled={formLoading}
                                    onClick={closeEditModal}
                                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    <span className="sr-only">Close</span>
                                    <FiX className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit}>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 pr-6">
                                            Edit Permission
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                                                    Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    id="edit-name"
                                                    required
                                                    disabled={formLoading}
                                                    value={editFormData.name}
                                                    onChange={handleEditInputChange}
                                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border disabled:opacity-50 disabled:cursor-not-allowed"
                                                    placeholder="Enter permission name"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="edit-remark" className="block text-sm font-medium text-gray-700">
                                                    Remark
                                                </label>
                                                <textarea
                                                    name="remark"
                                                    id="edit-remark"
                                                    rows="3"
                                                    disabled={formLoading}
                                                    value={editFormData.remark}
                                                    onChange={handleEditInputChange}
                                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border disabled:opacity-50 disabled:cursor-not-allowed"
                                                    placeholder="Enter remark"
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {formLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Permission'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={formLoading}
                                        onClick={closeEditModal}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 relative max-h-[90vh] overflow-y-auto">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    disabled={formLoading}
                                    onClick={closeSettingsModal}
                                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    <span className="sr-only">Close</span>
                                    <FiX className="h-6 w-6" />
                                </button>
                            </div>

                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 pr-6">
                                    Permission Settings - {selectedPermission?.name}
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Configure the specific permissions for this role
                                </p>

                                <PermissionList
                                    permissions={permissionSettings}
                                    onToggle={handleSettingToggle}
                                    disabled={formLoading}
                                    onSelectAll={handleSelectAll}
                                    onDeselectAll={handleDeselectAll}
                                />
                            </div>

                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="button"
                                    disabled={formLoading}
                                    onClick={handleSaveSettings}
                                    className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {formLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Permission Settings'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    disabled={formLoading}
                                    onClick={closeSettingsModal}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PermissionsList;