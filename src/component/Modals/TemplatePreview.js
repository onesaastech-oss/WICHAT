import React, { useState } from 'react';
import { FiX, FiSend, FiClock, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const TemplatePreview = ({ 
    isOpen, 
    onClose, 
    selectedTemplate, 
    darkMode = false, 
    onUseTemplate 
}) => {
    const [variableValues, setVariableValues] = useState({});
    
    if (!selectedTemplate) return null;

    // Parse template content for preview
    const parseTemplateContent = (template) => {
        if (!template.template_data) return { content: '', variables: [] };

        let content = '';
        let variables = [];

        if (template.template_data.body) {
            content = template.template_data.body;
        } else if (template.template_data.components) {
            const bodyComponent = template.template_data.components.find(comp => comp.type === 'BODY');
            if (bodyComponent) {
                content = bodyComponent.text || '';
            }
        }

        // Extract variables from content (e.g., {{1}}, {{2}}, etc.)
        const variableMatches = content.match(/\{\{\d+\}\}/g);
        if (variableMatches) {
            variables = variableMatches.map(match => {
                const num = match.match(/\d+/)[0];
                return { placeholder: match, number: parseInt(num) };
            });
        }

        return { content, variables };
    };

    const { content, variables } = parseTemplateContent(selectedTemplate);

    const handleVariableChange = (variableNumber, value) => {
        setVariableValues(prev => ({
            ...prev,
            [variableNumber]: value
        }));
    };

    const renderPreviewContent = () => {
        let previewContent = content;
        
        // Replace variables with user input or placeholder text
        variables.forEach(variable => {
            const value = variableValues[variable.number] || `[Variable ${variable.number}]`;
            previewContent = previewContent.replace(variable.placeholder, value);
        });

        return previewContent;
    };

    const handleUseTemplate = () => {
        const finalContent = renderPreviewContent();
        onUseTemplate(finalContent);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className={`w-full max-w-2xl max-h-[90vh] ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl flex flex-col`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div>
                                <h2 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Template Preview
                                </h2>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                    {selectedTemplate.name}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            {/* Template Info */}
                            <div className={`p-4 rounded-xl border mb-4 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Category: {selectedTemplate.category}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        selectedTemplate.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                        selectedTemplate.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    }`}>
                                        {selectedTemplate.status}
                                    </span>
                                </div>
                                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Language: {selectedTemplate.language}
                                </div>
                            </div>

                            {/* Variable Inputs */}
                            {variables.length > 0 && (
                                <div className="mb-4">
                                    <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Fill Template Variables
                                    </h3>
                                    <div className="space-y-3">
                                        {variables.map((variable) => (
                                            <div key={variable.number}>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Variable {variable.number}
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={`Enter value for variable ${variable.number}`}
                                                    value={variableValues[variable.number] || ''}
                                                    onChange={(e) => handleVariableChange(variable.number, e.target.value)}
                                                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                                                        darkMode 
                                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                                                    } focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Chat Preview */}
                            <div className="mb-4">
                                <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Chat Preview
                                </h3>
                                <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                                    {/* Chat Header */}
                                    <div className={`flex items-center gap-3 p-3 border-b ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                            <span className="text-white text-sm font-semibold">W</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                WhatsApp Business
                                            </div>
                                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Template Message
                                            </div>
                                        </div>
                                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <FiClock className="w-3 h-3 inline mr-1" />
                                            Now
                                        </div>
                                    </div>

                                    {/* Chat Messages */}
                                    <div className="p-4 space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                                        {/* Previous message context */}
                                        <div className="flex justify-start">
                                            <div className="flex items-end gap-2 max-w-[80%]">
                                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <span className="text-gray-600 text-xs">C</span>
                                                </div>
                                                <div className={`px-3 py-2 rounded-2xl rounded-bl-md ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                                    <div className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        Hi! I'd like to know more about your services.
                                                    </div>
                                                    <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        10:30 AM
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Template message */}
                                        <div className="flex justify-end">
                                            <div className="flex items-end gap-2 max-w-[80%]">
                                                <div className={`px-3 py-2 rounded-2xl rounded-br-md bg-green-500 relative shadow-sm border border-green-400`}>
                                                    <div className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                                                        {renderPreviewContent()}
                                                    </div>
                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                                        <div className="text-xs text-green-100">
                                                            10:32 AM
                                                        </div>
                                                        <div className="flex items-center">
                                                            <FiCheckCircle className="w-3 h-3 text-green-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                                    <span className="text-white text-xs font-semibold">Y</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Typing indicator */}
                                        <div className="flex justify-start">
                                            <div className="flex items-end gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <span className="text-gray-600 text-xs">C</span>
                                                </div>
                                                <div className={`px-3 py-2 rounded-2xl rounded-bl-md ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                                    <div className="flex items-center gap-1">
                                                        <div className="flex space-x-1">
                                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`flex items-center justify-between gap-3 p-4 sm:p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                        darkMode 
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUseTemplate}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                >
                                    <FiSend className="w-4 h-4" />
                                    Use Template
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TemplatePreview;