import React, { useState, useEffect } from 'react';
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
  FiSave
} from 'react-icons/fi';

function Contact() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState(['Family', 'Friends', 'Work', 'Clients', 'VIP', 'Suppliers', 'Partners']);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  
  // Form states
  const [newContact, setNewContact] = useState({
    name: '',
    mobile: '',
    languageCode: 'en',
    country: '',
    groups: []
  });
  
  const [importFile, setImportFile] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  // Derived state for bulk actions
  const showBulkActions = selectedContacts.length > 0;
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

  // Fetch contacts data (simulated)
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock data for contacts
        const mockContacts = [
          { id: 1, name: 'John Doe', mobile: '+1234567890', languageCode: 'en', country: 'United States', createdOn: '2023-06-15', groups: ['Work', 'Clients'] },
          { id: 2, name: 'Jane Smith', mobile: '+44123456789', languageCode: 'en', country: 'United Kingdom', createdOn: '2023-06-10', groups: ['Friends'] },
          { id: 3, name: 'Carlos Ruiz', mobile: '+34123456789', languageCode: 'es', country: 'Spain', createdOn: '2023-06-05', groups: ['Clients', 'VIP'] },
          { id: 4, name: 'Marie Dubois', mobile: '+33123456789', languageCode: 'fr', country: 'France', createdOn: '2023-05-28', groups: ['Family'] },
          { id: 5, name: 'Wei Zhang', mobile: '+86123456789', languageCode: 'zh', country: 'China', createdOn: '2023-05-20', groups: ['Work', 'Suppliers'] },
          { id: 6, name: 'Hiroshi Tanaka', mobile: '+81123456789', languageCode: 'ja', country: 'Japan', createdOn: '2023-05-15', groups: ['VIP', 'Partners'] },
          { id: 7, name: 'Anna Müller', mobile: '+49123456789', languageCode: 'de', country: 'Germany', createdOn: '2023-05-10', groups: ['Clients'] },
          { id: 8, name: 'Marco Rossi', mobile: '+39123456789', languageCode: 'it', country: 'Italy', createdOn: '2023-05-05', groups: ['Friends', 'Partners'] },
          { id: 9, name: 'Sofia Silva', mobile: '+55123456789', languageCode: 'pt', country: 'Brazil', createdOn: '2023-04-28', groups: ['Work'] },
          { id: 10, name: 'Raj Patel', mobile: '+91123456789', languageCode: 'hi', country: 'India', createdOn: '2023-04-20', groups: ['VIP'] },
          { id: 11, name: 'Elena Ivanova', mobile: '+79123456789', languageCode: 'ru', country: 'Russia', createdOn: '2023-04-15', groups: ['Family', 'Friends'] },
          { id: 12, name: 'Mohammed Al-Fayed', mobile: '+20123456789', languageCode: 'ar', country: 'Egypt', createdOn: '2023-04-10', groups: ['Clients', 'Suppliers'] },
        ];
        
        setContacts(mockContacts);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Get current contacts for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContacts = contacts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(contacts.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedContacts([]);
    setIsAllSelected(false);
  };

  // Handle individual contact selection
  const toggleContactSelection = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
      setIsAllSelected(false);
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  // Handle select all on current page
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedContacts([]);
      setIsAllSelected(false);
    } else {
      const currentPageIds = currentContacts.map(contact => contact.id);
      setSelectedContacts(currentPageIds);
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
    setContacts(contacts.filter(contact => !selectedContacts.includes(contact.id)));
    setSelectedContacts([]);
    setShowDeleteModal(false);
    setIsAllSelected(false);
  };

  // Handle export to Excel
  const handleExport = () => {
    setShowExportModal(true);
  };

  // Confirm export
  const confirmExport = () => {
    alert(`Exporting ${selectedContacts.length > 0 ? selectedContacts.length : contacts.length} contacts to Excel`);
    setShowExportModal(false);
  };

  // Handle import from Excel
  const handleImport = () => {
    setShowImportModal(true);
  };

  // Handle file upload for import
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };

  // Confirm import
  const confirmImport = () => {
    if (importFile) {
      alert(`Importing contacts from ${importFile.name}`);
      setShowImportModal(false);
      setImportFile(null);
    } else {
      alert('Please select a file first');
    }
  };

  // Handle add contact
  const handleAddContact = () => {
    setNewContact({
      name: '',
      mobile: '',
      languageCode: 'en',
      country: '',
      groups: []
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  // Handle edit contact
  const handleEditContact = (contact) => {
    setCurrentContact(contact);
    setNewContact({
      name: contact.name,
      mobile: contact.mobile,
      languageCode: contact.languageCode,
      country: contact.country,
      groups: [...contact.groups] // Copy the array to avoid mutation
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Handle input change for forms
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContact({
      ...newContact,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Handle group selection/deselection
  const toggleGroupSelection = (group) => {
    if (newContact.groups.includes(group)) {
      // Remove group if already selected
      setNewContact({
        ...newContact,
        groups: newContact.groups.filter(g => g !== group)
      });
    } else {
      // Add group if not selected
      setNewContact({
        ...newContact,
        groups: [...newContact.groups, group]
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!newContact.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!newContact.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(newContact.mobile)) {
      errors.mobile = 'Please enter a valid mobile number';
    }
    
    if (!newContact.country.trim()) {
      errors.country = 'Country is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save new contact
  const saveNewContact = () => {
    if (validateForm()) {
      const newContactObj = {
        id: contacts.length + 1,
        ...newContact,
        createdOn: new Date().toISOString().split('T')[0]
      };
      setContacts([...contacts, newContactObj]);
      setShowAddModal(false);
      setNewContact({
        name: '',
        mobile: '',
        languageCode: 'en',
        country: '',
        groups: []
      });
    }
  };

  // Save edited contact
  const saveEditedContact = () => {
    if (validateForm()) {
      const updatedContacts = contacts.map(contact => 
        contact.id === currentContact.id 
          ? { ...contact, ...newContact }
          : contact
      );
      setContacts(updatedContacts);
      setShowEditModal(false);
      setCurrentContact(null);
      setNewContact({
        name: '',
        mobile: '',
        languageCode: 'en',
        country: '',
        groups: []
      });
    }
  };

  // Handle group assignment
  const handleGroupAssignment = () => {
    setShowGroupModal(true);
    setShowBulkDropdown(false);
  };

  // Confirm group assignment
  const confirmGroupAssignment = () => {
    if (selectedGroup) {
      const updatedContacts = contacts.map(contact => 
        selectedContacts.includes(contact.id)
          ? { 
              ...contact, 
              groups: contact.groups.includes(selectedGroup) 
                ? contact.groups 
                : [...contact.groups, selectedGroup] 
            }
          : contact
      );
      setContacts(updatedContacts);
      setShowGroupModal(false);
      setSelectedGroup('');
      setSelectedContacts([]);
      setIsAllSelected(false);
    } else {
      alert('Please select a group');
    }
  };

  // Modal component for reusability
  const Modal = ({ isOpen, onClose, title, children, actions }) => {
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
  };

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
            Are you sure you want to delete {selectedContacts.length} contact(s)? This action cannot be undone.
          </p>
        </div>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Contact"
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
              onClick={saveNewContact}
            >
              Save Contact
            </button>
          </>
        }
      >
        <div className="px-4 py-3 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={newContact.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter name"
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
            <input
              type="text"
              name="mobile"
              value={newContact.mobile}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.mobile ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter mobile number"
            />
            {formErrors.mobile && <p className="mt-1 text-sm text-red-600">{formErrors.mobile}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language Code</label>
            <select
              name="languageCode"
              value={newContact.languageCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="en">English (en)</option>
              <option value="es">Spanish (es)</option>
              <option value="fr">French (fr)</option>
              <option value="de">German (de)</option>
              <option value="zh">Chinese (zh)</option>
              <option value="ja">Japanese (ja)</option>
              <option value="ru">Russian (ru)</option>
              <option value="ar">Arabic (ar)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
            <input
              type="text"
              name="country"
              value={newContact.country}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.country ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter country"
            />
            {formErrors.country && <p className="mt-1 text-sm text-red-600">{formErrors.country}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Groups</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {groups.map(group => (
                <button
                  key={group}
                  type="button"
                  onClick={() => toggleGroupSelection(group)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    newContact.groups.includes(group)
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Selected: {newContact.groups.length > 0 ? newContact.groups.join(', ') : 'None'}
            </p>
          </div>
        </div>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Contact"
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
              onClick={saveEditedContact}
            >
              Save Changes
            </button>
          </>
        }
      >
        <div className="px-4 py-3 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={newContact.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
            <input
              type="text"
              name="mobile"
              value={newContact.mobile}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.mobile ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.mobile && <p className="mt-1 text-sm text-red-600">{formErrors.mobile}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language Code</label>
            <select
              name="languageCode"
              value={newContact.languageCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="en">English (en)</option>
              <option value="es">Spanish (es)</option>
              <option value="fr">French (fr)</option>
              <option value="de">German (de)</option>
              <option value="zh">Chinese (zh)</option>
              <option value="ja">Japanese (ja)</option>
              <option value="ru">Russian (ru)</option>
              <option value="ar">Arabic (ar)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
            <input
              type="text"
              name="country"
              value={newContact.country}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.country ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.country && <p className="mt-1 text-sm text-red-600">{formErrors.country}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Groups</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {groups.map(group => (
                <button
                  key={group}
                  type="button"
                  onClick={() => toggleGroupSelection(group)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    newContact.groups.includes(group)
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Selected: {newContact.groups.length > 0 ? newContact.groups.join(', ') : 'None'}
            </p>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Contacts from Excel"
        actions={
          <>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setShowImportModal(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={confirmImport}
            >
              Import
            </button>
          </>
        }
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 hover:border-indigo-500">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUpload className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">Excel files only</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          {importFile && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <FiFile className="text-indigo-600 mr-2" />
                <span className="text-sm font-medium">{importFile.name}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Contacts to Excel"
        actions={
          <>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setShowExportModal(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={confirmExport}
            >
              Export
            </button>
          </>
        }
      >
        <div className="px-4 py-3">
          <p className="text-sm text-gray-500">
            {selectedContacts.length > 0 
              ? `Export ${selectedContacts.length} selected contacts to Excel?`
              : `Export all ${contacts.length} contacts to Excel?`
            }
          </p>
        </div>
      </Modal>

      {/* Group Assignment Modal */}
      <Modal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="Assign to Group"
        actions={
          <>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setShowGroupModal(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={confirmGroupAssignment}
            >
              Assign
            </button>
          </>
        }
      >
        <div className="px-4 py-3">
          <p className="text-sm text-gray-500 mb-3">
            Assign {selectedContacts.length} selected contacts to:
          </p>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a group</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Main content */}
      <div className="pt-16 md:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {/* Page header */}
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Contact Management
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiDownload className="mr-2" />
                Export to Excel
              </button>
              <button
                onClick={handleImport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiUpload className="mr-2" />
                Import from Excel
              </button>
              <button
                onClick={handleAddContact}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiUserPlus className="mr-2" />
                Add Contact
              </button>
            </div>
          </div>

          {/* Bulk Actions Dropdown */}
          {showBulkActions && (
            <div className="mb-4 bg-indigo-50 p-3 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-indigo-800 font-medium">
                  {selectedContacts.length} contact(s) selected
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
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        onClick={handleGroupAssignment}
                      >
                        Assign to Group
                      </button>
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

          {/* Contacts table */}
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
                        Name
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Language Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Groups
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
                    currentContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <button 
                              onClick={() => toggleContactSelection(contact.id)}
                              className="mr-2 focus:outline-none"
                            >
                              {selectedContacts.includes(contact.id) ? 
                                <FiCheckSquare className="h-5 w-5 text-indigo-600" /> : 
                                <FiSquare className="h-5 w-5 text-gray-400" />
                              }
                            </button>
                            <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{contact.mobile}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{contact.languageCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{contact.country}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {contact.groups.map(group => (
                              <span key={group} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {group}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contact.createdOn}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900"
                              onClick={() => handleEditContact(contact)}
                            >
                              <FiEdit size={18} />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => {
                                setSelectedContacts([contact.id]);
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
                        {Math.min(indexOfLastItem, contacts.length)}
                      </span>{' '}
                      of <span className="font-medium">{contacts.length}</span> results
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
      <style jsx>{`
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
      `}</style>
    </div>
  );
}

export default Contact;