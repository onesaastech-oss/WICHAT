import React, { useState, useEffect, useRef } from 'react';
import { FiCheck, FiCreditCard, FiZap, FiGitBranch, FiCode, FiTrendingUp, FiMail, FiCpu, FiChevronDown, FiChevronUp, FiX, FiShield, FiLock, FiSmartphone, FiChevronRight, FiRefreshCw, FiCopy } from 'react-icons/fi';
import { BsBank2, BsWallet2 } from 'react-icons/bs';
import { MdQrCodeScanner } from 'react-icons/md';
import { SiGooglepay, SiPhonepe, SiPaytm, SiAmazonpay } from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header, Sidebar } from '../component/Menu';
import toast from 'react-hot-toast';
import { createPaymentOrder, checkPaymentStatus, getSubscriptionPacks } from '../api/auth';
import QRCode from 'react-qr-code';

function MyPlan() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });
    const [basePlan, setBasePlan] = useState(null);
    const [addons, setAddons] = useState([]);
    const [purchasedAddons, setPurchasedAddons] = useState([]);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [expandedAddons, setExpandedAddons] = useState([]);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [loading, setLoading] = useState(true);
    const [allPacks, setAllPacks] = useState([]);
    const [activeSubscriptionsCount, setActiveSubscriptionsCount] = useState(0);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showUpiApps, setShowUpiApps] = useState(false);
    const [showQrPopup, setShowQrPopup] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const navigate = useNavigate();
    const paymentSectionRef = useRef(null);

    // Persist sidebar minimized state
    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    // Lock body scroll when mobile sidebar is open
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

    // Track window resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    // Reset payment details when amount or payment method changes
    useEffect(() => {
        setPaymentDetails(null);
        setShowUpiApps(false);
        setShowQrPopup(false);
        setIsPolling(false);
        setSelectedPaymentMethod(null);
    }, [selectedAddons, billingCycle]);

    // Lock body scroll when payment modal is open
    useEffect(() => {
        if (showPaymentModal || showUpiApps || showQrPopup) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showPaymentModal, showUpiApps, showQrPopup]);

    // Poll payment status for UPI payments
    useEffect(() => {
        if (!isPolling || !paymentDetails?.orderId) return;

        const project_id = getProjectId();
        if (!project_id) {
            setIsPolling(false);
            return;
        }

        let pollInterval;
        let pollTimeout;

        const checkStatus = async () => {
            try {
                const response = await checkPaymentStatus({
                    project_id,
                    order_id: paymentDetails.orderId
                });

                if (response.error) {
                    console.error('Payment status check error:', response.msg);
                    return;
                }

                const status = response.status?.toUpperCase();

                if (status === 'SUCCESS') {
                    setIsPolling(false);
                    toast.success('Payment successful! Subscription updated.');
                    sessionStorage.removeItem('pending_payment');
                    navigate('/payment-status', { 
                        state: { 
                            paymentStatus: 'success',
                            orderId: response.order_id,
                            paymentId: response.payment_id,
                            amount: response.amount
                        } 
                    });
                } else if (status === 'FAILED') {
                    setIsPolling(false);
                    toast.error('Payment failed. Please try again.');
                    sessionStorage.removeItem('pending_payment');
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            }
        };

        checkStatus();
        pollInterval = setInterval(checkStatus, 3000);

        pollTimeout = setTimeout(() => {
            setIsPolling(false);
            clearInterval(pollInterval);
            toast.error('Payment status check timeout. Please check manually.');
        }, 300000);

        return () => {
            clearInterval(pollInterval);
            clearTimeout(pollTimeout);
        };
    }, [isPolling, paymentDetails?.orderId, navigate]);

    // Check for payment callback on page load
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('status');
        
        if (paymentStatus === 'success') {
            toast.success('Payment successful! Subscription updated.');
            sessionStorage.removeItem('pending_payment');
            setTimeout(() => {
                window.history.replaceState({}, '', '/my-plan');
            }, 2000);
        } else if (paymentStatus === 'failed') {
            toast.error('Payment failed. Please try again.');
            sessionStorage.removeItem('pending_payment');
            window.history.replaceState({}, '', '/my-plan');
        }
    }, []);

    // Icon mapping for addons
    const iconMap = {
        'bot': FiZap,
        'flow': FiGitBranch,
        'api': FiCode,
        'lead': FiTrendingUp,
        'email': FiMail,
        'ai': FiCpu,
        'default': FiZap
    };

    // Get icon based on addon name or features
    const getAddonIcon = (packName) => {
        const name = packName.toLowerCase();
        if (name.includes('bot') || name.includes('reply')) return iconMap.bot;
        if (name.includes('flow') || name.includes('builder')) return iconMap.flow;
        if (name.includes('api') || name.includes('webhook')) return iconMap.api;
        if (name.includes('lead') || name.includes('management')) return iconMap.lead;
        if (name.includes('email') || name.includes('campaign')) return iconMap.email;
        if (name.includes('ai') || name.includes('chat')) return iconMap.ai;
        return iconMap.default;
    };

    // Calculate discount percentage for yearly vs monthly plans
    const calculateYearlyDiscount = () => {
        if (!allPacks || allPacks.length === 0) return null;
        
        // Find monthly and yearly platform packs
        const monthlyPlatform = allPacks.find(
            pack => pack.pack_type === 'platform' && pack.billing_cycle === 'monthly'
        );
        const yearlyPlatform = allPacks.find(
            pack => pack.pack_type === 'platform' && pack.billing_cycle === 'yearly'
        );

        if (!monthlyPlatform || !yearlyPlatform) return null;

        // Calculate savings: (Monthly * 12 - Yearly) / (Monthly * 12) * 100
        const monthlyAnnual = monthlyPlatform.amount * 12;
        const yearlyCost = yearlyPlatform.amount;
        const savings = monthlyAnnual - yearlyCost;
        const discountPercent = Math.round((savings / monthlyAnnual) * 100);

        return discountPercent > 0 ? discountPercent : null;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await getSubscriptionPacks();
                
                if (response.error) {
                    throw new Error(response.msg || 'Failed to fetch subscription packs');
                }

                const packs = response.data || [];
                
                // Store all packs for discount calculation
                setAllPacks(packs);
                
                // Set active subscriptions count
                setActiveSubscriptionsCount(response.active_subscriptions_count || 0);
                
                // Filter packs by current billing cycle
                const currentCyclePacks = packs.filter(pack => pack.billing_cycle === billingCycle);
                
                // Separate platform (base plan) and addons for current billing cycle
                const platformPacks = currentCyclePacks.filter(pack => pack.pack_type === 'platform');
                const addonPacks = currentCyclePacks.filter(pack => pack.pack_type === 'addon');

                // Set base plan - use the first platform pack for current billing cycle
                const currentPlatformPack = platformPacks[0];

                if (currentPlatformPack) {
                    // Transform features - handle both array and object formats
                    let featuresList = [];
                    if (Array.isArray(currentPlatformPack.features)) {
                        featuresList = currentPlatformPack.features;
                    } else if (typeof currentPlatformPack.features === 'object') {
                        featuresList = Object.entries(currentPlatformPack.features).map(([key, value]) => {
                            // Format feature text
                            const formattedKey = key.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ');
                            return `${value} ${formattedKey}`;
                        });
                    }

                    setBasePlan({
                        id: currentPlatformPack.pack_id,
                        name: currentPlatformPack.pack_name,
                        price: currentPlatformPack.amount,
                        currency: 'INR',
                        billingCycle: currentPlatformPack.billing_cycle,
                        description: currentPlatformPack.description,
                        features: featuresList,
                        subscribed: currentPlatformPack.subscribed || false,
                        activeSubscription: currentPlatformPack.active_subscription || null
                    });
                } else {
                    setBasePlan(null);
                }

                // Transform addons for current billing cycle only
                const transformedAddons = addonPacks.map((pack, index) => {
                    // Transform features - handle both array and object formats
                    let featuresList = [];
                    if (Array.isArray(pack.features)) {
                        featuresList = pack.features;
                    } else if (typeof pack.features === 'object') {
                        featuresList = Object.entries(pack.features).map(([key, value]) => {
                            const formattedKey = key.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ');
                            return `${value} ${formattedKey}`;
                        });
                    }

                    return {
                        id: index + 1,
                        packId: pack.pack_id,
                        name: pack.pack_name,
                        description: pack.description || '',
                        priceMonthly: billingCycle === 'monthly' ? pack.amount : 0,
                        priceYearly: billingCycle === 'yearly' ? pack.amount : 0,
                        currency: 'INR',
                        icon: getAddonIcon(pack.pack_name),
                        features: featuresList,
                        billingCycle: pack.billing_cycle,
                        subscribed: pack.subscribed || false,
                        activeSubscription: pack.active_subscription || null
                    };
                });

                setAddons(transformedAddons);
                
                // Set purchased addons based on subscribed status
                const subscribedAddonIds = transformedAddons
                    .filter(addon => addon.subscribed)
                    .map(addon => addon.id);
                
                setPurchasedAddons(subscribedAddonIds);
                setSelectedAddons(subscribedAddonIds);
            } catch (error) {
                console.error('Failed to fetch subscription packs:', error);
                toast.error(error.message || 'Failed to load subscription plans');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [billingCycle]);

    const handleAddonToggle = (addonId) => {
        setSelectedAddons(prev => {
            if (prev.includes(addonId)) {
                return prev.filter(id => id !== addonId);
            } else {
                return [...prev, addonId];
            }
        });

        setTimeout(() => {
            if (paymentSectionRef.current) {
                paymentSectionRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }, 10);
    };

    const toggleAddonExpanded = (addonId) => {
        setExpandedAddons(prev => {
            if (prev.includes(addonId)) {
                return prev.filter(id => id !== addonId);
            } else {
                return [...prev, addonId];
            }
        });
    };

    const calculateTotal = () => {
        if (!basePlan) return 0;
        
        // Only include base plan price if not already subscribed
        const basePrice = basePlan.subscribed ? 0 : (basePlan.price || 0);
        
        // Only calculate price for new (non-subscribed) addons
        const addonsPrice = selectedAddons.reduce((sum, addonId) => {
            const addon = addons.find(a => a.id === addonId);
            if (addon && !addon.subscribed) {
                const price = billingCycle === 'monthly' ? addon.priceMonthly : addon.priceYearly;
                return sum + price;
            }
            return sum;
        }, 0);
        
        return basePrice + addonsPrice;
    };

    // Payment methods
    const paymentMethods = [
        {
            id: 'upi',
            name: 'UPI & QR',
            icon: <MdQrCodeScanner className="text-indigo-600" size={28} />,
            description: 'Pay via UPI apps or QR code',
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

    const upiAppOptions = [
        {
            key: 'gpay',
            label: 'Google Pay',
            icon: <SiGooglepay className="text-blue-600" size={28} />
        },
        {
            key: 'phonepe',
            label: 'PhonePe',
            icon: <SiPhonepe className="text-purple-600" size={28} />
        },
        {
            key: 'paytm',
            label: 'Paytm',
            icon: <SiPaytm className="text-blue-500" size={28} />
        },
        {
            key: 'bhim',
            label: 'BHIM UPI',
            icon: <MdQrCodeScanner className="text-orange-500" size={28} />
        },
        {
            key: 'amazonpay',
            label: 'Amazon Pay',
            icon: <SiAmazonpay className="text-yellow-600" size={28} />
        },
        {
            key: 'navi',
            label: 'Navi',
            icon: <BsWallet2 className="text-indigo-600" size={26} />
        },
        {
            key: 'defaultUpi',
            label: 'Other UPI Apps',
            icon: <FiSmartphone className="text-indigo-600" size={26} />
        }
    ];

    const handlePaymentMethodSelect = async (methodId) => {
        setSelectedPaymentMethod(methodId);
        setShowUpiApps(false);
        setShowQrPopup(false);
        
        // Proceed with payment initialization, passing methodId directly
        await initializePayment(methodId);
    };

    // Initialize payment
    const initializePayment = async (methodId = null) => {
        const newAddons = selectedAddons.filter(id => {
            const addon = addons.find(a => a.id === id);
            return addon && !addon.subscribed;
        });
        
        if (newAddons.length === 0) {
            toast.error('No new addons to purchase');
            return;
        }

        const totalAmount = calculateTotal();
        if (!totalAmount || totalAmount < 1) {
            toast.error('Please select addons to purchase');
            return;
        }

        const paymentMethod = methodId || selectedPaymentMethod;
        if (!paymentMethod) {
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
                amount: totalAmount,
                redirect_url
            });

            if (response.error) {
                throw new Error(response.msg || 'Failed to create payment order');
            }

            // Store payment details in sessionStorage for verification later
            sessionStorage.setItem('pending_payment', JSON.stringify({
                payment_id: response.payment_id,
                order_id: response.order_id,
                amount: totalAmount,
                addons: newAddons
            }));

            // Handle UPI payment method - show payment sheet with QR + UPI apps
            const currentPaymentMethod = methodId || selectedPaymentMethod;
            if (currentPaymentMethod === 'upi' && response.qrIntent) {
                setPaymentDetails({
                    paymentUrl: response.paymentUrl,
                    qrIntent: response.qrIntent,
                    paymentId: response.payment_id,
                    orderId: response.order_id,
                    amount: totalAmount
                });
                setShowPaymentModal(false);
                setShowQrPopup(false);
                if (windowWidth < 768) {
                    setShowUpiApps(true);
                } else {
                    setShowQrPopup(true);
                }
                setProcessing(false);
                // Start polling for payment status
                setIsPolling(true);
            } else {
                setShowPaymentModal(false);
                setProcessing(false);
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
        if (!paymentDetails?.qrIntent) return;
        
        const upiLink = paymentDetails.qrIntent[appName] || paymentDetails.qrIntent.defaultUpi;
        window.location.href = upiLink;
        
        setTimeout(() => {
            toast.success('Opening payment app...');
        }, 500);
    };

    const showUpiModal = () => {
        if (!paymentDetails?.qrIntent) {
            toast.error('Generate the payment request first');
            return;
        }
        setShowQrPopup(false);
        setShowUpiApps(true);
    };

    const showQrModal = () => {
        if (!paymentDetails?.qrIntent) {
            toast.error('Generate the payment request first');
            return;
        }
        setShowUpiApps(false);
        setShowQrPopup(true);
    };

    const handleCloseQrModal = () => {
        setShowQrPopup(false);
        if (paymentDetails?.qrIntent) {
            setShowUpiApps(true);
        }
    };

    const handleCopy = async (text, label) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        } catch (error) {
            toast.error('Unable to copy');
        }
    };

    const AddonListItem = ({ addon }) => {
        const isSelected = selectedAddons.includes(addon.id);
        const isPurchased = addon.subscribed || false;
        const isExpanded = expandedAddons.includes(addon.id);
        const price = billingCycle === 'monthly' ? addon.priceMonthly : addon.priceYearly;
        const billingText = billingCycle === 'monthly' ? 'month' : 'year';
        const IconComponent = addon.icon;

        return (
            <div className="border-b border-gray-200 last:border-b-0">
                <div className="flex items-start gap-3 sm:gap-4 py-4 px-1 hover:bg-gray-50 transition-colors">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-0.5">
                        <button
                            onClick={() => handleAddonToggle(addon.id)}
                            disabled={isPurchased}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected 
                                    ? 'bg-indigo-600 border-indigo-600' 
                                    : isPurchased
                                    ? 'bg-green-100 border-green-300 cursor-not-allowed'
                                    : 'border-gray-300 hover:border-indigo-400'
                            }`}
                        >
                            {(isSelected || isPurchased) && <FiCheck className={`w-3 h-3 ${isPurchased ? 'text-green-700' : 'text-white'}`} />}
                        </button>
                    </div>

                    {/* Icon - Hidden on mobile */}
                    <div className="hidden sm:block flex-shrink-0">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <IconComponent className="w-5 h-5 text-gray-600" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h4 className="text-sm font-medium text-gray-900">{addon.name}</h4>
                                    {isPurchased && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                                            <FiCheck className="w-3 h-3" />
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">{addon.description}</p>
                                
                                {/* Subscription Details */}
                                {isPurchased && addon.activeSubscription && (
                                    <div className="mt-2 flex flex-col gap-1 text-xs">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <span className="font-medium">
                                                {addon.activeSubscription.auto_renew ? 'Renews on:' : 'Valid until:'}
                                            </span>
                                            <span className="text-gray-900 font-semibold">
                                                {new Date(addon.activeSubscription.end_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        {addon.activeSubscription.auto_renew && (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <FiRefreshCw className="w-3 h-3" />
                                                <span>Auto-renewal enabled</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Price and Expand Button */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-gray-900">₹{price.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">/ {billingText}</div>
                                </div>
                                <button
                                    onClick={() => toggleAddonExpanded(addon.id)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {isExpanded ? (
                                        <FiChevronUp className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <FiChevronDown className="w-4 h-4 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        {/* Expandable Details */}
                        {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <ul className="space-y-1.5">
                                    {addon.features.map((feature, index) => (
                                        <li key={index} className="flex items-start text-xs text-gray-600">
                                            <FiCheck className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0 mr-2" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
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
                <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6">
                    {/* Page header */}
                    <div className="mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Subscription & Add-ons</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage your subscription plan and add-ons</p>
                    </div>
                {/* Billing cycle toggle */}
                <div className="flex justify-center sm:justify-end mb-6">
                    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                                billingCycle === 'monthly'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                                billingCycle === 'yearly'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Yearly
                            {calculateYearlyDiscount() && (
                                <span className={`ml-1.5 sm:ml-2 text-xs px-1.5 py-0.5 rounded ${
                                    billingCycle === 'yearly' 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-green-50 text-green-700'
                                }`}>
                                    -{calculateYearlyDiscount()}%
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="grid grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                        <div className="flex-1 h-12 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Base Plan Card */}
                        {basePlan && (
                            <div className={`bg-white border rounded-lg p-4 sm:p-6 mb-6 ${
                                basePlan.subscribed 
                                    ? 'border-green-300 bg-green-50/30' 
                                    : 'border-gray-200'
                            }`}>
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                                Base Plan
                                            </div>
                                            {basePlan.subscribed && (
                                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                                    <FiCheck className="w-3 h-3" />
                                                    Active
                                                </div>
                                            )}
                                        </div>
                                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">{basePlan.name}</h2>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">{basePlan.description || 'Essential features to get started'}</p>
                                        
                                        {/* Subscription Details */}
                                        {basePlan.subscribed && basePlan.activeSubscription && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <span className="font-medium">
                                                            {basePlan.activeSubscription.auto_renew ? 'Renews on:' : 'Valid until:'}
                                                        </span>
                                                        <span className="text-gray-900 font-semibold">
                                                            {new Date(basePlan.activeSubscription.end_date).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    {basePlan.activeSubscription.auto_renew && (
                                                        <div className="flex items-center gap-1 text-green-600">
                                                            <FiRefreshCw className="w-3 h-3" />
                                                            <span>Auto-renewal enabled</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                            ₹{basePlan.price?.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            per {billingCycle === 'monthly' ? 'month' : 'year'}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {basePlan.features.map((feature, index) => (
                                        <div key={index} className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <FiCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add-ons List */}
                        {addons.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-lg mb-6">
                                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">Available Add-ons</h3>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Select additional features to enhance your plan</p>
                                </div>
                                <div className="px-3 sm:px-5">
                                    {addons.map((addon) => (
                                        <AddonListItem key={addon.id} addon={addon} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Summary - Fixed on mobile, static on desktop */}
                        {basePlan && (
                            <div ref={paymentSectionRef} className="fixed sm:static bottom-0 left-0 right-0 bg-gray-50 border-t sm:border sm:border-gray-200 sm:rounded-lg p-4 sm:p-6 shadow-lg sm:shadow-none z-10">
                                <div className="flex flex-col gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Plan Summary</h3>
                                        <div className="space-y-2 max-h-32 sm:max-h-none overflow-y-auto">
                                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                                <span className="text-gray-600">Base Plan</span>
                                                <span className="font-medium text-gray-900">
                                                    ₹{basePlan.price?.toLocaleString()}
                                                </span>
                                            </div>
                                        {selectedAddons.length > 0 && (
                                            <>
                                                {selectedAddons.map(addonId => {
                                                    const addon = addons.find(a => a.id === addonId);
                                                    const price = billingCycle === 'monthly' ? addon.priceMonthly : addon.priceYearly;
                                                    return (
                                                        <div key={addonId} className="flex items-center justify-between text-xs sm:text-sm">
                                                            <span className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                                                                <span className="truncate">{addon.name}</span>
                                                                {addon.subscribed && (
                                                                    <span className="flex-shrink-0 text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Active</span>
                                                                )}
                                                            </span>
                                                            <span className="font-medium text-gray-900 flex-shrink-0">₹{price.toLocaleString()}</span>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )}
                                        <div className="border-t border-gray-300 pt-2 flex items-center justify-between">
                                            <span className="text-xs sm:text-sm font-semibold text-gray-900">Total</span>
                                            <span className="text-base sm:text-lg font-bold text-gray-900">
                                                ₹{calculateTotal().toLocaleString()}
                                                <span className="text-xs sm:text-sm font-normal text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                    {(() => {
                                        const newAddons = selectedAddons.filter(id => {
                                            const addon = addons.find(a => a.id === id);
                                            return addon && !addon.subscribed;
                                        });
                                        return newAddons.length > 0 ? (
                                            <>
                                                <p className="text-xs text-gray-500">
                                                    {newAddons.length} new add-on(s)
                                                </p>
                                                <button
                                                    onClick={() => setShowPaymentModal(true)}
                                                    className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 border border-transparent rounded-lg text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors whitespace-nowrap"
                                                >
                                                    <FiCreditCard className="mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    Continue to Payment
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium text-gray-600 bg-gray-200">
                                                <FiCheck className="mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                Current Plan
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        )}
                    </>
                )}
                </div>
            </div>

            {/* Payment Method Selection Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPaymentModal(false)}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Select Payment Method</h2>
                                    <p className="text-sm text-gray-500 mt-1">Choose your preferred payment option</p>
                                </div>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>

                            {/* Payment Summary */}
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Summary</h3>
                                <div className="space-y-2">
                                    {basePlan && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Base Plan</span>
                                            <span className="font-medium text-gray-900">
                                                ₹{basePlan.price?.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {selectedAddons.filter(id => {
                                        const addon = addons.find(a => a.id === id);
                                        return addon && !addon.subscribed;
                                    }).map(addonId => {
                                        const addon = addons.find(a => a.id === addonId);
                                        const price = billingCycle === 'monthly' ? addon.priceMonthly : addon.priceYearly;
                                        return (
                                            <div key={addonId} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 truncate">{addon.name}</span>
                                                <span className="font-medium text-gray-900 flex-shrink-0 ml-2">₹{price.toLocaleString()}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="border-t border-gray-300 pt-2 flex items-center justify-between">
                                        <span className="text-base font-semibold text-gray-900">Total</span>
                                        <span className="text-lg font-bold text-indigo-600">
                                            ₹{calculateTotal().toLocaleString()}
                                            <span className="text-sm font-normal text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="p-6">
                                <div className="space-y-3">
                                    {paymentMethods.map((method) => (
                                        <motion.button
                                            key={method.id}
                                            onClick={() => handlePaymentMethodSelect(method.id)}
                                            disabled={processing}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                                selectedPaymentMethod === method.id
                                                    ? 'border-indigo-600 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                                            } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            whileHover={!processing ? { scale: 1.01 } : {}}
                                            whileTap={!processing ? { scale: 0.99 } : {}}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-50">
                                                    {method.icon}
                                                </div>
                                                <div className="text-left">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-base text-gray-900">{method.name}</span>
                                                        {method.recommended && (
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                                                Recommended
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-500">{method.description}</span>
                                                </div>
                                            </div>
                                            <FiChevronRight
                                                className={`text-xl flex-shrink-0 ${
                                                    selectedPaymentMethod === method.id ? 'text-indigo-600' : 'text-gray-400'
                                                }`}
                                            />
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Security Badge */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex items-center justify-center text-sm text-gray-500">
                                        <FiShield className="mr-2 text-green-600" size={18} />
                                        <span>100% Secure Payment</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UPI Apps Modal */}
            <AnimatePresence>
                {showUpiApps && paymentDetails?.qrIntent && (
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
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Select UPI App</h2>
                                    <p className="text-sm text-gray-500">Amount: ₹{paymentDetails.amount}</p>
                                </div>
                                <button
                                    onClick={() => setShowUpiApps(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <motion.button
                                    onClick={() => {
                                        setShowUpiApps(false);
                                        showQrModal();
                                    }}
                                    className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-md">
                                        <MdQrCodeScanner className="text-indigo-600" size={32} />
                                    </div>
                                    <span className="font-semibold text-gray-900 text-center">Scan QR</span>
                                </motion.button>

                                {upiAppOptions
                                    .filter((option) => paymentDetails.qrIntent[option.key])
                                    .map((option) => (
                                        <motion.button
                                            key={option.key}
                                            onClick={() => openUpiApp(option.key)}
                                            className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-md">
                                                {option.icon}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-center">{option.label}</span>
                                        </motion.button>
                                    ))}
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4 text-center">
                                <p className="text-sm text-blue-900">
                                    <FiShield className="inline mr-2" />
                                    Select your preferred UPI app or scan the QR to complete the payment
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QR Modal */}
            <AnimatePresence>
                {showQrPopup && paymentDetails?.qrIntent && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseQrModal}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Scan & Pay</h2>
                                    <p className="text-sm text-gray-500">Amount: ₹{paymentDetails.amount}</p>
                                </div>
                                <button
                                    onClick={handleCloseQrModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <div className="bg-indigo-50 p-4 rounded-2xl shadow-inner">
                                    <QRCode
                                        value={paymentDetails.qrIntent.defaultUpi || paymentDetails.paymentUrl}
                                        size={200}
                                        className="w-48 h-48"
                                    />
                                </div>
                                <p className="text-sm text-gray-600 text-center">
                                    Scan using any UPI app to complete your payment.
                                </p>
                                <div className="flex flex-col w-full gap-2">
                                    <button
                                        onClick={() => handleCopy(paymentDetails.qrIntent.defaultUpi, 'UPI intent')}
                                        className="w-full py-2 px-3 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-300 transition-colors flex items-center justify-center"
                                    >
                                        <FiCopy className="mr-2" size={16} /> Copy UPI Intent
                                    </button>
                                    <button
                                        onClick={() => handleCopy(paymentDetails.paymentUrl, 'Payment link')}
                                        className="w-full py-2 px-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center"
                                    >
                                        <FiCopy className="mr-2" size={16} /> Copy Payment Link
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default MyPlan;