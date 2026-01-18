import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { FiDownload, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiFileText, FiCalendar, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import moment from 'moment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';

const Transactions = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebarMinimized');
    return saved ? JSON.parse(saved) : false;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokens, setTokens] = useState(null);
  const [lastId, setLastId] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

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
        setError('Failed to load authentication data');
      }
    };

    loadTokens();
  }, []);

  // Fetch transactions from API
  const fetchTransactions = async (resetData = false) => {
    if (!tokens?.token || !tokens?.username) return;

    try {
      setLoading(true);
      setError('');

      const projectId = tokens.selected_project_id || tokens.projects?.[0]?.project_id || '';
      if (!projectId) {
        setError('No project selected');
        return;
      }

      const payload = {
        last_id: resetData ? 0 : lastId
      };

      console.log('📤 Fetching transactions:', payload);

      const { data, key } = Encrypt(payload);
      const data_pass = JSON.stringify({ data, key });

      const response = await axios.post(
        'https://api.w1chat.com/payment/transaction-history',
        data_pass,
        {
          headers: {
            'token': tokens.token,
            'username': tokens.username,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📥 Transaction response:', response.data);

      if (response?.data?.error) {
        setError(response?.data?.message || 'Failed to fetch transactions');
        return;
      }

      const responseData = response.data;
      const newTransactions = responseData.data || [];
      
      if (resetData) {
        setTransactions(newTransactions);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }
      
      setLastId(responseData.last_id || 0);
      setTotalCount(responseData.count || 0);
      setHasMore(newTransactions.length > 0);

    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setError('Failed to fetch transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load transactions when tokens are available
  useEffect(() => {
    if (tokens?.token && tokens?.username) {
      fetchTransactions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  // Transform API data to match component expectations
  const transformedTransactions = transactions.map(transaction => ({
    id: transaction.transaction_id,
    date: transaction.create_date,
    type: transaction.type ? 'Credit' : 'Debit',
    description: transaction.transaction_type,
    amount: parseFloat(transaction.amount),
    status: 'Completed', // API doesn't provide status, assuming completed
    paymentMethod: transaction.transaction_type,
    invoiceNumber: transaction.transaction_id,
    remark: transaction.remark,
    create_by: transaction.create_by
  }));

  // Filter and sort transactions
  const filteredTransactions = transformedTransactions
    .filter(transaction => {
      const matchesSearch = 
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.remark && transaction.remark.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || transaction.status.toLowerCase() === filterStatus.toLowerCase();
      const matchesType = filterType === 'all' || transaction.type.toLowerCase() === filterType.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Generate PDF Invoice
  const generatePDF = (transaction) => {
    const doc = new jsPDF();
    
    // Company/Service Info
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text('1Chat Transaction Receipt', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('WhatsApp Business API Platform', 20, 28);
    doc.text('support@1chat.com | www.1chat.com', 20, 34);
    
    // Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('TRANSACTION RECEIPT', 20, 50);
    
    // Transaction Details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Transaction ID:', 20, 60);
    doc.text('Date:', 20, 66);
    doc.text('Type:', 20, 72);
    doc.text('Status:', 20, 78);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(transaction.id, 70, 60);
    doc.text(moment(transaction.date).format('MMMM DD, YYYY HH:mm'), 70, 66);
    doc.text(transaction.type, 70, 72);
    doc.text(transaction.status, 70, 78);
    
    // Bill To Section (if create_by exists)
    if (transaction.create_by) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Created By:', 140, 60);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.text(transaction.create_by.username || 'N/A', 140, 66);
      doc.text(transaction.create_by.email || 'N/A', 140, 72);
      doc.text(transaction.create_by.mobile || 'N/A', 140, 78);
    }
    
    // Line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 85, 190, 85);
    
    // Transaction Details Table
    const tableData = [
      [
        'Description',
        'Type',
        'Amount',
        'Remark'
      ],
      [
        transaction.description,
        transaction.type,
        `₹${transaction.amount.toFixed(2)}`,
        transaction.remark || 'N/A'
      ]
    ];
    
    autoTable(doc, {
      startY: 90,
      head: [tableData[0]],
      body: [tableData[1]],
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 60 }
      }
    });
    
    // Total Section
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total Amount:', 140, finalY);
    doc.text(`₹${transaction.amount.toFixed(2)}`, 180, finalY);
    
    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 20, 280);
    doc.text('This is a computer-generated receipt.', 20, 285);
    
    // Save the PDF
    doc.save(`Transaction-${transaction.id}.pdf`);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeDisplay = (transactionType) => {
    return transactionType.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getTypeColor = (type) => {
    return type === 'Credit' 
      ? 'text-green-600 font-semibold' 
      : 'text-red-600 font-semibold';
  };

  const totalAmount = filteredTransactions.reduce((sum, t) => {
    return sum + (t.type === 'Credit' ? t.amount : -t.amount);
  }, 0);

  // Refresh transactions
  const handleRefresh = () => {
    if (tokens?.token && tokens?.username) {
      setLastId(0);
      fetchTransactions(true);
    }
  };

  // Load more transactions
  const loadMoreTransactions = () => {
    if (hasMore && !loading && tokens?.token && tokens?.username) {
      fetchTransactions(false);
    }
  };

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

      {/* Main content */}
      <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Transaction History</h1>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
            <p className="text-gray-600">View and download receipts for all your transactions</p>
            {error && (
              <div className="mt-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Summary Cards */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCount || filteredTransactions.length}</p>
                </div>
                <div className="bg-indigo-100 rounded-lg p-3">
                  <FiFileText className="text-indigo-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Net Balance</p>
                  <p className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{Math.abs(totalAmount).toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-100 rounded-lg p-3">
                  <FiDollarSign className="text-green-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredTransactions.filter(t => 
                      moment(t.date).isSame(moment(), 'month')
                    ).length}
                  </p>
                </div>
                <div className="bg-blue-100 rounded-lg p-3">
                  <FiCalendar className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Search and Filter Section */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by ID, description, or invoice number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiFilter size={20} />
                <span className="hidden sm:inline">Filters</span>
                {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="id">Transaction ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl shadow p-8">
              <div className="flex items-center justify-center">
                <FiRefreshCw className="animate-spin mr-2" size={20} />
                <span>Loading transactions...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-white rounded-xl shadow p-8">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <FiFileText size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Transactions</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('id')}
                    >
                      Transaction ID
                      {sortBy === 'id' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      {sortBy === 'date' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      {sortBy === 'amount' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{transaction.id}</div>
                          <div className="text-xs text-gray-500">{transaction.invoiceNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {moment(transaction.date).format('MMM DD, YYYY')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {moment(transaction.date).format('hh:mm A')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{getTransactionTypeDisplay(transaction.description)}</div>
                          {transaction.remark && (
                            <div className="text-xs text-gray-500">{transaction.remark}</div>
                          )}
                          {transaction.create_by && (
                            <div className="text-xs text-blue-600">By: {transaction.create_by.username}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getTypeColor(transaction.type)}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getTypeColor(transaction.type)}>
                            {transaction.type === 'Credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => generatePDF(transaction)}
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
                          >
                            <FiDownload size={16} />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No transactions found
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{(transaction.id).slice(6)}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{transaction.invoiceNumber}</p>
                      </div>
                      <span className={getTypeColor(transaction.type)}>
                        {transaction.type === 'Credit' ? '' : ''}₹{transaction.amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{getTransactionTypeDisplay(transaction.description)}</p>
                    {transaction.remark && (
                      <p className="text-xs text-gray-500 mb-2">{transaction.remark}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                      <span>{moment(transaction.date).format('MMM DD, YYYY hh:mm A')}</span>
                      <span>•</span>
                      <span className={getTypeColor(transaction.type)}>{transaction.type}</span>
                      {transaction.create_by && (
                        <>
                          <span>•</span>
                          <span>By: {transaction.create_by.username}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => generatePDF(transaction)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <FiDownload size={16} />
                      <span>Download Receipt</span>
                    </button>
                  </div>
                ))
              )}
            </div>
            </div>
          )}

          {/* Pagination Info and Load More */}
          {!loading && !error && filteredTransactions.length > 0 && (
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-600 mb-4">
                Showing {filteredTransactions.length} of {totalCount || transactions.length} transactions
              </div>
              {hasMore && (
                <button
                  onClick={loadMoreTransactions}
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
