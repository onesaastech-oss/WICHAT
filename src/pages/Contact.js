import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';
import { contactDbHelper } from './db';
import {
  FiPlus,
  FiDownload,
  FiUpload,
  FiEdit,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiGlobe,
  FiHome,
  FiFileText,
  FiStar,
  FiFilter,
  FiCheckCircle
} from 'react-icons/fi';

function Contact() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tokens, setTokens] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [favoriteContacts, setFavoriteContacts] = useState(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [sortColumn, setSortColumn] = useState(null); // 'name', 'email', 'firm_name'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Form state for creating new contact
  const [newContact, setNewContact] = useState({
    number: '',
    name: '',
    email: '',
    firm_name: '',
    website: '',
    remark: ''
  });

  // Form state for editing contact
  const [editContact, setEditContact] = useState({
    contact_id: '',
    number: '',
    name: '',
    email: '',
    firm_name: '',
    website: '',
    remark: ''
  });

  // Validation errors for create modal
  const [createErrors, setCreateErrors] = useState({
    number: '',
    name: '',
    email: '',
    website: '',
    remark: ''
  });

  // Validation errors for edit modal
  const [editErrors, setEditErrors] = useState({
    number: '',
    name: '',
    email: '',
    website: '',
    remark: ''
  });

  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebarMinimized');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  // Initialize database and load auth tokens
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load auth tokens from session
        const sessionData = localStorage.getItem('userData');
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed && typeof parsed === 'object') {
            setTokens(parsed);

            // Initialize contact database with project ID
            const projectId = parsed.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c';
            const dbInitSuccess = await contactDbHelper.init(projectId);
            setDbInitialized(dbInitSuccess);
          }
        }
      } catch (e) {
        console.error('Failed to initialize app:', e);
      }
    };

    initializeApp();
  }, []);

  // 3-Step Process: Load local DB → Sync with API → Refresh local DB
  useEffect(() => {
    if (!tokens?.token || !tokens?.username || !dbInitialized) return;

    const loadAndSyncContacts = async () => {
      try {
        // 1️⃣ Load local database immediately
        console.log('📱 Step 1: Loading contacts from local database...');
        setLoading(true);

        const localResult = await contactDbHelper.getContacts(currentPage, 10);
        if (localResult.contacts.length > 0) {
          const mappedLocal = localResult.contacts.map(c => ({
            id: c.contact_id, // Use contact_id as the main ID
            name: c.name,
            mobile: c.number,
            email: c.email,
            firm_name: c.firm_name,
            website: c.website,
            remark: c.remark,
            languageCode: c.language_code,
            country: c.country,
            createdOn: c.create_date,
            is_favorite: c.is_favorite || false
          }));

          // Load favorites from database
          const favorites = new Set(mappedLocal.filter(c => c.is_favorite).map(c => c.id));
          setFavoriteContacts(favorites);
          setContacts(mappedLocal);
          setTotalPages(localResult.totalPages);
          setLoading(false);
          console.log(`✅ Loaded ${mappedLocal.length} contacts from local DB`);
        } else {
          console.log('📭 No local contacts found, will wait for API sync');
        }

        // 2️⃣ Sync with API - make request and wait for response
        console.log('🌐 Step 2: Syncing with API...');
        setSyncing(true);

        const payload = {
          project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
          page_no: currentPage,
          query: ''
        };

        const { data, key } = Encrypt(payload);
        const data_pass = JSON.stringify({ data, key });

        const response = await axios.post(
          'https://api.w1chat.com/contact/contact-list',
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
          const apiList = response?.data?.data || [];
          console.log(`📥 Received ${apiList.length} contacts from API`);

          // Save to local database
          await contactDbHelper.saveContacts(apiList);

          // 3️⃣ After API updates DB, re-fetch from local DB again
          console.log('🔄 Step 3: Refreshing from updated local database...');
          const refreshedResult = await contactDbHelper.getContacts(currentPage, 10);

          const mappedRefreshed = refreshedResult.contacts.map(c => ({
            id: c.contact_id, // Use contact_id as the main ID
            name: c.name,
            mobile: c.number,
            email: c.email,
            firm_name: c.firm_name,
            website: c.website,
            remark: c.remark,
            languageCode: c.language_code,
            country: c.country,
            createdOn: c.create_date,
            is_favorite: c.is_favorite || false
          }));

          // Update favorites from refreshed data
          const refreshedFavorites = new Set(mappedRefreshed.filter(c => c.is_favorite).map(c => c.id));
          setFavoriteContacts(refreshedFavorites);

          setContacts(mappedRefreshed);
          setTotalPages(refreshedResult.totalPages);
          console.log(`✅ Final result: ${mappedRefreshed.length} contacts displayed`);
        } else {
          console.warn('⚠️ API returned error:', response?.data?.message);
          // If API fails but we have local data, keep showing local data
          if (localResult.contacts.length === 0) {
            setContacts([]);
            setTotalPages(1);
          }
        }
      } catch (error) {
        console.error('❌ Error in loadAndSyncContacts:', error);
        // If everything fails, try to show local data or empty state
        try {
          const fallbackResult = await contactDbHelper.getContacts(currentPage, 10);
          if (fallbackResult.contacts.length > 0) {
            const mappedFallback = fallbackResult.contacts.map(c => ({
              id: c.contact_id, // Use contact_id as the main ID
              name: c.name,
              mobile: c.number,
              email: c.email,
              firm_name: c.firm_name,
              website: c.website,
              remark: c.remark,
              languageCode: c.language_code,
              country: c.country,
              createdOn: c.create_date,
              is_favorite: c.is_favorite || false
            }));

            // Update favorites from fallback data
            const fallbackFavorites = new Set(mappedFallback.filter(c => c.is_favorite).map(c => c.id));
            setFavoriteContacts(fallbackFavorites);
            setContacts(mappedFallback);
            setTotalPages(fallbackResult.totalPages);
          } else {
            setContacts([]);
            setTotalPages(1);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          setContacts([]);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
        setSyncing(false);
        setSelectedContacts([]);
        setIsAllSelected(false);
      }
    };

    loadAndSyncContacts();
  }, [tokens?.token, tokens?.username, tokens?.projects, currentPage, dbInitialized]);

  // Validation functions
  const validatePhoneNumber = (phone) => {
    // Remove spaces, dashes, and parentheses for validation
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // Allow digits, +, and should be between 10-15 digits (international format)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phone || phone.trim() === '') {
      return 'Mobile number is required';
    }
    if (!phoneRegex.test(cleaned)) {
      return 'Please enter a valid mobile number (10-15 digits)';
    }
    return '';
  };

  const validateName = (name) => {
    if (!name || name.trim() === '') {
      return 'Name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (name.trim().length > 100) {
      return 'Name must be less than 100 characters';
    }
    // Allow letters, spaces, hyphens, apostrophes, periods, and numbers (for international names)
    // More permissive regex that allows unicode letters and common name characters
    const nameRegex = /^[\p{L}\s\-'\.0-9]+$/u;
    if (!nameRegex.test(name.trim())) {
      return 'Name contains invalid characters';
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email || email.trim() === '') {
      return ''; // Email is optional
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }
    if (email.trim().length > 255) {
      return 'Email must be less than 255 characters';
    }
    return '';
  };

  const validateWebsite = (website) => {
    if (!website || website.trim() === '') {
      return ''; // Website is optional
    }
    try {
      const url = website.trim();
      // Add protocol if missing
      const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://') 
        ? url 
        : `https://${url}`;
      new URL(urlWithProtocol);
      if (url.length > 500) {
        return 'Website URL must be less than 500 characters';
      }
      return '';
    } catch (e) {
      return 'Please enter a valid website URL';
    }
  };

  const validateRemark = (remark) => {
    if (!remark || remark.trim() === '') {
      return ''; // Remark is optional
    }
    if (remark.trim().length > 1000) {
      return 'Remark must be less than 1000 characters';
    }
    return '';
  };

  // Validate create contact form
  const validateCreateForm = () => {
    const errors = {
      number: validatePhoneNumber(newContact.number),
      name: validateName(newContact.name),
      email: validateEmail(newContact.email),
      website: validateWebsite(newContact.website),
      remark: validateRemark(newContact.remark)
    };
    setCreateErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  // Validate edit contact form
  const validateEditForm = () => {
    const errors = {
      number: validatePhoneNumber(editContact.number),
      name: validateName(editContact.name),
      email: validateEmail(editContact.email),
      website: validateWebsite(editContact.website),
      remark: validateRemark(editContact.remark)
    };
    setEditErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  // Handle create contact
  const handleCreateContact = async () => {
    if (!tokens?.token || !tokens?.username) return;

    // Validate form before submitting
    if (!validateCreateForm()) {
      return;
    }

    try {
      const payload = {
        project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
        ...newContact
      };

      const { data, key } = Encrypt(payload);
      const data_pass = JSON.stringify({ data, key });

      const response = await axios.post(
        'https://api.w1chat.com/contact/create-contact',
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
        // Save to local database immediately
        const newContactData = {
          contact_id: response?.data?.data?.contact_id || response?.data?.data?.id || Date.now().toString(),
          number: newContact.number,
          name: newContact.name,
          email: newContact.email,
          firm_name: newContact.firm_name,
          website: newContact.website,
          remark: newContact.remark,
          create_date: new Date().toISOString()
        };

        await contactDbHelper.saveContacts([newContactData]);

        // Close modal and reset form
        setShowCreateModal(false);
        setNewContact({
          number: '',
          name: '',
          email: '',
          firm_name: '',
          website: '',
          remark: ''
        });
        setCreateErrors({
          number: '',
          name: '',
          email: '',
          website: '',
          remark: ''
        });

        // Refresh contacts list immediately - go to page 1 to show new contact
        setCurrentPage(1);
        
        // Directly refresh the contacts list from local database
        const refreshedResult = await contactDbHelper.getContacts(1, 10);
        const mappedRefreshed = refreshedResult.contacts.map(c => ({
          id: c.contact_id,
          name: c.name,
          mobile: c.number,
          email: c.email,
          firm_name: c.firm_name,
          website: c.website,
          remark: c.remark,
          languageCode: c.language_code,
          country: c.country,
          createdOn: c.create_date,
          is_favorite: c.is_favorite || false
        }));

        // Update favorites from refreshed data
        const refreshedFavorites = new Set(mappedRefreshed.filter(c => c.is_favorite).map(c => c.id));
        setFavoriteContacts(refreshedFavorites);

        setContacts(mappedRefreshed);
        setTotalPages(refreshedResult.totalPages);

        // Show success message
        const successMsg = response?.data?.msg || 'Contact created successfully';
        setSuccessMessage(successMsg);
        setShowSuccessModal(true);
      } else {
        alert('Failed to create contact: ' + (response?.data?.message || response?.data?.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to create contact:', error);
      alert('Failed to create contact. Please try again.');
    }
  };

  // Handle opening edit modal
  const handleOpenEditModal = (contact) => {
    console.log('🔧 Opening edit modal for contact:', contact);
    setEditingContact(contact);
    setEditContact({
      contact_id: contact.id, // This should be the contact_id from API
      number: contact.mobile,
      name: contact.name,
      email: contact.email || '',
      firm_name: contact.firm_name || '',
      website: contact.website || '',
      remark: contact.remark || ''
    });
    setEditErrors({
      number: '',
      name: '',
      email: '',
      website: '',
      remark: ''
    });
    setShowEditModal(true);
  };

  // Handle update contact
  const handleUpdateContact = async () => {
    if (!tokens?.token || !tokens?.username || !editContact.contact_id) return;

    // Validate form before submitting
    if (!validateEditForm()) {
      return;
    }

    try {
      const payload = {
        project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
        contact_id: editContact.contact_id,
        number: editContact.number,
        name: editContact.name,
        email: editContact.email,
        firm_name: editContact.firm_name,
        website: editContact.website,
        remark: editContact.remark
      };

      console.log('📤 Sending update payload:', payload);

      const { data, key } = Encrypt(payload);
      const data_pass = JSON.stringify({ data, key });

      const response = await axios.post(
        'https://api.w1chat.com/contact/update-contact',
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
        // Update local database immediately
        const updatedContactData = {
          contact_id: editContact.contact_id,
          number: editContact.number,
          name: editContact.name,
          email: editContact.email,
          firm_name: editContact.firm_name,
          website: editContact.website,
          remark: editContact.remark,
          create_date: editingContact.createdOn || new Date().toISOString()
        };

        await contactDbHelper.saveContacts([updatedContactData]);

        // Close modal and reset form
        setShowEditModal(false);
        setEditingContact(null);
        setEditContact({
          contact_id: '',
          number: '',
          name: '',
          email: '',
          firm_name: '',
          website: '',
          remark: ''
        });
        setEditErrors({
          number: '',
          name: '',
          email: '',
          website: '',
          remark: ''
        });

        // Refresh the contacts list to show updated data
        const refreshedResult = await contactDbHelper.getContacts(currentPage, 10);
        const mappedRefreshed = refreshedResult.contacts.map(c => ({
          id: c.contact_id,
          name: c.name,
          mobile: c.number,
          email: c.email,
          firm_name: c.firm_name,
          website: c.website,
          remark: c.remark,
          languageCode: c.language_code,
          country: c.country,
          createdOn: c.create_date,
          is_favorite: c.is_favorite || false
        }));

        // Update favorites from refreshed data
        const refreshedFavorites = new Set(mappedRefreshed.filter(c => c.is_favorite).map(c => c.id));
        setFavoriteContacts(refreshedFavorites);

        setContacts(mappedRefreshed);
        setTotalPages(refreshedResult.totalPages);

        // Show success message
        const successMsg = response?.data?.msg || 'Contact updated successfully';
        setSuccessMessage(successMsg);
        setShowSuccessModal(true);
      } else {
        alert('Failed to update contact: ' + (response?.data?.message || response?.data?.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to update contact:', error);
      alert('Failed to update contact. Please try again.');
    }
  };

  // Handle favorite contact toggle
  const handleToggleFavorite = async (contact) => {
    if (!tokens?.token || !tokens?.username) return;

    const isFavorite = favoriteContacts.has(contact.id);
    const action = isFavorite ? 'delete' : 'add';

    try {
      const payload = {
        project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
        number: contact.mobile,
        action: action
      };

      console.log('⭐ Toggling favorite:', { contact: contact.name, action, payload });

      const { data, key } = Encrypt(payload);
      const data_pass = JSON.stringify({ data, key });

      const response = await axios.post(
        'https://api.w1chat.com/contact/mark-as-favorite',
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
        // Update local favorite state
        const newFavorites = new Set(favoriteContacts);
        if (action === 'add') {
          newFavorites.add(contact.id);
        } else {
          newFavorites.delete(contact.id);
        }
        setFavoriteContacts(newFavorites);

        // Update local database
        await contactDbHelper.updateContact(contact.id, {
          is_favorite: action === 'add'
        });

        console.log(`✅ Contact ${action === 'add' ? 'added to' : 'removed from'} favorites`);
      } else {
        alert('Failed to update favorite status: ' + (response?.data?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('Failed to update favorite status. Please try again.');
    }
  };

  // Handle export to Excel
  const handleExportToExcel = () => {
    if (contacts.length === 0) {
      alert('No contacts to export');
      return;
    }

    const csvContent = [
      ['Name', 'Mobile', 'Email', 'Company', 'Website', 'Remark',],
      ...contacts.map(contact => [
        contact.name,
        contact.mobile,
        contact.email,
        contact.firm_name,
        contact.website,
        contact.remark,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle select all contacts
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedContacts([]);
      setIsAllSelected(false);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
      setIsAllSelected(true);
    }
  };

  // Handle individual contact selection
  const handleSelectContact = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
      setIsAllSelected(false);
    } else {
      const newSelected = [...selectedContacts, contactId];
      setSelectedContacts(newSelected);
      setIsAllSelected(newSelected.length === contacts.length);
    }
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle column sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter contacts based on favorites filter
  let filteredContacts = showFavoritesOnly
    ? contacts.filter(contact => favoriteContacts.has(contact.id))
    : contacts;

  // Apply sorting if a sort column is selected
  if (sortColumn) {
    filteredContacts = [...filteredContacts].sort((a, b) => {
      let aValue = a[sortColumn] || '';
      let bValue = b[sortColumn] || '';

      // Convert to string and handle empty values
      aValue = String(aValue).toLowerCase().trim();
      bValue = String(bValue).toLowerCase().trim();

      // Handle empty values - put them at the end
      if (aValue === '' && bValue === '') return 0;
      if (aValue === '') return 1;
      if (bValue === '') return -1;

      // Compare values
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

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

      <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'
        }`}>
        <div className="p-4 sm:p-6 md:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-base font-bold text-gray-900">Contact Management</h1>
                  {syncing && (
                    <div className="flex items-center text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Syncing...
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-sm">Manage your contacts and customer information</p>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${showFavoritesOnly
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <FiFilter className="mr-2 h-4 w-4 text-sm" />
                  {showFavoritesOnly ? 'Show All' : 'Favorites Only'}
                </button>

                <button
                  onClick={handleExportToExcel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiDownload className="mr-2 h-4 w-4" />
                  Export to Excel
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiUpload className="mr-2 h-4 w-4" />
                  Import from Excel
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiPlus className="mr-2 h-4 w-4" />
                  Create Contact
                </button>
              </div>
            </div>
          </div>

          {/* Contacts Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-gray-600">Loading contacts...</span>
                </div>
              ) : (
                <>
                  {/* Table Header */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Name</span>
                              {sortColumn === 'name' ? (
                                sortDirection === 'asc' ? (
                                  <FiChevronUp className="h-4 w-4 text-gray-700" />
                                ) : (
                                  <FiChevronDown className="h-4 w-4 text-gray-700" />
                                )
                              ) : (
                                <div className="flex flex-col -space-y-1">
                                  <FiChevronUp className="h-3 w-3 text-gray-400" />
                                  <FiChevronDown className="h-3 w-3 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mobile
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort('email')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Email</span>
                              {sortColumn === 'email' ? (
                                sortDirection === 'asc' ? (
                                  <FiChevronUp className="h-4 w-4 text-gray-700" />
                                ) : (
                                  <FiChevronDown className="h-4 w-4 text-gray-700" />
                                )
                              ) : (
                                <div className="flex flex-col -space-y-1">
                                  <FiChevronUp className="h-3 w-3 text-gray-400" />
                                  <FiChevronDown className="h-3 w-3 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort('firm_name')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Company</span>
                              {sortColumn === 'firm_name' ? (
                                sortDirection === 'asc' ? (
                                  <FiChevronUp className="h-4 w-4 text-gray-700" />
                                ) : (
                                  <FiChevronDown className="h-4 w-4 text-gray-700" />
                                )
                              ) : (
                                <div className="flex flex-col -space-y-1">
                                  <FiChevronUp className="h-3 w-3 text-gray-400" />
                                  <FiChevronDown className="h-3 w-3 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredContacts.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                              {showFavoritesOnly
                                ? 'No favorite contacts found. Mark some contacts as favorites to see them here.'
                                : 'No contacts found. Create your first contact to get started.'
                              }
                            </td>
                          </tr>
                        ) : (
                          filteredContacts.map((contact) => (
                            <tr key={contact.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedContacts.includes(contact.id)}
                                  onChange={() => handleSelectContact(contact.id)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                      <FiUser className="h-5 w-5 text-indigo-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {contact.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {contact.mobile}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {contact.email || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {contact.firm_name || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleOpenEditModal(contact)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title="Edit contact"
                                  >
                                    <FiEdit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleFavorite(contact)}
                                    className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                    title={favoriteContacts.has(contact.id) ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <FiStar
                                      className={`h-4 w-4 ${favoriteContacts.has(contact.id)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300 hover:text-yellow-400'
                                        }`}
                                    />
                                  </button>

                                  <button className="text-red-600 hover:text-red-900" title="Delete contact">
                                    <FiTrash2 className="h-4 w-4" />
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
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                      <div className="flex justify-between flex-1 sm:hidden">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Page <span className="font-medium">{currentPage}</span> of{' '}
                            <span className="font-medium">{totalPages}</span>
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={handlePreviousPage}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FiChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              onClick={handleNextPage}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FiChevronRight className="h-5 w-5" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Contact Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-5/6 sm:w-3/6 md:w-3/6 lg:w-2/6 xl:w-6/9 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Contact</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateErrors({
                      number: '',
                      name: '',
                      email: '',
                      website: '',
                      remark: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiPhone className="inline h-4 w-4 mr-1" />
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={newContact.number}
                    onChange={(e) => {
                      setNewContact({ ...newContact, number: e.target.value });
                      if (createErrors.number) {
                        setCreateErrors({ ...createErrors, number: validatePhoneNumber(e.target.value) });
                      }
                    }}
                    onBlur={() => setCreateErrors({ ...createErrors, number: validatePhoneNumber(newContact.number) })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      createErrors.number 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter mobile number"
                    required
                  />
                  {createErrors.number && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiUser className="inline h-4 w-4 mr-1" />
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => {
                      setNewContact({ ...newContact, name: e.target.value });
                      if (createErrors.name) {
                        setCreateErrors({ ...createErrors, name: validateName(e.target.value) });
                      }
                    }}
                    onBlur={() => setCreateErrors({ ...createErrors, name: validateName(newContact.name) })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      createErrors.name 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter full name"
                    required
                  />
                  {createErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiMail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => {
                      setNewContact({ ...newContact, email: e.target.value });
                      if (createErrors.email) {
                        setCreateErrors({ ...createErrors, email: validateEmail(e.target.value) });
                      }
                    }}
                    onBlur={() => setCreateErrors({ ...createErrors, email: validateEmail(newContact.email) })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      createErrors.email 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter email address"
                  />
                  {createErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiHome className="inline h-4 w-4 mr-1" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newContact.firm_name}
                    onChange={(e) => setNewContact({ ...newContact, firm_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiGlobe className="inline h-4 w-4 mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={newContact.website}
                    onChange={(e) => {
                      setNewContact({ ...newContact, website: e.target.value });
                      if (createErrors.website) {
                        setCreateErrors({ ...createErrors, website: validateWebsite(e.target.value) });
                      }
                    }}
                    onBlur={() => setCreateErrors({ ...createErrors, website: validateWebsite(newContact.website) })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      createErrors.website 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter website URL (e.g., example.com)"
                  />
                  {createErrors.website && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.website}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiFileText className="inline h-4 w-4 mr-1" />
                    Remark
                  </label>
                  <textarea
                    value={newContact.remark}
                    onChange={(e) => {
                      setNewContact({ ...newContact, remark: e.target.value });
                      if (createErrors.remark) {
                        setCreateErrors({ ...createErrors, remark: validateRemark(e.target.value) });
                      }
                    }}
                    onBlur={() => setCreateErrors({ ...createErrors, remark: validateRemark(newContact.remark) })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      createErrors.remark 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter any remarks"
                    rows="3"
                  />
                  {createErrors.remark && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.remark}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {newContact.remark.length}/1000 characters
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateErrors({
                      number: '',
                      name: '',
                      email: '',
                      website: '',
                      remark: ''
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateContact}
                  disabled={!newContact.number || !newContact.name}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-5/6 sm:w-3/6 md:w-3/6 lg:w-2/6 xl:w-6/9 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Contact</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingContact(null);
                    setEditErrors({
                      number: '',
                      name: '',
                      email: '',
                      website: '',
                      remark: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiPhone className="inline h-4 w-4 mr-1" />
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={editContact.number}
                    onChange={(e) => {
                      setEditContact({ ...editContact, number: e.target.value });
                      if (editErrors.number) {
                        setEditErrors({ ...editErrors, number: validatePhoneNumber(e.target.value) });
                      }
                    }}
                    onBlur={() => setEditErrors({ ...editErrors, number: validatePhoneNumber(editContact.number) })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      editErrors.number 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter mobile number"
                    required
                  />
                  {editErrors.number && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiUser className="inline h-4 w-4 mr-1" />
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editContact.name}
                    onChange={(e) => {
                      setEditContact({ ...editContact, name: e.target.value });
                      if (editErrors.name) {
                        setEditErrors({ ...editErrors, name: validateName(e.target.value) });
                      }
                    }}
                    onBlur={() => setEditErrors({ ...editErrors, name: validateName(editContact.name) })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      editErrors.name 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter full name"
                    required
                  />
                  {editErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiMail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={editContact.email}
                    onChange={(e) => {
                      setEditContact({ ...editContact, email: e.target.value });
                      if (editErrors.email) {
                        setEditErrors({ ...editErrors, email: validateEmail(e.target.value) });
                      }
                    }}
                    onBlur={() => setEditErrors({ ...editErrors, email: validateEmail(editContact.email) })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      editErrors.email 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter email address"
                  />
                  {editErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiHome className="inline h-4 w-4 mr-1" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={editContact.firm_name}
                    onChange={(e) => setEditContact({ ...editContact, firm_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiGlobe className="inline h-4 w-4 mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={editContact.website}
                    onChange={(e) => {
                      setEditContact({ ...editContact, website: e.target.value });
                      if (editErrors.website) {
                        setEditErrors({ ...editErrors, website: validateWebsite(e.target.value) });
                      }
                    }}
                    onBlur={() => setEditErrors({ ...editErrors, website: validateWebsite(editContact.website) })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      editErrors.website 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter website URL (e.g., example.com)"
                  />
                  {editErrors.website && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.website}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiFileText className="inline h-4 w-4 mr-1" />
                    Remark
                  </label>
                  <textarea
                    value={editContact.remark}
                    onChange={(e) => {
                      setEditContact({ ...editContact, remark: e.target.value });
                      if (editErrors.remark) {
                        setEditErrors({ ...editErrors, remark: validateRemark(e.target.value) });
                      }
                    }}
                    onBlur={() => setEditErrors({ ...editErrors, remark: validateRemark(editContact.remark) })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      editErrors.remark 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter any remarks"
                    rows="3"
                  />
                  {editErrors.remark && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.remark}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {editContact.remark.length}/1000 characters
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingContact(null);
                    setEditErrors({
                      number: '',
                      name: '',
                      email: '',
                      website: '',
                      remark: ''
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateContact}
                  disabled={!editContact.number || !editContact.name}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Import from Excel</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Excel File
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p className="mb-2">File format requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Columns: Name, Mobile, Email, Company, Website, Remark</li>
                    <li>Supported formats: .xlsx, .xls, .csv</li>
                    <li>Maximum 1000 contacts per import</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Import functionality will be implemented');
                    setShowImportModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Import Contacts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-5/6 sm:w-3/6 md:w-2/6 lg:w-2/6 xl:w-1/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <FiCheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Success</h3>
                <p className="text-sm text-gray-600 mb-4">{successMessage}</p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contact;