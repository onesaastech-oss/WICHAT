import React, { useState, useEffect } from 'react';
import { FiX, FiSend, FiFileText, FiChevronDown } from 'react-icons/fi';
import { BsCheckAll } from 'react-icons/bs';
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
    contactDetails,
    onSendTemplate,
    onCloseAll
}) => {
    const [variableValues, setVariableValues] = useState({});
    const [sendingTemplate, setSendingTemplate] = useState(false);
    const [headerMediaUrl, setHeaderMediaUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [openDropdowns, setOpenDropdowns] = useState({});

    // --- Helpers ---
    const getFileNameFromUrl = (url) => {
        if (!url) return 'document';
        try {
            const pathname = new URL(url).pathname;
            const last = pathname.split('/').pop();
            return decodeURIComponent(last || 'document');
        } catch (e) {
            return 'document.pdf';
        }
    };

    const getFileExtension = (name) => {
        if (!name) return '';
        const match = name.match(/\.([a-zA-Z0-9]+)$/);
        return match ? match[1].toLowerCase() : 'FILE';
    };

    // Generate dropdown options from user details
    const generateVariableOptions = () => {
        const options = [];

        // Helper function to check if a string looks like a phone number
        const looksLikePhoneNumber = (str) => {
            if (!str) return false;
            // Remove common phone number characters
            const cleaned = str.replace(/[\s\-\(\)\+]/g, '');
            // If it's mostly digits and longer than 7 characters, it's likely a phone number
            return /^\d{7,}$/.test(cleaned);
        };

        // Determine the best contact name to use
        let contactName = null;

        // Priority 1: Use contact details name if available (most reliable)
        if (contactDetails?.has_contact && contactDetails?.contact?.name) {
            contactName = contactDetails.contact.name;
        }
        // Priority 2: Use activeChat name only if it's NOT a phone number
        else if (activeChat?.name && !looksLikePhoneNumber(activeChat.name)) {
            contactName = activeChat.name;
        }

        // Add contact name if we found a valid one
        if (contactName) {
            options.push({ label: 'Contact Name', value: contactName });
        }

        // Always add phone number if available
        if (activeChat?.number) {
            options.push({ label: 'Phone Number', value: activeChat.number });
        }

        // Extended contact details (if available)
        if (contactDetails?.has_contact && contactDetails?.contact) {
            const contact = contactDetails.contact;

            if (contact.email) {
                options.push({ label: 'Email', value: contact.email });
            }
            if (contact.firm_name) {
                options.push({ label: 'Company Name', value: contact.firm_name });
            }
            if (contact.website) {
                options.push({ label: 'Website', value: contact.website });
            }
            if (contact.country) {
                options.push({ label: 'Country', value: contact.country });
            }
            if (contact.remark) {
                options.push({ label: 'Notes/Remarks', value: contact.remark });
            }
        }

        // Add some common placeholders
        options.push(
            { label: 'Current Date', value: new Date().toLocaleDateString() },
            { label: 'Current Time', value: new Date().toLocaleTimeString() },
            { label: 'Current Day', value: new Date().toLocaleDateString('en-US', { weekday: 'long' }) }
        );

        return options;
    };
    // --- Template Parsing ---
    const parseTemplateContent = (template) => {
        const templateData = template?.template_data || template?.template || {};
        const components = templateData?.components || [];

        let content = '';
        let variables = [];
        let footerText = '';
        let buttons = [];

        const bodyComponent = components.find((comp) => comp.type === 'BODY');
        if (bodyComponent) content = bodyComponent.text || '';
        else if (templateData.body) content = templateData.body;

        const footerComponent = components.find((comp) => comp.type === 'FOOTER');
        if (footerComponent) footerText = footerComponent.text || '';

        const buttonsComponent = components.find((comp) => comp.type === 'BUTTONS');
        if (buttonsComponent && Array.isArray(buttonsComponent.buttons)) buttons = buttonsComponent.buttons;

        const variableMatches = content.match(/\{\{\d+\}\}/g);
        if (variableMatches) {
            variables = variableMatches.map((match) => {
                const num = match.match(/\d+/)[0];
                return { placeholder: match, number: parseInt(num) };
            });
        }

        return { content, variables, footerText, buttons, components };
    };

    const { content, variables, footerText, buttons, components } = parseTemplateContent(selectedTemplate);
    const headerComponent = components?.find((c) => c.type === 'HEADER');
    const headerFormat = headerComponent?.format || 'NONE';
    const requiresHeaderMedia = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat);

    useEffect(() => {
        if (requiresHeaderMedia) {
            const exampleLink = headerComponent?.example?.header_handle?.[0] || '';
            setHeaderMediaUrl((prev) => prev || exampleLink || '');
        } else {
            setHeaderMediaUrl('');
        }
    }, [selectedTemplate?.id, requiresHeaderMedia, headerComponent]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.variable-dropdown')) {
                setOpenDropdowns({});
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!selectedTemplate) return null;

    const handleVariableChange = (variableNumber, value) => {
        setVariableValues(prev => ({ ...prev, [variableNumber]: value }));
    };

    // Parse WhatsApp formatting (*bold*, _italic_, ~strikethrough~, ```monospace```)
    const parseWhatsAppFormatting = (text) => {
        if (!text) return text;

        const parts = [];
        let currentIndex = 0;
        let keyCounter = 0;

        // Regex patterns for WhatsApp formatting
        // Order matters: do monospace first (```), then others
        const patterns = [
            { regex: /```([^`]+)```/g, component: (match) => <code key={`mono-${keyCounter++}`} className="font-mono bg-black/10 dark:bg-white/10 px-1 rounded text-sm">{match}</code> },
            { regex: /\*([^*]+)\*/g, component: (match) => <strong key={`bold-${keyCounter++}`} className="font-bold">{match}</strong> },
            { regex: /_([^_]+)_/g, component: (match) => <em key={`italic-${keyCounter++}`} className="italic">{match}</em> },
            { regex: /~([^~]+)~/g, component: (match) => <span key={`strike-${keyCounter++}`} className="line-through">{match}</span> },
        ];

        // Create a combined regex to find all formatting markers
        const combinedRegex = /(\*[^*]+\*|_[^_]+_|~[^~]+~|```[^`]+```)/g;

        let lastIndex = 0;
        let match;

        while ((match = combinedRegex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }

            const matchedText = match[0];
            let formatted = false;

            // Check which pattern matched and apply the corresponding component
            for (const pattern of patterns) {
                const innerMatch = matchedText.match(pattern.regex);
                if (innerMatch) {
                    const content = matchedText.slice(
                        matchedText.startsWith('```') ? 3 : 1,
                        matchedText.endsWith('```') ? -3 : -1
                    );
                    parts.push(pattern.component(content));
                    formatted = true;
                    break;
                }
            }

            if (!formatted) {
                parts.push(matchedText);
            }

            lastIndex = match.index + matchedText.length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    const renderPreviewContent = () => {
        let previewContent = content;
        variables.forEach(variable => {
            const value = variableValues[variable.number] || `{{${variable.number}}}`;
            previewContent = previewContent.replace(variable.placeholder, value);
        });
        return parseWhatsAppFormatting(previewContent);
    };

    const uploadHeaderMedia = async (file) => {
        if (!file || !tokens?.token) return;
        setIsUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await axios.post('https://api.w1chat.com/upload/upload-media', form, {
                headers: { 'Content-Type': 'multipart/form-data', 'token': tokens.token, 'username': tokens.username }
            });
            if (res?.data?.link) setHeaderMediaUrl(res.data.link);
        } catch (e) {
            alert('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const sendTemplate = async () => {
        if (variables.length > 0) {
            const missing = variables.some(v => !((variableValues[v.number] || '').trim()));
            if (missing) { alert('Please fill variables'); return; }
        }
        if (requiresHeaderMedia && !headerMediaUrl) { alert('Header media required'); return; }

        setSendingTemplate(true);
        try {
            const formattedComponents = [];

            if (requiresHeaderMedia) {
                const mediaType = headerFormat.toLowerCase();
                const mediaParam = { type: mediaType, [mediaType]: { link: headerMediaUrl } };
                formattedComponents.push({ type: 'header', parameters: [mediaParam] });
            }

            const bodyParams = [];
            variables.forEach(v => {
                bodyParams.push({ type: "text", text: variableValues[v.number] || "" });
            });
            if (bodyParams.length > 0) {
                formattedComponents.push({ type: "body", parameters: bodyParams });
            }

            const payload = {
                project_id: tokens.selected_project_id || tokens.projects?.[0]?.project_id,
                number: activeChat.number,
                template_id: selectedTemplate.id,
                component: formattedComponents
            };

            console.log('Sending template with payload:', payload);

            const { data, key } = Encrypt(payload);

            if (onSendTemplate) {
                await onSendTemplate(selectedTemplate, formattedComponents, renderPreviewContent());
                onClose();
                onCloseAll?.();
            } else {
                const response = await axios.post('https://api.w1chat.com/message/send-template',
                    JSON.stringify({ data, key }),
                    { headers: { 'token': tokens.token, 'username': tokens.username, 'Content-Type': 'application/json' } }
                );
                if (!response.data.error) {
                    onUseTemplate && onUseTemplate(renderPreviewContent());
                    onClose();
                    onCloseAll?.();
                } else {
                    alert(response.data.message);
                }
            }
        } catch (error) {
            alert('Error sending template');
        } finally {
            setSendingTemplate(false);
        }
    };

    const isSendDisabled = sendingTemplate || (variables.length > 0 && variables.some(v => !variableValues[v.number]));

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        className={`w-full max-w-4xl h-[85vh] ${darkMode ? 'bg-[#111b21]' : 'bg-white'} rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden`}
                    >
                        {/* LEFT PANEL: CONFIGURATION */}
                        <div className={`flex-1 flex flex-col border-b md:border-b-0 md:border-r ${darkMode ? 'border-gray-700 bg-[#111b21]' : 'border-gray-200 bg-white'} overflow-hidden`}>
                            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                                <div>
                                    <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Customize Template</h2>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedTemplate.name}</p>
                                </div>
                                <button onClick={onClose} className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                {/* Status Badge */}
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTemplate.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {selectedTemplate.status}
                                </div>

                                {/* Header Media Input */}
                                {requiresHeaderMedia && (
                                    <div className="space-y-2">
                                        <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Header Media ({headerFormat})
                                        </label>
                                        <div className={`p-3 rounded-lg border ${darkMode ? 'bg-[#202c33] border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                            <div className="flex gap-2">
                                                <input
                                                    type="url"
                                                    value={headerMediaUrl}
                                                    onChange={(e) => setHeaderMediaUrl(e.target.value)}
                                                    placeholder="https://example.com/image.png"
                                                    className={`flex-1 px-3 py-2 rounded text-sm border focus:ring-2 focus:ring-green-500 outline-none ${darkMode ? 'bg-[#2a3942] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                                        }`}
                                                />
                                                <label className={`px-3 py-2 rounded cursor-pointer text-sm font-medium transition-colors ${isUploading ? 'bg-gray-400' : 'bg-[#00a884] hover:bg-[#008f6f] text-white'
                                                    }`}>
                                                    {isUploading ? '...' : 'Upload'}
                                                    <input type="file" className="hidden" disabled={isUploading} onChange={(e) => uploadHeaderMedia(e.target.files?.[0])} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Variable Inputs */}
                                {variables.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Body Variables
                                        </h3>
                                        {variables.map((variable) => {
                                            const isDropdownOpen = openDropdowns[variable.number];

                                            return (
                                                <div key={variable.number} className="variable-dropdown relative">
                                                    <div className="flex justify-between mb-1">
                                                        <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {`{{${variable.number}}}`}
                                                        </label>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={variableValues[variable.number] || ''}
                                                            onChange={(e) => handleVariableChange(variable.number, e.target.value)}
                                                            placeholder={`Value for {{${variable.number}}}`}
                                                            className={`w-full px-3 py-2.5 rounded-md border text-sm focus:border-[#00a884] outline-none ${darkMode
                                                                ? 'bg-[#2a3942] border-gray-600 text-white placeholder-gray-500'
                                                                : 'bg-white border-gray-300 text-gray-900'
                                                                }`}
                                                        />
                                                        <button
                                                            type="button" // Important to prevent form submission
                                                            onClick={() => setOpenDropdowns(prev => ({ ...prev, [variable.number]: !prev[variable.number] }))}
                                                            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 z-10"
                                                        >
                                                            <FiChevronDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {/* --- THIS WAS MISSING IN YOUR CODE --- */}
                                                        {isDropdownOpen && (
                                                            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 max-h-48 overflow-y-auto ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                                                                }`}>
                                                                <div className="py-1">
                                                                    {generateVariableOptions().map((option, index) => (
                                                                        <button
                                                                            key={index}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleVariableChange(variable.number, option.value);
                                                                                setOpenDropdowns(prev => ({ ...prev, [variable.number]: false }));
                                                                            }}
                                                                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${darkMode
                                                                                ? 'text-gray-300 hover:bg-gray-600'
                                                                                : 'text-gray-700 hover:bg-gray-50'
                                                                                }`}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium">{option.label}</span>
                                                                                <span className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                                    {option.value}
                                                                                </span>
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* ------------------------------------- */}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer Buttons */}
                            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                                <button onClick={onClose} className={`px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    Cancel
                                </button>
                                <button
                                    onClick={sendTemplate}
                                    disabled={isSendDisabled}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium text-white transition-all ${isSendDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#00a884] hover:bg-[#008f6f] shadow-sm'
                                        }`}
                                >
                                    {sendingTemplate ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSend />}
                                    Send Template
                                </button>
                            </div>
                        </div>

                        {/* RIGHT PANEL: PREVIEW */}
                        <div className={`w-full md:w-[400px] flex flex-col ${darkMode ? 'bg-[#0b141a]' : 'bg-[#efeae2]'} relative`}>
                            {/* Background */}
                            <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
                                backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
                                backgroundRepeat: 'repeat'
                            }}></div>

                            {/* Header */}
                            <div className={`relative z-10 flex items-center gap-3 px-4 py-3 ${darkMode ? 'bg-[#202c33] text-white' : 'bg-[#008069] text-white'} shadow-sm`}>
                                <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                                    <div className="w-full h-full flex items-center justify-center bg-white/20 text-lg font-medium">
                                        {activeChat?.name?.[0] || 'C'}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm truncate">{activeChat?.name || activeChat?.number || 'Contact'}</div>
                                    <div className="text-xs opacity-80">online</div>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-4 relative z-10 flex flex-col">
                                <div className="flex justify-center mb-4">
                                    <span className={`text-xs px-3 py-1.5 rounded-lg shadow-sm ${darkMode ? 'bg-[#182229] text-gray-300' : 'bg-white text-gray-600'}`}>
                                        Today
                                    </span>
                                </div>

                                <div className="flex justify-end w-full">
                                    {/* MESSAGE BUBBLE CONTAINER (No Padding Here to allow full width elements) */}
                                    <div className={`
                                        relative max-w-[300px] sm:max-w-[320px] rounded-lg shadow-sm flex flex-col
                                        ${darkMode ? 'bg-[#005c4b]' : 'bg-[#d9fdd3]'}
                                    `}>
                                        {/* Tail */}
                                        <span className={`absolute top-0 -right-[8px] w-[8px] h-[13px] overflow-hidden`}>
                                            <svg viewBox="0 0 8 13" width="8" height="13" className={`w-full h-full fill-current ${darkMode ? 'text-[#005c4b]' : 'text-[#d9fdd3]'}`}>
                                                <path opacity="0.13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
                                                <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"></path>
                                            </svg>
                                        </span>

                                        {/* 1. HEADER MEDIA (Full Width) */}
                                        {requiresHeaderMedia && headerMediaUrl && (
                                            <div className="p-1 pb-0">
                                                {(() => {
                                                    const url = headerMediaUrl;
                                                    const isPdf = url.toLowerCase().includes('.pdf') || headerFormat === 'DOCUMENT';
                                                    const isVideo = headerFormat === 'VIDEO';

                                                    if (!isPdf) {
                                                        return (
                                                            <div className="w-full h-40 sm:h-48 bg-black/10 rounded-lg overflow-hidden relative">
                                                                {isVideo ? (
                                                                    <video src={url} className="w-full h-full object-cover" controls={false} />
                                                                ) : (
                                                                    <img src={url} alt="Header" className="w-full h-full object-cover" />
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    const fileName = getFileNameFromUrl(url);
                                                    const ext = getFileExtension(fileName).toUpperCase();
                                                    return (
                                                        <div className={`rounded-lg overflow-hidden flex items-center h-20 ${darkMode ? 'bg-[#233039]' : 'bg-[#f5fcf4]'} relative`}>
                                                            <div className="w-14 h-full flex items-center justify-center">
                                                                <FiFileText className={`w-8 h-8 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
                                                            </div>
                                                            <div className="flex-1 pr-3 overflow-hidden">
                                                                <div className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                                    {fileName}
                                                                </div>
                                                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                    {ext} • 1 page
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {/* 2. CONTENT WRAPPER (Applies Padding for Text Only) */}
                                        <div className="px-2 pt-2 pb-3">
                                            {/* Body Text */}
                                            <div className={`text-[14.2px] leading-[19px] whitespace-pre-wrap ${darkMode ? 'text-white' : 'text-[#111b21]'}`}>
                                                {renderPreviewContent()}

                                                {/* Metadata float right inside text */}
                                                <span className="float-right flex items-center gap-1 mt-1 ml-2 relative top-1.5">
                                                    <span className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-[#667781]'}`}>
                                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </span>
                                                    <BsCheckAll className={`text-[16px] ${darkMode ? 'text-[#53bdeb]' : 'text-[#53bdeb]'}`} />
                                                </span>
                                            </div>

                                            {/* Footer Text */}
                                            {footerText && (
                                                <div className={`text-[13px] mt-1 opacity-60 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {footerText}
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. BUTTONS (FULL WIDTH - Outside padding wrapper) */}
                                        {buttons && buttons.length > 0 && (
                                            <div className={`w-full flex flex-col rounded-b-lg overflow-hidden border-t ${darkMode ? 'border-white/10 bg-[#202c33]/30' : 'border-[#0000000d] bg-[#f0f2f5]/30'}`}>
                                                {buttons.map((btn, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        className={`
                                                            w-full py-3 px-4 text-center 
                                                            text-[#00a5f4] text-[15px] font-medium 
                                                            cursor-pointer transition-colors
                                                            hover:bg-black/5 dark:hover:bg-white/5
                                                            flex items-center justify-center gap-2
                                                            ${idx !== 0 ? `border-t ${darkMode ? 'border-white/10' : 'border-[#0000000d]'}` : ''}
                                                        `}
                                                    >
                                                        {btn.type === 'URL' && <span className="text-xs">↗</span>}
                                                        {btn.type === 'PHONE_NUMBER' && <span className="text-xs">📞</span>}
                                                        {btn.text}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Fake Input Area */}
                            <div className={`p-3 flex items-center gap-3 relative z-10 ${darkMode ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
                                <div className={`p-2 rounded-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>+</div>
                                <div className={`flex-1 py-2 px-4 rounded-lg ${darkMode ? 'bg-[#2a3942] text-gray-300' : 'bg-white text-gray-500'} text-sm`}>
                                    Type a message
                                </div>
                                <div className={`p-2 rounded-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>🎙️</div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TemplatePreview;