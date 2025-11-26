import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCopy,
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiRefreshCw
} from 'react-icons/fi';
import { Header, Sidebar } from '../component/Menu';
import toast from 'react-hot-toast';
import { checkPaymentStatus } from '../api/auth';
import { fetchProjectInfo } from '../store/projectSlice';
import { useDispatch } from 'react-redux';
import moment from 'moment';

const PaymentStatus = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebarMinimized');
    return saved ? JSON.parse(saved) : false;
  });
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  // Get project_id from localStorage
  const getProjectId = () => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.selected_project_id || null;
      }
    } catch (error) {
      console.error('Error getting project_id:', error);
    }
    return null;
  };

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

  // Fetch payment status
  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get order_id from location state, URL params, or sessionStorage
        const orderId = 
          location.state?.orderId || 
          searchParams.get('order_id') ||
          (() => {
            try {
              const pending = sessionStorage.getItem('pending_payment');
              return pending ? JSON.parse(pending).order_id : null;
            } catch {
              return null;
            }
          })();

        if (!orderId) {
          setError('Order ID not found');
          setLoading(false);
          return;
        }

        const project_id = getProjectId();
        if (!project_id) {
          setError('Project ID not found');
          setLoading(false);
          return;
        }

        const response = await checkPaymentStatus({
          project_id,
          order_id: orderId
        });

        if (response.error) {
          setError(response.msg || 'Failed to fetch payment status');
          setLoading(false);
          return;
        }

        setPaymentData(response);
        
        // Refresh wallet balance if payment is successful
        if (response.status?.toUpperCase() === 'SUCCESS') {
          dispatch(fetchProjectInfo());
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching payment status:', err);
        setError(err.message || 'Failed to fetch payment status');
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [location.state, searchParams, dispatch]);

  const handleCopy = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Unable to copy');
    }
  };

  const getStatusConfig = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'SUCCESS':
        return {
          icon: <FiCheckCircle className="text-green-600" size={48} />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          badgeColor: 'bg-green-100 text-green-800',
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully'
        };
      case 'FAILED':
        return {
          icon: <FiXCircle className="text-red-600" size={48} />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          badgeColor: 'bg-red-100 text-red-800',
          title: 'Payment Failed',
          description: 'Your payment could not be processed'
        };
      case 'PENDING':
        return {
          icon: <FiClock className="text-yellow-600" size={48} />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          badgeColor: 'bg-yellow-100 text-yellow-800',
          title: 'Payment Pending',
          description: 'Your payment is being processed'
        };
      default:
        return {
          icon: <FiClock className="text-gray-600" size={48} />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          badgeColor: 'bg-gray-100 text-gray-800',
          title: 'Payment Status',
          description: 'Checking payment status'
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return moment(dateString).format('DD MMM YYYY, hh:mm A');
    } catch {
      return dateString;
    }
  };

  if (loading) {
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FiRefreshCw size={48} className="text-indigo-600" />
              </motion.div>
              <p className="mt-4 text-gray-600">Loading payment status...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !paymentData) {
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center">
                <FiXCircle className="mx-auto text-red-600" size={64} />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Error</h2>
                <p className="mt-2 text-gray-600">{error}</p>
                <button
                  onClick={() => navigate('/wallet-recharge')}
                  className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Back to Wallet Recharge
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(paymentData?.status);

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/wallet-recharge')}
            className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors mb-6"
          >
            <FiArrowLeft className="mr-2" size={18} />
            Back to Wallet Recharge
          </button>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 border-2 ${statusConfig.borderColor}`}
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {statusConfig.icon}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {statusConfig.title}
              </h1>
              <p className="text-gray-600 mb-4">{statusConfig.description}</p>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.badgeColor}`}>
                {paymentData?.status || 'UNKNOWN'}
              </span>
            </div>
          </motion.div>

          {/* Payment Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FiFileText className="mr-2 text-indigo-600" size={24} />
              Payment Details
            </h2>

            <div className="space-y-4">
              {/* Amount */}
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center">
                  <FiDollarSign className="text-indigo-600 mr-3" size={20} />
                  <span className="font-semibold text-gray-700">Amount</span>
                </div>
                <span className="text-2xl font-bold text-indigo-600">
                  ₹{paymentData?.amount?.toFixed(2) || '0.00'}
                </span>
              </div>

              {/* Payment Type */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <FiCreditCard className="text-gray-600 mr-3" size={20} />
                  <span className="font-medium text-gray-700">Payment Type</span>
                </div>
                <span className="text-gray-900 font-semibold">
                  {paymentData?.type || 'N/A'}
                </span>
              </div>

              {/* Order ID */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <FiFileText className="text-gray-600 mr-3" size={20} />
                  <span className="font-medium text-gray-700">Order ID</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-mono text-sm break-all">
                    {paymentData?.order_id || 'N/A'}
                  </span>
                  {paymentData?.order_id && (
                    <button
                      onClick={() => handleCopy(paymentData.order_id, 'Order ID')}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      <FiCopy size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Payment ID */}
              {paymentData?.payment_id && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <FiCreditCard className="text-gray-600 mr-3" size={20} />
                    <span className="font-medium text-gray-700">Payment ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-mono text-sm">
                      {paymentData.payment_id}
                    </span>
                    <button
                      onClick={() => handleCopy(paymentData.payment_id, 'Payment ID')}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      <FiCopy size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* UTR */}
              {paymentData?.utr && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <FiFileText className="text-gray-600 mr-3" size={20} />
                    <span className="font-medium text-gray-700">UTR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-mono text-sm">
                      {paymentData.utr}
                    </span>
                    <button
                      onClick={() => handleCopy(paymentData.utr, 'UTR')}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      <FiCopy size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Date */}
              {paymentData?.create_date && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <FiCalendar className="text-gray-600 mr-3" size={20} />
                    <span className="font-medium text-gray-700">Transaction Date</span>
                  </div>
                  <span className="text-gray-900">
                    {formatDate(paymentData.create_date)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* User Information */}
          {paymentData?.name && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FiUser className="mr-2 text-indigo-600" size={24} />
                User Information
              </h2>

              <div className="space-y-4">
                {paymentData.name && (
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <FiUser className="text-gray-600 mr-3" size={20} />
                      <span className="font-medium text-gray-700">Name</span>
                    </div>
                    <span className="text-gray-900 font-semibold">{paymentData.name}</span>
                  </div>
                )}

                {paymentData.email && (
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <FiMail className="text-gray-600 mr-3" size={20} />
                      <span className="font-medium text-gray-700">Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{paymentData.email}</span>
                      <button
                        onClick={() => handleCopy(paymentData.email, 'Email')}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <FiCopy size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {paymentData.mobile && (
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <FiPhone className="text-gray-600 mr-3" size={20} />
                      <span className="font-medium text-gray-700">Mobile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{paymentData.mobile}</span>
                      <button
                        onClick={() => handleCopy(paymentData.mobile, 'Mobile')}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <FiCopy size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Created By Information */}
          {paymentData?.create_by && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6 sm:p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FiUser className="mr-2 text-indigo-600" size={24} />
                Created By
              </h2>

              <div className="space-y-4">
                {paymentData.create_by.name && (
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <FiUser className="text-gray-600 mr-3" size={20} />
                      <span className="font-medium text-gray-700">Name</span>
                    </div>
                    <span className="text-gray-900 font-semibold">
                      {paymentData.create_by.name}
                    </span>
                  </div>
                )}

                {paymentData.create_by.email && (
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <FiMail className="text-gray-600 mr-3" size={20} />
                      <span className="font-medium text-gray-700">Email</span>
                    </div>
                    <span className="text-gray-900">{paymentData.create_by.email}</span>
                  </div>
                )}

                {paymentData.create_by.mobile && (
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <FiPhone className="text-gray-600 mr-3" size={20} />
                      <span className="font-medium text-gray-700">Mobile</span>
                    </div>
                    <span className="text-gray-900">{paymentData.create_by.mobile}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/transactions')}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              View All Transactions
            </button>
            <button
              onClick={() => navigate('/wallet-recharge')}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Recharge Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;

