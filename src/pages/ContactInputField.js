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

function ContactInputField() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [currentField, setCurrentField] = useState(null);

    // Form states
    const [newField, setNewField] = useState({
        name: '',
        inputType: 'text',
        required: false
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

    // Fetch fields data (simulated)
    useEffect(() => {
        const fetchFields = async () => {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Mock data for input fields
                const mockFields = [
                    { id: 1, name: 'First Name', inputType: 'text', required: true, createdOn: '2023-06-15' },
                    { id: 2, name: 'Last Name', inputType: 'text', required: true, createdOn: '2023-06-10' },
                    { id: 3, name: 'Email', inputType: 'email', required: true, createdOn: '2023-06-05' },
                    { id: 4, name: 'Phone Number', inputType: 'tel', required: false, createdOn: '2023-05-28' },
                    { id: 5, name: 'Date of Birth', inputType: 'date', required: false, createdOn: '2023-05-20' },
                    { id: 6, name: 'Address', inputType: 'textarea', required: false, createdOn: '2023-05-15' },
                    { id: 7, name: 'Password', inputType: 'password', required: true, createdOn: '2023-05-10' },
                    { id: 8, name: 'Profile Picture', inputType: 'file', required: false, createdOn: '2023-05-05' },
                ];

                setFields(mockFields);
            } catch (error) {
                console.error('Failed to fetch fields:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFields();
    }, []);

    // Get current fields for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentFields = fields.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(fields.length / itemsPerPage);

    // Change page
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Handle delete field
    const handleDeleteField = (fieldId) => {
        setCurrentField(fields.find(field => field.id === fieldId));
        setShowDeleteModal(true);
    };

    // Confirm delete
    const confirmDelete = () => {
        setFields(fields.filter(field => field.id !== currentField.id));
        setShowDeleteModal(false);
        setCurrentField(null);
    };

    // Handle add field
    const handleAddField = () => {
        setNewField({
            name: '',
            inputType: 'text',
            required: false
        });
        setFormErrors({});
        setShowAddModal(true);
    };

    // Handle edit field
    const handleEditField = (field) => {
        setCurrentField(field);
        setNewField({
            name: field.name,
            inputType: field.inputType,
            required: field.required
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Handle view field
    const handleViewField = (field) => {
        setCurrentField(field);
        setShowViewModal(true);
    };

    // Handle input change for forms
    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setNewField(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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

        if (!newField.name.trim()) {
            errors.name = 'Field name is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save new field
    const saveNewField = () => {
        if (validateForm()) {
            const newFieldObj = {
                id: fields.length + 1,
                ...newField,
                createdOn: new Date().toISOString().split('T')[0]
            };
            setFields([...fields, newFieldObj]);
            setShowAddModal(false);
            setNewField({
                name: '',
                inputType: 'text',
                required: false
            });
        }
    };

    // Save edited field
    const saveEditedField = () => {
        if (validateForm()) {
            const updatedFields = fields.map(field =>
                field.id === currentField.id
                    ? { ...field, ...newField }
                    : field
            );
            setFields(updatedFields);
            setShowEditModal(false);
            setCurrentField(null);
            setNewField({
                name: '',
                inputType: 'text',
                required: false
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
                        Are you sure you want to delete the field "{currentField?.name}"? This action cannot be undone.
                    </p>
                </div>
            </Modal>

            {/* Add Field Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add New Field"
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
                            onClick={saveNewField}
                        >
                            Save Field
                        </button>
                    </>
                }
            >
                <div className="px-4 py-3 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Field Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={newField.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter field name"
                        />
                        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Input Type</label>
                        <select
                            name="inputType"
                            value={newField.inputType}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="password">Password</option>
                            <option value="number">Number</option>
                            <option value="tel">Phone</option>
                            <option value="date">Date</option>
                            <option value="textarea">Textarea</option>
                            <option value="file">File</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="radio">Radio</option>
                            <option value="select">Select</option>
                        </select>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="required"
                            id="required"
                            checked={newField.required}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
                            Required field
                        </label>
                    </div>
                </div>
            </Modal>

            {/* Edit Field Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Field"
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
                            onClick={saveEditedField}
                        >
                            Save Changes
                        </button>
                    </>
                }
            >
                <div className="px-4 py-3 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Field Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={newField.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Input Type</label>
                        <select
                            name="inputType"
                            value={newField.inputType}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="password">Password</option>
                            <option value="number">Number</option>
                            <option value="tel">Phone</option>
                            <option value="date">Date</option>
                            <option value="textarea">Textarea</option>
                            <option value="file">File</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="radio">Radio</option>
                            <option value="select">Select</option>
                        </select>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="required"
                            id="edit-required"
                            checked={newField.required}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="edit-required" className="ml-2 block text-sm text-gray-900">
                            Required field
                        </label>
                    </div>
                </div>
            </Modal>

            {/* View Field Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Field Details"
                actions={
                    <button
                        className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => setShowViewModal(false)}
                    >
                        Close
                    </button>
                }
            >
                {currentField && (
                    <div className="px-4 py-3 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                            <p className="text-sm text-gray-900">{currentField.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Input Type</label>
                            <p className="text-sm text-gray-900 capitalize">{currentField.inputType}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Required</label>
                            <p className="text-sm text-gray-900">{currentField.required ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Created On</label>
                            <p className="text-sm text-gray-900">{currentField.createdOn}</p>
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
                                Input Fields
                            </h2>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <button
                                onClick={handleAddField}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <FiPlus className="mr-2" />
                                Add Field
                            </button>
                        </div>
                    </div>

                    {/* Fields table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Field Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Input Type
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Required
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
                                        currentFields.map((field) => (
                                            <tr key={field.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{field.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                                                        {field.inputType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full 
                                                        ${field.required 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {field.required ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            onClick={() => handleViewField(field)}
                                                        >
                                                            <FiEye size={18} />
                                                        </button>
                                                        <button
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            onClick={() => handleEditField(field)}
                                                        >
                                                            <FiEdit size={18} />
                                                        </button>
                                                        <button
                                                            className="text-red-600 hover:text-red-900"
                                                            onClick={() => handleDeleteField(field.id)}
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
                                                {Math.min(indexOfLastItem, fields.length)}
                                            </span>{' '}
                                            of <span className="font-medium">{fields.length}</span> results
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

export default ContactInputField;