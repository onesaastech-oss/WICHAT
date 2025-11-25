import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiCreditCard,
  FiDollarSign,
  FiCheck,
  FiX,
  FiArrowLeft,
  FiShield,
  FiLock,
  FiSmartphone,
  FiChevronRight,
  FiZap,
  FiGift,
  FiRefreshCw
} from 'react-icons/fi';
import { BsBank2, BsWallet2 } from 'react-icons/bs';
import { MdQrCodeScanner } from 'react-icons/md';
import { Header, Sidebar } from '../component/Menu';
import toast from 'react-hot-toast';
import { fetchProjectInfo } from '../store/projectSlice';
import { createPaymentOrder, validatePromoCode } from '../api/auth';
import { SiGooglepay, SiPhonepe, SiPaytm } from 'react-icons/si';

const WalletRecharge = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showUpiApps, setShowUpiApps] = useState(false);
  const [qrIntent, setQrIntent] = useState(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const walletBalance = useSelector((state) => state.project.walletBalance);

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

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Predefined amount options
  const amountOptions = [
    { value: 100, label: '₹100', bonus: 0 },
    { value: 500, label: '₹500', bonus: 25, popular: false },
    { value: 1000, label: '₹1,000', bonus: 75, popular: true },
    { value: 2000, label: '₹2,000', bonus: 200, popular: false },
    { value: 5000, label: '₹5,000', bonus: 600, popular: false },
    { value: 10000, label: '₹10,000', bonus: 1500, popular: false }
  ];

  // Payment methods
  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: <MdQrCodeScanner className="text-indigo-600" size={28} />,
      description: 'PhonePe, Google Pay, Paytm',
      recommended: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <FiCreditCard className="text-indigo-600" size={28} />,
      description: 'Visa, Mastercard, RuPay, Amex',
      recommended: false
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: <BsBank2 className="text-indigo-600" size={26} />,
      description: 'All major banks',
      recommended: false
    },
    {
      id: 'wallet',
      name: 'Wallets',
      icon: <BsWallet2 className="text-indigo-600" size={26} />,
      description: 'Paytm, PhonePe, Amazon Pay',
      recommended: false
    }
  ];

  const getActiveAmount = () => {
    if (customAmount && !isNaN(parseFloat(customAmount))) {
      return parseFloat(customAmount);
    }
    return selectedAmount;
  };

  const getBonus = () => {
    const amount = getActiveAmount();
    if (!amount) return 0;
    
    const option = amountOptions.find(opt => opt.value === amount);
    if (option) return option.bonus;
    
    // Calculate bonus for custom amounts
    if (amount >= 10000) return Math.floor(amount * 0.15);
    if (amount >= 5000) return Math.floor(amount * 0.12);
    if (amount >= 2000) return Math.floor(amount * 0.10);
    if (amount >= 1000) return Math.floor(amount * 0.075);
    if (amount >= 500) return Math.floor(amount * 0.05);
    return 0;
  };

  const getTotalAmount = () => {
    const amount = getActiveAmount();
    if (!amount) return 0;
    const bonus = getBonus();
    const discountAmount = promoApplied ? (amount * discount / 100) : 0;
    return amount + bonus - discountAmount;
  };

  const getPayableAmount = () => {
    const amount = getActiveAmount();
    if (!amount) return 0;
    const discountAmount = promoApplied ? (amount * discount / 100) : 0;
    return amount - discountAmount;
  };

  const handleAmountSelect = (value) => {
    setSelectedAmount(value);
    setCustomAmount(value.toString());
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount(null);
    }
  };

  const applyPromoCode = async () => {
    try {
      // Call API to validate promo code
      const response = await validatePromoCode(promoCode);
      
      if (response.success && response.data) {
        setDiscount(response.data.discount_percentage);
        setPromoApplied(true);
        toast.success(`Promo code applied! ${response.data.discount_percentage}% discount`);
      } else {
        toast.error('Invalid promo code');
      }
    } catch (error) {
      // Fallback to mock validation for testing
      const validPromoCodes = {
        'FIRST10': 10,
        'SAVE20': 20,
        'WELCOME15': 15
      };

      if (validPromoCodes[promoCode.toUpperCase()]) {
        setDiscount(validPromoCodes[promoCode.toUpperCase()]);
        setPromoApplied(true);
        toast.success(`Promo code applied! ${validPromoCodes[promoCode.toUpperCase()]}% discount`);
      } else {
        toast.error('Invalid promo code');
      }
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setPromoApplied(false);
    setDiscount(0);
  };

  // Initialize payment
  const initializePayment = async () => {
    const amount = getActiveAmount();
    
    if (!amount || amount < 10) {
      toast.error('Please enter a valid amount (minimum ₹10)');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    const project_id = getProjectId();
    if (!project_id) {
      toast.error('Please select a project first');
      return;
    }

    setProcessing(true);

    try {
      // Get current URL for redirect
      const redirect_url = 'https://wichat-sigma.vercel.app' + '/payment-status';

      // Create payment order via API
      const response = await createPaymentOrder({
        project_id,
        amount: getPayableAmount(),
        redirect_url
      });

      if (response.error) {
        throw new Error(response.msg || 'Failed to create payment order');
      }

      // Store payment details in sessionStorage for verification later
      sessionStorage.setItem('pending_payment', JSON.stringify({
        payment_id: response.payment_id,
        order_id: response.order_id,
        amount: getActiveAmount(),
        bonus: getBonus(),
        discount: promoApplied ? discount : 0
      }));

      // Handle UPI payment method - show UPI apps
      if (selectedPaymentMethod === 'upi' && response.qrIntent) {
        setQrIntent(response.qrIntent);
        setShowUpiApps(true);
        setProcessing(false);
      } else {
        // For other payment methods, redirect to payment URL
        window.location.href = response.paymentUrl;
      }

    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error(error.message || 'Failed to initialize payment');
      setProcessing(false);
    }
  };

  // Open UPI app
  const openUpiApp = (appName) => {
    if (!qrIntent) return;
    
    const upiLink = qrIntent[appName] || qrIntent.defaultUpi;
    
    // Try to open the UPI app
    window.location.href = upiLink;
    
    // After a delay, show a message
    setTimeout(() => {
      toast.success('Opening payment app...');
    }, 500);
  };

  // Check for payment callback on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');
    
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Wallet updated.');
      
      // Clear pending payment
      sessionStorage.removeItem('pending_payment');
      
      // Refresh wallet balance
      dispatch(fetchProjectInfo());
      
      // Clean URL and redirect after delay
      setTimeout(() => {
        window.history.replaceState({}, '', '/wallet-recharge');
        navigate('/transactions');
      }, 2000);
    } else if (paymentStatus === 'failed') {
      toast.error('Payment failed. Please try again.');
      
      // Clear pending payment
      sessionStorage.removeItem('pending_payment');
      
      // Clean URL
      window.history.replaceState({}, '', '/wallet-recharge');
    }
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
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

      <div
        className={`transition-all duration-300 mt-16 w-full ${
          isMinimized ? 'md:ml-[72px]' : 'md:ml-[280px]'
        }`}
        style={{
          width: window.innerWidth >= 768 ? (isMinimized ? 'calc(100% - 72px)' : 'calc(100% - 280px)') : '100%'
        }}
      >
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 w-full">
          <div className="max-w-6xl mx-auto w-full">
            {/* Header */}
            {/* <div className="mb-4 sm:mb-6 lg:mb-8">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors mb-3 sm:mb-4 text-sm sm:text-base"
              >
                <FiArrowLeft className="mr-2" size={18} />
                Back
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Recharge Wallet</h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Add money to your WICHAT wallet</p>
                </div>

              </div>
            </div> */}

            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Left Column - Amount Selection */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Amount Options */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  ₹
                    Select Amount
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {amountOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => handleAmountSelect(option.value)}
                        className={`relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                          selectedAmount === option.value
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300 bg-white active:border-indigo-400'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {option.popular && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold flex items-center">
                            <FiZap size={10} className="mr-0.5 sm:mr-1" />
                            Popular
                          </div>
                        )}
                        <div className="text-xl sm:text-2xl font-bold text-gray-900">{option.label}</div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Or enter custom amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-base sm:text-lg">₹</span>
                      <input
                        type="text"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        placeholder="Enter amount (min ₹10)"
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-indigo-600 focus:ring-0 text-base sm:text-lg"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Payment Methods */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <FiCreditCard className="mr-2 text-indigo-600" size={20} />
                    Payment Method
                  </h2>
                  <div className="space-y-2 sm:space-y-3">
                    {paymentMethods.map((method) => (
                      <motion.button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                          selectedPaymentMethod === method.id
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300 bg-white active:border-indigo-400'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-50 mr-3 sm:mr-4">
                            {method.icon}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                              <span className="font-semibold text-sm sm:text-base text-gray-900">{method.name}</span>
                              {method.recommended && (
                                <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 rounded-full font-semibold">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500">{method.description}</span>
                          </div>
                        </div>
                        <FiChevronRight
                          className={`text-lg sm:text-xl flex-shrink-0 ${
                            selectedPaymentMethod === method.id ? 'text-indigo-600' : 'text-gray-400'
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

              </div>

              {/* Right Column - Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-24"
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Payment Summary</h2>
                  
                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <div className="flex justify-between text-gray-700 text-sm sm:text-base">
                      <span>Recharge Amount</span>
                      <span className="font-semibold">₹{getActiveAmount() || 0}</span>
                    </div>
                    {getBonus() > 0 && (
                      <div className="flex justify-between text-green-600 text-sm sm:text-base">
                        <span className="flex items-center">
                          <FiGift className="mr-1" size={14} />
                          Bonus
                        </span>
                        <span className="font-semibold">+₹{getBonus()}</span>
                      </div>
                    )}
                    {promoApplied && (
                      <div className="flex justify-between text-green-600 text-sm sm:text-base">
                        <span>Discount ({discount}%)</span>
                        <span className="font-semibold">-₹{(getActiveAmount() * discount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 sm:pt-4">
                      <div className="flex justify-between text-gray-700 mb-2 text-sm sm:text-base">
                        <span>You Pay</span>
                        <span className="font-semibold">₹{getPayableAmount().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base sm:text-lg font-bold text-indigo-600">
                        <span>Total Credit</span>
                        <span>₹{getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={initializePayment}
                    disabled={!getActiveAmount() || !selectedPaymentMethod || processing}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center"
                  >
                    {processing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <FiRefreshCw size={18} />
                        </motion.div>
                        <span className="text-sm sm:text-base">Processing...</span>
                      </>
                    ) : (
                      <>
                        <FiLock className="mr-2" size={18} />
                        <span className="text-sm sm:text-base">Proceed to Pay</span>
                      </>
                    )}
                  </button>

                  {/* Security Badges */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                    <div className="flex items-center justify-center text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                      <FiShield className="mr-2 text-green-600" size={16} />
                      <span>100% Secure Payment</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 opacity-60">
                      <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-5 sm:h-6 mx-auto grayscale" />
                      <img src="https://www.logo.wine/a/logo/Unified_Payments_Interface/Unified_Payments_Interface-Logo.wine.svg" alt="UPI" className="h-5 sm:h-6 mx-auto grayscale" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-5 sm:h-6 mx-auto grayscale" />
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl">
                    <h3 className="font-semibold text-blue-900 mb-1.5 sm:mb-2 text-xs sm:text-sm">Why recharge?</h3>
                    <ul className="text-[10px] sm:text-xs text-blue-700 space-y-0.5 sm:space-y-1">
                      <li>✓ Send unlimited messages</li>
                      <li>✓ Create campaigns</li>
                      <li>✓ Access premium features</li>
                      <li>✓ Get bonus credits</li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Apps Modal */}
      <AnimatePresence>
        {showUpiApps && qrIntent && (
          <>
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpiApps(false)}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Select UPI App</h2>
                  <button
                    onClick={() => setShowUpiApps(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Google Pay */}
                  <motion.button
                    onClick={() => openUpiApp('gpay')}
                    className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-md">
                      <SiGooglepay className="text-blue-600" size={32} />
                    </div>
                    <span className="font-semibold text-gray-900">Google Pay</span>
                  </motion.button>

                  {/* PhonePe */}
                  <motion.button
                    onClick={() => openUpiApp('phonepe')}
                    className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-md">
                      <SiPhonepe className="text-purple-600" size={32} />
                    </div>
                    <span className="font-semibold text-gray-900">PhonePe</span>
                  </motion.button>

                  {/* Paytm */}
                  <motion.button
                    onClick={() => openUpiApp('paytm')}
                    className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-md">
                      <SiPaytm className="text-blue-500" size={32} />
                    </div>
                    <span className="font-semibold text-gray-900">Paytm</span>
                  </motion.button>

                  {/* BHIM */}
                  <motion.button
                    onClick={() => openUpiApp('bhim')}
                    className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-md">
                      <MdQrCodeScanner className="text-orange-600" size={32} />
                    </div>
                    <span className="font-semibold text-gray-900">BHIM UPI</span>
                  </motion.button>

                  {/* Amazon Pay */}
                  <motion.button
                    onClick={() => openUpiApp('amazonpay')}
                    className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-md">
                      <BsWallet2 className="text-orange-500" size={28} />
                    </div>
                    <span className="font-semibold text-gray-900">Amazon Pay</span>
                  </motion.button>

                  {/* Other UPI */}
                  <motion.button
                    onClick={() => openUpiApp('defaultUpi')}
                    className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-md">
                      <FiSmartphone className="text-indigo-600" size={28} />
                    </div>
                    <span className="font-semibold text-gray-900">Other UPI</span>
                  </motion.button>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-900 text-center">
                    <FiShield className="inline mr-2" />
                    Select your preferred UPI app to complete the payment
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletRecharge;

