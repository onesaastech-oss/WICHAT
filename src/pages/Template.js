import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Header, Sidebar } from '../component/Menu';
import Tooltip from '../component/Tooltip';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';
import { FiPlus, FiEdit, FiTrash2, FiFacebook, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

function Template() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastId, setLastId] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [tokens, setTokens] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef(null);
  
  // AbortController to prevent race conditions
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

  // Optimized Fetcher
  const fetchTemplates = useCallback(async (isInitial = false) => {
    if (!tokens?.token || !tokens?.username) return;

    // Cancel previous request if still pending
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

  // Combined Effect for Initial Load & Filter Changes
  useEffect(() => {
    fetchTemplates(true);
    return () => abortControllerRef.current?.abort();
  }, [statusFilter, tokens?.token]); // Only refetch when status or auth changes

  // Smoother Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isLoadingMore) {
          fetchTemplates(false);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // Fetch 200px before reaching the bottom for "infinite" feel
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    
    return () => currentTarget && observer.unobserve(currentTarget);
  }, [hasMore, loading, isLoadingMore, fetchTemplates]);

  // UI Helper for Status Badges
  const getStatusStyle = (status) => {
    const styles = {
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
        isMinimized={isMinimized} 
        setIsMinimized={setIsMinimized} 
      />
      
      <div className="flex flex-1">
        <Sidebar 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen} 
          isMinimized={isMinimized} 
          setIsMinimized={setIsMinimized} 
        />

        <main className={`flex-1 transition-all duration-300 ease-in-out pt-16 ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
              
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <button
                  onClick={() => fetchTemplates(true)}
                  className="p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                  disabled={loading}
                >
                  <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
                </button>

                <Link
                  to="/template-add"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <FiPlus className="mr-2" /> New Template
                </Link>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Language', 'Category', 'Status', 'Updated', ''].map((header) => (
                        <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading && templates.length === 0 ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {[...Array(6)].map((_, j) => (
                            <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded"></div></td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      templates.map((template) => (
                        <tr key={template.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">{template.name}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{template.language}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{template.category}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(template.status)}`}>
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
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                  >
                                    <FiAlertCircle className="w-3 h-3" />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{template.updatedOn}</td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link to={`/template-edit/${template.id}`} className="text-indigo-600 hover:text-indigo-900"><FiEdit size={16} /></Link>
                              <button className="text-red-500 hover:text-red-700"><FiTrash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Infinite Scroll Sentinel */}
              <div ref={observerTarget} className="w-full h-20 flex items-center justify-center">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading more...
                  </div>
                )}
                {!hasMore && templates.length > 0 && (
                  <span className="text-gray-400 text-sm italic">You've reached the end of the list</span>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Template;