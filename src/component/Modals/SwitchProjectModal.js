import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiBriefcase } from 'react-icons/fi';

const SwitchProjectModal = ({ isOpen, onClose, companies = [], onSelectCompany }) => {
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            // Save the current scroll position
            const scrollY = window.scrollY;
            // Disable body scroll
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';

            return () => {
                // Re-enable body scroll when modal closes
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                // Restore scroll position
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    // Default companies if none provided
    const defaultCompanies = [
        { id: 1, name: 'Acme Corporation', description: 'Technology Solutions' },
        { id: 2, name: 'Global Industries', description: 'Manufacturing & Trade' },
        { id: 3, name: 'Digital Ventures', description: 'Software Development' },
        { id: 4, name: 'TechStart Inc.', description: 'Startup Accelerator' },
        { id: 5, name: 'Enterprise Solutions', description: 'Business Consulting' },
    ];

    const companyList = companies.length > 0 ? companies : defaultCompanies;

    // Filter companies based on search query
    const filteredCompanies = companyList.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.description && company.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSelect = (company) => {
        setSelectedCompany(company);
        if (onSelectCompany) {
            onSelectCompany(company);
        }
        // Close modal after a brief delay to show selection
        setTimeout(() => {
            onClose();
            setSelectedCompany(null);
            setSearchQuery('');
        }, 300);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto"
                    onClick={onClose}
                >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <FiBriefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Switch Project
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Company List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filteredCompanies.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No companies found
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredCompanies.map((company) => (
                                    <motion.button
                                        key={company.id}
                                        onClick={() => handleSelect(company)}
                                        className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                                            selectedCompany?.id === company.id
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <FiBriefcase className={`w-5 h-5 ${
                                                        selectedCompany?.id === company.id
                                                            ? 'text-indigo-600 dark:text-indigo-400'
                                                            : 'text-gray-400'
                                                    }`} />
                                                    <h4 className={`font-medium ${
                                                        selectedCompany?.id === company.id
                                                            ? 'text-indigo-600 dark:text-indigo-400'
                                                            : 'text-gray-900 dark:text-white'
                                                    }`}>
                                                        {company.name}
                                                    </h4>
                                                </div>
                                                {company.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-7">
                                                        {company.description}
                                                    </p>
                                                )}
                                            </div>
                                            {selectedCompany?.id === company.id && (
                                                <FiCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SwitchProjectModal;

