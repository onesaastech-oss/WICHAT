import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiBriefcase, FiRefreshCw } from 'react-icons/fi';
import { fetchUserProfile } from '../../api/auth';

const SwitchProjectModal = ({ isOpen, onClose, companies = [], onSelectCompany }) => {
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [projects, setProjects] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Load projects from localStorage immediately, then fetch from API
    useEffect(() => {
        if (isOpen) {
            // First, load from localStorage immediately (synchronous)
            const loadFromLocalStorage = () => {
                try {
                    const userData = localStorage.getItem('userData');
                    if (userData) {
                        const parsedData = JSON.parse(userData);
                        if (parsedData.projects?.list && Array.isArray(parsedData.projects.list)) {
                            setProjects(parsedData.projects.list);
                        } else if (parsedData.projects && Array.isArray(parsedData.projects)) {
                            setProjects(parsedData.projects);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing userData from localStorage:', error);
                }
            };

            // Load from localStorage first
            loadFromLocalStorage();

            // Then fetch from API in the background
            const fetchFromAPI = async () => {
                setRefreshing(true);
                setError(null);
                try {
                    const response = await fetchUserProfile();
                    if (response && response.projects) {
                        // API returns projects as object with list property
                        let newProjects = [];
                        if (response.projects.list && Array.isArray(response.projects.list)) {
                            newProjects = response.projects.list;
                        } else if (Array.isArray(response.projects)) {
                            newProjects = response.projects;
                        }
                        
                        // Smoothly update with new data
                        if (newProjects.length > 0) {
                            setProjects(newProjects);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching projects from API:', error);
                    setError('Failed to refresh projects');
                    // Keep showing localStorage data on error
                } finally {
                    setRefreshing(false);
                }
            };

            // Small delay to ensure localStorage data is shown first
            const timeoutId = setTimeout(() => {
                fetchFromAPI();
            }, 100);

            return () => clearTimeout(timeoutId);
        } else {
            // Reset state when modal closes
            setProjects([]);
            setRefreshing(false);
            setError(null);
        }
    }, [isOpen]);

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

    // Use projects from API, fallback to companies prop, then empty array
    const projectList = projects.length > 0 ? projects : (companies.length > 0 ? companies : []);

    // Filter projects based on search query
    const filteredProjects = projectList.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
                            {refreshing && (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="ml-2"
                                >
                                    <FiRefreshCw className="w-4 h-4 text-indigo-500" />
                                </motion.div>
                            )}
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
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Project List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {error && (
                            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                        {filteredProjects.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No projects found
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredProjects.map((project) => {
                                    const projectId = project.project_id || project.id;
                                    const isSelected = selectedCompany?.project_id === projectId || selectedCompany?.id === projectId;
                                    return (
                                        <motion.button
                                            key={projectId}
                                            onClick={() => handleSelect(project)}
                                            className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                                                isSelected
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
                                                            isSelected
                                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                                : 'text-gray-400'
                                                        }`} />
                                                        <h4 className={`font-medium ${
                                                            isSelected
                                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                                : 'text-gray-900 dark:text-white'
                                                        }`}>
                                                            {project.name}
                                                        </h4>
                                                    </div>
                                                    {project.description && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-7">
                                                            {project.description}
                                                        </p>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <FiCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
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

