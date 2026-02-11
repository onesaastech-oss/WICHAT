import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiBriefcase, FiRefreshCw, FiUser, FiShield, FiUserCheck } from 'react-icons/fi';
import { fetchUserProfile } from '../../api/auth';

const SwitchProjectModal = ({ isOpen, onClose, companies = [], onSelectCompany }) => {
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [projects, setProjects] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [activeProjectId, setActiveProjectId] = useState(null);

    // Load projects from localStorage immediately, then fetch from API
    useEffect(() => {
        if (isOpen) {
            // First, load from localStorage immediately (synchronous)
            const loadFromLocalStorage = () => {
                try {
                    const userData = localStorage.getItem('userData');
                    if (userData) {
                        const parsedData = JSON.parse(userData);
                        // Get active project ID
                        if (parsedData.selected_project_id) {
                            setActiveProjectId(parsedData.selected_project_id);
                        }
                        // Load projects
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
            setActiveProjectId(null);
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

    // Filter projects based on search query (name, description, owner)
    const filteredProjects = projectList.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (project.owner_name && project.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
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
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full mx-4 max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <FiBriefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Switch Project
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                        {projectList.length} project{projectList.length !== 1 ? 's' : ''} available
                                    </p>
                                </div>
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
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                            <input
                                type="text"
                                placeholder="Search by project name or owner..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                            />
                        </div>

                        {/* Project Cards Grid - 3 per row */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}
                            {filteredProjects.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <FiBriefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">No projects found</p>
                                    <p className="text-sm mt-1">Try a different search term</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredProjects.map((project) => {
                                        const projectId = project.project_id || project.id;
                                        const isSelected = selectedCompany?.project_id === projectId || selectedCompany?.id === projectId;
                                        const isActive = activeProjectId === projectId;
                                        const isOwned = project.owned === true;
                                        return (
                                            <motion.button
                                                key={projectId}
                                                onClick={() => handleSelect(project)}
                                                title={project.name}
                                                className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 min-h-[100px] flex flex-col ${isSelected
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/25 shadow-md'
                                                    : isActive
                                                        ? 'border-indigo-400 bg-indigo-50/70 dark:bg-indigo-900/15'
                                                        : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm'
                                                    }`}
                                                whileHover={{ scale: 1.02, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {/* Row 1: Project name gets maximum space; role badge on right */}
                                                <div className="flex items-start gap-2 w-full min-w-0">
                                                    <h4 className={`flex-1 min-w-0 font-semibold text-base truncate ${isSelected || isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`} title={project.name}>
                                                        {project.name}
                                                    </h4>
                                                    <span className="flex-shrink-0 mt-0.5">
                                                        {isOwned ? (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded">
                                                                <FiShield className="w-3 h-3" />
                                                                Admin
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600/50 rounded">
                                                                <FiUserCheck className="w-3 h-3" />
                                                                Agent
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Row 2: Owner */}
                                                {project.owner_name && (
                                                    <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 min-w-0">
                                                        <FiUser className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                                        <span className="truncate">{project.owner_name}</span>
                                                    </p>
                                                )}

                                                {/* Row 3: Current / Selected */}
                                                <div className="mt-auto pt-2 flex items-center gap-2 flex-wrap">
                                                    {isActive && (
                                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-full">
                                                            Current
                                                        </span>
                                                    )}
                                                    {isSelected && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                                            <FiCheck className="w-3.5 h-3.5" />
                                                            Selected
                                                        </span>
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

