import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header, Sidebar } from '../component/Menu';
import Tooltip from '../component/Tooltip';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiAlertCircle, FiMoreVertical } from 'react-icons/fi';

function Template() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastId, setLastId] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [tokens, setTokens] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const observerTarget = useRef(null);
  const abortControllerRef = useRef(null);

  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebarMinimized');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) setTokens(JSON.parse(userData));
  }, []);

  const fetchTemplates = useCallback(async (isInitial = false) => {
    if (!tokens?.token || !tokens?.username) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    if (isInitial) {
      setLoading(true);
      setLastId(0);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const selectedProjectId = tokens.selected_project_id || tokens.projects?.[0]?.project_id;
      const payload = {
        project_id: selectedProjectId,
        status: statusFilter,
        last_id: isInitial ? 0 : lastId
      };

      const { data, key } = Encrypt(payload);
      const response = await axios.post(
        'https://api.w1chat.com/template/template-list',
        JSON.stringify({ data, key }),
        {
          headers: {
            'token': tokens.token,
            'username': tokens.username,
            'Content-Type': 'application/json'
          },
          signal: abortControllerRef.current.signal
        }
      );

      if (!response?.data?.error && response?.data?.data) {
        const apiTemplates = response.data.data.map(t => ({
          id: t.template_id,
          name: t.template_name,
          language: t.template?.language?.toUpperCase() || 'EN',
          category: t.category,
          status: t.status,
          rejectReason: t.reject_reason || null,
          updatedOn: new Date(t.create_date).toLocaleDateString(),
          template_data: t.template
        }));

        setTemplates(prev => isInitial ? apiTemplates : [...prev, ...apiTemplates]);
        setLastId(response.data.last_id);
        setHasMore(response.data.has_more);
      }
    } catch (error) {
      if (axios.isCancel(error)) return;
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [tokens, statusFilter, lastId]);

  useEffect(() => {
    fetchTemplates(true);
    return () => abortControllerRef.current?.abort();
  }, [statusFilter, tokens?.token]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isLoadingMore) {
          fetchTemplates(false);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px'
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    
    return () => currentTarget && observer.unobserve(currentTarget);
  }, [hasMore, loading, isLoadingMore, fetchTemplates]);

  const getStatusStyle = (status) => {
    const styles = {
      APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm',
      PENDING: 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm',
      REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'APPROVED':
        return (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'PENDING':
        return (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'REJECTED':
        return (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      // Add delete logic here
      console.log('Delete template:', id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
        isMinimized={isMinimized} 
        setIsMinimized={setIsMinimized} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen} 
          isMinimized={isMinimized} 
          setIsMinimized={setIsMinimized} 
        />

        <main className={`flex-1 transition-all duration-300 ease-in-out pt-16 overflow-y-auto ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Templates</h1>
              
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 sm:flex-initial rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                >
                  <option value="">All Status</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <button
                  onClick={() => fetchTemplates(true)}
                  className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-gray-200 hover:border-indigo-200"
                  disabled={loading}
                  title="Refresh"
                >
                  <FiRefreshCw className={`${loading ? 'animate-spin' : ''} w-4 h-4`} />
                </button>

                <Link
                  to="/template-add"
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-sm hover:shadow-md"
                >
                  <FiPlus className="mr-2 w-4 h-4" /> 
                  <span className="hidden sm:inline">New Template</span>
                  <span className="sm:hidden">New</span>
                </Link>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['S.No', 'Name', 'Language', 'Category', 'Status', 'Updated', 'Actions'].map((header) => (
                        <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading && templates.length === 0 ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {[...Array(7)].map((_, j) => (
                            <td key={j} className="px-6 py-4">
                              <div className="h-4 bg-gray-100 rounded"></div>
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      templates.map((template, index) => (
                        <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-gray-900">{template.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 font-medium">{template.language}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 capitalize">{template.category}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusStyle(template.status)}`}>
                                {getStatusIcon(template.status)}
                                {template.status}
                              </span>
                              {template.status === 'REJECTED' && template.rejectReason && (
                                <Tooltip
                                  content={`Reason: ${template.rejectReason}`}
                                  disabled={true}
                                  position="top"
                                >
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 transition-all"
                                  >
                                    <FiAlertCircle className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{template.updatedOn}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <Link 
                                to={`/template-edit/${template.id}`} 
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FiEdit size={18} />
                              </Link>
                              <button 
                                onClick={() => handleDelete(template.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
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
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {loading && templates.length === 0 ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
                    <div className="h-5 bg-gray-100 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  </div>
                ))
              ) : (
                templates.map((template, index) => (
                  <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
                            {template.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-medium">{template.language}</span>
                            <span>•</span>
                            <span className="capitalize">{template.category}</span>
                          </div>
                        </div>
                        <div className="relative ml-2">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === template.id ? null : template.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <FiMoreVertical size={18} />
                          </button>
                          
                          {activeDropdown === template.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <Link
                                to={`/template-edit/${template.id}`}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <FiEdit size={16} />
                                Edit
                              </Link>
                              <button
                                onClick={() => {
                                  handleDelete(template.id);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <FiTrash2 size={16} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status & Date */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusStyle(template.status)}`}>
                            {getStatusIcon(template.status)}
                            {template.status}
                          </span>
                          {template.status === 'REJECTED' && template.rejectReason && (
                            <Tooltip
                              content={`Reason: ${template.rejectReason}`}
                              disabled={true}
                              position="top"
                            >
                              <button
                                type="button"
                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-100 text-rose-600"
                              >
                                <FiAlertCircle className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{template.updatedOn}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Infinite Scroll Sentinel */}
            <div ref={observerTarget} className="w-full py-8 flex items-center justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  Loading more...
                </div>
              )}
              {!hasMore && templates.length > 0 && (
                <span className="text-gray-400 text-sm italic">You've reached the end</span>
              )}
              {!loading && templates.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">No templates found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Template;