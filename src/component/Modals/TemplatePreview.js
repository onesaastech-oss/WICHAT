import React, { useState, useEffect } from 'react';
import { FiX, FiSend, FiClock, FiCheck, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Encrypt } from '../../pages/encryption/payload-encryption';

const TemplatePreview = ({ 
    isOpen, 
    onClose, 
    selectedTemplate, 
    darkMode = false, 
    onUseTemplate,
    tokens,
    activeChat,
    onSendTemplate,
    onCloseAll
}) => {
    const [variableValues, setVariableValues] = useState({});
    const [sendingTemplate, setSendingTemplate] = useState(false);
    const [headerMediaUrl, setHeaderMediaUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Helpers for document preview metadata
    const getFileNameFromUrl = (url) => {
        if (!url) return 'document';
        try {
            const pathname = new URL(url).pathname;
            const last = pathname.split('/').pop();
            return decodeURIComponent(last || 'document');
        } catch (e) {
            const stripped = url.split('?')[0];
            const parts = stripped.split('/');
            return decodeURIComponent(parts.pop() || 'document');
        }
    };

    const getFileExtension = (name) => {
        if (!name) return '';
        const match = name.match(/\.([a-zA-Z0-9]+)$/);
        return match ? match[1].toLowerCase() : '';
    };

    // Normalize template structures and parse for preview
    const parseTemplateContent = (template) => {
        const templateData = template?.template_data || template?.template || {};
        const components = templateData?.components || [];

        let content = '';
        let variables = [];
        let footerText = '';
        let buttons = [];

        const bodyComponent = components.find((comp) => comp.type === 'BODY');
        if (bodyComponent) {
            content = bodyComponent.text || '';
        } else if (templateData.body) {
            content = templateData.body;
        }

        const footerComponent = components.find((comp) => comp.type === 'FOOTER');
        if (footerComponent) {
            footerText = footerComponent.text || '';
        }

        const buttonsComponent = components.find((comp) => comp.type === 'BUTTONS');
        if (buttonsComponent && Array.isArray(buttonsComponent.buttons)) {
            buttons = buttonsComponent.buttons;
        }

        // Extract variables from content (e.g., {{1}}, {{2}}, etc.)
        const variableMatches = content.match(/\{\{\d+\}\}/g);
        if (variableMatches) {
            variables = variableMatches.map((match) => {
                const num = match.match(/\d+/)[0];
                return { placeholder: match, number: parseInt(num) };
            });
        }

        return { content, variables, footerText, buttons, components, templateData };
    };

    const { content, variables, footerText, buttons, components } = parseTemplateContent(selectedTemplate);

    // Detect header media requirement and preset default link from example if present
    const headerComponent = components?.find((c) => c.type === 'HEADER');
    const headerFormat = headerComponent?.format || 'NONE';
    const requiresHeaderMedia = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat);

    // Initialize default header media link from example on open/change
    useEffect(() => {
        if (requiresHeaderMedia) {
            const exampleLink = headerComponent?.example?.header_handle?.[0] || '';
            setHeaderMediaUrl((prev) => prev || exampleLink || '');
        } else {
            setHeaderMediaUrl('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTemplate?.id]);

    if (!selectedTemplate) return null;

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

    const uploadHeaderMedia = async (file) => {
        if (!file || !tokens?.token || !tokens?.username) return;
        setIsUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await axios.post(
                'https://api.w1chat.com/upload/upload-media',
                form,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'token': tokens.token,
                        'username': tokens.username
                    }
                }
            );
            if (res?.data && !res.data.error && res.data.link) {
                setHeaderMediaUrl(res.data.link);
            } else {
                alert('Failed to upload media for header');
            }
        } catch (e) {
            console.error('Header media upload failed:', e);
            alert('Header media upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    // Send template via API
    const sendTemplate = async () => {
        if (!tokens?.token || !tokens?.username || !activeChat?.number) {
            console.error('Missing required data for sending template');
            return;
        }

        // Validate that all variables are provided (mandatory)
        if (variables && variables.length > 0) {
            const missing = variables.filter(v => !((variableValues[v.number] || '').trim()));
            if (missing.length > 0) {
                alert('Please fill in all required template variables before sending.');
                return;
            }
        }

        setSendingTemplate(true);
        try {
            // Format components according to WhatsApp API specification
            const formattedComponents = [];
            
            if (selectedTemplate.template_data?.components) {
                // Header media parameter if required
                if (requiresHeaderMedia) {
                    const mediaType = headerFormat.toLowerCase(); // image | video | document
                    const mediaLink = headerMediaUrl || headerComponent?.example?.header_handle?.[0] || '';
                    if (!mediaLink) {
                        alert('Please provide a media for the header');
                        setSendingTemplate(false);
                        return;
                    }
                    const mediaParam = { type: mediaType };
                    mediaParam[mediaType] = { link: mediaLink };
                    formattedComponents.push({
                        type: 'header',
                        parameters: [mediaParam]
                    });
                }

                selectedTemplate.template_data.components.forEach(component => {
                    if (component.type === 'BODY' && component.text) {
                        // Extract variables from the body text (e.g., {{1}}, {{2}})
                        const variableMatches = component.text.match(/\{\{\d+\}\}/g);
                        const parameters = [];
                        
                        if (variableMatches) {
                            // Use user-entered values for variables (mandatory, already validated)
                            variableMatches.forEach((match) => {
                                const variableNumber = parseInt(match.match(/\d+/)[0]);
                                const userValue = (variableValues[variableNumber] || '').trim();
                                parameters.push({
                                    type: "text",
                                    text: userValue
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
                template_id: selectedTemplate.id,
                component: formattedComponents
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            console.log('Sending template with payload:', payload);

            // Delegate actual send + optimistic UI to Conversation handler if provided
            if (onSendTemplate) {
                await onSendTemplate(selectedTemplate, formattedComponents, renderPreviewContent());
                onClose();
                if (typeof onCloseAll === 'function') {
                    onCloseAll();
                }
            } else {
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
                    if (onUseTemplate) {
                        onUseTemplate(renderPreviewContent());
                    }
                    onClose();
                    if (typeof onCloseAll === 'function') {
                        onCloseAll();
                    }
                } else {
                    console.error('API Error:', response?.data?.message);
                    alert('Failed to send template: ' + (response?.data?.message || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error('Failed to send template:', error);
            alert('Failed to send template: ' + (error.message || 'Network error'));
        } finally {
            setSendingTemplate(false);
        }
    };

    const handleUseTemplate = () => {
        sendTemplate();
    };

    // Determine if send should be disabled due to missing required variables
    const hasEmptyRequiredVariables = variables && variables.length > 0 && variables.some(v => !((variableValues[v.number] || '').trim()));
    const isSendDisabled = sendingTemplate || hasEmptyRequiredVariables;

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

                            {/* Header media selector when template requires media */}
                            {requiresHeaderMedia && (
                                <div className="mb-4">
                                    <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Header Media ({headerFormat.toLowerCase()})
                                    </h3>
                                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="url"
                                                placeholder={`Paste ${headerFormat.toLowerCase()} link or upload below`}
                                                value={headerMediaUrl}
                                                onChange={(e) => setHeaderMediaUrl(e.target.value)}
                                                className={`flex-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                                            />
                                            <label className={`inline-flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer ${isUploading ? 'opacity-60 cursor-not-allowed' : ''} ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
                                                {isUploading ? 'Uploading...' : 'Upload'}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept={headerFormat === 'IMAGE' ? 'image/*' : headerFormat === 'VIDEO' ? 'video/*' : '*'}
                                                    disabled={isUploading}
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) uploadHeaderMedia(f);
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        {headerMediaUrl && (
                                            <div className="mt-3 text-xs break-all opacity-80">
                                                Using: {headerMediaUrl}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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
                                        {/* <div className="flex justify-start">
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
                                        </div> */}

                                        {/* Template message */}
                                        <div className="flex justify-end">
                                            <div className="flex items-end gap-2 max-w-[90%]">
                                                <div className={`px-3 py-2 rounded-2xl w-56 rounded-br-md bg-green-500 relative shadow-sm border border-green-400`}>
                                                    {requiresHeaderMedia && headerMediaUrl && (() => {
                                                        const url = headerMediaUrl;
                                                        const isImageUrl = /\.(png|jpe?g|webp|gif)$/i.test(url);
                                                        const isVideoUrl = /\.(mp4|webm|ogg|mov)$/i.test(url);
                                                        const name = getFileNameFromUrl(url);
                                                        const ext = getFileExtension(name);
                                                        const isPdf = ext === 'pdf' || /\.pdf($|\?)/i.test(url);

                                                        // If template says IMAGE or the URL clearly is an image
                                                        if (headerFormat === 'IMAGE' || isImageUrl) {
                                                            return (
                                                                <div className="mb-2 bg-white rounded-lg overflow-hidden w-full">
                                                                    <img src={url} alt={name} className="w-full h-32 object-cover" />
                                                                </div>
                                                            );
                                                        }

                                                        // If template says VIDEO or URL is video, render lightweight inline video
                                                        if (headerFormat === 'VIDEO' || isVideoUrl) {
                                                            return (
                                                                <div className="mb-2 bg-white rounded-lg overflow-hidden w-full">
                                                                    <video src={url} className="w-full h-32 object-cover" muted playsInline loop />
                                                                </div>
                                                            );
                                                        }

                                                        // DOCUMENT handling
                                                        if (headerFormat === 'DOCUMENT') {
                                                            // Some users attach images as documents; show image if URL is image
                                                            if (isImageUrl) {
                                                                return (
                                                                    <div className="mb-2 bg-white rounded-lg overflow-hidden w-full">
                                                                        <img src={url} alt={name} className="w-full h-32 object-cover" />
                                                                    </div>
                                                                );
                                                            }

                                                            // Try to inline-preview PDFs; fallback to icon card if embed fails/blocked
                                                            if (isPdf) {
                                                                return (
                                                                    <div className="mb-2 bg-white rounded-lg overflow-hidden border border-gray-200 w-full">
                                                                        <div className="w-full h-32 bg-gray-50 overflow-hidden relative">
                                                                            <iframe 
                                                                                src={`${url}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH&zoom=page-width`} 
                                                                                title={name} 
                                                                                className="w-full h-full border-0 pointer-events-none"
                                                                                style={{ 
                                                                                    minWidth: '100%',
                                                                                    minHeight: '100%',
                                                                                    objectFit: 'cover'
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="flex items-center p-2 border-t border-gray-200">
                                                                            <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-red-100 text-red-600">
                                                                                <FiFileText className="w-4 h-4" />
                                                                            </div>
                                                                            <div className="ml-2 min-w-0 flex-1">
                                                                                <div className="text-xs font-medium text-gray-900 truncate" title={name}>{name}</div>
                                                                                <div className="text-[10px] text-gray-500 uppercase">PDF document</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            // Generic document card fallback
                                                            return (
                                                                <div className="mb-2 bg-white rounded-lg overflow-hidden border border-gray-200">
                                                                    <div className="flex items-center p-3 w-56">
                                                                        <div className={`flex-shrink-0 w-10 h-12 rounded-md flex items-center justify-center ${isPdf ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                            <FiFileText className="w-6 h-6" />
                                                                        </div>
                                                                        <div className="ml-3 min-w-0">
                                                                            <div className="text-sm font-medium text-gray-900 truncate" title={name}>{name}</div>
                                                                            <div className="text-xs text-gray-500 uppercase">{ext || 'file'} document</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        // Fallback placeholder (should rarely hit)
                                                        return (
                                                            <div className="mb-2 bg-white rounded-lg overflow-hidden w-full">
                                                                <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                                                                    <span className="text-xs text-gray-600">{headerFormat.toLowerCase()} header</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                    <div className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                                                        {renderPreviewContent()}
                                                    </div>
                                                    {footerText ? (
                                                        <div className="text-xs text-green-50/80 mt-2 whitespace-pre-wrap">
                                                            {footerText}
                                                        </div>
                                                    ) : null}
                                                    {buttons && buttons.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {buttons.map((btn, idx) => {
                                                                const type = btn.type || '';
                                                                const text = btn.text || 'Button';
                                                                const isUrl = type === 'URL';
                                                                const isPhone = type === 'PHONE_NUMBER';
                                                                const pillBase = 'px-3 py-1 rounded-full text-xs font-medium border bg-white/10 text-white border-white/30 hover:bg-white/20';
                                                                return (
                                                                    <a
                                                                        key={idx}
                                                                        href={isUrl ? (btn.url || '#') : isPhone ? `tel:${btn.phone_number || ''}` : undefined}
                                                                        target={isUrl ? '_blank' : undefined}
                                                                        rel={isUrl ? 'noreferrer' : undefined}
                                                                        className={pillBase}
                                                                        onClick={(e) => { if (!isUrl && !isPhone) e.preventDefault(); }}
                                                                    >
                                                                        {text}
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : null}
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
                                    disabled={isSendDisabled}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                        isSendDisabled
                                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                                >
                                    {sendingTemplate ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <FiSend className="w-4 h-4" />
                                            Send Template
                                        </>
                                    )}
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