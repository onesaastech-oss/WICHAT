import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { Link } from 'react-router-dom'
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
  FiFacebook
} from 'react-icons/fi';

function Template() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Fetch templates data (simulated)
  useEffect(() => {
    const fetchTemplates = async () => {
      // Simulate API call
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock data
        const mockTemplates = [
          { id: 1, name: 'Order Confirmation', language: 'English', category: 'Transaction', status: 'Approved', updatedOn: '2023-06-15' },
          { id: 2, name: 'Shipping Update', language: 'English', category: 'Transaction', status: 'Pending', updatedOn: '2023-06-10' },
          { id: 3, name: 'Appointment Reminder', language: 'Spanish', category: 'Appointment', status: 'Approved', updatedOn: '2023-06-05' },
          { id: 4, name: 'Payment Receipt', language: 'English', category: 'Transaction', status: 'Rejected', updatedOn: '2023-05-28' },
          { id: 5, name: 'Customer Feedback', language: 'French', category: 'Marketing', status: 'Approved', updatedOn: '2023-05-20' },
          { id: 6, name: 'Welcome Message', language: 'German', category: 'Authentication', status: 'Approved', updatedOn: '2023-05-15' },
          { id: 7, name: 'Password Reset', language: 'English', category: 'Authentication', status: 'Pending', updatedOn: '2023-05-10' },
          { id: 8, name: 'Special Offer', language: 'Italian', category: 'Marketing', status: 'Approved', updatedOn: '2023-05-05' },
          { id: 9, name: 'Account Verification', language: 'English', category: 'Authentication', status: 'Approved', updatedOn: '2023-04-28' },
          { id: 10, name: 'Event Invitation', language: 'Portuguese', category: 'Marketing', status: 'Rejected', updatedOn: '2023-04-20' },
          { id: 11, name: 'Back in Stock', language: 'English', category: 'Marketing', status: 'Pending', updatedOn: '2023-04-15' },
          { id: 12, name: 'Delivery Notification', language: 'Spanish', category: 'Transaction', status: 'Approved', updatedOn: '2023-04-10' },
        ];
        
        setTemplates(mockTemplates);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

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
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiFacebook className="mr-2" />
                Template Manager
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
                            ${template.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                              template.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {template.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {template.updatedOn}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button className="text-indigo-600 hover:text-indigo-900">
                              <FiDownload size={18} />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <FiEdit size={18} />
                            </button>
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

            {/* Pagination */}
            {!loading && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, templates.length)}
                      </span>{' '}
                      of <span className="font-medium">{templates.length}</span> results
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
    </div>
  );
}

export default Template;