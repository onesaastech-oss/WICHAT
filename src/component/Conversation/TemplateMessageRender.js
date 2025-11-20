import React from 'react';
// You may need to import icons from your icon library (e.g., react-icons or lucide-react)
// import { FiFileText, FiVideo, FiImage } from 'react-icons/fi';
// import { BsCheckAll } from 'react-icons/bs'; 

// Helper to get file meta if not provided
const getFileNameFromUrl = (url) => url?.substring(url.lastIndexOf('/') + 1) || 'Document';
const getFileExtension = (name) => name?.split('.').pop() || '';

const TemplateMessageRenderer = ({ msg, darkMode, renderFilePreview, isOwnMessage, onAudioTimeChange }) => {
    const template = msg.template || {};
    const components = template.components || [];
    const componentList = Array.isArray(msg.component) ? msg.component : [];

    // --- 1. Extract Data ---
    const headerComponent = components.find(c => c.type === 'HEADER');
    const componentHeader = componentList.find(c => c.type?.toLowerCase() === 'header');
    const bodyComponent = components.find(c => c.type === 'BODY');
    const footerComponent = components.find(c => c.type === 'FOOTER');
    const buttonsComponent = components.find(c => c.type === 'BUTTONS');

    // Header Logic
    const headerParamType = componentHeader?.parameters?.[0]?.type?.toUpperCase();
    const headerFormat = headerComponent?.format || headerParamType || 'NONE';
    const hasHeaderMedia = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat);
    const headerText = headerFormat === 'TEXT' ? headerComponent?.text : null;
    
    // Body Logic
    const bodyText = msg.message || bodyComponent?.text || '';

    // Footer Logic
    const footerText = footerComponent?.text || '';

    // Buttons Logic
    const buttons = buttonsComponent?.buttons || [];

    // --- 2. Style Constants (WhatsApp Specifics) ---
    const bubbleBgClass = isOwnMessage
        ? (darkMode ? 'bg-[#005c4b]' : 'bg-[#d9fdd3]') // Outgoing Green
        : (darkMode ? 'bg-[#202c33]' : 'bg-white');     // Incoming White/Dark

    const tailColorClass = isOwnMessage
        ? (darkMode ? 'text-[#005c4b]' : 'text-[#d9fdd3]')
        : (darkMode ? 'text-[#202c33]' : 'text-white');

    const textColorClass = darkMode ? 'text-gray-100' : 'text-[#111b21]';
    const secondaryTextColorClass = darkMode ? 'text-gray-400' : 'text-[#667781]';
    const separatorBorderClass = darkMode ? 'border-white/10' : 'border-[#0000000d]';

    // ⚠️ Handle case where template data is completely missing (e.g. temp message before refresh)
    // If we have a message body but no template structure, fallback to simple text rendering
    if (!template.components && msg.message) {
        return (
             <div className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
                <div className={`
                    relative max-w-[320px] sm:max-w-[360px] rounded-lg shadow-sm flex flex-col p-2
                    ${bubbleBgClass}
                    ${isOwnMessage ? 'rounded-tr-none' : 'rounded-tl-none'}
                `}>
                    <span className={`absolute top-0 w-[8px] h-[13px] overflow-hidden ${isOwnMessage ? '-right-[8px]' : '-left-[8px]'}`}>
                        <svg viewBox="0 0 8 13" width="8" height="13" className={`w-full h-full fill-current ${tailColorClass}`}>
                             {isOwnMessage ? (
                                <>
                                    <path opacity="0.13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                                    <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
                                </>
                            ) : (
                                <path d="M-2.288 0H2.9v11.193l-6.467-8.625C-4.626 1.156 -4.058 0 -2.288 0z" transform="scale(-1,1) translate(-8,0)" />
                            )}
                        </svg>
                    </span>
                     <div className={`text-[14.2px] leading-[19px] whitespace-pre-wrap break-words ${textColorClass}`}>
                        {msg.message}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`
                relative max-w-[320px] sm:max-w-[360px] rounded-lg shadow-sm flex flex-col
                ${bubbleBgClass}
                ${isOwnMessage ? 'rounded-tr-none' : 'rounded-tl-none'}
            `}>
                
                {/* --- 3. The WhatsApp Tail SVG --- */}
                <span className={`absolute top-0 w-[8px] h-[13px] overflow-hidden ${isOwnMessage ? '-right-[8px]' : '-left-[8px]'}`}>
                    <svg viewBox="0 0 8 13" width="8" height="13" className={`w-full h-full fill-current ${tailColorClass}`}>
                        {isOwnMessage ? (
                            // Right Tail (Outgoing)
                            <>
                                <path opacity="0.13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                                <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
                            </>
                        ) : (
                            // Left Tail (Incoming) - Mirrored
                            <path d="M-2.288 0H2.9v11.193l-6.467-8.625C-4.626 1.156 -4.058 0 -2.288 0z" transform="scale(-1,1) translate(-8,0)" />
                        )}
                    </svg>
                </span>

                {/* --- 4. Header Component (Media or Text) --- */}
                {/* Media Header */}
                {hasHeaderMedia && msg.media_url && (
                    <div className="p-1 pb-0">
                        {headerFormat === 'DOCUMENT' ? (
                             // Document Card Look
                            <div className={`rounded-md overflow-hidden flex items-center h-20 relative ${darkMode ? 'bg-[#2a3942]' : 'bg-[#f0f2f5]'} bg-opacity-50`}>
                                {renderFilePreview ? renderFilePreview(
                                    {
                                        ...msg,
                                        message_type: 'document',
                                        send_by: isOwnMessage ? 'You' : (msg.send_by || '')
                                    },
                                    { onAudioTimeChange }
                                ) : (
                                    /* Fallback if renderFilePreview isn't available/capable of custom styling */
                                    <div className="flex items-center w-full px-3">
                                        <div className="mr-3">
                                            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className={`text-sm font-medium truncate ${textColorClass}`}>
                                                {getFileNameFromUrl(msg.media_url)}
                                            </div>
                                            <div className={`text-xs uppercase ${secondaryTextColorClass}`}>
                                                {getFileExtension(getFileNameFromUrl(msg.media_url))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Image or Video Look
                            <div className="rounded-lg overflow-hidden mb-1">
                                {renderFilePreview && renderFilePreview(
                                    {
                                        ...msg,
                                        message_type: headerFormat.toLowerCase(),
                                        send_by: isOwnMessage ? 'You' : (msg.send_by || '')
                                    },
                                    { onAudioTimeChange }
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Text Header */}
                {headerText && (
                    <div className="px-2 pt-2">
                        <div className={`text-[14.5px] font-bold ${textColorClass}`}>
                            {headerText}
                        </div>
                    </div>
                )}

                {/* --- 5. Body & Content Wrapper --- */}
                <div className={`px-2 pt-1.5 ${buttons.length > 0 ? 'pb-2' : 'pb-1.5'}`}>
                    
                    {/* Body Text */}
                    {bodyText && (
                        <div className={`text-[14.2px] leading-[19px] whitespace-pre-wrap break-words ${textColorClass}`}>
                            {bodyText}
                        </div>
                    )}

                    {/* Footer Text */}
                    {footerText && (
                        <div className={`text-[11px] mt-1 opacity-80 ${secondaryTextColorClass}`}>
                            {footerText}
                        </div>
                    )}

                </div>

                {/* --- 6. Buttons (Stacked at bottom) --- */}
                {buttons && buttons.length > 0 && (
                    <div className={`mt-1 border-t ${separatorBorderClass}`}>
                        {buttons.map((btn, idx) => {
                            const isUrl = btn.type === 'URL';
                            const isPhone = btn.type === 'PHONE_NUMBER';
                            const label = btn.text || 'Button';

                            // Button styling: Full width, centered, blue text
                            const btnClasses = `
                                w-full py-2.5 px-4 
                                text-[#00a5f4] text-[14.5px] font-medium 
                                hover:bg-black/5 dark:hover:bg-white/5 transition-colors
                                flex items-center justify-center gap-2
                                ${idx !== 0 ? `border-t ${separatorBorderClass}` : ''}
                            `;

                            if (isUrl) {
                                return (
                                    <a
                                        key={idx}
                                        href={btn.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={btnClasses}
                                    >
                                        <span className="text-sm">↗</span> {label}
                                    </a>
                                );
                            } else if (isPhone) {
                                return (
                                    <a
                                        key={idx}
                                        href={`tel:${btn.phone_number}`}
                                        className={btnClasses}
                                    >
                                        <span className="text-sm">📞</span> {label}
                                    </a>
                                );
                            } else {
                                // Quick Reply / Payload Button
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={btnClasses}
                                        disabled // Typically disabled in read-only views
                                    >
                                        {label}
                                    </button>
                                );
                            }
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateMessageRenderer;