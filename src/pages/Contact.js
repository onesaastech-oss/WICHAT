import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header, Sidebar } from '../component/Menu';
import Tooltip from '../component/Tooltip';
import Pagination from '../component/Pagination';
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';
import { useNavigate } from 'react-router-dom';
import { contactDbHelper } from './db';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
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
  FiSearch,
  FiCheckCircle
} from 'react-icons/fi';

function Contact() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(20); // Default 20 items per page
  const [tokens, setTokens] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reloadTick, setReloadTick] = useState(0);
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(null); // 'selected' | 'all'
  const [bulkDeletePhrase, setBulkDeletePhrase] = useState('');
  const [bulkDeleteError, setBulkDeleteError] = useState('');
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sortColumn, setSortColumn] = useState(null); // 'name', 'email', 'firm_name'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const navigate = useNavigate();
  const permissions = useSelector((state) => state.project.permissions);

  // Infinite list (modal-style) state (smooth scroll + accurate scrollbar using API meta)
  const USE_INFINITE_CONTACTS_LIST = true;
  const CONTACT_LIST_ROW_HEIGHT = 64; // approximate row height for spacer calculation
  const [contactsMeta, setContactsMeta] = useState({
    page_no: 1,
    limit: 20,
    total_records: 0,
    total_pages: 1,
    has_more: false
  });
  const [contactsPageNo, setContactsPageNo] = useState(1);
  const [contactsLoading, setContactsLoading] = useState(false);
  const contactsReqIdRef = useRef(0);
  const contactsLoadingRef = useRef(false);
  const contactsLastRequestedPageRef = useRef(0);
  const contactsHasUserScrolledRef = useRef(false);
  const contactsIgnoreNextSearchEffectRef = useRef(false);
  const scrollJumpTimeoutRef = useRef(null);
  const lastFetchedPageRef = useRef(1);

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
            console.log(parsed.selected_project_id);
            

            // Initialize contact database with project ID
            const projectId = parsed.selected_project_id || '';
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
    if (USE_INFINITE_CONTACTS_LIST) return;
    if (!tokens?.token || !tokens?.username || !dbInitialized) return;
    if (permissions && permissions.view_contact === false) return;

    const loadAndSyncContacts = async () => {
      try {
        // 1️⃣ Load local database immediately
        console.log('📱 Step 1: Loading contacts from local database...');
        setLoading(true);

        const localResult = await contactDbHelper.getContacts(currentPage, pageSize);
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
          setTotalRecords(localResult.totalCount || 0);
          setLoading(false);
          console.log(`✅ Loaded ${mappedLocal.length} contacts from local DB`);
        } else {
          console.log('📭 No local contacts found, will wait for API sync');
        }

        // 2️⃣ Sync with API - make request and wait for response
        console.log('🌐 Step 2: Syncing with API...');
        setSyncing(true);

        const payload = {
          project_id: tokens.selected_project_id || '',
          page_no: currentPage,
          limit: pageSize,
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
          const apiMeta = response?.data?.meta || null;
          console.log(`📥 Received ${apiList.length} contacts from API`, apiMeta);

          // Save to local database
          await contactDbHelper.saveContacts(apiList);

          // 3️⃣ After API updates DB, re-fetch from local DB again
          console.log('🔄 Step 3: Refreshing from updated local database...');
          const refreshedResult = await contactDbHelper.getContacts(currentPage, pageSize);

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
          
          // Use API meta if available, otherwise fall back to local DB count
          if (apiMeta) {
            const metaTotalPages = apiMeta.total_pages > 0 ? apiMeta.total_pages : (apiMeta.total_records > 0 ? 1 : 0);
            setTotalPages(metaTotalPages);
            setTotalRecords(apiMeta.total_records || 0);
          } else {
            setTotalPages(refreshedResult.totalPages || 0);
            setTotalRecords(refreshedResult.totalCount || 0);
          }
          
          console.log(`✅ Final result: ${mappedRefreshed.length} contacts displayed, Total: ${apiMeta?.total_records || refreshedResult.totalCount}`);
        } else {
          console.warn('⚠️ API returned error:', response?.data?.message);
          // If API fails but we have local data, keep showing local data
          if (localResult.contacts.length === 0) {
            setContacts([]);
            setTotalPages(1);
            setTotalRecords(0);
          }
        }
      } catch (error) {
        console.error('❌ Error in loadAndSyncContacts:', error);
        // If everything fails, try to show local data or empty state
        try {
          const fallbackResult = await contactDbHelper.getContacts(currentPage, pageSize);
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
            setTotalRecords(fallbackResult.totalCount || 0);
          } else {
            setContacts([]);
            setTotalPages(1);
            setTotalRecords(0);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          setContacts([]);
          setTotalPages(1);
          setTotalRecords(0);
        }
      } finally {
        setLoading(false);
        setSyncing(false);
        setSelectedContacts([]);
        setIsAllSelected(false);
      }
    };

    loadAndSyncContacts();
  }, [USE_INFINITE_CONTACTS_LIST, tokens?.token, tokens?.username, tokens?.projects, currentPage, pageSize, dbInitialized, permissions]);

  const loadContactsPage = useCallback(
    async ({ requestedPageNo, query, append, isFavoriteOnly }) => {
      if (!tokens?.token || !tokens?.username) return;
      if (permissions && permissions.view_contact === false) return;
      if (contactsLoadingRef.current) return;

      const projectId = tokens.selected_project_id || '';
      const reqId = ++contactsReqIdRef.current;

      try {
        contactsLoadingRef.current = true;
        setContactsLoading(true);

        const payload = {
          project_id: projectId,
          page_no: requestedPageNo,
          limit: pageSize,
          query: query || '',
          ...(isFavoriteOnly ? { is_favorite_only: true } : {})
        };

        const { data, key } = Encrypt(payload);
        const data_pass = JSON.stringify({ data, key });

        const response = await axios.post(
          'https://api.w1chat.com/contact/contact-list',
          data_pass,
          {
            headers: {
              token: tokens.token,
              username: tokens.username,
              'Content-Type': 'application/json'
            }
          }
        );

        // ignore stale results
        if (reqId !== contactsReqIdRef.current) return;

        if (!response?.data?.error) {
          const apiList = response?.data?.data || [];
          const meta = response?.data?.meta || null;

          // best-effort local DB warm-up (non-blocking for UI)
          try {
            if (dbInitialized) await contactDbHelper.saveContacts(apiList);
          } catch (e) {
            console.warn('Contact DB save failed (non-blocking):', e);
          }

          const mapped = apiList.map((c) => ({
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

          setContacts((prev) => {
            const next = append ? [...prev, ...mapped] : mapped;
            const seen = new Set();
            return next.filter((row) => {
              if (!row?.id) return false;
              if (seen.has(row.id)) return false;
              seen.add(row.id);
              return true;
            });
          });

          setFavoriteContacts((prev) => {
            const next = new Set(prev);
            for (const row of mapped) {
              if (row?.id && row.is_favorite) next.add(row.id);
            }
            return next;
          });

          const fallbackTotalRecords =
            meta?.total_records ??
            response?.data?.count ??
            (append ? undefined : mapped.length);

          const totalPagesFallback =
            meta?.total_pages ??
            (typeof fallbackTotalRecords === 'number'
              ? Math.max(1, Math.ceil(fallbackTotalRecords / pageSize))
              : 1);

          const hasMoreFallback =
            meta?.has_more ??
            (meta?.page_no
              ? meta.page_no < (meta.total_pages || totalPagesFallback)
              : requestedPageNo < totalPagesFallback);

          setContactsMeta({
            page_no: meta?.page_no ?? requestedPageNo,
            limit: meta?.limit ?? pageSize,
            total_records: meta?.total_records ?? (fallbackTotalRecords || 0),
            total_pages: totalPagesFallback,
            has_more: hasMoreFallback
          });
          setContactsPageNo(meta?.page_no ?? requestedPageNo);
          setCurrentPage(meta?.page_no ?? requestedPageNo); // keep legacy state aligned
          setTotalRecords(meta?.total_records ?? (fallbackTotalRecords || 0));
          setTotalPages(totalPagesFallback);
        } else {
          console.warn('⚠️ contact-list API returned error:', response?.data?.message);
          if (!append) {
            setContacts([]);
            setContactsMeta({
              page_no: 1,
              limit: pageSize,
              total_records: 0,
              total_pages: 1,
              has_more: false
            });
            setContactsPageNo(1);
            setCurrentPage(1);
            setTotalRecords(0);
            setTotalPages(1);
          }
        }
      } catch (error) {
        console.error('❌ Error loading contacts:', error);
        if (!append) {
          setContacts([]);
          setContactsMeta({
            page_no: 1,
            limit: pageSize,
            total_records: 0,
            total_pages: 1,
            has_more: false
          });
          setContactsPageNo(1);
          setCurrentPage(1);
          setTotalRecords(0);
          setTotalPages(1);
        }
      } finally {
        if (reqId === contactsReqIdRef.current) {
          setContactsLoading(false);
          contactsLoadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [
      tokens?.token,
      tokens?.username,
      tokens?.selected_project_id,
      permissions,
      pageSize,
      dbInitialized
    ]
  );

  const resetAndLoadContacts = useCallback(
    async (query, isFavoriteOnly) => {
      contactsReqIdRef.current += 1; // invalidate any in-flight
      contactsLoadingRef.current = false;
      contactsLastRequestedPageRef.current = 1;
      contactsHasUserScrolledRef.current = false;
      lastFetchedPageRef.current = 1;
      if (scrollJumpTimeoutRef.current) {
        clearTimeout(scrollJumpTimeoutRef.current);
        scrollJumpTimeoutRef.current = null;
      }
      setContacts([]);
      setContactsMeta({
        page_no: 1,
        limit: pageSize,
        total_records: 0,
        total_pages: 1,
        has_more: false
      });
      setContactsPageNo(1);
      setCurrentPage(1);
      setSelectedContacts([]);
      setIsAllSelected(false);
      setLoading(true);
      await loadContactsPage({
        requestedPageNo: 1,
        query,
        append: false,
        isFavoriteOnly
      });
    },
    [loadContactsPage, pageSize]
  );

  // Initial load (infinite list mode)
  useEffect(() => {
    if (!USE_INFINITE_CONTACTS_LIST) return;
    if (!tokens?.token || !tokens?.username) return;
    if (!dbInitialized) return;
    if (permissions && permissions.view_contact === false) return;
    contactsIgnoreNextSearchEffectRef.current = true;
    resetAndLoadContacts('', showFavoritesOnly);
  }, [
    USE_INFINITE_CONTACTS_LIST,
    tokens?.token,
    tokens?.username,
    dbInitialized,
    permissions,
    pageSize,
    reloadTick
  ]);

  // Debounced server-side search
  useEffect(() => {
    if (!USE_INFINITE_CONTACTS_LIST) return;
    if (contactsIgnoreNextSearchEffectRef.current) {
      contactsIgnoreNextSearchEffectRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      resetAndLoadContacts(searchTerm, showFavoritesOnly);
    }, 350);
    return () => clearTimeout(t);
  }, [USE_INFINITE_CONTACTS_LIST, searchTerm, showFavoritesOnly, resetAndLoadContacts]);

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
    if (permissions && permissions.create_contact === false) {
      alert('You do not have permission to create contacts.');
      return;
    }
    if (!tokens?.token || !tokens?.username) return;

    // Validate form before submitting
    if (!validateCreateForm()) {
      return;
    }

    try {
      const payload = {
        project_id: tokens.selected_project_id || '',
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
        if (USE_INFINITE_CONTACTS_LIST) {
          setReloadTick((t) => t + 1);
        } else {
          // Directly refresh the contacts list from local database
          const refreshedResult = await contactDbHelper.getContacts(1, pageSize);
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
          setTotalRecords(refreshedResult.totalCount || 0);
        }

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
    if (permissions && permissions.edit_contact === false) {
      alert('You do not have permission to edit contacts.');
      return;
    }
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
    if (permissions && permissions.edit_contact === false) {
      alert('You do not have permission to edit contacts.');
      return;
    }
    if (!tokens?.token || !tokens?.username || !editContact.contact_id) return;

    // Validate form before submitting
    if (!validateEditForm()) {
      return;
    }

    try {
      const payload = {
        project_id: tokens.selected_project_id || '',
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

        if (USE_INFINITE_CONTACTS_LIST) {
          setReloadTick((t) => t + 1);
        } else {
          // Refresh the contacts list to show updated data
          const refreshedResult = await contactDbHelper.getContacts(currentPage, pageSize);
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
          setTotalRecords(refreshedResult.totalCount || 0);
        }

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
        project_id: tokens.selected_project_id || '',
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
        const isFavorite = response?.data?.is_favorite || action === 'add';
        
        if (isFavorite) {
          newFavorites.add(contact.id);
          toast.success(`${contact.name} added to favorites`);
        } else {
          newFavorites.delete(contact.id);
          toast.success(`${contact.name} removed from favorites`);
        }
        setFavoriteContacts(newFavorites);

        // Update local database
        await contactDbHelper.updateContact(contact.id, {
          is_favorite: isFavorite
        });

        console.log(`✅ Contact ${isFavorite ? 'added to' : 'removed from'} favorites`);
      } else {
        toast.error('Failed to update favorite status: ' + (response?.data?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorite status. Please try again.');
    }
  };

  // Handle delete contact - opens confirmation modal
  const handleDeleteContact = (contact) => {
    if (permissions && permissions.delete_contact === false) {
      alert('You do not have permission to delete contacts.');
      return;
    }
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const handleOpenBulkDeleteSelectedPage = () => {
    if (permissions && permissions.delete_contact === false) {
      alert('You do not have permission to delete contacts.');
      return;
    }
    if (selectedContacts.length === 0) return;
    setBulkDeleteMode('selected');
    setBulkDeletePhrase('');
    setBulkDeleteError('');
    setShowBulkDeleteModal(true);
  };

  const handleOpenBulkDeleteAllContacts = () => {
    if (permissions && permissions.delete_contact === false) {
      alert('You do not have permission to delete contacts.');
      return;
    }
    if (!isAllSelected) return;
    setBulkDeleteMode('all');
    setBulkDeletePhrase('');
    setBulkDeleteError('');
    setShowBulkDeleteModal(true);
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false);
    setBulkDeleteMode(null);
    setBulkDeletePhrase('');
    setBulkDeleteError('');
  };

  const confirmBulkDelete = async () => {
    if (!tokens?.token || !tokens?.username || !tokens?.selected_project_id) return;
    if (!bulkDeleteMode) return;

    if (bulkDeleteMode === 'all' && bulkDeletePhrase.trim() !== 'all-delete') {
      setBulkDeleteError("Type 'all-delete' to confirm deleting ALL contacts.");
      return;
    }

    // Visible contacts = what user is currently seeing in the table
    const visibleContacts = showFavoritesOnly
      ? contacts.filter(c => favoriteContacts.has(c.id))
      : contacts;

    const selectedList = visibleContacts.filter(c => selectedContacts.includes(c.id));
    const selectedIds = selectedList.map(c => c.id);
    const selectedNumbers = selectedList.map(c => c.mobile);

    if (bulkDeleteMode === 'selected' && selectedIds.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const payload =
        bulkDeleteMode === 'all'
          ? {
              project_id: tokens.selected_project_id || '',
              all_contact_delete: true
            }
          : {
              project_id: tokens.selected_project_id || '',
              all_contact_delete: false,
              contact_ids: selectedIds,
              numbers: selectedNumbers
            };

      console.log('🗑️ Bulk delete payload:', payload);

      const { data, key } = Encrypt(payload);
      const data_pass = JSON.stringify({ data, key });

      const response = await axios.post(
        'https://api.w1chat.com/contact/delete-contact',
        data_pass,
        {
          headers: {
            token: tokens.token,
            username: tokens.username,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response?.data?.error) {
        if (bulkDeleteMode === 'all') {
          await contactDbHelper.clearContacts();
          setContacts([]);
          setTotalPages(1);
          setTotalRecords(0);
          setCurrentPage(1);
          setFavoriteContacts(new Set());
        } else {
          await Promise.all(
            selectedList.map(c => contactDbHelper.deleteContact(c.id, c.mobile))
          );

          const refreshedResult = await contactDbHelper.getContacts(currentPage, pageSize);
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

          const refreshedFavorites = new Set(mappedRefreshed.filter(c => c.is_favorite).map(c => c.id));
          setFavoriteContacts(refreshedFavorites);

          setContacts(mappedRefreshed);
          setTotalPages(refreshedResult.totalPages);
          setTotalRecords(refreshedResult.totalCount || 0);

          if (mappedRefreshed.length === 0 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        }

        setSelectedContacts([]);
        setIsAllSelected(false);

        setShowBulkDeleteModal(false);
        setBulkDeleteMode(null);
        setBulkDeletePhrase('');
        setBulkDeleteError('');

        const successMsg =
          response?.data?.msg ||
          (bulkDeleteMode === 'all'
            ? 'All contacts deleted successfully'
            : 'Selected contacts deleted successfully');
        setSuccessMessage(successMsg);
        setShowSuccessModal(true);
      } else {
        alert('Failed to delete contacts: ' + (response?.data?.message || response?.data?.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to bulk delete contacts:', error);
      alert('Failed to delete contacts. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Confirm and execute delete
 // Confirm and execute delete (single contact)
 const confirmDeleteContact = async () => {
  if (!tokens?.token || !tokens?.username || !contactToDelete) return;

  setIsDeleting(true);

  try {
    const payload = {
      all_contact_delete: false,
      contact_ids: [contactToDelete.id],
      numbers: [contactToDelete.mobile],
      project_id: tokens.selected_project_id || ''
    };

    console.log('🗑️ Deleting contact:', payload);

    const { data, key } = Encrypt(payload);
    const data_pass = JSON.stringify({ data, key });

    const response = await axios.post(
      'https://api.w1chat.com/contact/delete-contact',
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
      // Delete from local database using both id and number for reliability
      await contactDbHelper.deleteContact(contactToDelete.id, contactToDelete.mobile);

      if (USE_INFINITE_CONTACTS_LIST) {
        setReloadTick((t) => t + 1);
      } else {
        // Refresh the contacts list
        const refreshedResult = await contactDbHelper.getContacts(currentPage, pageSize);
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
        setTotalRecords(refreshedResult.totalCount || 0);

        // If current page is empty and not the first page, go to previous page
        if (mappedRefreshed.length === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      }

      // Close delete modal
      setShowDeleteModal(false);
      setContactToDelete(null);
      setSelectedContacts(prev => prev.filter(id => id !== contactToDelete.id));
      setIsAllSelected(false);

      // Show success message
      const successMsg = response?.data?.msg || 'Contact deleted successfully';
      setSuccessMessage(successMsg);
      setShowSuccessModal(true);
    } else {
      alert('Failed to delete contact: ' + (response?.data?.message || response?.data?.msg || 'Unknown error'));
    }
  } catch (error) {
    console.error('Failed to delete contact:', error);
    alert('Failed to delete contact. Please try again.');
  } finally {
    setIsDeleting(false);
  }
};

  // Cancel delete
  const cancelDeleteContact = () => {
    setShowDeleteModal(false);
    setContactToDelete(null);
  };

  // Handle export to Excel - opens confirmation modal
  const handleExportToExcel = () => {
    if (contacts.length === 0) {
      alert('No contacts to export');
      return;
    }
    setShowExportModal(true);
  };

  // Confirm and execute export
  const confirmExportContacts = async () => {
    if (!tokens?.token || !tokens?.username) return;

    setIsExporting(true);

    try {
      const payload = {
        project_id: tokens.selected_project_id || '',
        type: 'excel'
      };

      console.log('📤 Exporting contacts:', payload);

      const { data, key } = Encrypt(payload);
      const data_pass = JSON.stringify({ data, key });

      const response = await axios.post(
        'https://api.w1chat.com/contact/export-contacts',
        data_pass,
        {
          headers: {
            'token': tokens.token,
            'username': tokens.username,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response?.data?.error && response?.data?.url) {
        // Download the file from the URL
        const downloadUrl = response.data.url;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', '');
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Close export modal
        setShowExportModal(false);

        // Show success message
        const successMsg = response?.data?.msg || 'Contacts exported successfully';
        setSuccessMessage(successMsg);
        setShowSuccessModal(true);
      } else {
        alert('Failed to export contacts: ' + (response?.data?.message || response?.data?.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to export contacts:', error);
      alert('Failed to export contacts. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Cancel export
  const cancelExportContacts = () => {
    setShowExportModal(false);
  };

  // Handle toggle favorites only with API sync
  const handleToggleFavoritesOnly = async () => {
    const newShowFavoritesOnly = !showFavoritesOnly;
    setShowFavoritesOnly(newShowFavoritesOnly);

    if (USE_INFINITE_CONTACTS_LIST) {
      setLoadingFavorites(true);
      try {
        // Avoid double-fetch with the debounced search effect
        contactsIgnoreNextSearchEffectRef.current = true;
        await resetAndLoadContacts(searchTerm, newShowFavoritesOnly);
      } finally {
        setLoadingFavorites(false);
      }
      return;
    }

    // If switching to favorites view, fetch from API in background
    if (newShowFavoritesOnly && tokens?.token && tokens?.username) {
      setLoadingFavorites(true);
      try {
        const payload = {
          project_id: tokens.selected_project_id || '',
          page_no: currentPage,
          limit: pageSize,
          query: '',
          is_favorite_only: true
        };

        console.log('⭐ Fetching favorites from API:', payload);

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
          console.log(`📥 Received ${apiList.length} favorite contacts from API`);

          // Update favorites set from API response
          const apiFavoriteIds = new Set(apiList.map(c => c.contact_id));
          setFavoriteContacts(apiFavoriteIds);

          // Save to local database to keep it in sync
          await contactDbHelper.saveContacts(apiList);

          console.log('✅ Favorites synced from API');
        } else {
          console.warn('⚠️ API returned error:', response?.data?.message);
        }
      } catch (error) {
        console.error('❌ Error fetching favorites from API:', error);
      } finally {
        setLoadingFavorites(false);
      }
    }
  };

  // Handle select all contacts
  const handleSelectAll = () => {
    const visibleContacts = showFavoritesOnly
      ? contacts.filter(c => favoriteContacts.has(c.id))
      : contacts;

    if (isAllSelected) {
      setSelectedContacts([]);
      setIsAllSelected(false);
    } else {
      setSelectedContacts(visibleContacts.map(c => c.id));
      setIsAllSelected(visibleContacts.length > 0);
    }
  };

  // Handle individual contact selection
  const handleSelectContact = (contactId) => {
    const visibleContacts = showFavoritesOnly
      ? contacts.filter(c => favoriteContacts.has(c.id))
      : contacts;

    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
      setIsAllSelected(false);
    } else {
      const newSelected = [...selectedContacts, contactId];
      setSelectedContacts(newSelected);
      setIsAllSelected(visibleContacts.length > 0 && newSelected.length === visibleContacts.length);
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

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
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

  const filteredContacts = useMemo(() => {
    // Safety net filter (in infinite mode, API may already return favorites-only)
    return showFavoritesOnly
      ? contacts.filter((contact) => favoriteContacts.has(contact.id))
      : contacts;
  }, [contacts, favoriteContacts, showFavoritesOnly]);

  const sortedContacts = useMemo(() => {
    if (!sortColumn) return filteredContacts;
    return [...filteredContacts].sort((a, b) => {
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
  }, [filteredContacts, sortColumn, sortDirection]);

  // Calculate spacer heights for windowed scrolling
  const totalFromApi = contactsMeta?.total_records || 0;
  const currentDisplayPage = contactsMeta?.page_no || 1;
  const itemsPerPage = contactsMeta?.limit || pageSize;
  
  // Items BEFORE current page (spacer at top)
  const itemsBeforeCurrentPage = (currentDisplayPage - 1) * itemsPerPage;
  const topSpacerHeight = itemsBeforeCurrentPage * CONTACT_LIST_ROW_HEIGHT;
  
  // Items AFTER current page (spacer at bottom)
  const itemsInCurrentPage = sortedContacts.length;
  const itemsAfterCurrentPage = Math.max(0, totalFromApi - itemsBeforeCurrentPage - itemsInCurrentPage);
  const bottomSpacerHeight = itemsAfterCurrentPage * CONTACT_LIST_ROW_HEIGHT;

  // Scroll handler: detect which page user scrolled to and fetch it
  const handleContactsScroll = useCallback(
    (e) => {
      if (!USE_INFINITE_CONTACTS_LIST) return;
      const el = e.currentTarget;
      if (!el) return;

      if (el.scrollTop > 0) contactsHasUserScrolledRef.current = true;
      if (!contactsHasUserScrolledRef.current) return;

      // Avoid processing when list doesn't overflow yet
      const scrollable = el.scrollHeight > el.clientHeight + 8;
      if (!scrollable) return;

      // Calculate which page the current scroll position corresponds to
      const scrollTop = el.scrollTop;
      const pageHeight = itemsPerPage * CONTACT_LIST_ROW_HEIGHT;
      
      // Determine target page based on scroll position
      const targetPage = Math.max(1, Math.min(
        contactsMeta?.total_pages || 1,
        Math.floor(scrollTop / pageHeight) + 1
      ));

      // If we're already on this page or loading, skip
      if (targetPage === lastFetchedPageRef.current) return;
      if (contactsLoadingRef.current) return;

      // Debounce scroll jumps to avoid excessive API calls when dragging
      if (scrollJumpTimeoutRef.current) {
        clearTimeout(scrollJumpTimeoutRef.current);
      }

      scrollJumpTimeoutRef.current = setTimeout(() => {
        // Double-check we still need to fetch
        if (targetPage === lastFetchedPageRef.current) return;
        if (contactsLoadingRef.current) return;

        console.log(`📜 Scroll jump detected: fetching page ${targetPage}`);
        lastFetchedPageRef.current = targetPage;
        contactsLastRequestedPageRef.current = targetPage;

        loadContactsPage({
          requestedPageNo: targetPage,
          query: searchTerm,
          append: false, // Replace, don't append
          isFavoriteOnly: showFavoritesOnly
        });
      }, 150); // 150ms debounce for smooth dragging
    },
    [
      USE_INFINITE_CONTACTS_LIST,
      contactsMeta?.total_pages,
      itemsPerPage,
      loadContactsPage,
      searchTerm,
      showFavoritesOnly
    ]
  );

  // Sync lastFetchedPageRef when contactsMeta changes
  useEffect(() => {
    lastFetchedPageRef.current = contactsMeta?.page_no || 1;
  }, [contactsMeta?.page_no]);

  // If user lacks permission to view contacts, show an access message
  if (permissions && permissions.view_contact === false) {
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
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h2 className="text-lg font-semibold text-gray-900">Access Denied</h2>
              <p className="mt-2 text-gray-600">You do not have permission to view contacts.</p>
            </div>
          </div>
        </div>
      </div>
    );
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
                <p className="text-gray-600 text-sm">
                  Manage your contacts and customer information
                  {USE_INFINITE_CONTACTS_LIST && totalFromApi > 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Page {currentDisplayPage} of {contactsMeta?.total_pages || 1} • {totalFromApi} total)
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                <button
                  onClick={handleToggleFavoritesOnly}
                  disabled={loadingFavorites}
                  className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${showFavoritesOnly
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    } ${loadingFavorites ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loadingFavorites ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                  ) : (
                    <FiFilter className="mr-2 h-4 w-4 text-sm" />
                  )}
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

                <Tooltip
                  content="Not authorized"
                  disabled={permissions && permissions.create_contact === false}
                  position="top"
                >
                  <button
                    onClick={() => { if (!permissions || permissions.create_contact) setShowCreateModal(true); }}
                    disabled={permissions && permissions.create_contact === false}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${permissions && permissions.create_contact === false ? 'bg-indigo-400 cursor-not-allowed opacity-60' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    <FiPlus className="mr-2 h-4 w-4" />
                    Create Contact
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            {USE_INFINITE_CONTACTS_LIST && (
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing {sortedContacts.length} of {contactsMeta?.total_records || 0} contacts
                </span>
                {(contactsLoading && sortedContacts.length > 0) && (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 mr-2"></span>
                    Loading…
                  </span>
                )}
              </div>
            )}
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
                  {/* Bulk Actions */}
                  {selectedContacts.length > 0 && (
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="text-sm text-gray-700">
                        {isAllSelected
                          ? 'All contacts on this page are selected.'
                          : `${selectedContacts.length} contact(s) selected on this page.`}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Tooltip
                          content="Not authorized"
                          disabled={permissions && permissions.delete_contact === false}
                          position="top"
                        >
                          <button
                            onClick={() => { if (!permissions || permissions.delete_contact) handleOpenBulkDeleteSelectedPage(); }}
                            disabled={permissions && permissions.delete_contact === false}
                            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              permissions && permissions.delete_contact === false
                                ? 'bg-orange-300 cursor-not-allowed opacity-60'
                                : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                            }`}
                          >
                            <FiTrash2 className="mr-2 h-4 w-4" />
                            Delete selected (this page)
                          </button>
                        </Tooltip>

                        {isAllSelected && (
                          <Tooltip
                            content="Not authorized"
                            disabled={permissions && permissions.delete_contact === false}
                            position="top"
                          >
                            <button
                              onClick={() => { if (!permissions || permissions.delete_contact) handleOpenBulkDeleteAllContacts(); }}
                              disabled={permissions && permissions.delete_contact === false}
                              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                permissions && permissions.delete_contact === false
                                  ? 'bg-red-300 cursor-not-allowed opacity-60'
                                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                              }`}
                            >
                              <FiTrash2 className="mr-2 h-4 w-4" />
                              Delete ALL contacts
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Table Header */}
                  <div className="overflow-x-auto">
                    <div
                      className="relative max-h-[65vh] overflow-y-auto overscroll-contain"
                      onScroll={handleContactsScroll}
                    >
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              S.No.
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
                          {/* Top spacer for windowed scrolling */}
                          {(USE_INFINITE_CONTACTS_LIST && topSpacerHeight > 0) && (
                            <tr aria-hidden="true">
                              <td colSpan="7" className="p-0">
                                <div
                                  style={{ height: topSpacerHeight, minHeight: topSpacerHeight }}
                                  className="pointer-events-none"
                                />
                              </td>
                            </tr>
                          )}
                          {sortedContacts.length === 0 && !contactsLoading ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                              {showFavoritesOnly
                                ? 'No favorite contacts found. Mark some contacts as favorites to see them here.'
                                : 'No contacts found. Create your first contact to get started.'
                              }
                            </td>
                          </tr>
                        ) : (
                          sortedContacts.map((contact, idx) => (
                            <tr key={contact.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedContacts.includes(contact.id)}
                                  onChange={() => handleSelectContact(contact.id)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {itemsBeforeCurrentPage + idx + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                      <FiUser className="h-5 w-5 text-indigo-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4 cursor-pointer text-indigo-600">
                                    <div className="text-sm font-medium  " onClick={()=>{
                                      navigate(`/live-chat/${contact.mobile}`);
                                    }}>
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
                                <div className="flex justify-center items-center space-x-2">
                                  <Tooltip
                                    content="Not authorized"
                                    disabled={permissions && permissions.edit_contact === false}
                                    position="top"
                                  >
                                    <button
                                      onClick={() => { if (!permissions || permissions.edit_contact) handleOpenEditModal(contact); }}
                                      disabled={permissions && permissions.edit_contact === false}
                                      className={`text-indigo-600 hover:text-indigo-900 ${permissions && permissions.edit_contact === false ? 'opacity-50 cursor-not-allowed hover:text-indigo-600' : ''}`}
                                      title={permissions && permissions.edit_contact === false ? '' : 'Edit contact'}
                                    >
                                      <FiEdit className="h-4 w-4" />
                                    </button>
                                  </Tooltip>

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

                                  <Tooltip
                                    content="Not authorized"
                                    disabled={permissions && permissions.delete_contact === false}
                                    position="top"
                                  >
                                    <button 
                                      className={`text-red-600 hover:text-red-900 ${permissions && permissions.delete_contact === false ? 'opacity-50 cursor-not-allowed hover:text-red-600' : ''}`}
                                      title={permissions && permissions.delete_contact === false ? '' : 'Delete contact'}
                                      disabled={permissions && permissions.delete_contact === false}
                                      onClick={() => handleDeleteContact(contact)}
                                      style={{ display: permissions && permissions.delete_contact === false ? 'inline-block' : (!permissions || permissions.delete_contact) ? 'inline-block' : 'none' }}
                                    >
                                      <FiTrash2 className="h-4 w-4" />
                                    </button>
                                  </Tooltip>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                          {(USE_INFINITE_CONTACTS_LIST && contactsLoading && sortedContacts.length > 0) && (
                            <tr>
                              <td colSpan="7" className="px-6 py-3 text-center text-xs text-gray-500">
                                <span className="inline-flex items-center">
                                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></span>
                                  Loading more…
                                </span>
                              </td>
                            </tr>
                          )}

                          {/* Bottom spacer for windowed scrolling */}
                          {(USE_INFINITE_CONTACTS_LIST && bottomSpacerHeight > 0) && (
                            <tr aria-hidden="true">
                              <td colSpan="7" className="p-0">
                                <div
                                  style={{ height: bottomSpacerHeight, minHeight: bottomSpacerHeight }}
                                  className="pointer-events-none"
                                />
                              </td>
                            </tr>
                          )}

                          {(USE_INFINITE_CONTACTS_LIST && !contactsLoading && currentDisplayPage >= (contactsMeta?.total_pages || 1) && sortedContacts.length > 0) && (
                            <tr>
                              <td colSpan="7" className="px-6 py-3 text-center text-xs text-gray-400">
                                End of contacts (Page {currentDisplayPage} of {contactsMeta?.total_pages || 1})
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {!USE_INFINITE_CONTACTS_LIST && totalRecords >= 0 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalRecords={totalRecords}
                      pageSize={pageSize}
                      onPageChange={(page) => setCurrentPage(page)}
                      onPageSizeChange={handlePageSizeChange}
                      pageSizeOptions={[10, 20, 50, 100]}
                      showPageSizeSelector={true}
                      showGoToPage={true}
                    />
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

      {/* Export Confirmation Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-5/6 sm:w-3/6 md:w-2/6 lg:w-2/6 xl:w-1/4 shadow-xl rounded-lg bg-white transform transition-all">
            <div className="mt-2">
              {/* Download Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-indigo-100">
                  <FiDownload className="h-7 w-7 text-indigo-600" />
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Contacts</h3>
                <p className="text-sm text-gray-500 mb-1">You are about to export</p>
                <p className="text-xs text-gray-400 mb-6">The file will be downloaded as Excel format.</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={cancelExportContacts}
                  disabled={isExporting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExportContacts}
                  disabled={isExporting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FiDownload className="h-4 w-4" />
                      Download
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-5/6 sm:w-3/6 md:w-2/6 lg:w-2/6 xl:w-1/4 shadow-xl rounded-lg bg-white transform transition-all">
            <div className="mt-2">
              <div className="flex items-center justify-center mb-4">
                <div
                  className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full ${
                    bulkDeleteMode === 'all' ? 'bg-red-100' : 'bg-orange-100'
                  }`}
                >
                  <FiTrash2
                    className={`h-7 w-7 ${
                      bulkDeleteMode === 'all' ? 'text-red-600' : 'text-orange-600'
                    }`}
                  />
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {bulkDeleteMode === 'all' ? 'Delete All Contacts' : 'Delete Selected Contacts'}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {bulkDeleteMode === 'all'
                    ? 'This will delete ALL contacts from this project.'
                    : 'This will delete all selected contacts from this page.'}
                </p>
                <p className="text-xs text-gray-400 mb-4">This action cannot be undone.</p>

                {bulkDeleteMode === 'all' && (
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="font-semibold">all-delete</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={bulkDeletePhrase}
                      onChange={(e) => {
                        setBulkDeletePhrase(e.target.value);
                        if (bulkDeleteError) setBulkDeleteError('');
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        bulkDeleteError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                      placeholder="all-delete"
                      autoFocus
                    />
                    {bulkDeleteError && (
                      <p className="mt-1 text-sm text-red-600">{bulkDeleteError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
                  disabled={isBulkDeleting || (bulkDeleteMode === 'all' && bulkDeletePhrase.trim() !== 'all-delete')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                    bulkDeleteMode === 'all'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                  }`}
                >
                  {isBulkDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && contactToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-5/6 sm:w-3/6 md:w-2/6 lg:w-2/6 xl:w-1/4 shadow-xl rounded-lg bg-white transform transition-all">
            <div className="mt-2">
              {/* Warning Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100">
                  <FiTrash2 className="h-7 w-7 text-red-600" />
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Contact</h3>
                <p className="text-sm text-gray-500 mb-1">Are you sure you want to delete</p>
                <p className="text-base font-medium text-gray-800 mb-1">"{contactToDelete.name}"?</p>
                <p className="text-xs text-gray-400 mb-6">This action cannot be undone.</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={cancelDeleteContact}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteContact}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
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