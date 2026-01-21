import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { FiDownload, FiFileText, FiCalendar, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import moment from 'moment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';
import Pagination from '../component/Pagination';
import DateRangePicker from '../component/DateRangePicker';
import MultiSelect from '../component/MultiSelect';

const Transactions = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebarMinimized');
    return saved ? JSON.parse(saved) : false;
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokens, setTokens] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);

  // Server-side filters (payload options)
  const [fromDate, setFromDate] = useState(() => moment().subtract(30, 'days').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(() => moment().format('YYYY-MM-DD'));
  const [transactionType, setTransactionType] = useState('all'); // template send | wallet topup | project renewal | all
  const [entryType, setEntryType] = useState('all'); // Credit=1, Debit=0, all
  const [selectedProjects, setSelectedProjects] = useState([]); // Array of project_ids, empty array = all projects

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
  const fetchTransactions = async (page = currentPage, limit = pageSize, overrides = {}) => {
    if (!tokens?.token || !tokens?.username) return;

    try {
      setLoading(true);
      setError('');

      const effectiveFromDate = overrides.fromDate ?? fromDate;
      const effectiveToDate = overrides.toDate ?? toDate;
      const effectiveTransactionType = overrides.transactionType ?? transactionType;
      const effectiveEntryType = overrides.entryType ?? entryType;
      const effectiveSelectedProjects = overrides.selectedProjects ?? selectedProjects;

      const allProjectIds = (tokens.projects || []).map(p => p?.project_id).filter(Boolean);

      // Determine project IDs based on selection
      // Empty array means all projects
      const projectIds = effectiveSelectedProjects.length === 0
        ? allProjectIds
        : effectiveSelectedProjects;

      if (!projectIds.length) {
        setError('No projects available');
        return;
      }

      const payload = {
        page_no: page,
        limit: limit,
        project_ids: projectIds,
        ...(effectiveFromDate ? { from_date: effectiveFromDate } : {}),
        ...(effectiveToDate ? { to_date: effectiveToDate } : {}),
        ...(effectiveTransactionType !== 'all' ? { transaction_type: effectiveTransactionType } : {}),
        ...(effectiveEntryType !== 'all' ? { type: effectiveEntryType } : {})
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

      setTransactions(newTransactions);

      // Totals from API
      setTotalCredit(parseFloat(responseData.total_credit || 0));
      setTotalDebit(parseFloat(responseData.total_debit || 0));

      // Extract pagination metadata
      if (responseData.meta) {
        setCurrentPage(responseData.meta.page_no || page);
        setPageSize(responseData.meta.limit || limit);
        setTotalPages(responseData.meta.total_pages || 1);
        setTotalRecords(responseData.meta.total_records || 0);
      } else {
        // Fallback if meta is not available
        setTotalRecords(newTransactions.length);
        setTotalPages(1);
      }

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
      fetchTransactions(1, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  // Auto-apply: Fetch transactions when filters change
  useEffect(() => {
    if (tokens?.token && tokens?.username) {
      setCurrentPage(1); // Reset to first page when filters change
      fetchTransactions(1, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, transactionType, entryType, selectedProjects]);

  // Fetch transactions when page or page size changes
  useEffect(() => {
    if (tokens?.token && tokens?.username) {
      fetchTransactions(currentPage, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // Transform API data to match component expectations
  const transformedTransactions = transactions.map((transaction, index) => ({
    id: transaction.transaction_id,
    date: transaction.create_date,
    type: transaction.type ? 'Credit' : 'Debit',
    description: transaction.transaction_type,
    amount: parseFloat(transaction.amount),
    invoiceNumber: transaction.transaction_id,
    remark: transaction.remark,
    create_by: transaction.create_by,
    payment_details: transaction.payment_details,
    message_details: transaction.message_details,
    serialNumber: (currentPage - 1) * pageSize + index + 1
  }));

  // Generate PDF Invoice
  const generatePDF = (transformedTransaction) => {
    // Find the original transaction from the transactions array
    const originalTransaction = transactions.find(t => t.transaction_id === transformedTransaction.id);
    if (!originalTransaction) {
      console.error('Original transaction not found');
      return;
    }

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
    doc.text('Transaction Type:', 20, 78);

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(transformedTransaction.id, 70, 60);
    doc.text(moment(transformedTransaction.date).format('MMMM DD, YYYY HH:mm'), 70, 66);
    doc.text(transformedTransaction.type, 70, 72);
    doc.text(transformedTransaction.description, 70, 78);

    // Bill To Section (if create_by exists)
    if (transformedTransaction.create_by) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Created By:', 140, 60);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.text(transformedTransaction.create_by.username || 'N/A', 140, 66);
      doc.text(transformedTransaction.create_by.email || 'N/A', 140, 72);
      doc.text(transformedTransaction.create_by.mobile || 'N/A', 140, 78);
    }

    // Line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 85, 190, 85);

    let currentY = 90;

    // Payment Details Section (for wallet topup)
    if (originalTransaction.payment_details) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Payment Details', 20, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Payment ID:', 20, currentY);
      doc.text('Name:', 20, currentY + 6);
      doc.text('Email:', 20, currentY + 12);
      doc.text('Mobile:', 20, currentY + 18);
      doc.text('UTR:', 20, currentY + 24);
      doc.text('Payment Date:', 20, currentY + 30);

      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(originalTransaction.payment_details.payment_id || 'N/A', 70, currentY);
      doc.text(originalTransaction.payment_details.name || 'N/A', 70, currentY + 6);
      doc.text(originalTransaction.payment_details.email || 'N/A', 70, currentY + 12);
      doc.text(originalTransaction.payment_details.mobile || 'N/A', 70, currentY + 18);
      doc.text(originalTransaction.payment_details.utr || 'N/A', 70, currentY + 24);
      doc.text(
        originalTransaction.payment_details.create_date
          ? moment(originalTransaction.payment_details.create_date).format('MMMM DD, YYYY HH:mm')
          : 'N/A',
        70,
        currentY + 30
      );

      currentY += 40;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, currentY, 190, currentY);
      currentY += 10;
    }

    // Message Details Section (for template send)
    if (originalTransaction.message_details) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Message Details', 20, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Unique ID:', 20, currentY);
      doc.text('WAMID:', 20, currentY + 6);
      doc.text('Project ID:', 20, currentY + 12);
      doc.text('Message By:', 20, currentY + 18);
      doc.text('Number:', 20, currentY + 24);
      doc.text('Template Name:', 20, currentY + 30);
      doc.text('Language:', 20, currentY + 36);
      doc.text('Category:', 20, currentY + 42);
      doc.text('Message Date:', 20, currentY + 48);

      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(originalTransaction.message_details.unique_id || 'N/A', 70, currentY);
      doc.text(
        originalTransaction.message_details.wamid
          ? (originalTransaction.message_details.wamid.length > 40
            ? originalTransaction.message_details.wamid.substring(0, 40) + '...'
            : originalTransaction.message_details.wamid)
          : 'N/A',
        70,
        currentY + 6
      );
      doc.text(originalTransaction.message_details.project_id || 'N/A', 70, currentY + 12);
      doc.text(originalTransaction.message_details.message_by || 'N/A', 70, currentY + 18);
      doc.text(originalTransaction.message_details.number || 'N/A', 70, currentY + 24);
      doc.text(originalTransaction.message_details.template_name || 'N/A', 70, currentY + 30);
      doc.text(originalTransaction.message_details.language_code || 'N/A', 70, currentY + 36);
      doc.text(originalTransaction.message_details.category || 'N/A', 70, currentY + 42);
      doc.text(
        originalTransaction.message_details.create_date
          ? moment(originalTransaction.message_details.create_date).format('MMMM DD, YYYY HH:mm')
          : 'N/A',
        70,
        currentY + 48
      );

      currentY += 58;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, currentY, 190, currentY);
      currentY += 10;
    }

    // Transaction Details Table
    const tableData = [
      [
        'Description',
        'Type',
        'Amount',
        'Remark'
      ],
      [
        transformedTransaction.description,
        transformedTransaction.type,
        `₹${transformedTransaction.amount.toFixed(2)}`,
        transformedTransaction.remark || 'N/A'
      ]
    ];

    autoTable(doc, {
      startY: currentY,
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
    doc.text(`₹${transformedTransaction.amount.toFixed(2)}`, 180, finalY);

    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150, 150, 150);
    const pageHeight = doc.internal.pageSize.height;
    doc.text('Thank you for your business!', 20, pageHeight - 20);
    doc.text('This is a computer-generated receipt.', 20, pageHeight - 15);

    // Save the PDF
    doc.save(`Transaction-${transformedTransaction.id}.pdf`);
  };

  const getTransactionTypeDisplay = (transactionType) => {
    return (transactionType || '').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getTypeColor = (type) => {
    return type === 'Credit'
      ? 'text-green-600 font-semibold'
      : 'text-red-600 font-semibold';
  };

  // Refresh transactions
  const handleRefresh = () => {
    if (tokens?.token && tokens?.username) {
      setCurrentPage(1);
      fetchTransactions(1, pageSize);
    }
  };

  const handleResetFilters = () => {
    setFromDate(moment().subtract(30, 'days').format('YYYY-MM-DD'));
    setToDate(moment().format('YYYY-MM-DD'));
    setTransactionType('all');
    setEntryType('all');
    setSelectedProjects([]);
    // Auto-apply will trigger via useEffect
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
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
                    <p className="text-sm text-gray-600 mb-1">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{totalRecords || transformedTransactions.length}</p>
                  </div>
                  <div className="bg-indigo-100 rounded-lg p-3">
                    <FiFileText className="text-indigo-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Credit</p>
                    <p className="text-2xl font-bold text-green-600">₹{Number(totalCredit || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3">
                    <FiDollarSign className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Debit</p>
                    <p className="text-2xl font-bold text-red-600">₹{Number(totalDebit || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-3">
                    <FiCalendar className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters (server-side; maps to API payload) */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={handleResetFilters}
                  disabled={loading}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Reset All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range Picker */}
                <DateRangePicker
                  startDate={fromDate}
                  endDate={toDate}
                  onStartDateChange={setFromDate}
                  onEndDateChange={setToDate}
                  maxDate={moment().format('YYYY-MM-DD')}
                />

                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="all">All</option>
                    <option value="template send">Template Send</option>
                    <option value="wallet topup">Wallet Topup</option>
                    <option value="project renewal">Project Renewal</option>
                  </select>
                </div>

                {/* Entry Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type</label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="all">All</option>
                    <option value="1">Credit</option>
                    <option value="0">Debit</option>
                  </select>
                </div>

                {/* Multi-Select Projects */}
                <div>
                  <MultiSelect
                    options={(tokens?.projects || []).map(project => ({
                      value: project.project_id,
                      label: project.name
                    }))}
                    selectedValues={selectedProjects}
                    onChange={setSelectedProjects}
                    label="Projects"
                    placeholder="Select projects"
                    allOptionLabel="All Projects"
                  />
                </div>
              </div>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transformedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transformedTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{transaction.serialNumber}</div>
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
                          <td className="px-6 py-4">
                            {/* Payment Details for wallet topup */}
                            {transaction.payment_details && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-indigo-600">Payment Details:</div>
                                <div className="text-xs text-gray-600">ID: {transaction.payment_details.payment_id || 'N/A'}</div>
                                <div className="text-xs text-gray-600">UTR: {transaction.payment_details.utr || 'N/A'}</div>
                                <div className="text-xs text-gray-600">Name: {transaction.payment_details.name || 'N/A'}</div>
                                {transaction.payment_details.create_date && (
                                  <div className="text-xs text-gray-500">
                                    {moment(transaction.payment_details.create_date).format('MMM DD, YYYY')}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Message Details for template send */}
                            {transaction.message_details && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-indigo-600">Message Details:</div>
                                <div className="text-xs text-gray-600">Template: {transaction.message_details.template_name || 'N/A'}</div>
                                <div className="text-xs text-gray-600">Number: {transaction.message_details.number || 'N/A'}</div>
                                <div className="text-xs text-gray-600">Category: {transaction.message_details.category || 'N/A'}</div>
                                <div className="text-xs text-gray-600">Language: {transaction.message_details.language_code || 'N/A'}</div>
                                {transaction.message_details.create_date && (
                                  <div className="text-xs text-gray-500">
                                    {moment(transaction.message_details.create_date).format('MMM DD, YYYY')}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Remark and Created By */}
                            {transaction.remark && (
                              <div className="text-xs text-gray-600 mt-1">Remark: {transaction.remark}</div>
                            )}
                            {transaction.create_by && (
                              <div className="text-xs text-blue-600 mt-1">
                                By: {transaction.create_by.username || 'N/A'}
                              </div>
                            )}
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
                {transformedTransactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No transactions found
                  </div>
                ) : (
                  transformedTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-500">#{transaction.serialNumber}</span>
                            <span className="text-sm font-semibold text-gray-900">{transaction.id}</span>
                          </div>
                          <p className="text-xs text-gray-500">{transaction.invoiceNumber}</p>
                        </div>
                        <span className={getTypeColor(transaction.type)}>
                          {transaction.type === 'Credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{getTransactionTypeDisplay(transaction.description)}</p>

                      {/* Payment Details for wallet topup */}
                      {transaction.payment_details && (
                        <div className="bg-indigo-50 rounded-lg p-3 mb-2">
                          <div className="text-xs font-semibold text-indigo-600 mb-1">Payment Details:</div>
                          <div className="text-xs text-gray-700">Payment ID: {transaction.payment_details.payment_id || 'N/A'}</div>
                          <div className="text-xs text-gray-700">UTR: {transaction.payment_details.utr || 'N/A'}</div>
                          <div className="text-xs text-gray-700">Name: {transaction.payment_details.name || 'N/A'}</div>
                          <div className="text-xs text-gray-700">Email: {transaction.payment_details.email || 'N/A'}</div>
                          <div className="text-xs text-gray-700">Mobile: {transaction.payment_details.mobile || 'N/A'}</div>
                          {transaction.payment_details.create_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              Payment Date: {moment(transaction.payment_details.create_date).format('MMM DD, YYYY hh:mm A')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Details for template send */}
                      {transaction.message_details && (
                        <div className="bg-indigo-50 rounded-lg p-3 mb-2">
                          <div className="text-xs font-semibold text-indigo-600 mb-1">Message Details:</div>
                          <div className="text-xs text-gray-700">Template: {transaction.message_details.template_name || 'N/A'}</div>
                          <div className="text-xs text-gray-700">Number: {transaction.message_details.number || 'N/A'}</div>
                          <div className="text-xs text-gray-700">Category: {transaction.message_details.category || 'N/A'}</div>
                          <div className="text-xs text-gray-700">Language: {transaction.message_details.language_code || 'N/A'}</div>
                          <div className="text-xs text-gray-700">Message By: {transaction.message_details.message_by || 'N/A'}</div>
                          {transaction.message_details.wamid && (
                            <div className="text-xs text-gray-600 break-all mt-1">
                              WAMID: {transaction.message_details.wamid.length > 30
                                ? transaction.message_details.wamid.substring(0, 30) + '...'
                                : transaction.message_details.wamid}
                            </div>
                          )}
                          {transaction.message_details.create_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              Message Date: {moment(transaction.message_details.create_date).format('MMM DD, YYYY hh:mm A')}
                            </div>
                          )}
                        </div>
                      )}

                      {transaction.remark && (
                        <p className="text-xs text-gray-500 mb-2">Remark: {transaction.remark}</p>
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

          {/* Pagination */}
          {!loading && !error && transactions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[10, 20, 50, 100]}
              showPageSizeSelector={true}
              showGoToPage={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
