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
// import logo from "../../public/logo-main.png";
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

      // When "All" is selected, pass empty array (no project_id); backend treats [] as all projects
      const projectIds = effectiveSelectedProjects;

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

  // Auto-apply: Fetch transactions when filters change (EXCLUDING selectedProjects)
  useEffect(() => {
    if (tokens?.token && tokens?.username) {
      setCurrentPage(1); // Reset to first page when filters change
      fetchTransactions(1, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, transactionType, entryType]); // selectedProjects removed from here

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
// ============= PDF GENERATION – FAST & PERFECTLY ALIGNED =============
const generatePDF = async (transaction) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // --- ULTRA-FAST LOGO LOAD (0ms timeout – if not ready, skip) ---
  const getLogoFast = () => {
    return new Promise((resolve) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 0); // abort immediately if not cached
      const logoUrl = `${window.location.origin}/1Chatting%20Logo%20PNG.png`;
      fetch(logoUrl, { signal: controller.signal, cache: 'force-cache' })
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        })
        .catch(() => resolve(null))
        .finally(() => clearTimeout(timeout));
    });
  };

  const logoBase64 = await getLogoFast();

  // --- HEADER: Logo on RIGHT (bigger), Title on LEFT ---
  // Left aligned title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('1Chat Transaction Receipt', 15, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('WhatsApp Business API Platform', 15, 27);
  doc.text('support@1chat.com  |  www.1chat.com', 15, 32);

  // Logo – significantly larger (55x20 mm) – still fits perfectly
  if (logoBase64) {
    const logoWidth = 55;
    const logoHeight = 20;
    doc.addImage(logoBase64, 'PNG', 195 - logoWidth, 6, logoWidth, logoHeight);
  }

  // --- Decorative line ---
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(15, 42, 195, 42);

  // --- Main title ---
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('TRANSACTION RECEIPT', 105, 52, { align: 'center' });

  // --- TRANSACTION OVERVIEW – VERTICAL (line by line, clean) ---
  // Each field on its own row – more readable and premium
  const overviewRows = [
    ['Transaction ID:', transaction.id || 'N/A'],
    ['Date:', moment(transaction.date).format('MMMM DD, YYYY HH:mm')],
    ['Type:', transaction.type],
    ['Transaction Type:', getTransactionTypeDisplay(transaction.description)]
  ];

  autoTable(doc, {
    startY: 62,
    body: overviewRows,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2.5,
      textColor: [31, 41, 55],
      fontStyle: 'normal',
      valign: 'middle'
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [107, 114, 128], cellWidth: 45, halign: 'left' },
      1: { cellWidth: 130, halign: 'left' }
    },
    margin: { left: 15, right: 15 },
    tableWidth: 'auto'
  });

  let finalY = doc.lastAutoTable.finalY + 12; // generous gap

  // --- MESSAGE DETAILS (if present) ---
  if (transaction.message_details) {
    const md = transaction.message_details;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('Message Details', 15, finalY);

    doc.setDrawColor(209, 213, 219);
    doc.line(15, finalY + 2, 195, finalY + 2);

    const details = [
      ['Unique ID:', md.unique_id || md.message_details_id || 'N/A'],
      ['WAMID:', md.wamid || 'N/A'],
      ['Project ID:', md.project_id || 'N/A'],
      ['Message By:', md.message_by || 'N/A'],
      ['Number:', md.number || 'N/A'],
      ['Template Name:', md.template_name || 'N/A'],
      ['Language:', md.language_code || 'N/A'],
      ['Category:', md.category || 'N/A'],
      ['Message Date:', md.create_date ? moment(md.create_date).format('MMMM DD, YYYY HH:mm') : 'N/A']
    ];

    autoTable(doc, {
      startY: finalY + 5,
      body: details,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        textColor: [31, 41, 55],
        valign: 'middle'
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [107, 114, 128], cellWidth: 35, halign: 'left' },
        1: { cellWidth: 140, halign: 'left' }
      },
      margin: { left: 15, right: 15 },
      tableWidth: 'auto'
    });
    finalY = doc.lastAutoTable.finalY + 12;
  }

  // --- PAYMENT DETAILS (if present) ---
  if (transaction.payment_details) {
    const pd = transaction.payment_details;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('Payment Details', 15, finalY);

    doc.setDrawColor(209, 213, 219);
    doc.line(15, finalY + 2, 195, finalY + 2);

    const details = [
      ['Payment ID:', pd.payment_id || 'N/A'],
      ['UTR:', pd.utr || 'N/A'],
      ['Name:', pd.name || 'N/A'],
      ['Email:', pd.email || 'N/A'],
      ['Mobile:', pd.mobile || 'N/A'],
      ['Payment Date:', pd.create_date ? moment(pd.create_date).format('MMMM DD, YYYY HH:mm') : 'N/A']
    ];

    autoTable(doc, {
      startY: finalY + 5,
      body: details,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        textColor: [31, 41, 55],
        valign: 'middle'
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [107, 114, 128], cellWidth: 35, halign: 'left' },
        1: { cellWidth: 140, halign: 'left' }
      },
      margin: { left: 15, right: 15 },
      tableWidth: 'auto'
    });
    finalY = doc.lastAutoTable.finalY + 12;
  }

  // --- TRANSACTION DETAILS TABLE (FULLY CENTERED) ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('Transaction Details', 15, finalY);

  doc.setDrawColor(209, 213, 219);
  doc.line(15, finalY + 2, 195, finalY + 2);

  const lineData = [
    [
      getTransactionTypeDisplay(transaction.description),
      transaction.type,
      `₹${transaction.amount.toFixed(2)}`,
      transaction.remark || 'N/A'
    ]
  ];

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Description', 'Type', 'Amount (₹)', 'Remark']],
    body: lineData,
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
      valign: 'middle'
    },
    styles: {
      fontSize: 9,
      cellPadding: 5,
      halign: 'center',        // EVERYTHING CENTERED
      valign: 'middle',
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { halign: 'center' }, // Description centered
      1: { halign: 'center' }, // Type centered
      2: { halign: 'center' }, // Amount centered (rupee symbol inside value)
      3: { halign: 'center' }  // Remark centered
    },
    margin: { left: 15, right: 15 },
    tableWidth: 'auto'
  });

  finalY = doc.lastAutoTable.finalY + 12; // generous gap before total

  // --- TOTAL AMOUNT – ALIGNED EXACTLY WITH TABLE RIGHT EDGE ---
  // Table's right edge is at 195 (since margin left=15, right=15, width=180)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(`Total Amount: ₹${transaction.amount.toFixed(2)}`, 175, finalY, { align: 'right' });

  // --- FOOTER: CONTACT + SYSTEM GENERATED NOTE ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('support@1chat.com  |  www.1chat.com', 105, pageHeight - 15, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(156, 163, 175);
  doc.text('This is a system generated receipt and does not require a signature.', 105, pageHeight - 8, { align: 'center' });

  // --- INSTANT SAVE ---
  const fileName = `receipt_${transaction.id || 'transaction'}_${moment().format('YYYYMMDDHHmmss')}.pdf`;
  doc.save(fileName);
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
    const resetFromDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
    const resetToDate = moment().format('YYYY-MM-DD');
    
    setFromDate(resetFromDate);
    setToDate(resetToDate);
    setTransactionType('all');
    setEntryType('all');
    setSelectedProjects([]);
    
    // Fetch with reset filters
    setCurrentPage(1);
    fetchTransactions(1, pageSize, {
      fromDate: resetFromDate,
      toDate: resetToDate,
      transactionType: 'all',
      entryType: 'all',
      selectedProjects: []
    });
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

  // Skeleton Loading Component for Desktop Table
  const DesktopTableSkeleton = () => (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5, 6, 7].map((col) => (
              <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: pageSize }).map((_, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {Array.from({ length: 7 }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  <div className={`h-4 bg-gray-100 rounded animate-pulse ${
                    colIndex === 5 ? 'w-3/4' : 'w-full'
                  }`}></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Skeleton Loading Component for Mobile Cards
  const MobileCardsSkeleton = () => (
    <div className="md:hidden divide-y divide-gray-200">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3"></div>
            </div>
            <div className="h-6 bg-gray-100 rounded animate-pulse w-20"></div>
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3"></div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5"></div>
          </div>
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      ))}
    </div>
  );

  // Skeleton Loading Component for Summary Cards
  const SummaryCardsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-24"></div>
              <div className="h-8 bg-gray-100 rounded animate-pulse w-20"></div>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
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

          {/* Summary Cards - Show skeleton when loading */}
          {loading ? (
            <SummaryCardsSkeleton />
          ) : !error ? (
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
          ) : null}

          {/* Filters - Show only when not loading or has error */}
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
                {/* Unified Date Range Picker */}
                <DateRangePicker
                  startDate={fromDate}
                  endDate={toDate}
                  onStartDateChange={setFromDate}
                  onEndDateChange={setToDate}
                  maxDate={moment().format('YYYY-MM-DD')}
                />

                {/* Transaction Type Dropdown - Premium */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                  <div className="relative group">
                    <select
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="w-full px-4 py-2.5 pl-10 pr-10 border border-gray-300 rounded-lg 
                                bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                                hover:border-indigo-400 hover:shadow-sm transition-all duration-200
                                cursor-pointer appearance-none shadow-sm
                                text-sm text-gray-800 font-medium"
                    >
                      <option value="all">All</option>
                      <option value="template send">Template Send</option>
                      <option value="wallet topup">Wallet Topup</option>
                      <option value="project renewal">Project Renewal</option>
                    </select>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Entry Type Dropdown - Premium */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type</label>
                  <div className="relative group">
                    <select
                      value={entryType}
                      onChange={(e) => setEntryType(e.target.value)}
                      className="w-full px-4 py-2.5 pl-10 pr-10 border border-gray-300 rounded-lg 
                                bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                                hover:border-indigo-400 hover:shadow-sm transition-all duration-200
                                cursor-pointer appearance-none shadow-sm
                                text-sm text-gray-800 font-medium"
                    >
                      <option value="all">All</option>
                      <option value="1">Credit</option>
                      <option value="0">Debit</option>
                    </select>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Multi-Select Projects */}
                <div>
                  <MultiSelect
                    options={(tokens?.projects || []).map(project => ({
                      value: project.project_id,
                      label: project.name
                    }))}
                    selectedValues={selectedProjects}
                    onChange={(newSelectedProjects) => {
                      // Only update local state, no API call
                      setSelectedProjects([...newSelectedProjects]);
                    }}
                    onSearch={(selectedProjectIds) => {
                      // This will be called when search button is clicked
                      console.log('Searching with projects:', selectedProjectIds);
                      // Call fetchTransactions with the selected projects
                      setCurrentPage(1); // Reset to first page
                      fetchTransactions(1, pageSize, {
                        selectedProjects: selectedProjectIds
                      });
                    }}
                    label="Projects"
                    placeholder="Select projects"
                    allOptionLabel="All Projects"
                    showSearchButton={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Transactions Table with Skeleton Loading */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loading ? (
              // Show skeleton when loading
              <>
                <DesktopTableSkeleton />
                <MobileCardsSkeleton />
              </>
            ) : error ? (
              // Show error state
              <div className="p-8">
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
            ) : (
              // Show actual data when loaded
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <tr>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200/50">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="text-gray-400">#</div>
                            <div>S.No</div>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200/50">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>Date</div>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200/50">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>Transaction Type</div>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200/50">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>Type</div>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200/50">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>Amount</div>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200/50">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>Details</div>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>Receipt</div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {transformedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                              </svg>
                              <div>
                                <p className="text-gray-500 font-medium">No transactions found</p>
                                <p className="text-gray-400 text-sm mt-1">Transactions will appear here once available</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        transformedTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50/80 transition-all duration-150 group">
                            <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100 text-center align-middle">
                              <div className="flex items-center justify-center">
                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
                                  {transaction.serialNumber}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100 text-center align-middle">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {moment(transaction.date).format('MMM DD, YYYY')}
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md inline-flex items-center justify-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {moment(transaction.date).format('hh:mm A')}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 border-r border-gray-100 text-center align-middle">
                              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium justify-center">
                                {getTransactionTypeDisplay(transaction.description)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100 text-center align-middle">
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold justify-center ${transaction.type === 'Credit' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                {transaction.type === 'Credit' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                )}
                                {transaction.type}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100 text-center align-middle">
                              <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${transaction.type === 'Credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {transaction.type === 'Credit' ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                )}
                                <span>{transaction.type === 'Credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 border-r border-gray-100 align-middle">
                              {/* Payment Details for wallet topup */}
                              {transaction.payment_details && (
                                <div className="space-y-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wide justify-center">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    Payment Details
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Payment ID</div>
                                      <div className="text-xs font-medium text-gray-900 truncate">{transaction.payment_details.payment_id || 'N/A'}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">UTR</div>
                                      <div className="text-xs font-medium text-gray-900 truncate">{transaction.payment_details.utr || 'N/A'}</div>
                                    </div>
                                    <div className="col-span-2 text-center">
                                      <div className="text-xs text-gray-500">Name</div>
                                      <div className="text-xs font-medium text-gray-900">{transaction.payment_details.name || 'N/A'}</div>
                                    </div>
                                  </div>
                                  {transaction.payment_details.create_date && (
                                    <div className="text-xs text-gray-500 flex items-center justify-center gap-1 pt-1 border-t border-blue-100">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {moment(transaction.payment_details.create_date).format('MMM DD, YYYY hh:mm A')}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Message Details for template send */}
                              {transaction.message_details && (
                                <div className="space-y-2 p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wide justify-center">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    Message Details
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Template</div>
                                      <div className="text-xs font-medium text-gray-900 truncate">{transaction.message_details.template_name || 'N/A'}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500">Number</div>
                                      <div className="text-xs font-medium text-gray-900">{transaction.message_details.number || 'N/A'}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Remark and Created By */}
                              {(transaction.remark || transaction.create_by) && (
                                <div className="mt-2 space-y-2">
                                  {transaction.remark && (
                                    <div className="flex flex-col items-center text-xs p-2 bg-gray-50 rounded-md">
                                      <div className="flex items-center gap-2 mb-1">
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                        <div className="text-gray-500">Remark</div>
                                      </div>
                                      <div className="text-gray-900 font-medium text-center">{transaction.remark}</div>
                                    </div>
                                  )}
                                  {transaction.create_by && (
                                    <div className="flex flex-col items-center text-xs p-2 bg-blue-50/50 rounded-md">
                                      <div className="flex items-center gap-2 mb-1">
                                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <div className="text-gray-500">Created By</div>
                                      </div>
                                      <div className="text-blue-600 font-semibold">{transaction.create_by.username || 'N/A'}</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                              <button
                                onClick={() => generatePDF(transaction)}
                                className="group/btn inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-indigo-50/50 hover:from-indigo-100 hover:to-indigo-100/80 text-indigo-700 hover:text-indigo-800 font-semibold text-sm rounded-lg border border-indigo-200 hover:border-indigo-300 transition-all duration-200 shadow-sm hover:shadow mx-auto"
                              >
                                <svg className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Receipt
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
              </>
            )}
          </div>

          {/* Pagination - Show only when not loading and has data */}
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