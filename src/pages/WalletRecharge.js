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
import { createPaymentOrder, verifyPayment, validatePromoCode } from '../api/auth';

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
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const walletBalance = useSelector((state) => state.project.walletBalance);

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

  // Initialize Razorpay payment
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

    setProcessing(true);

    try {
      // Create payment order via API
      const orderResponse = await createPaymentOrder({
        amount: getPayableAmount(),
        currency: 'INR',
        payment_method: selectedPaymentMethod
      });

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to create payment order');
      }

      const order = orderResponse.data;

      // Razorpay integration
      const options = {
        key: order.razorpay_key || process.env.REACT_APP_RAZORPAY_KEY || 'rzp_test_XXXXXXXXXXXXXXX',
        amount: getPayableAmount() * 100, // Amount in paise
        currency: 'INR',
        name: 'WICHAT',
        description: 'Wallet Recharge',
        image: '/logo192.png',
        order_id: order.order_id || order.id, // Use the order_id from backend
        handler: function (response) {
          handlePaymentSuccess(response);
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
          contact: '9999999999'
        },
        notes: {
          amount: amount,
          bonus: getBonus(),
          discount: promoApplied ? discount : 0
        },
        theme: {
          color: '#4F46E5'
        },
        method: {
          upi: selectedPaymentMethod === 'upi',
          card: selectedPaymentMethod === 'card',
          netbanking: selectedPaymentMethod === 'netbanking',
          wallet: selectedPaymentMethod === 'wallet'
        }
      };

      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response) {
          handlePaymentFailure(response.error);
        });
        razorpay.open();
        setProcessing(false);
      };
      script.onerror = () => {
        toast.error('Failed to load payment gateway');
        setProcessing(false);
      };
      document.body.appendChild(script);

    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error('Failed to initialize payment');
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      // Verify payment with backend
      const verifyResponse = await verifyPayment({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        amount: getActiveAmount(),
        bonus: getBonus(),
        discount: promoApplied ? discount : 0
      });

      if (!verifyResponse.success) {
        throw new Error('Payment verification failed');
      }

      toast.success('Payment successful! Wallet updated.');
      
      // Refresh wallet balance
      dispatch(fetchProjectInfo());
      
      // Redirect to transactions page after 2 seconds
      setTimeout(() => {
        navigate('/transactions');
      }, 2000);
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed. Please contact support.');
    }
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    toast.error(error.description || 'Payment failed. Please try again.');
    setProcessing(false);
  };

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
    </div>
  );
};

export default WalletRecharge;

