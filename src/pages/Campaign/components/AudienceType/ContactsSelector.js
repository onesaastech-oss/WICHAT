import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Search, User } from 'lucide-react';
import axios from 'axios';
import { Encrypt } from '../../../encryption/payload-encryption';

export default function ContactsSelector({
  selectedContacts,
  setSelectedContacts,
  setSelectedContactDetails
}) {
  const [tokens, setTokens] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactsMap, setContactsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const projectId = tokens?.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c';

  const updateSelectedContactDetails = useCallback(
    (selectedIds, map) => {
      if (typeof setSelectedContactDetails === 'function') {
        const details = selectedIds
          .map(id => map[id])
          .filter(Boolean);
        setSelectedContactDetails(details);
      }
    },
    [setSelectedContactDetails]
  );

  // Load tokens from storage
  useEffect(() => {
    const loadTokens = () => {
      try {
        if (typeof window === 'undefined') return;
        const storages = [localStorage, sessionStorage];
        for (const storage of storages) {
          try {
            const userData = storage?.getItem('userData');
            if (userData) {
              const parsed = JSON.parse(userData);
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
      } catch (error) {
        console.error('Failed to load tokens:', error);
      }
    };

    loadTokens();

    const handleStorageChange = (event) => {
      if (event.key === 'userData') {
        loadTokens();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchContacts = useCallback(
    async (pageNo = 1, reset = false, query = '') => {
      if (!tokens?.token || !tokens?.username) return;
      try {
        setError(null);
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const payload = {
          project_id: projectId,
          page_no: pageNo,
          query: query
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

        const responseData = response?.data;
        if (responseData?.error) {
          throw new Error(responseData?.message || 'Failed to fetch contacts');
        }

        const fetched = Array.isArray(responseData?.data) ? responseData.data : [];

        setContacts(prev => {
          const combined = reset ? fetched : [...prev, ...fetched];
          const uniqueMap = new Map();
          combined.forEach(contact => {
            if (contact?.contact_id) {
              uniqueMap.set(contact.contact_id, contact);
            }
          });
          return Array.from(uniqueMap.values());
        });

        setContactsMap(prev => {
          const newMap = reset ? { ...prev } : { ...prev };
          fetched.forEach(contact => {
            if (contact?.contact_id) {
              newMap[contact.contact_id] = contact;
            }
          });
          updateSelectedContactDetails(selectedContacts, newMap);
          return newMap;
        });

        setHasMore(responseData?.is_last_page === false);
        setPage(responseData?.page_no || pageNo);
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
        if (reset) {
          setContacts([]);
        }
        setHasMore(false);
        setError(err?.message || 'Failed to load contacts');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [projectId, tokens, selectedContacts, updateSelectedContactDetails]
  );

  // Initial and search-driven fetch
  useEffect(() => {
    if (!tokens?.token || !tokens?.username) return;
    fetchContacts(1, true, debouncedSearch);
  }, [tokens, debouncedSearch, fetchContacts]);

  const handleToggleContact = useCallback((contactId) => {
    setSelectedContacts(prev => {
      const exists = prev.includes(contactId);
      const updated = exists ? prev.filter(id => id !== contactId) : [...prev, contactId];
      updateSelectedContactDetails(updated, contactsMap);
      return updated;
    });
  }, [contactsMap, setSelectedContacts, updateSelectedContactDetails]);

  const isAllSelected = useMemo(() => {
    if (!contacts.length) return false;
    return contacts.every(contact => selectedContacts.includes(contact.contact_id));
  }, [contacts, selectedContacts]);

  const handleSelectAll = useCallback(() => {
    if (!contacts.length) return;
    setSelectedContacts(prev => {
      let updated;
      if (isAllSelected) {
        const currentIds = new Set(contacts.map(contact => contact.contact_id));
        updated = prev.filter(id => !currentIds.has(id));
      } else {
        const union = new Set(prev);
        contacts.forEach(contact => {
          if (contact?.contact_id) {
            union.add(contact.contact_id);
          }
        });
        updated = Array.from(union);
      }
      updateSelectedContactDetails(updated, contactsMap);
      return updated;
    });
  }, [contacts, contactsMap, isAllSelected, setSelectedContacts, updateSelectedContactDetails]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchContacts(page + 1, false, debouncedSearch);
  };

  const isLoadingInitial = loading && contacts.length === 0;

  if (!tokens?.token || !tokens?.username) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
        Please sign in to load your contacts.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">
          Select Contacts ({selectedContacts.length} selected)
        </h3>
        <button
          onClick={handleSelectAll}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:text-gray-400"
          disabled={!contacts.length}
        >
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search contacts..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {isLoadingInitial && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      )}

      {!isLoadingInitial && contacts.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
          No contacts found. Adjust your search or add contacts first.
        </div>
      )}

      <div className="space-y-3">
        {contacts.map(contact => {
          const contactId = contact?.contact_id;
          if (!contactId) return null;
          const isSelected = selectedContacts.includes(contactId);
          return (
            <div
              key={contactId}
              onClick={() => handleToggleContact(contactId)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-indigo-500' : 'bg-gray-200'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {contact?.name || 'Unnamed contact'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {contact?.number || contact?.phone || 'No number'}
                    </div>
                  </div>
                </div>
                {contact?.assign_to_me && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex-shrink-0">
                    Assigned to me
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && contacts.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center gap-2"
            disabled={loadingMore}
          >
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}