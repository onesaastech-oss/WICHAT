import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../../component/Menu';
import { motion } from 'framer-motion';
import {
    FiGitBranch
} from 'react-icons/fi';

const Flow = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

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

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            />

            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'lg:ml-16' : 'lg:ml-64'}`}>
                <Header
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                    isMinimized={isMinimized}
                    setIsMinimized={setIsMinimized}
                />

                <main className="mt-16 flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flow Builder</h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Create sophisticated conversation flows and automation workflows
                            </p>
                        </div>

                        {/* Coming Soon Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 sm:p-12"
                        >
                            <div className="text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                        <FiGitBranch className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
                                    </div>
                                </div>
                                
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Coming Soon
                                </h2>
                                
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                    We're working on an amazing Flow Builder feature. Stay tuned for updates!
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Flow;
