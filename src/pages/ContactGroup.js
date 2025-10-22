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
    FiEye
} from 'react-icons/fi';

function ContactGroup() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [isAllSelected, setIsAllSelected] = useState(false);

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [currentGroup, setCurrentGroup] = useState(null);

    // Form states
    const [newGroup, setNewGroup] = useState({
        name: '',
        description: '',
        status: 'Active'
    });

    const [formErrors, setFormErrors] = useState({});

    // Derived state for bulk actions
    const showBulkActions = selectedGroups.length > 0;
    const [showBulkDropdown, setShowBulkDropdown] = useState(false);

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

    // Fetch groups data (simulated)
    useEffect(() => {
        const fetchGroups = async () => {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Mock data for groups
                const mockGroups = [
                    { id: 1, name: 'Family', description: 'Close family members', createdOn: '2023-06-15', status: 'Active' },
                    { id: 2, name: 'Friends', description: 'Personal friends and acquaintances', createdOn: '2023-06-10', status: 'Active' },
                    { id: 3, name: 'Work', description: 'Colleagues and business contacts', createdOn: '2023-06-05', status: 'Active' },
                    { id: 4, name: 'Clients', description: 'Business clients and customers', createdOn: '2023-05-28', status: 'Active' },
                    { id: 5, name: 'VIP', description: 'Very important persons', createdOn: '2023-05-20', status: 'Active' },
                    { id: 6, name: 'Suppliers', description: 'Vendors and suppliers', createdOn: '2023-05-15', status: 'Inactive' },
                    { id: 7, name: 'Marketing', description: 'Marketing campaign recipients', createdOn: '2023-05-10', status: 'Active' },
                    { id: 8, name: 'Newsletter', description: 'Newsletter subscribers', createdOn: '2023-05-05', status: 'Active' },
                ];

                setGroups(mockGroups);
            } catch (error) {
                console.error('Failed to fetch groups:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    // Get current groups for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentGroups = groups.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(groups.length / itemsPerPage);

    // Change page
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        setSelectedGroups([]);
        setIsAllSelected(false);
    };

    // Handle individual group selection
    const toggleGroupSelection = (groupId) => {
        if (selectedGroups.includes(groupId)) {
            setSelectedGroups(selectedGroups.filter(id => id !== groupId));
            setIsAllSelected(false);
        } else {
            setSelectedGroups([...selectedGroups, groupId]);
        }
    };

    // Handle select all on current page
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedGroups([]);
            setIsAllSelected(false);
        } else {
            const currentPageIds = currentGroups.map(group => group.id);
            setSelectedGroups(currentPageIds);
            setIsAllSelected(true);
        }
    };

    // Handle bulk delete
    const handleBulkDelete = () => {
        setShowDeleteModal(true);
        setShowBulkDropdown(false);
    };

    // Confirm delete
    const confirmDelete = () => {
        setGroups(groups.filter(group => !selectedGroups.includes(group.id)));
        setSelectedGroups([]);
        setShowDeleteModal(false);
        setIsAllSelected(false);
    };

    // Handle add group
    const handleAddGroup = () => {
        setNewGroup({
            name: '',
            description: '',
            status: 'Active'
        });
        setFormErrors({});
        setShowAddModal(true);
    };

    // Handle edit group
    const handleEditGroup = (group) => {
        setCurrentGroup(group);
        setNewGroup({
            name: group.name,
            description: group.description,
            status: group.status
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Handle view group
    const handleViewGroup = (group) => {
        setCurrentGroup(group);
        setShowViewModal(true);
    };

    // Handle input change for forms
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setNewGroup(prev => ({
            ...prev,
            [name]: value
        }));

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

        if (!newGroup.name.trim()) {
            errors.name = 'Group name is required';
        }

        if (!newGroup.description.trim()) {
            errors.description = 'Description is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save new group
    const saveNewGroup = () => {
        if (validateForm()) {
            const newGroupObj = {
                id: groups.length + 1,
                ...newGroup,
                createdOn: new Date().toISOString().split('T')[0]
            };
            setGroups([...groups, newGroupObj]);
            setShowAddModal(false);
            setNewGroup({
                name: '',
                description: '',
                status: 'Active'
            });
        }
    };

    // Save edited group
    const saveEditedGroup = () => {
        if (validateForm()) {
            const updatedGroups = groups.map(group =>
                group.id === currentGroup.id
                    ? { ...group, ...newGroup }
                    : group
            );
            setGroups(updatedGroups);
            setShowEditModal(false);
            setCurrentGroup(null);
            setNewGroup({
                name: '',
                description: '',
                status: 'Active'
            });
        }
    };

    // Modal component for reusability
    const Modal = React.memo(({ isOpen, onClose, title, children, actions }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white transform transition-all duration-300 scale-95 opacity-0 animate-modal-in">
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
                        Are you sure you want to delete {selectedGroups.length} group(s)? This action cannot be undone.
                    </p>
                </div>
            </Modal>

            {/* Add Group Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add New Group"
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
                            onClick={saveNewGroup}
                        >
                            Save Group
                        </button>
                    </>
                }
            >
                <div className="px-4 py-3 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={newGroup.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter group name"
                        />
                        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                            name="description"
                            value={newGroup.description}
                            onChange={handleInputChange}
                            rows="3"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter group description"
                        />
                        {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            name="status"
                            value={newGroup.status}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Edit Group Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Group"
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
                            onClick={saveEditedGroup}
                        >
                            Save Changes
                        </button>
                    </>
                }
            >
                <div className="px-4 py-3 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={newGroup.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                            name="description"
                            value={newGroup.description}
                            onChange={handleInputChange}
                            rows="3"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            name="status"
                            value={newGroup.status}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </Modal>

            {/* View Group Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Group Details"
                actions={
                    <button
                        className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => setShowViewModal(false)}
                    >
                        Close
                    </button>
                }
            >
                {currentGroup && (
                    <div className="px-4 py-3 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                            <p className="text-sm text-gray-900">{currentGroup.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <p className="text-sm text-gray-900">{currentGroup.description}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <p className="text-sm text-gray-900">{currentGroup.status}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Created On</label>
                            <p className="text-sm text-gray-900">{currentGroup.createdOn}</p>
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
                                Contact Groups
                            </h2>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <button
                                onClick={handleAddGroup}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <FiPlus className="mr-2" />
                                Add Group
                            </button>
                        </div>
                    </div>

                    {/* Bulk Actions Dropdown */}
                    {showBulkActions && (
                        <div className="mb-4 bg-indigo-50 p-3 rounded-md flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="text-indigo-800 font-medium">
                                    {selectedGroups.length} group(s) selected
                                </span>
                            </div>
                            <div className="relative inline-block text-left">
                                <div>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                                    >
                                        Bulk Actions
                                        <FiChevronDown className="-mr-1 ml-2 h-5 w-5" />
                                    </button>
                                </div>

                                {showBulkDropdown && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                        <div className="py-1">
                                            <button
                                                className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                                                onClick={handleBulkDelete}
                                            >
                                                Delete Selected
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Groups table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <button onClick={toggleSelectAll} className="mr-2 focus:outline-none">
                                                    {isAllSelected ? <FiCheckSquare className="h-5 w-5 text-indigo-600" /> : <FiSquare className="h-5 w-5 text-gray-400" />}
                                                </button>
                                                Group Name
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
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
                                                    <div className="flex items-center">
                                                        <div className="h-4 bg-gray-200 rounded w-4 mr-2 animate-pulse"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                                    </div>
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
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="h-6 bg-gray-200 rounded w-16 animate-pulse ml-auto"></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        // Actual data rows
                                        currentGroups.map((group) => (
                                            <tr key={group.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <button
                                                            onClick={() => toggleGroupSelection(group.id)}
                                                            className="mr-2 focus:outline-none"
                                                        >
                                                            {selectedGroups.includes(group.id) ?
                                                                <FiCheckSquare className="h-5 w-5 text-indigo-600" /> :
                                                                <FiSquare className="h-5 w-5 text-gray-400" />
                                                            }
                                                        </button>
                                                        <div className="text-sm font-medium text-gray-900">{group.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-500 line-clamp-1">{group.description}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {group.createdOn}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full 
                                                        ${group.status === 'Active' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {group.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            onClick={() => handleViewGroup(group)}
                                                        >
                                                            <FiEye size={18} />
                                                        </button>
                                                        <button
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            onClick={() => handleEditGroup(group)}
                                                        >
                                                            <FiEdit size={18} />
                                                        </button>
                                                        <button
                                                            className="text-red-600 hover:text-red-900"
                                                            onClick={() => {
                                                                setSelectedGroups([group.id]);
                                                                setShowDeleteModal(true);
                                                            }}
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
                                                {Math.min(indexOfLastItem, groups.length)}
                                            </span>{' '}
                                            of <span className="font-medium">{groups.length}</span> results
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
                .line-clamp-1 {
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}
            </style>
        </div>
    );
}

export default ContactGroup;