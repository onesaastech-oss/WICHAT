import React, { useState, useEffect, useRef } from 'react';
import { FiCheck, FiCreditCard, FiZap, FiGitBranch, FiCode, FiTrendingUp, FiMail, FiCpu, FiChevronDown, FiChevronUp } from 'react-icons/fi';

function MyPlan() {
    const [addons, setAddons] = useState([]);
    const [purchasedAddons, setPurchasedAddons] = useState([]);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [expandedAddons, setExpandedAddons] = useState([]);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [loading, setLoading] = useState(true);

    const paymentSectionRef = useRef(null);

    const basePlan = {
        id: 1,
        name: 'Basic Plan',
        priceMonthly: 299,
        priceYearly: 2999,
        currency: 'INR',
        features: [
            '500 Contacts',
            '30 Monthly Campaigns',
            '5 Bot Replies',
            '5 Bot Flows',
            '5 Contact Custom Fields',
            '5 Team Members/Agents',
            'Basic Support'
        ]
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));

                const mockAddons = [
                    {
                        id: 1,
                        name: 'Bot Auto Reply',
                        description: 'Automated responses for customer queries',
                        priceMonthly: 149,
                        priceYearly: 1499,
                        currency: 'INR',
                        icon: FiZap,
                        features: ['Unlimited Auto Replies', 'Custom Response Templates', '24/7 Automation']
                    },
                    {
                        id: 2,
                        name: 'Flow Builder',
                        description: 'Visual workflow automation builder',
                        priceMonthly: 199,
                        priceYearly: 1999,
                        currency: 'INR',
                        icon: FiGitBranch,
                        features: ['Unlimited Bot Flows', 'Drag & Drop Builder', 'Advanced Logic']
                    },
                    {
                        id: 3,
                        name: 'API Access',
                        description: 'Full API and webhook integration',
                        priceMonthly: 249,
                        priceYearly: 2499,
                        currency: 'INR',
                        icon: FiCode,
                        features: ['REST API Access', 'Webhooks', 'Developer Documentation']
                    },
                    {
                        id: 4,
                        name: 'Lead Management',
                        description: 'Advanced lead tracking and nurturing',
                        priceMonthly: 179,
                        priceYearly: 1799,
                        currency: 'INR',
                        icon: FiTrendingUp,
                        features: ['Lead Scoring', 'Pipeline Management', 'Analytics Dashboard']
                    },
                    {
                        id: 5,
                        name: 'Email Campaigns',
                        description: 'Unlimited email marketing campaigns',
                        priceMonthly: 129,
                        priceYearly: 1299,
                        currency: 'INR',
                        icon: FiMail,
                        features: ['Unlimited Campaigns', 'Email Templates', 'A/B Testing']
                    },
                    {
                        id: 6,
                        name: 'AI Chat Bot',
                        description: 'Intelligent AI-powered conversations',
                        priceMonthly: 299,
                        priceYearly: 2999,
                        currency: 'INR',
                        icon: FiCpu,
                        features: ['Natural Language Processing', 'Smart Learning', 'Multi-language Support']
                    }
                ];

                setAddons(mockAddons);
                setPurchasedAddons([1, 6]);
                setSelectedAddons([1, 6]);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
        const basePrice = billingCycle === 'monthly' ? basePlan.priceMonthly : basePlan.priceYearly;
        const addonsPrice = selectedAddons.reduce((sum, addonId) => {
            const addon = addons.find(a => a.id === addonId);
            if (addon) {
                const price = billingCycle === 'monthly' ? addon.priceMonthly : addon.priceYearly;
                return sum + price;
            }
            return sum;
        }, 0);
        
        return basePrice + addonsPrice;
    };

    const handlePayment = () => {
        const newAddons = selectedAddons.filter(id => !purchasedAddons.includes(id));
        if (newAddons.length > 0) {
            alert(`Processing payment for new addons: ${newAddons.map(id => addons.find(a => a.id === id)?.name).join(', ')}`);
        } else {
            alert('No new addons to purchase');
        }
    };

    const AddonListItem = ({ addon }) => {
        const isSelected = selectedAddons.includes(addon.id);
        const isPurchased = purchasedAddons.includes(addon.id);
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
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected 
                                    ? 'bg-indigo-600 border-indigo-600' 
                                    : 'border-gray-300 hover:border-indigo-400'
                            }`}
                        >
                            {isSelected && <FiCheck className="w-3 h-3 text-white" />}
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
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-xl font-semibold text-gray-900">Subscription & Add-ons</h1>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32 sm:pb-8">
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
                            <span className={`ml-1.5 sm:ml-2 text-xs px-1.5 py-0.5 rounded ${
                                billingCycle === 'yearly' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-green-50 text-green-700'
                            }`}>
                                -16%
                            </span>
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
                        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-700 mb-2">
                                        Base Plan
                                    </div>
                                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">{basePlan.name}</h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Essential features to get started</p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                        ₹{(billingCycle === 'monthly' ? basePlan.priceMonthly : basePlan.priceYearly).toLocaleString()}
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

                        {/* Add-ons List */}
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

                        {/* Payment Summary - Fixed on mobile, static on desktop */}
                        <div ref={paymentSectionRef} className="fixed sm:static bottom-0 left-0 right-0 bg-gray-50 border-t sm:border sm:border-gray-200 sm:rounded-lg p-4 sm:p-6 shadow-lg sm:shadow-none z-10">
                            <div className="flex flex-col gap-4">
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Plan Summary</h3>
                                    <div className="space-y-2 max-h-32 sm:max-h-none overflow-y-auto">
                                        <div className="flex items-center justify-between text-xs sm:text-sm">
                                            <span className="text-gray-600">Base Plan</span>
                                            <span className="font-medium text-gray-900">
                                                ₹{(billingCycle === 'monthly' ? basePlan.priceMonthly : basePlan.priceYearly).toLocaleString()}
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
                                                                {purchasedAddons.includes(addonId) && (
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
                                    {selectedAddons.filter(id => !purchasedAddons.includes(id)).length > 0 ? (
                                        <>
                                            <p className="text-xs text-gray-500">
                                                {selectedAddons.filter(id => !purchasedAddons.includes(id)).length} new add-on(s)
                                            </p>
                                            <button
                                                onClick={handlePayment}
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
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default MyPlan;