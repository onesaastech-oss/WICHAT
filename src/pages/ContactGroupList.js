import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
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
  const [allContacts, setAllContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);
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

    const loadGroupContacts = async () => {
      try {
        setLoading(true);
        console.log('🌐 Loading group contacts from API...');

        const payload = {
          project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
          group_id: getGroupId(),
          last_id: 0
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
  }, [tokens?.token, tokens?.username, tokens?.projects]);

  // Load all contacts for adding to group
  const loadAllContacts = async () => {
    if (!tokens?.token || !tokens?.username) return;

    try {
      console.log('🌐 Loading all contacts for selection...');

      const payload = {
        project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
        page_no: 1,
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
        console.log(`📥 Received ${apiList.length} total contacts from API`);

        const mappedContacts = apiList.map(c => ({
          id: c.contact_id,
          name: c.name,
          mobile: c.number,
          firm_name: c.firm_name,
          website: c.website,
          remark: c.remark
        }));

        // Filter out contacts that are already in the group
        const groupContactIds = groupContacts.map(gc => gc.id);
        const availableContacts = mappedContacts.filter(c => !groupContactIds.includes(c.id));

        setAllContacts(availableContacts);
        console.log(`✅ Loaded ${availableContacts.length} available contacts`);
      } else {
        console.warn('⚠️ API returned error:', response?.data?.message);
        setAllContacts([]);
      }
    } catch (error) {
      console.error('❌ Error loading all contacts:', error);
      setAllContacts([]);
    }
  };

  // Handle add contact to group
  const handleAddContactToGroup = async (contactId) => {
    if (!tokens?.token || !tokens?.username) return;

    try {
      const payload = {
        project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
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
        // Refresh group contacts list
        const refreshPayload = {
          project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
          group_id: getGroupId(),
          last_id: 0
        };

        const { data: refreshData, key: refreshKey } = Encrypt(refreshPayload);
        const refresh_data_pass = JSON.stringify({ data: refreshData, key: refreshKey });

        const refreshResponse = await axios.post(
          'https://api.w1chat.com/contact/group-contact-list',
          refresh_data_pass,
          {
            headers: {
              'token': tokens.token,
              'username': tokens.username,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!refreshResponse?.data?.error) {
          const apiList = refreshResponse?.data?.data || [];
          const mappedContacts = apiList.map(c => ({
            id: c.contact_id,
            unique_id: c.unique_id,
            name: c.name,
            mobile: c.number,
            firm_name: c.firm_name,
            website: c.website,
            remark: c.remark,
            createdOn: c.create_date
          }));
          setGroupContacts(mappedContacts);
        }

        // Show success message
        const successMsg = response?.data?.msg || 'Contact added to group successfully';
        setSuccessMessage(successMsg);
        setShowSuccessModal(true);

        // Refresh available contacts
        loadAllContacts();
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
      const payload = {
        project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
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

        // Refresh group contacts list
        const refreshPayload = {
          project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
          group_id: getGroupId(),
          last_id: 0
        };

        const { data: refreshData, key: refreshKey } = Encrypt(refreshPayload);
        const refresh_data_pass = JSON.stringify({ data: refreshData, key: refreshKey });

        const refreshResponse = await axios.post(
          'https://api.w1chat.com/contact/group-contact-list',
          refresh_data_pass,
          {
            headers: {
              'token': tokens.token,
              'username': tokens.username,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!refreshResponse?.data?.error) {
          const apiList = refreshResponse?.data?.data || [];
          const mappedContacts = apiList.map(c => ({
            id: c.contact_id,
            unique_id: c.unique_id,
            name: c.name,
            mobile: c.number,
            firm_name: c.firm_name,
            website: c.website,
            remark: c.remark,
            createdOn: c.create_date
          }));
          setGroupContacts(mappedContacts);
        }

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

  // Filter group contacts based on search
  const filteredGroupContacts = groupContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.mobile.includes(searchTerm) ||
    (contact.firm_name && contact.firm_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter available contacts for adding
  const filteredAvailableContacts = allContacts.filter(contact =>
    contact.name.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
    contact.mobile.includes(addSearchTerm) ||
    (contact.firm_name && contact.firm_name.toLowerCase().includes(addSearchTerm.toLowerCase()))
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
                  Manage contacts in this group ({filteredGroupContacts.length} contacts)
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                <button
                  onClick={() => {
                    setShowAddModal(true);
                    loadAllContacts();
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-5/6 sm:w-4/6 md:w-3/6 lg:w-2/6 xl:w-2/6 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Contact to Group</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddSearchTerm('');
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

              {/* Available contacts list */}
              <div className="max-h-96 overflow-y-auto">
                {filteredAvailableContacts.length === 0 ? (
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
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddSearchTerm('');
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