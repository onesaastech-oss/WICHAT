import React, { useState, useEffect, useRef } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { Link } from 'react-router-dom';
import { FiCheck, FiCreditCard, FiArrowRight } from 'react-icons/fi';

function MyPlan() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [plans, setPlans] = useState([]);
    const [activePlan, setActivePlan] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
    const [loading, setLoading] = useState(true);
    
    // Ref for the payment section to scroll to
    const paymentSectionRef = useRef(null);

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

    // Fetch plans and active plan data (simulated)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Mock data for plans
                const mockPlans = [
                    {
                        id: 1,
                        name: 'Standard',
                        priceMonthly: 499,
                        priceYearly: 4999,
                        currency: 'INR',
                        features: [
                            '1000 Contacts',
                            '60 monthly Campaigns',
                            '10 Bot Replies',
                            '10 Bot Flows',
                            '10 Contact Custom Fields',
                            '10 Team Members/Agents',
                            'AI Chat Bot',
                            'API and Webhook Access'
                        ],
                        popular: false
                    },
                    {
                        id: 2,
                        name: 'Premium',
                        priceMonthly: 999,
                        priceYearly: 9999,
                        currency: 'INR',
                        features: [
                            '10000 Contacts',
                            '120 monthly Campaigns',
                            '100 Bot Replies',
                            '50 Bot Flows',
                            '50 Contact Custom Fields',
                            '20 Team Members/Agents',
                            'AI Chat Bot',
                            'API and Webhook Access'
                        ],
                        popular: true
                    },
                    {
                        id: 3,
                        name: 'Ultimate',
                        priceMonthly: 1999,
                        priceYearly: 19999,
                        currency: 'INR',
                        features: [
                            'Unlimited Contacts',
                            'Unlimited Campaigns',
                            'Unlimited Bot Replies',
                            'Unlimited Bot Flows',
                            'Unlimited Contact Custom Fields',
                            'Unlimited Team Members/Agents',
                            'AI Chat Bot',
                            'API and Webhook Access'
                        ],
                        popular: false
                    },
                    {
                        id: 4,
                        name: 'Manual/Prepaid Subscription',
                        priceMonthly: 0,
                        priceYearly: 0,
                        currency: 'INR',
                        features: [
                            'Pay with any UPI',
                            'Custom pricing based on usage',
                            'Flexible payment options',
                            'All features available'
                        ],
                        popular: false,
                        custom: true
                    }
                ];

                setPlans(mockPlans);
                
                // Set active plan (simulate that Premium is the current active plan)
                setActivePlan(mockPlans[1]);
                setSelectedPlan(mockPlans[1]);
            } catch (error) {
                console.error('Failed to fetch plans:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handlePlanSelect = (plan) => {
        const previousSelection = selectedPlan;
        setSelectedPlan(plan);
        
        // Only scroll if the selection changed and it's not the active plan
        if (previousSelection?.id !== plan.id && activePlan?.id !== plan.id) {
            // Use setTimeout to ensure state update is processed before scrolling
            setTimeout(() => {
                if (paymentSectionRef.current) {
                    paymentSectionRef.current.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 10);
        }
    };

    const handleBillingCycleChange = (cycle) => {
        setBillingCycle(cycle);
    };

    const handlePayment = () => {
        // Handle payment logic here
        alert(`Proceeding to payment for ${selectedPlan.name} plan (${billingCycle})`);
    };

    const PlanCard = ({ plan, isActive, onSelect }) => {
        const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
        const billingText = billingCycle === 'monthly' ? 'monthly' : 'yearly';
        const isSelected = selectedPlan && selectedPlan.id === plan.id;
        
        return (
            <div 
                className={`relative border rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                    isActive ? 'border-indigo-500 ring-2 ring-indigo-500' : 
                    isSelected ? 'border-indigo-400 ring-1 ring-indigo-400' : 
                    'border-gray-200 hover:border-indigo-300'
                } ${plan.popular ? 'bg-indigo-50' : 'bg-white'}`}
                onClick={() => onSelect(plan)}
            >
                {plan.popular && (
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                        MOST POPULAR
                    </div>
                )}
                
                {isActive && (
                    <div className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                        CURRENT PLAN
                    </div>
                )}
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                
                {plan.custom ? (
                    <div className="my-4">
                        <p className="text-gray-700">Custom Pricing</p>
                    </div>
                ) : (
                    <div className="my-4">
                        <span className="text-3xl font-bold text-gray-900">{price.toLocaleString()}</span>
                        <span className="text-gray-600"> {plan.currency} / {billingText}</span>
                        {billingCycle === 'yearly' && (
                            <div className="text-sm text-green-600 mt-1">Save 16% with yearly billing</div>
                        )}
                    </div>
                )}
                
                <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <FiCheck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="ml-2 text-gray-700">{feature}</span>
                        </li>
                    ))}
                </ul>
                
                <div className={`px-4 py-2 text-center rounded-md font-medium ${
                    isActive ? 'bg-gray-200 text-gray-700' : 
                    isSelected ? 'bg-indigo-600 text-white' : 
                    'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}>
                    {isActive ? 'Current Plan' : isSelected ? 'Selected' : 'Select Plan'}
                </div>
            </div>
        );
    };

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
                                Subscription Plans
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Choose the plan that works best for your business needs
                            </p>
                        </div>
                    </div>

                    {/* Billing cycle toggle */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex rounded-md shadow-sm" role="group">
                            <button
                                type="button"
                                onClick={() => handleBillingCycleChange('monthly')}
                                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                                    billingCycle === 'monthly'
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-500'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                Monthly Billing
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBillingCycleChange('yearly')}
                                className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                                    billingCycle === 'yearly'
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-500'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                Yearly Billing (Save 16%)
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        // Skeleton loading
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="border rounded-lg p-6 bg-white">
                                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                                    <div className="h-8 bg-gray-200 rounded w-2/3 mb-6 animate-pulse"></div>
                                    <div className="space-y-3 mb-6">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((feature) => (
                                            <div key={feature} className="flex items-center">
                                                <div className="h-5 w-5 bg-gray-200 rounded-full mr-2 animate-pulse"></div>
                                                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Plans grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {plans.map((plan) => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        isActive={activePlan && activePlan.id === plan.id}
                                        onSelect={handlePlanSelect}
                                    />
                                ))}
                            </div>

                            {/* Payment section with ref for scrolling */}
                            <div ref={paymentSectionRef} className="bg-white shadow rounded-lg p-6 transition-all duration-300">
                                <div className="md:flex md:items-center md:justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {selectedPlan.name} Plan
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {selectedPlan.custom ? (
                                                "Custom pricing based on your usage"
                                            ) : billingCycle === 'monthly' ? (
                                                `${selectedPlan.priceMonthly.toLocaleString()} ${selectedPlan.currency} per month`
                                            ) : (
                                                `${selectedPlan.priceYearly.toLocaleString()} ${selectedPlan.currency} per year`
                                            )}
                                        </p>
                                    </div>
                                    
                                    {activePlan && activePlan.id !== selectedPlan.id && (
                                        <div className="mt-4 md:mt-0">
                                            <button
                                                onClick={handlePayment}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                            >
                                                <FiCreditCard className="mr-2" />
                                                Pay Now
                                            </button>
                                        </div>
                                    )}
                                    
                                    {activePlan && activePlan.id === selectedPlan.id && (
                                        <div className="mt-4 md:mt-0">
                                            <div className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-gray-700 bg-gray-100">
                                                <FiCheck className="mr-2 text-green-500" />
                                                Current Active Plan
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {activePlan && activePlan.id !== selectedPlan.id && (
                                    <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                                        <p className="text-sm text-yellow-800">
                                            You are about to change your subscription from {activePlan.name} to {selectedPlan.name} plan.
                                            {!selectedPlan.custom && ` This will cost ${billingCycle === 'monthly' 
                                                ? `${selectedPlan.priceMonthly.toLocaleString()} ${selectedPlan.currency} per month`
                                                : `${selectedPlan.priceYearly.toLocaleString()} ${selectedPlan.currency} per year`}.`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MyPlan;