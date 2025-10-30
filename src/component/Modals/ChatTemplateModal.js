import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiChevronDown, FiChevronUp, FiCheck, FiClock, FiAlertCircle, FiCheckCircle, FiEye } from 'react-icons/fi';
import axios from 'axios';
import { Encrypt } from '../../pages/encryption/payload-encryption';

const ChatTemplateModal = ({ isOpen, onClose, tokens, onTemplateSelect, onTemplatePreview, darkMode = false, activeChat, onSendTemplate }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('APPROVED');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [lastId, setLastId] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [sendingTemplate, setSendingTemplate] = useState(null);

    // Fetch templates from API
    const fetchTemplates = async (resetData = false) => {
        if (!tokens?.token || !tokens?.username) return;

        setLoading(true);
        try {
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
                status: statusFilter,
                last_id: resetData ? 0 : lastId
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/template/template-list',
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // const approvedTemplates = response?.data?.data?.filter(template => template.status === 'APPROVED');

            if (!response?.data?.error && response?.data?.data  ) {
                const apiTemplates = response.data.data.map(template => ({
                    id: template.template_id,
                    name: template.template_name,
                    language: template.template?.language?.toUpperCase() || 'EN',
                    category: template.category,
                    status: template.status,
                    updatedOn: new Date(template.create_date).toLocaleDateString(),
                    waba_template_id: template.waba_template_id,
                    reject_reason: template.reject_reason,
                    template_data: template.template
                }));

                if (resetData) {
                    setTemplates(apiTemplates);
                    setCurrentPage(1);
                } else {
                    setTemplates(prev => [...prev, ...apiTemplates]);
                }

                setLastId(response.data.last_id);
                setHasMore(response.data.has_more);
            } else {
                console.error('API Error:', response?.data?.message);
                if (resetData) {
                    setTemplates([]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            if (resetData) {
                setTemplates([]);
            }
        } finally {
            setLoading(false);
        }
    };

    // Send template via API
    const sendTemplate = async (template) => {
        if (!tokens?.token || !tokens?.username || !activeChat?.number) {
            console.error('Missing required data for sending template');
            return;
        }

        setSendingTemplate(template.id);
        try {
            // Format components according to WhatsApp API specification
            const formattedComponents = [];
            
            if (template.template_data?.components) {
                template.template_data.components.forEach(component => {
                    if (component.type === 'BODY' && component.text) {
                        // Extract variables from the body text (e.g., {{1}}, {{2}})
                        const variableMatches = component.text.match(/\{\{\d+\}\}/g);
                        const parameters = [];
                        
                        if (variableMatches) {
                            // For now, use example values or empty strings
                            // In a real implementation, you'd collect these from user input
                            variableMatches.forEach((match, index) => {
                                const exampleValue = component.example?.body_text?.[0]?.[index] || `Variable ${index + 1}`;
                                parameters.push({
                                    type: "text",
                                    text: exampleValue
                                });
                            });
                        }
                        
                        formattedComponents.push({
                            type: "body",
                            parameters: parameters
                        });
                    }
                    // Add other component types (header, footer, buttons) if needed
                });
            }

            const payload = {
                project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
                number: activeChat.number,
                template_id: template.id,
                component: formattedComponents
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            console.log('Sending template with payload:', payload);

            const response = await axios.post(
                'https://api.w1chat.com/message/send-template',
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Send template response:', response.data);

            if (!response?.data?.error) {
                console.log('Template sent successfully:', response.data);
                // Call the original onTemplateSelect if needed for any additional handling
                if (onTemplateSelect) {
                    onTemplateSelect(template);
                }
                onClose();
            } else {
                console.error('API Error:', response?.data?.message);
                alert('Failed to send template: ' + (response?.data?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to send template:', error);
            alert('Failed to send template: ' + (error.message || 'Network error'));
        } finally {
            setSendingTemplate(null);
        }
    };

    // Load templates when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchTemplates(true);
        }
    }, [isOpen]);

    // Extract unique categories from templates
    const getUniqueCategories = () => {
        const categories = [...new Set(templates.map(template => template.category))];
        return categories.sort();
    };

    // Filter templates based on search term and category
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            template.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || template.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Handle template selection
    const handleTemplateSelect = (template) => {
        console.log('Template selected:', template);
        if (onSendTemplate) {
            // Let Conversation own the send + optimistic UI. Build components similarly.
            const formattedComponents = [];
            if (template.template_data?.components) {
                template.template_data.components.forEach(component => {
                    if (component.type === 'BODY' && component.text) {
                        const variableMatches = component.text.match(/\{\{\d+\}\}/g);
                        const parameters = [];
                        if (variableMatches) {
                            variableMatches.forEach((match, index) => {
                                const exampleValue = component.example?.body_text?.[0]?.[index] || `Variable ${index + 1}`;
                                parameters.push({ type: 'text', text: exampleValue });
                            });
                        }
                        formattedComponents.push({ type: 'body', parameters });
                    }
                });
            }
            onSendTemplate(template, formattedComponents);
            onClose();
        } else {
            sendTemplate(template);
        }
    };

    // Load more templates
    const loadMore = () => {
        if (hasMore && !loading) {
            fetchTemplates(false);
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCategoryDropdown && !event.target.closest('.category-dropdown')) {
                setShowCategoryDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCategoryDropdown]);



    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-4xl max-h-[90vh] ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl flex flex-col`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h2 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Select Template
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2 sm:py-3 rounded-lg border transition-colors ${
                                    darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                                } focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800`}
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative category-dropdown">
                            <button
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className={`flex items-center gap-2 px-4 py-2 sm:py-3 rounded-lg border transition-colors ${
                                    darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                                        : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                                } focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800`}
                            >
                                <span className="text-sm font-medium">
                                    {categoryFilter === 'ALL' ? 'All Categories' : categoryFilter}
                                </span>
                                {showCategoryDropdown ? (
                                    <FiChevronUp className="w-4 h-4" />
                                ) : (
                                    <FiChevronDown className="w-4 h-4" />
                                )}
                            </button>

                            {/* Category Dropdown */}
                            {showCategoryDropdown && (
                                <div className={`absolute top-full left-0 mt-1 w-full min-w-[200px] rounded-lg border shadow-lg z-10 ${
                                    darkMode 
                                        ? 'bg-gray-700 border-gray-600' 
                                        : 'bg-white border-gray-200'
                                }`}>
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setCategoryFilter('ALL');
                                                setShowCategoryDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                                categoryFilter === 'ALL'
                                                    ? darkMode 
                                                        ? 'bg-blue-600 text-white' 
                                                        : 'bg-blue-50 text-blue-700'
                                                    : darkMode 
                                                        ? 'text-gray-300 hover:bg-gray-600' 
                                                        : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>All Categories</span>
                                                {categoryFilter === 'ALL' && <FiCheck className="w-4 h-4" />}
                                            </div>
                                        </button>
                                        {getUniqueCategories().map((category) => (
                                            <button
                                                key={category}
                                                onClick={() => {
                                                    setCategoryFilter(category);
                                                    setShowCategoryDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                                    categoryFilter === category
                                                        ? darkMode 
                                                            ? 'bg-blue-600 text-white' 
                                                            : 'bg-blue-50 text-blue-700'
                                                        : darkMode 
                                                            ? 'text-gray-300 hover:bg-gray-600' 
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>{category}</span>
                                                    {categoryFilter === category && <FiCheck className="w-4 h-4" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Templates List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {loading && templates.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="text-center py-8">
                            <p className={`text-gray-500 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                No templates found
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTemplates.map((template) => {
                                
                                return (
                                    <div
                                        key={template.id}
                                        className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                                            darkMode 
                                                ? 'bg-gray-700 border-gray-600' 
                                                : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className={`font-semibold text-sm sm:text-base truncate ${
                                                        darkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        {template.name}
                                                    </h3>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {template.language}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                    <span>Category: {template.category}</span>
                                                    <span>Updated: {template.updatedOn}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onTemplatePreview(template)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    darkMode 
                                                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                <FiEye className="w-4 h-4" />
                                                Preview
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={loadMore}
                                        disabled={loading}
                                        className={`px-6 py-2 rounded-lg transition-colors ${
                                            loading 
                                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                        }`}
                                    >
                                        {loading ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatTemplateModal;