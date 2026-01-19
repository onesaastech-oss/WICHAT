import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Header, Sidebar } from '../component/Menu';
import Pagination from '../component/Pagination';
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';
import {
  FiPlus,
  FiTrash2,
  FiX,
  FiUser,
  FiPhone,
  FiMail,
  FiSearch,
  FiCheckCircle,
  FiArrowLeft,
  FiUsers
} from 'react-icons/fi';

function ContactGroupList() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [groupContacts, setGroupContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20); // Default 20 items per page
  const [reloadTick, setReloadTick] = useState(0);
  const [contactsMeta, setContactsMeta] = useState({
    page_no: 1,
    limit: 20,
    total_records: 0,
    total_pages: 1,
    has_more: false
  });
  const [totalContacts, setTotalContacts] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removingContact, setRemovingContact] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [groupInfo, setGroupInfo] = useState(null);

  // Add-contact modal (infinite scroll) state
  const ADD_CONTACTS_PAGE_SIZE = 20;
  const ADD_CONTACT_ITEM_HEIGHT = 62; // Approximate height of each contact row in pixels (p-3 + content + gap)
  const [addContacts, setAddContacts] = useState([]);
  const [addContactsMeta, setAddContactsMeta] = useState({
    page_no: 1,
    limit: ADD_CONTACTS_PAGE_SIZE,
    total_records: 0,
    total_pages: 1,
    has_more: false
  });
  const [addContactsPageNo, setAddContactsPageNo] = useState(1);
  const [addContactsLoading, setAddContactsLoading] = useState(false);
  const addContactsReqIdRef = useRef(0);
  const addContactsLoadingRef = useRef(false);
  const addContactsLastRequestedPageRef = useRef(0);
  const addModalHasUserScrolledRef = useRef(false);
  const addModalIgnoreNextSearchEffectRef = useRef(false);
  const [addModalGroupContactIds, setAddModalGroupContactIds] = useState([]);
  const [addModalGroupIdsLoading, setAddModalGroupIdsLoading] = useState(false);
  const addModalGroupIdsReqIdRef = useRef(0);
  const addModalGroupContactIdsSet = useMemo(
    () => new Set(addModalGroupContactIds),
    [addModalGroupContactIds]
  );

  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebarMinimized');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  // Get group_id and group_name from URL params
  const getGroupId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('group_id') || 'dryn4237yjlh8dst5rmd5jg7pafudt1762755078808'; // fallback for testing
  };

  const getGroupName = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('group_name') || 'Group';
  };

  // Load auth tokens
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const sessionData = localStorage.getItem('userData');
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed && typeof parsed === 'object') {
            setTokens(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load tokens:', e);
      }
    };

    loadTokens();
  }, []);

  // Load group contacts from API
  useEffect(() => {
    if (!tokens?.token || !tokens?.username) return;

    const projectId = tokens.selected_project_id || tokens.projects?.[0]?.project_id || '';

    const loadGroupContacts = async (requestedPageNo = pageNo) => {
      try {
        setLoading(true);
        console.log('🌐 Loading group contacts from API...');

        const payload = {
          project_id: projectId,
          group_id: getGroupId(),
          page_no: requestedPageNo,
          limit: pageSize
        };

        const { data, key } = Encrypt(payload);
        const data_pass = JSON.stringify({ data, key });

        const response = await axios.post(
          'https://api.w1chat.com/contact/group-contact-list',
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
          const meta = response?.data?.meta || null;
          const totalCount = meta?.total_records ?? response?.data?.count ?? apiList.length ?? 0;
          console.log(`📥 Received ${apiList.length} group contacts from API`);

          const mappedContacts = apiList.map(c => ({
            id: c.contact_id,
            unique_id: c.unique_id, // Important for deletion
            name: c.name,
            mobile: c.number,
            firm_name: c.firm_name,
            website: c.website,
            remark: c.remark,
            createdOn: c.create_date
          }));

          setGroupContacts(mappedContacts);
          setTotalContacts(totalCount);
          if (meta) {
            setContactsMeta(prev => ({
              page_no: meta?.page_no ?? requestedPageNo,
              limit: meta?.limit ?? prev?.limit ?? 20,
              total_records: meta?.total_records ?? totalCount,
              total_pages: meta?.total_pages ?? prev?.total_pages ?? 1,
              has_more: meta?.has_more ?? false
            }));
          } else {
            setContactsMeta(prev => ({
              ...prev,
              page_no: requestedPageNo,
              total_records: totalCount
            }));
          }
          
          // Set group info if available
          if (apiList.length > 0 && apiList[0].group_name) {
            setGroupInfo({
              name: apiList[0].group_name,
              id: getGroupId()
            });
          }

          console.log(`✅ Loaded ${mappedContacts.length} group contacts`);
        } else {
          console.warn('⚠️ API returned error:', response?.data?.message);
          setGroupContacts([]);
        }
      } catch (error) {
        console.error('❌ Error loading group contacts:', error);
        setGroupContacts([]);
      } finally {
        setLoading(false);
        setSelectedContacts([]);
        setIsAllSelected(false);
      }
    };

    loadGroupContacts();
  }, [tokens?.token, tokens?.username, tokens?.selected_project_id, tokens?.projects, pageNo, pageSize, reloadTick]);

  const loadAddContactsPage = useCallback(
    async ({ requestedPageNo, query, append }) => {
      if (!tokens?.token || !tokens?.username) return;
      // Strict guard to prevent concurrent loads (state can lag behind)
      if (addContactsLoadingRef.current) return;

      const projectId =
        tokens.selected_project_id || tokens.projects?.[0]?.project_id || '';

      const reqId = ++addContactsReqIdRef.current;
      try {
        addContactsLoadingRef.current = true;
        setAddContactsLoading(true);
        console.log('🌐 Loading contacts for add-to-group modal...', {
          requestedPageNo,
          query,
          append
        });

        const payload = {
          project_id: projectId,
          page_no: requestedPageNo,
          limit: ADD_CONTACTS_PAGE_SIZE,
          query: query || ''
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

        // If a newer request started, ignore this result (prevents race on fast typing)
        if (reqId !== addContactsReqIdRef.current) return;

        if (!response?.data?.error) {
          const apiList = response?.data?.data || [];
          const meta = response?.data?.meta || null;

          const mappedContacts = apiList.map((c) => ({
            id: c.contact_id,
            name: c.name,
            mobile: c.number,
            firm_name: c.firm_name,
            website: c.website,
            remark: c.remark
          }));

          // Deduplicate by contact_id while appending
          setAddContacts((prev) => {
            const next = append ? [...prev, ...mappedContacts] : mappedContacts;
            const seen = new Set();
            return next.filter((c) => {
              if (!c?.id) return false;
              if (seen.has(c.id)) return false;
              seen.add(c.id);
              return true;
            });
          });

          const fallbackTotalRecords =
            meta?.total_records ??
            response?.data?.count ??
            (append ? undefined : mappedContacts.length);

          const totalPagesFallback =
            meta?.total_pages ??
            (typeof fallbackTotalRecords === 'number'
              ? Math.max(1, Math.ceil(fallbackTotalRecords / ADD_CONTACTS_PAGE_SIZE))
              : 1);

          const hasMoreFallback =
            meta?.has_more ??
            (meta?.page_no
              ? meta.page_no < (meta.total_pages || totalPagesFallback)
              : requestedPageNo < totalPagesFallback);

          setAddContactsMeta({
            page_no: meta?.page_no ?? requestedPageNo,
            limit: meta?.limit ?? ADD_CONTACTS_PAGE_SIZE,
            total_records: meta?.total_records ?? (fallbackTotalRecords || 0),
            total_pages: totalPagesFallback,
            has_more: hasMoreFallback
          });
          setAddContactsPageNo(meta?.page_no ?? requestedPageNo);
        } else {
          console.warn('⚠️ contact-list API returned error:', response?.data?.message);
          if (!append) {
            setAddContacts([]);
            setAddContactsMeta({
              page_no: 1,
              limit: ADD_CONTACTS_PAGE_SIZE,
              total_records: 0,
              total_pages: 1,
              has_more: false
            });
            setAddContactsPageNo(1);
          }
        }
      } catch (error) {
        console.error('❌ Error loading contacts for add modal:', error);
        if (!append) {
          setAddContacts([]);
          setAddContactsMeta({
            page_no: 1,
            limit: ADD_CONTACTS_PAGE_SIZE,
            total_records: 0,
            total_pages: 1,
            has_more: false
          });
          setAddContactsPageNo(1);
        }
      } finally {
        // Only clear loading if this request is still the latest
        if (reqId === addContactsReqIdRef.current) {
          setAddContactsLoading(false);
          addContactsLoadingRef.current = false;
        }
      }
    },
    [tokens?.token, tokens?.username, tokens?.selected_project_id, tokens?.projects]
  );

  const resetAndLoadAddContacts = useCallback(
    async (query) => {
      addContactsReqIdRef.current += 1; // invalidate any in-flight request
      addContactsLoadingRef.current = false;
      addContactsLastRequestedPageRef.current = 1;
      setAddContacts([]);
      setAddContactsMeta({
        page_no: 1,
        limit: ADD_CONTACTS_PAGE_SIZE,
        total_records: 0,
        total_pages: 1,
        has_more: false
      });
      setAddContactsPageNo(1);
      await loadAddContactsPage({ requestedPageNo: 1, query, append: false });
    },
    [loadAddContactsPage]
  );

  const handleAddContactsScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      if (!el) return;
      // Don't allow paging until group membership ids are loaded (prevents scroll "jump" from late filtering)
      if (addModalGroupIdsLoading) return;
      // Only start infinite-load after the user has actually scrolled
      if (el.scrollTop > 0) addModalHasUserScrolledRef.current = true;
      if (!addModalHasUserScrolledRef.current) return;

      // Avoid autoload loops when list doesn't overflow yet
      const scrollable = el.scrollHeight > el.clientHeight + 8;
      if (!scrollable) return;

      // Calculate loaded content height (excluding spacer)
      let loadedItemCount = 0;
      for (const c of addContacts) {
        if (!c?.id) continue;
        if (addModalGroupContactIdsSet.has(c.id)) continue;
        loadedItemCount += 1;
      }
      const loadedContentHeight = loadedItemCount * ADD_CONTACT_ITEM_HEIGHT;
      
      // How far user has scrolled
      const scrolledTo = el.scrollTop + el.clientHeight;
      
      // Trigger when near bottom of LOADED content (not spacer)
      const nearBottomOfLoaded = scrolledTo >= (loadedContentHeight - 150);

      if (!nearBottomOfLoaded) return;
      if (addContactsLoadingRef.current) return;
      if (!addContactsMeta?.has_more) return;

      const nextPage = (addContactsPageNo || 1) + 1;
      if (nextPage <= addContactsLastRequestedPageRef.current) return;
      addContactsLastRequestedPageRef.current = nextPage;

      loadAddContactsPage({
        requestedPageNo: nextPage,
        query: addSearchTerm,
        append: true
      });
    },
    [addModalGroupIdsLoading, addContactsMeta?.has_more, addContactsPageNo, addSearchTerm, loadAddContactsPage, addContacts, addModalGroupContactIdsSet]
  );

  const loadAllGroupContactIdsForAddModal = useCallback(async () => {
    if (!tokens?.token || !tokens?.username) return;

    const projectId =
      tokens.selected_project_id || tokens.projects?.[0]?.project_id || '';
    const groupId = getGroupId();

    const reqId = ++addModalGroupIdsReqIdRef.current;

    try {
      setAddModalGroupIdsLoading(true);
      console.log('🌐 Loading ALL group contact ids for add modal...', {
        groupId
      });

      let page = 1;
      let hasMore = true;
      const ids = [];

      // Safety cap so we don't loop forever if API meta is bad
      for (let i = 0; i < 500 && hasMore; i += 1) {
        const payload = {
          project_id: projectId,
          group_id: groupId,
          page_no: page,
          limit: 200
        };

        const { data, key } = Encrypt(payload);
        const data_pass = JSON.stringify({ data, key });

        const response = await axios.post(
          'https://api.w1chat.com/contact/group-contact-list',
          data_pass,
          {
            headers: {
              token: tokens.token,
              username: tokens.username,
              'Content-Type': 'application/json'
            }
          }
        );

        if (reqId !== addModalGroupIdsReqIdRef.current) return;

        if (response?.data?.error) {
          console.warn(
            '⚠️ group-contact-list API returned error:',
            response?.data?.message
          );
          break;
        }

        const list = response?.data?.data || [];
        const meta = response?.data?.meta || null;

        for (const row of list) {
          if (row?.contact_id) ids.push(row.contact_id);
        }

        const metaPage = meta?.page_no ?? page;
        const metaTotalPages = meta?.total_pages ?? null;

        hasMore =
          meta?.has_more ??
          (typeof metaTotalPages === 'number' ? metaPage < metaTotalPages : false);

        page = metaPage + 1;
      }

      if (reqId !== addModalGroupIdsReqIdRef.current) return;

      setAddModalGroupContactIds(Array.from(new Set(ids)));
    } catch (e) {
      console.error('❌ Failed to load group contact ids for add modal:', e);
      if (reqId === addModalGroupIdsReqIdRef.current) {
        setAddModalGroupContactIds([]);
      }
    } finally {
      if (reqId === addModalGroupIdsReqIdRef.current) {
        setAddModalGroupIdsLoading(false);
      }
    }
  }, [tokens?.token, tokens?.username, tokens?.selected_project_id, tokens?.projects]);

  // When the add modal opens, load initial page
  useEffect(() => {
    if (!showAddModal) return;
    addModalHasUserScrolledRef.current = false;
    addContactsLastRequestedPageRef.current = 1;
    addModalIgnoreNextSearchEffectRef.current = true; // prevent duplicate initial fetch from search effect
    // Important: load group membership ids FIRST, then load contacts.
    // Otherwise when the ids request finishes later, it re-filters the list and can "jump" scroll position.
    (async () => {
      try {
        await loadAllGroupContactIdsForAddModal();
      } finally {
        await resetAndLoadAddContacts(addSearchTerm);
      }
    })();
  }, [showAddModal]); // intentionally only on open/close

  // Debounced server-side search inside add modal
  useEffect(() => {
    if (!showAddModal) return;
    if (addModalIgnoreNextSearchEffectRef.current) {
      addModalIgnoreNextSearchEffectRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      addModalHasUserScrolledRef.current = false;
      addContactsLastRequestedPageRef.current = 1;
      resetAndLoadAddContacts(addSearchTerm);
    }, 350);
    return () => clearTimeout(t);
  }, [addSearchTerm, showAddModal, resetAndLoadAddContacts]);

  // Handle add contact to group
  const handleAddContactToGroup = async (contactId) => {
    if (!tokens?.token || !tokens?.username) return;

    try {
      const projectId = tokens.selected_project_id || tokens.projects?.[0]?.project_id || '';
      const payload = {
        project_id: projectId,
        group_id: getGroupId(),
        contact_id: contactId
      };

      console.log('📤 Adding contact to group:', payload);

      const { data, key } = Encrypt(payload);
      const data_pass = JSON.stringify({ data, key });

      const response = await axios.post(
        'https://api.w1chat.com/contact/group-contact-add',
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
        setPageNo(1);
        setReloadTick(t => t + 1);

        // Show success message
        const successMsg = response?.data?.msg || 'Contact added to group successfully';
        setSuccessMessage(successMsg);
        setShowSuccessModal(true);

        // Remove from modal list immediately (so user can't add it twice)
        setAddContacts((prev) => prev.filter((c) => c.id !== contactId));
        setAddModalGroupContactIds((prev) =>
          prev.includes(contactId) ? prev : [...prev, contactId]
        );
      } else {
        alert('Failed to add contact to group: ' + (response?.data?.message || response?.data?.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to add contact to group:', error);
      alert('Failed to add contact to group. Please try again.');
    }
  };

  // Handle remove contact from group
  const handleRemoveContactFromGroup = async () => {
    if (!tokens?.token || !tokens?.username || !removingContact?.unique_id) return;

    try {
      const projectId = tokens.selected_project_id || tokens.projects?.[0]?.project_id || '';
      const payload = {
        project_id: projectId,
        unique_id: removingContact.unique_id
      };

      console.log('📤 Removing contact from group:', payload);

      const { data, key } = Encrypt(payload);
      const data_pass = JSON.stringify({ data, key });

      const response = await axios.post(
        'https://api.w1chat.com/contact/group-contact-delete',
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
        // Close modal
        setShowRemoveModal(false);
        setRemovingContact(null);

        setPageNo(1);
        setReloadTick(t => t + 1);

        // Show success message
        const successMsg = response?.data?.msg || 'Contact removed from group successfully';
        setSuccessMessage(successMsg);
        setShowSuccessModal(true);
      } else {
        alert('Failed to remove contact from group: ' + (response?.data?.message || response?.data?.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to remove contact from group:', error);
      alert('Failed to remove contact from group. Please try again.');
    }
  };

  // Handle opening remove modal
  const handleOpenRemoveModal = (contact) => {
    setRemovingContact(contact);
    setShowRemoveModal(true);
  };

  // Handle select all contacts
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedContacts([]);
      setIsAllSelected(false);
    } else {
      setSelectedContacts(filteredGroupContacts.map(c => c.id));
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
      setIsAllSelected(newSelected.length === filteredGroupContacts.length);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPageNo(1); // Reset to first page when changing page size
    setContactsMeta(prev => ({
      ...prev,
      limit: newPageSize
    }));
  };

  // Filter group contacts based on search
  const filteredGroupContacts = groupContacts.filter(contact =>
    (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.mobile && contact.mobile.includes(searchTerm)) ||
    (contact.firm_name && contact.firm_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter available contacts for adding
  const filteredAvailableContacts = addContacts.filter(
    (contact) => !addModalGroupContactIdsSet.has(contact.id)
  );

  // Calculate spacer height for accurate scrollbar
  // Total available = total_records from API - contacts already in group
  // Remaining unloaded = total available - currently loaded (filtered)
  const totalFromApi = addContactsMeta.total_records || 0;
  const inGroupCount = addModalGroupContactIds.length;
  const totalAvailable = Math.max(0, totalFromApi - inGroupCount);
  const loadedCount = filteredAvailableContacts.length;
  const remainingCount = Math.max(0, totalAvailable - loadedCount);
  const addContactsSpacerHeight = remainingCount * ADD_CONTACT_ITEM_HEIGHT;

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

      <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
        <div className="p-4 sm:p-6 md:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => window.history.back()}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Go back"
                  >
                    <FiArrowLeft className="h-5 w-5" />
                  </button>
                  <FiUsers className="h-6 w-6 text-indigo-600" />
                  <h1 className="text-base font-bold text-gray-900">
                    {getGroupName()} - Contacts
                  </h1>
                </div>
                <p className="text-gray-600 text-sm ml-12">
                  Manage contacts in this group ({filteredGroupContacts.length} of {totalContacts} contacts)
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                <button
                  onClick={() => {
                    setShowAddModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiPlus className="mr-2 h-4 w-4" />
                  Add Contact
                </button>
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
          </div>

          {/* Group Contacts Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-gray-600">Loading group contacts...</span>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mobile
                          </th>

                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredGroupContacts.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                              {searchTerm 
                                ? 'No contacts found matching your search.'
                                : 'No contacts in this group yet. Add some contacts to get started.'
                              }
                            </td>
                          </tr>
                        ) : (
                          filteredGroupContacts.map((contact) => (
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
                                <div className="flex items-center">
                                  <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                                  {contact.mobile}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleOpenRemoveModal(contact)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Remove from group"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={contactsMeta.page_no}
                    totalPages={contactsMeta.total_pages}
                    totalRecords={totalContacts}
                    pageSize={pageSize}
                    onPageChange={(page) => setPageNo(page)}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[10, 20, 50, 100]}
                    showPageSizeSelector={true}
                    showGoToPage={true}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-hidden z-50 flex items-start justify-center">
          <div className="mt-20 mx-auto p-5 border w-5/6 sm:w-4/6 md:w-3/6 lg:w-2/6 xl:w-2/6 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Contact to Group</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddSearchTerm('');
                    setAddContacts([]);
                    setAddContactsMeta({
                      page_no: 1,
                      limit: ADD_CONTACTS_PAGE_SIZE,
                      total_records: 0,
                      total_pages: 1,
                      has_more: false
                    });
                    setAddContactsPageNo(1);
                    addModalGroupIdsReqIdRef.current += 1;
                    setAddModalGroupContactIds([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              {/* Search for contacts */}
              <div className="mb-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search contacts to add..."
                    value={addSearchTerm}
                    onChange={(e) => setAddSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Available contacts list - fixed height container for stable scrollbar */}
              <div 
                className="relative max-h-96 min-h-96 overflow-y-auto overscroll-contain"
                onScroll={handleAddContactsScroll}
              >
                {/* Show full loading spinner ONLY when list is empty (initial load) */}
                {(addContactsLoading && addContacts.length === 0) ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600 text-sm">Loading contacts...</span>
                  </div>
                ) : filteredAvailableContacts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {addSearchTerm 
                      ? 'No contacts found matching your search.'
                      : 'No available contacts to add. All contacts are already in this group.'
                    }
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <FiUser className="h-4 w-4 text-indigo-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contact.mobile}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddContactToGroup(contact.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <FiPlus className="h-3 w-3 mr-1" />
                          Add
                        </button>
                      </div>
                    ))}

                    {/* Show "Loading more..." when we already have items and are fetching more */}
                    {(addContactsLoading && addContacts.length > 0) && (
                      <div className="flex justify-center items-center py-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-gray-600 text-xs">Loading more...</span>
                      </div>
                    )}

                    {/* Spacer for unloaded items - makes scrollbar accurate and stable */}
                    {addContactsSpacerHeight > 0 && (
                      <div 
                        style={{ height: addContactsSpacerHeight, minHeight: addContactsSpacerHeight }}
                        className="flex-shrink-0 pointer-events-none"
                        aria-hidden="true"
                      />
                    )}

                    {(!addContactsLoading && !addContactsMeta?.has_more && addContactsSpacerHeight === 0) && (
                      <div className="text-center py-3 text-xs text-gray-400">
                        End of contacts
                      </div>
                    )}
                  </div>
                )}

                {/* Non-janky overlay while we fetch full group membership for filtering */}
                {addModalGroupIdsLoading && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      <span className="ml-2 text-gray-700 text-sm">Preparing list...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddSearchTerm('');
                    setAddContacts([]);
                    setAddContactsMeta({
                      page_no: 1,
                      limit: ADD_CONTACTS_PAGE_SIZE,
                      total_records: 0,
                      total_pages: 1,
                      has_more: false
                    });
                    setAddContactsPageNo(1);
                    addModalGroupIdsReqIdRef.current += 1;
                    setAddModalGroupContactIds([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Contact Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-5/6 sm:w-3/6 md:w-2/6 lg:w-2/6 xl:w-1/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <FiTrash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Remove Contact</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to remove "{removingContact?.name}" from this group? 
                  The contact will remain in your contact list but will be removed from this group.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowRemoveModal(false);
                      setRemovingContact(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemoveContactFromGroup}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Remove
                  </button>
                </div>
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

export default ContactGroupList;