import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { Link } from 'react-router-dom'
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';
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
  FiEdit,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiFacebook,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';

function Template() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [lastId, setLastId] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [tokens, setTokens] = useState(null);

  // Get user tokens from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedData = JSON.parse(userData);
      setTokens(parsedData);
    }
  }, []);

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

  // Fetch templates from API
  const fetchTemplates = async (resetData = false) => {
    if (!tokens?.token || !tokens?.username) return;

    setLoading(true);
    try {
      const payload = {
        project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
        status: statusFilter,
        last_id: resetData ? 0 : lastId
      };

      const { data, key } = Encrypt(payload);
      const data_pass = JSON.stringify({ data, key });

      const response = await axios.post(
        'https://api.w1chat.com/template/template-list',
        data_pass,
        {
          headers: {
            'token': tokens.token,
            'username': tokens.username,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response?.data?.error && response?.data?.data) {
        const apiTemplates = response.data.data.map(template => ({
          id: template.template_id,
          name: template.template_name,
          language: template.template?.language?.toUpperCase() || 'EN',
          category: template.category,
          status: template.status,
          updatedOn: new Date(template.create_date).toLocaleDateString(),
          waba_template_id: template.waba_template_id,
          reject_reason: template.reject_reason,
          template_data: template.template
        }));

        if (resetData) {
          setTemplates(apiTemplates);
          setCurrentPage(1);
        } else {
          setTemplates(prev => [...prev, ...apiTemplates]);
        }

        // Store templates data in localStorage for edit functionality
        const currentTemplates = resetData ? apiTemplates : [...templates, ...apiTemplates];
        localStorage.setItem('templatesData', JSON.stringify(currentTemplates));

        setLastId(response.data.last_id);
        setHasMore(response.data.has_more);
      } else {
        console.error('API Error:', response?.data?.message);
        if (resetData) {
          setTemplates([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      if (resetData) {
        setTemplates([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when tokens are available
  useEffect(() => {
    if (tokens) {
      fetchTemplates(true);
    }
  }, [tokens]);

  // Refetch when status filter changes
  useEffect(() => {
    if (tokens) {
      setLastId(0);
      fetchTemplates(true);
    }
  }, [statusFilter]);

  // Get current templates for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTemplates = templates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(templates.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* Main content */}
      <div className="pt-16 md:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {/* Page header */}
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Template Management
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <button
                onClick={() => {
                  setLastId(0);
                  fetchTemplates(true);
                }}
                disabled={loading}
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
               to={'../template-add'}
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiPlus className="mr-2" />
                Add Template
              </Link>
            </div>
          </div>

          {/* Templates table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Language
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated On
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
                          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse ml-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : templates.length === 0 ? (
                    // Empty state
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <FiFacebook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                          <p className="text-sm">
                            {statusFilter ? `No templates with status "${statusFilter}" found.` : 'No templates available. Create your first template to get started.'}
                          </p>
                          {!statusFilter && (
                            <Link
                              to="../template-add"
                              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              <FiPlus className="mr-2" />
                              Add Template
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // Actual data rows
                    currentTemplates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{template.language}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{template.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${template.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                              template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {template.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {template.updatedOn}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-4">
                            {/* <button className="text-indigo-600 hover:text-indigo-900">
                              <FiDownload size={18} />
                            </button> */}
                            <Link 
                              to={`/template-edit/${template.id}`}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit Template"
                            >
                              <FiEdit size={18} />
                            </Link>
                            <button className="text-red-600 hover:text-red-900">
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

            {/* Load More / Pagination */}
            {!loading && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, templates.length)}
                      </span>{' '}
                      of <span className="font-medium">{templates.length}</span> results
                      {hasMore && <span className="text-indigo-600"> (more available)</span>}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {/* Traditional pagination for current loaded data */}
                    {totalPages > 1 && (
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px mr-4" aria-label="Pagination">
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
                    )}
                    
                    {/* Load More button */}
                    {hasMore && (
                      <button
                        onClick={() => fetchTemplates(false)}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <FiPlus className="mr-2" />
                            Load More
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Template;