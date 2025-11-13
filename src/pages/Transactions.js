import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { FiDownload, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiFileText, FiCalendar, FiDollarSign } from 'react-icons/fi';
import moment from 'moment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // Dummy transaction data
  const [transactions] = useState([
    {
      id: 'TXN-2024-001',
      date: '2024-01-15T10:30:00',
      type: 'Credit',
      description: 'Plan Subscription - Business Plan',
      amount: 99.00,
      status: 'Completed',
      paymentMethod: 'Credit Card',
      invoiceNumber: 'INV-2024-001'
    },
    {
      id: 'TXN-2024-002',
      date: '2024-01-10T14:20:00',
      type: 'Debit',
      description: 'API Usage Charges',
      amount: 45.50,
      status: 'Completed',
      paymentMethod: 'Wallet',
      invoiceNumber: 'INV-2024-002'
    },
    {
      id: 'TXN-2024-003',
      date: '2024-01-08T09:15:00',
      type: 'Credit',
      description: 'Top-up Balance',
      amount: 200.00,
      status: 'Completed',
      paymentMethod: 'Bank Transfer',
      invoiceNumber: 'INV-2024-003'
    },
    {
      id: 'TXN-2024-004',
      date: '2024-01-05T16:45:00',
      type: 'Debit',
      description: 'Campaign Charges - Summer Sale',
      amount: 150.75,
      status: 'Completed',
      paymentMethod: 'Wallet',
      invoiceNumber: 'INV-2024-004'
    },
    {
      id: 'TXN-2024-005',
      date: '2024-01-03T11:00:00',
      type: 'Credit',
      description: 'Refund - Failed Campaign',
      amount: 75.25,
      status: 'Completed',
      paymentMethod: 'Original Payment Method',
      invoiceNumber: 'INV-2024-005'
    },
    {
      id: 'TXN-2024-006',
      date: '2024-01-01T08:30:00',
      type: 'Debit',
      description: 'Monthly Subscription Renewal',
      amount: 99.00,
      status: 'Pending',
      paymentMethod: 'Credit Card',
      invoiceNumber: 'INV-2024-006'
    },
    {
      id: 'TXN-2024-007',
      date: '2023-12-28T13:20:00',
      type: 'Debit',
      description: 'Template Approval Fees',
      amount: 25.00,
      status: 'Completed',
      paymentMethod: 'Wallet',
      invoiceNumber: 'INV-2024-007'
    },
    {
      id: 'TXN-2024-008',
      date: '2023-12-25T10:00:00',
      type: 'Credit',
      description: 'Holiday Bonus Credit',
      amount: 50.00,
      status: 'Completed',
      paymentMethod: 'System Credit',
      invoiceNumber: 'INV-2024-008'
    },
    {
      id: 'TXN-2024-009',
      date: '2023-12-20T15:30:00',
      type: 'Debit',
      description: 'API Usage Charges',
      amount: 32.50,
      status: 'Failed',
      paymentMethod: 'Credit Card',
      invoiceNumber: 'INV-2024-009'
    },
    {
      id: 'TXN-2024-010',
      date: '2023-12-18T09:45:00',
      type: 'Credit',
      description: 'Top-up Balance',
      amount: 100.00,
      status: 'Completed',
      paymentMethod: 'PayPal',
      invoiceNumber: 'INV-2024-010'
    }
  ]);

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = 
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
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
    doc.text('1Chat Dummy invoice', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('WhatsApp Business API Platform', 20, 28);
    doc.text('support@1chat.com | www.1chat.com', 20, 34);
    
    // Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 20, 50);
    
    // Invoice Details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Invoice Number:', 20, 60);
    doc.text('Transaction ID:', 20, 66);
    doc.text('Date:', 20, 72);
    doc.text('Status:', 20, 78);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(transaction.invoiceNumber, 70, 60);
    doc.text(transaction.id, 70, 66);
    doc.text(moment(transaction.date).format('MMMM DD, YYYY'), 70, 72);
    doc.text(transaction.status, 70, 78);
    
    // Bill To Section
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Bill To:', 140, 60);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.text('Bmtax', 140, 66);
    doc.text('bmtax@example.com', 140, 72);
    
    // Line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 85, 190, 85);
    
    // Transaction Details Table
    const tableData = [
      [
        'Description',
        'Type',
        'Payment Method',
        'Amount'
      ],
      [
        transaction.description,
        transaction.type,
        transaction.paymentMethod,
        `$${transaction.amount.toFixed(2)}`
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
        0: { cellWidth: 80 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30, halign: 'right' }
      }
    });
    
    // Total Section
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total Amount:', 140, finalY);
    doc.text(`$${transaction.amount.toFixed(2)}`, 180, finalY);
    
    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 20, 280);
    doc.text('This is a computer-generated invoice.', 20, 285);
    
    // Save the PDF
    doc.save(`Invoice-${transaction.invoiceNumber}.pdf`);
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

  const getTypeColor = (type) => {
    return type === 'Credit' 
      ? 'text-green-600 font-semibold' 
      : 'text-red-600 font-semibold';
  };

  const totalAmount = filteredTransactions.reduce((sum, t) => {
    return sum + (t.type === 'Credit' ? t.amount : -t.amount);
  }, 0);

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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
            <p className="text-gray-600">View and download invoices for all your transactions</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
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
                    ${Math.abs(totalAmount).toFixed(2)}
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

          {/* Search and Filter Section */}
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

          {/* Transactions Table */}
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
                      Invoice
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
                          <div className="text-sm text-gray-900">{transaction.description}</div>
                          <div className="text-xs text-gray-500">{transaction.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getTypeColor(transaction.type)}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getTypeColor(transaction.type)}>
                            {transaction.type === 'Credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
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
                            <span>Download</span>
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
                          <span className="text-sm font-semibold text-gray-900">{transaction.id}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{transaction.invoiceNumber}</p>
                      </div>
                      <span className={getTypeColor(transaction.type)}>
                        {transaction.type === 'Credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{transaction.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                      <span>{moment(transaction.date).format('MMM DD, YYYY hh:mm A')}</span>
                      <span>•</span>
                      <span>{transaction.paymentMethod}</span>
                      <span>•</span>
                      <span className={getTypeColor(transaction.type)}>{transaction.type}</span>
                    </div>
                    <button
                      onClick={() => generatePDF(transaction)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <FiDownload size={16} />
                      <span>Download Invoice</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination Info */}
          {filteredTransactions.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
