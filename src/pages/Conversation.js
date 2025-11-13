import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import {
    FiPaperclip,
    FiMic,
    FiSmile,
    FiStar,
    FiArrowLeft,
    FiMoreVertical,
    FiImage,
    FiVideo,
    FiFile,
    FiMusic,
    FiMapPin,
    FiUser,
    FiDownload,
    FiX,
    FiZoomIn,
    FiPlay,
    FiExternalLink,
    FiCheck,
    FiClock,
    FiAlertCircle,
    FiInfo,
    FiActivity,
    FiMessageSquare,
    FiLayers,
    FiEye,
    FiSearch,
    FiEdit2,
    FiCalendar,
    FiHome,
    FiMail,
    FiGlobe,
    FiFileText
} from 'react-icons/fi';
import { FaRegEye } from "react-icons/fa6";
import { MdOutlineCancel } from "react-icons/md";
import { LuSendHorizontal } from "react-icons/lu";
import { FaDownload, FaFilePdf, FaFileWord, FaFileExcel, FaFile, FaFileImage, FaFileVideo, FaFileAudio } from 'react-icons/fa';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Encrypt } from './encryption/payload-encryption';
import { dbHelper, contactDbHelper } from './db';
import ReactPlayer from 'react-player';
import ChatTemplateModal from '../component/Modals/ChatTemplateModal';
import TemplatePreview from '../component/Modals/TemplatePreview';
import EmojiPickerPopover from '../component/Modals/Conversation/EmojiPicker';
import ErrorModal from '../component/Modals/Conversation/ErrorModal';
import MessageInfoModal from '../component/Modals/Conversation/MessageInfoModal';
import MediaModal from '../component/Modals/Conversation/MediaModal';
import MessageStatusIndicator from '../component/Conversation/MessageStatusIndicator';
import DocumentPreview from '../component/Conversation/DocumentPreview';
import ImagePreview from '../component/Conversation/ImagePreview';
import VideoPreview from '../component/Conversation/VideoPreview';
import AudioPreview from '../component/Conversation/AudioPreview';
import LocationPreview from '../component/Conversation/LocationPreview';
import ContactPreview from '../component/Conversation/ContactPreview';
import { SearchChatModal } from '../component/Modals/Conversation/SearchChatModal';

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const computeSimpleHash = (value) => {
    const str = String(value || '');
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
};

const getMessageKey = (msg) => {
    if (!msg) return 'message-unknown';
    const candidates = [
        msg.message_id,
        msg.wamid,
        msg.id,
        msg.unique_id,
        msg.local_id,
        msg.timestamp,
        msg.create_date
    ];

    for (const candidate of candidates) {
        if (candidate !== undefined && candidate !== null && candidate !== '') {
            return String(candidate);
        }
    }

    const fallbackPayload = JSON.stringify({
        type: msg.type,
        message: msg.message,
        media: msg.media_url,
        name: msg.name,
        timestamp: msg.timestamp,
        create_date: msg.create_date
    });

    return `msg-${computeSimpleHash(fallbackPayload)}`;
};

const getSearchableTextFromMessage = (msg) => {
    if (!msg) return '';

    if (msg.is_template) {
        if (typeof msg.message === 'string' && msg.message.trim().length > 0) {
            return msg.message;
        }

        const templateBody = msg.template?.template_data?.body;
        if (templateBody) {
            return templateBody;
        }

        const templateComponents = msg.template?.template_data?.components;
        if (Array.isArray(templateComponents)) {
            const bodyComponent = templateComponents.find((component) => component.type === 'BODY');
            if (bodyComponent?.text) {
                return bodyComponent.text;
            }
        }
    }

    const type = (msg.message_type || '').toLowerCase();

    if (type === 'text' || type === '' || type === 'template') {
        return msg.message || '';
    }

    if (type === 'location') {
        return [msg.name, msg.address, msg.latitude, msg.longitude]
            .filter(Boolean)
            .join(' ');
    }

    if (type === 'contact') {
        const contactInfo = msg.contact || msg.contact_info || msg.contactInfo || {};
        return [
            msg.name,
            contactInfo.name,
            contactInfo.phone,
            contactInfo.email,
            msg.message
        ].filter(Boolean).join(' ');
    }

    if (['image', 'video', 'audio', 'document'].includes(type)) {
        return [msg.caption, msg.media_name, msg.message]
            .filter(Boolean)
            .join(' ');
    }

    return msg.message || '';
};

const getSnippetAroundTerm = (text, term, radius = 32) => {
    if (!text) return '';
    if (!term) return text.length > 160 ? `${text.slice(0, 160)}…` : text;

    const normalizedText = text.toLowerCase();
    const normalizedTerm = term.toLowerCase();
    const index = normalizedText.indexOf(normalizedTerm);

    if (index === -1) {
        return text.length > 160 ? `${text.slice(0, 160)}…` : text;
    }

    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + normalizedTerm.length + radius);
    const prefix = start > 0 ? '…' : '';
    const suffix = end < text.length ? '…' : '';

    return `${prefix}${text.slice(start, end)}${suffix}`;
};

const HighlightedText = ({ text, term }) => {
    if (!term || !text) {
        return <>{text}</>;
    }

    const safeTerm = escapeRegExp(term);
    if (!safeTerm) {
        return <>{text}</>;
    }

    const regex = new RegExp(`(${safeTerm})`, 'ig');
    const segments = text.split(regex);
    const termLower = term.toLowerCase();

    return (
        <>
            {segments.map((segment, idx) => (
                segment.toLowerCase() === termLower ? (
                    <span
                        key={`${segment}-${idx}`}
                        className="bg-yellow-200 dark:bg-yellow-500/40 px-1 py-0.5 rounded"
                    >
                        {segment}
                    </span>
                ) : (
                    <React.Fragment key={`${segment}-${idx}`}>
                        {segment}
                    </React.Fragment>
                )
            ))}
        </>
    );
};

const ContactFormModal = ({
    isOpen,
    onClose,
    formData,
    onChange,
    onSubmit,
    loading,
    submitting,
    error,
    isExistingContact
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 sm:p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.25 }}
                        className="flex h-[80vh] max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-3 sm:px-5 sm:py-4 flex-shrink-0">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 flex-shrink-0">
                                    <FiEdit2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                                        {isExistingContact ? 'Edit Contact' : 'Save Contact'}
                                    </h3>
                                    {/* <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                                        Details are stored locally on this device.
                                    </p> */}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 flex-shrink-0 ml-2"
                                aria-label="Close contact modal"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="space-y-4 px-3 py-4 sm:px-5">
                                {error && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-900/30 dark:text-red-200">
                                        {error}
                                    </div>
                                )}

                                {loading && (
                                    <div className="flex items-center space-x-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-600 dark:border-blue-500/30 dark:bg-blue-900/30 dark:text-blue-200">
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-r-transparent" />
                                        <span>Loading contact details…</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4">
                                    <label className="flex flex-col space-y-1 text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Name</span>
                                        <input
                                            value={formData.name}
                                            onChange={(e) => onChange('name', e.target.value)}
                                            placeholder="Contact name"
                                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                                            disabled={loading || submitting}
                                        />
                                    </label>

                                    <label className="flex flex-col space-y-1 text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Mobile Number</span>
                                        <input
                                            value={formData.number}
                                            onChange={(e) => onChange('number', e.target.value)}
                                            placeholder="WhatsApp number"
                                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                                            disabled={loading || submitting}
                                        />
                                    </label>

                                    <label className="flex flex-col space-y-1 text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Email</span>
                                        <input
                                            value={formData.email}
                                            onChange={(e) => onChange('email', e.target.value)}
                                            placeholder="Email address"
                                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                                            disabled={loading || submitting}
                                        />
                                    </label>

                                    <label className="flex flex-col space-y-1 text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Company / Firm</span>
                                        <input
                                            value={formData.firm_name}
                                            onChange={(e) => onChange('firm_name', e.target.value)}
                                            placeholder="Company name"
                                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                                            disabled={loading || submitting}
                                        />
                                    </label>

                                    <label className="flex flex-col space-y-1 text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Website</span>
                                        <input
                                            value={formData.website}
                                            onChange={(e) => onChange('website', e.target.value)}
                                            placeholder="https://example.com"
                                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                                            disabled={loading || submitting}
                                        />
                                    </label>

                                    <label className="flex flex-col space-y-1 text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Remark</span>
                                        <textarea
                                            value={formData.remark}
                                            onChange={(e) => onChange('remark', e.target.value)}
                                            placeholder="Internal notes"
                                            rows={3}
                                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                                            disabled={loading || submitting}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 bg-gray-50 px-3 py-3 sm:px-5 sm:py-4 dark:border-gray-700 dark:bg-gray-900/60 flex-shrink-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">

                            </div>
                            <button
                                onClick={onSubmit}
                                disabled={loading || submitting}
                                className={`inline-flex items-center justify-center space-x-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition w-full sm:w-auto ${loading || submitting
                                    ? 'cursor-not-allowed bg-blue-300 dark:bg-blue-700'
                                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                                    }`}
                            >
                                {submitting ? (
                                    <span className="flex items-center space-x-2">
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                                        <span>Saving…</span>
                                    </span>
                                ) : (
                                    <>
                                        <FiCheck className="h-4 w-4" />
                                        <span>{isExistingContact ? 'Update Contact' : 'Save Contact'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// Date Separator Component
const DateSeparator = ({ displayDate, dateId }) => {
    return (
        <div id={dateId} className="flex items-center justify-center my-4 sm:my-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                        {displayDate}
                    </span>
                </div>
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            </div>
        </div>
    );
};

// Template Message Renderer Component
const TemplateMessageRenderer = ({ msg, darkMode, renderFilePreview, isOwnMessage }) => {
    const template = msg.template || {};
    const components = template.components || [];
    const componentList = Array.isArray(msg.component) ? msg.component : [];

    // Extract components
    const headerComponent = components.find(c => c.type === 'HEADER');
    const componentHeader = componentList.find(c => c.type?.toLowerCase() === 'header');
    const bodyComponent = components.find(c => c.type === 'BODY');
    const footerComponent = components.find(c => c.type === 'FOOTER');
    const buttonsComponent = components.find(c => c.type === 'BUTTONS');

    // Get header media info
    const headerParamType = componentHeader?.parameters?.[0]?.type?.toUpperCase();
    const headerFormat = headerComponent?.format || headerParamType || 'NONE';
    const hasHeaderMedia = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat);

    // Get body text (already resolved message with variables replaced)
    const bodyText = msg.message || bodyComponent?.text || '';

    // Get footer text
    const footerText = footerComponent?.text || '';

    // Get buttons
    const buttons = buttonsComponent?.buttons || [];

    // Determine text colors based on message type (outgoing has white text on blue bg)
    const textColorClass = isOwnMessage
        ? 'text-white'
        : (darkMode ? 'text-white' : 'text-gray-900');
    const footerColorClass = isOwnMessage
        ? 'text-white/80'
        : (darkMode ? 'text-gray-300' : 'text-gray-600');
    const buttonClass = isOwnMessage
        ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
        : (darkMode
            ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
            : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50');

    return (
        <div className="space-y-2">
            {/* Header Media */}
            {hasHeaderMedia && msg.media_url && (
                <div className="mb-2">
                    {renderFilePreview({
                        ...msg,
                        message_type: headerFormat.toLowerCase() === 'document' ? 'document' :
                            headerFormat.toLowerCase() === 'video' ? 'video' :
                                headerFormat.toLowerCase() === 'image' ? 'image' : 'document',
                        send_by: isOwnMessage ? 'You' : (msg.send_by || msg.send_by_name || '')
                    })}
                </div>
            )}

            {/* Body Text */}
            {bodyText && (
                <div className={`text-sm sm:text-base whitespace-pre-wrap break-words ${textColorClass}`}>
                    {bodyText}
                </div>
            )}

            {/* Footer */}
            {footerText && (
                <div className={`text-xs mt-2 ${footerColorClass}`}>
                    {footerText}
                </div>
            )}

            {/* Buttons */}
            {buttons && buttons.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {buttons.map((btn, idx) => {
                        const isUrl = btn.type === 'URL';
                        const isPhone = btn.type === 'PHONE_NUMBER';
                        const buttonText = btn.text || 'Button';

                        if (isUrl) {
                            return (
                                <a
                                    key={idx}
                                    href={btn.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${buttonClass}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {buttonText}
                                </a>
                            );
                        } else if (isPhone) {
                            return (
                                <a
                                    key={idx}
                                    href={`tel:${btn.phone_number || ''}`}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${buttonClass}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {buttonText}
                                </a>
                            );
                        } else {
                            return (
                                <button
                                    key={idx}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${buttonClass}`}
                                    disabled
                                >
                                    {buttonText}
                                </button>
                            );
                        }
                    })}
                </div>
            )}
        </div>
    );
};

// Message Item Component with Info Button
const MessageItem = ({ msg, activeChat, darkMode, renderFilePreview, formatTime, messageKey, highlightedMessageId }) => {
    const [showInfoModal, setShowInfoModal] = useState(false);
    const isHighlighted = highlightedMessageId === messageKey;
    const bubbleHighlightClass = isHighlighted
        ? (msg.type === 'out'
            ? 'ring-2 ring-offset-2 ring-offset-blue-100 ring-white dark:ring-offset-blue-900/40'
            : 'ring-2 ring-offset-2 ring-offset-gray-100 ring-blue-300 dark:ring-offset-gray-800 dark:ring-blue-500')
        : '';

    return (
        <>
            <div className={`flex ${msg.type === 'out' ? 'justify-end' : 'justify-start'} w-full group`}>
                <div className={`max-w-[80%] ${msg.type === 'out' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-end space-x-1 sm:space-x-2 ${msg.type === 'out' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {msg.type !== 'out' && (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                                {activeChat.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div
                            id={`message-${messageKey}`}
                            className={`p-3 sm:p-4 rounded-2xl ${msg.type === 'out'
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700'
                                } max-w-full relative ${bubbleHighlightClass}`}
                        >
                            {msg.is_template ? (
                                <TemplateMessageRenderer
                                    msg={msg}
                                    darkMode={darkMode}
                                    renderFilePreview={renderFilePreview}
                                    isOwnMessage={msg.type === 'out'}
                                />
                            ) : msg.message_type === 'text' ? (
                                <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{msg.message}</p>
                            ) : (
                                <div className="space-y-2">
                                    {renderFilePreview(msg)}
                                    {msg.message && msg.message.trim() && (
                                        <p className="whitespace-pre-wrap break-words text-sm sm:text-base">
                                            {msg.message}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className={`flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2 ${msg.type === 'out' ? 'justify-end' : 'justify-start'}`}>


                                <span className="text-xs opacity-75">
                                    {formatTime(msg.timestamp || msg.create_date)}
                                </span>

                                <MessageStatusIndicator
                                    status={msg.status || 'pending'}
                                    isOwnMessage={msg.type === 'out'}
                                    darkMode={darkMode}
                                    failedReason={msg.failed_reason}
                                />

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowInfoModal(true);
                                    }}
                                    className={`top-2 bg-gray-200 ${msg.type === 'out' ? 'left-2' : 'right-2'} 
                                     group-hover:opacity-100 transition-opacity duration-200
                                    p-1 rounded-full hover:bg-black hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-10
                                    focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
                                    title="View message details"
                                >
                                    <FiInfo className="w-2.5 h-2.5 text-gray-700 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Info Button */}

                        </div>
                    </div>
                </div>
            </div>

            <MessageInfoModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
                message={msg}
                activeChat={activeChat}
            />
        </>
    );
};

// Main Conversation Component
function Conversation({ activeChat, tokens, onBack, darkMode, dbAvailable, socketMessage = null, onMessageStatusUpdate }) {
    const [messageInput, setMessageInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showTemplatePreview, setShowTemplatePreview] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingPrevious, setLoadingPrevious] = useState(false);
    const [messages, setMessages] = useState([]);
    const [lastId, setLastId] = useState("0");
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactLoading, setContactLoading] = useState(false);
    const [contactSubmitting, setContactSubmitting] = useState(false);
    const [contactError, setContactError] = useState('');
    const [existingContactId, setExistingContactId] = useState(null);
    const [contactDbReady, setContactDbReady] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const [contactForm, setContactForm] = useState({
        name: activeChat?.name || '',
        number: activeChat?.number || '',
        email: '',
        firm_name: '',
        website: '',
        remark: '',
        language_code: '',
        country: ''
    });

    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // Contact details side panel state
    const [showContactDetails, setShowContactDetails] = useState(false);
    const [contactDetails, setContactDetails] = useState(null);
    const [contactDetailsLoading, setContactDetailsLoading] = useState(false);
    const [contactDetailsError, setContactDetailsError] = useState('');
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const initialScrollDoneRef = useRef(false);
    const emojiButtonRef = useRef(null);
    const messageInputRef = useRef(null);
    const inputSelectionRef = useRef({ start: 0, end: 0 });
    const headerMenuButtonRef = useRef(null);
    const headerMenuRef = useRef(null);
    const contactDbInitRef = useRef(false);

    const projectId = tokens?.projects?.[0]?.project_id;

    const ensureContactDb = useCallback(async () => {
        if (contactDbInitRef.current && contactDbReady) {
            return true;
        }

        if (!projectId) {
            console.warn('Missing project id for contact database initialisation');
            setContactDbReady(false);
            return false;
        }

        try {
            const result = await contactDbHelper.init(projectId);
            contactDbInitRef.current = result;
            setContactDbReady(result);
            return result;
        } catch (error) {
            console.error('Failed to initialise contact database:', error);
            contactDbInitRef.current = false;
            setContactDbReady(false);
            return false;
        }
    }, [projectId, contactDbReady]);

    const handleContactFieldChange = useCallback((field, value) => {
        setContactForm((prev) => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleCloseContactModal = useCallback(() => {
        if (contactSubmitting) return;
        setShowContactModal(false);
    }, [contactSubmitting]);

    const handleContactMenuClick = useCallback(async () => {
        console.log(1);
        
        setShowHeaderMenu(false);
        if (!activeChat?.number) {
            setContactError('Active chat information is unavailable.');
            setShowContactModal(true);
            return;
        }

        console.log(2);
        

        setShowContactModal(true);
        setContactError('');
        setContactLoading(true);

        console.log(3);
        

        setContactForm((prev) => ({
            ...prev,
            name: activeChat?.name || '',
            number: activeChat?.number || ''
        }));

        console.log(4);
        

        try {
            const ready = await ensureContactDb();

            console.log(5);
            
            if (!ready) {
                setContactError('Unable to access local contact storage.');
                return;
            }

            // Check if contactDetails exists and matches current contact
            let currentContactDetails = null;
            if (contactDetails?.contact?.number === activeChat.number && contactDetails?.has_contact) {
                currentContactDetails = contactDetails.contact;
            } else {
                // Fetch fresh contact details for current contact
                if (tokens?.token && tokens?.username) {
                    try {
                        const payload = {
                            project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                            number: activeChat.number
                        };
                        const { data, key } = Encrypt(payload);
                        const data_pass = JSON.stringify({ data, key });
                        const response = await axios.post(
                            'https://api.w1chat.com/contact/contact-details',
                            data_pass,
                            {
                                headers: {
                                    'token': tokens.token,
                                    'username': tokens.username,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        if (!response?.data?.error && response?.data?.has_contact) {
                            currentContactDetails = response.data.contact;
                            setContactDetails(response.data);
                        }
                    } catch (fetchError) {
                        console.error('Failed to fetch contact details:', fetchError);
                        // Continue with existing data if fetch fails
                    }
                }
            }

            let existing = await contactDbHelper.getContactByNumber(activeChat.number);

            console.log(6);
            
            setExistingContactId(existing?.contact_id || null);
            setContactForm({
                name: currentContactDetails?.name || existing?.name || activeChat.name || '',
                number: activeChat.number || '',
                email: currentContactDetails?.email || existing?.email || '',
                firm_name: currentContactDetails?.firm_name || existing?.firm_name || '',
                website: currentContactDetails?.website || existing?.website || '',
                remark: currentContactDetails?.remark || existing?.remark || '',
                language_code: currentContactDetails?.language_code || existing?.language_code || '',
                country: currentContactDetails?.country || existing?.country || ''
            });
        } catch (error) {
            console.error('Failed to load contact details:', error);
            setContactError('Failed to load contact details.');
        } finally {
            setContactLoading(false);
        }
    }, [activeChat, ensureContactDb, contactDetails, tokens]);

    const handleContactSave = useCallback(async () => {
        if (contactSubmitting) return;

        if (!tokens?.token || !tokens?.username) {
            setContactError('Authentication required. Please login again.');
            return;
        }

        const trimmedNumber = contactForm.number?.trim();
        const trimmedName = contactForm.name?.trim();

        if (!trimmedNumber) {
            setContactError('Mobile number is required.');
            return;
        }

        if (!trimmedName) {
            setContactError('Name is required.');
            return;
        }

        const ready = await ensureContactDb();
        if (!ready) {
            setContactError('Unable to access local contact storage.');
            return;
        }

        setContactSubmitting(true);
        setContactError('');

        try {
            const isUpdate = Boolean(existingContactId);
            console.log(existingContactId);
            console.log(isUpdate);


            const payload = {
                project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                number: trimmedNumber,
                name: trimmedName,
                email: contactForm.email?.trim() || '',
                firm_name: contactForm.firm_name?.trim() || '',
                website: contactForm.website?.trim() || '',
                remark: contactForm.remark?.trim() || ''
            };

            // Add contact_id for update requests
            if (isUpdate) {
                payload.contact_id = existingContactId;
            }

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const apiUrl = isUpdate
                ? 'https://api.w1chat.com/contact/update-contact'
                : 'https://api.w1chat.com/contact/create-contact';

            const response = await axios.post(apiUrl, data_pass, {
                headers: {
                    'token': tokens.token,
                    'username': tokens.username,
                    'Content-Type': 'application/json'
                }
            });

            if (!response?.data?.error) {
                // Save to local database with response data
                const contactData = {
                    contact_id: isUpdate
                        ? existingContactId
                        : (response?.data?.data?.id || Date.now().toString()),
                    number: trimmedNumber,
                    name: trimmedName,
                    email: contactForm.email?.trim() || '',
                    firm_name: contactForm.firm_name?.trim() || '',
                    website: contactForm.website?.trim() || '',
                    remark: contactForm.remark?.trim() || '',
                    language_code: contactForm.language_code?.trim() || '',
                    country: contactForm.country?.trim() || '',
                    create_date: isUpdate
                        ? undefined // Don't update create_date on edit
                        : new Date().toISOString()
                };

                await contactDbHelper.saveContacts([contactData]);

                if (isUpdate) {
                    setExistingContactId(existingContactId);
                } else {
                    setExistingContactId(contactData.contact_id);
                }

                // Update chat name in local database
                if (dbAvailable && trimmedName) {
                    try {
                        await dbHelper.updateChat(trimmedNumber, { name: trimmedName });
                    } catch (updateError) {
                        console.warn('Failed to sync chat name with contact name:', updateError);
                    }
                }

                setShowContactModal(false);
            } else {
                const errorMessage = response?.data?.message || 'Unknown error';
                setContactError(`Failed to ${isUpdate ? 'update' : 'create'} contact: ${errorMessage}`);
            }
        } catch (error) {
            console.error(`Failed to ${existingContactId ? 'update' : 'create'} contact:`, error);
            setContactError(`Failed to ${existingContactId ? 'update' : 'create'} contact. Please try again.`);
        } finally {
            setContactSubmitting(false);
        }
    }, [contactForm, existingContactId, ensureContactDb, contactSubmitting, dbAvailable, tokens]);

    const handleSearchMenuClick = useCallback(() => {
        setShowHeaderMenu(false);
        setSearchQuery('');
        setSearchModalOpen(true);
    }, []);

    const handleSearchQueryChange = useCallback((value) => {
        setSearchQuery(value);
    }, []);

    const handleCloseSearchModal = useCallback(() => {
        setSearchModalOpen(false);
    }, []);

    const handleSearchResultClick = useCallback((messageKey) => {
        setSearchModalOpen(false);
        if (!messageKey) return;
        setHighlightedMessageId(messageKey);

        setTimeout(() => {
            const node = document.getElementById(`message-${messageKey}`);
            if (node?.scrollIntoView) {
                node.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 80);
    }, []);

    const handleDateClick = useCallback((selectedDate) => {
        setSearchModalOpen(false);
        if (!selectedDate) return;

        // Convert selected date to date string format used by getDateString
        const date = new Date(selectedDate);
        const dateString = date.toDateString(); // Format: "Mon Oct 26 2025"

        // Format date for display
        const formattedDate = formatDateForDisplay(date);

        setTimeout(() => {
            const node = document.getElementById(`date-separator-${dateString}`);
            if (node?.scrollIntoView) {
                node.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Date not found - show custom toast notification
                toast.custom((t) => (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        className={`max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl pointer-events-auto flex border border-gray-200 dark:border-gray-700 overflow-hidden`}
                    >
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                        <FiCalendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        No conversations found
                                    </p>
                                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                        No messages on <span className="font-medium text-gray-700 dark:text-gray-300">{formattedDate}</span>
                                    </p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex">
                                    <button
                                        onClick={() => toast.dismiss(t.id)}
                                        className="inline-flex rounded-md p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                    >
                                        <FiX className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ), {
                    duration: 2000,
                    position: 'top-center',
                });
            }
        }, 80);
    }, [darkMode]);

    const searchResults = useMemo(() => {
        const term = searchQuery.trim();
        if (!term) return [];

        const lowerTerm = term.toLowerCase();
        const results = [];
        const seen = new Set();

        // Helper function to get date for search results (empty if today)
        const getSearchResultDate = (timestamp) => {
            if (!timestamp) return '';
            try {
                const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
                const today = new Date();

                // Reset time to compare only dates
                const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                // If it's today, return empty string
                if (messageDate.getTime() === todayDate.getTime()) {
                    return '';
                }

                // Otherwise, format the date
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

                if (messageDate.getTime() === yesterdayDate.getTime()) {
                    return 'Yesterday';
                } else {
                    // Format as DD/MM/YYYY
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                }
            } catch {
                return '';
            }
        };

        messages.forEach((msg) => {
            const text = getSearchableTextFromMessage(msg);
            if (!text) return;
            if (!text.toLowerCase().includes(lowerTerm)) return;

            const key = getMessageKey(msg);
            if (seen.has(key)) return;
            seen.add(key);

            const msgTimestamp = msg.timestamp || msg.create_date;
            results.push({
                messageKey: key,
                snippet: getSnippetAroundTerm(text, term),
                timestamp: formatTime(msgTimestamp),
                date: getSearchResultDate(msgTimestamp),
                direction: msg.type === 'out' ? 'You' : (activeChat?.name || msg.send_by_name || msg.send_by_username || 'Contact')
            });
        });

        return results.slice(0, 50);
    }, [searchQuery, messages, activeChat?.name]);

    useEffect(() => {
        if (!highlightedMessageId) return;
        const timer = setTimeout(() => setHighlightedMessageId(null), 3500);
        return () => clearTimeout(timer);
    }, [highlightedMessageId]);

    useEffect(() => {
        if (!showHeaderMenu) return;

        const handleClickOutside = (event) => {
            if (!headerMenuRef.current && !headerMenuButtonRef.current) return;

            const menuNode = headerMenuRef.current;
            const buttonNode = headerMenuButtonRef.current;

            if (menuNode && menuNode.contains(event.target)) return;
            if (buttonNode && buttonNode.contains(event.target)) return;

            setShowHeaderMenu(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showHeaderMenu]);

    useEffect(() => {
        setShowHeaderMenu(false);
    }, [activeChat?.number]);

    const updateSelectionFromInput = () => {
        const inputEl = messageInputRef.current;
        if (!inputEl) return;
        inputSelectionRef.current = {
            start: inputEl.selectionStart || 0,
            end: inputEl.selectionEnd || 0
        };
    };

    const handleEmojiSelect = (emoji) => {
        const inputEl = messageInputRef.current;
        const { start, end } = inputSelectionRef.current || { start: messageInput.length, end: messageInput.length };
        const insertAt = Number.isInteger(start) ? start : messageInput.length;
        const replaceTo = Number.isInteger(end) ? end : insertAt;
        const newValue = messageInput.slice(0, insertAt) + emoji + messageInput.slice(replaceTo);
        setMessageInput(newValue);

        // Restore focus and caret after updating value
        requestAnimationFrame(() => {
            if (inputEl) {
                inputEl.focus();
                const newCaret = insertAt + emoji.length;
                try {
                    inputEl.setSelectionRange(newCaret, newCaret);
                } catch (_) {
                    // ignore selection errors on some browsers
                }
            }
        });
    };

    useEffect(() => {
        markAsRead(activeChat.number);
    }, [activeChat, messages]);

    useEffect(() => {
        setContactForm({
            name: activeChat?.name || '',
            number: activeChat?.number || '',
            email: '',
            firm_name: '',
            website: '',
            remark: '',
            language_code: '',
            country: ''
        });
        setExistingContactId(null);
        setContactError('');
    }, [activeChat?.name, activeChat?.number]);

    // Load message history when active chat changes
    useEffect(() => {
        if (!tokens || !activeChat) return;

        (async () => {
            // Reset initial scroll state for new chat so first scroll is instant
            initialScrollDoneRef.current = false;
            // Reset pagination state for new chat
            setLastId("0");
            setHasMoreMessages(true);
            setLoadingPrevious(false);

            if (dbAvailable) {
                const localMessage = await dbHelper.getMessages(activeChat.number);
                if (localMessage.length > 0) {
                    setMessages(localMessage);
                }
            }

            await syncWithAPI();

            if (dbAvailable) {
                const updatedMessage = await dbHelper.getMessages(activeChat.number);
                setMessages(updatedMessage);
            }

            // Ensure scroll to bottom after loading messages
            setTimeout(() => scrollToBottomImmediate(), 220);
        })();
    }, [tokens, activeChat?.number]);

    // 🔹 When a new socket-driven refresh arrives (messages for active chat)
    useEffect(() => {
        if (Array.isArray(socketMessage) && socketMessage.length > 0 && activeChat?.number) {
            setMessages(socketMessage);
            // setTimeout(() => scrollToBottomImmediate(), 50);
        }
    }, [socketMessage, activeChat]);

    // Ensure we render from the bottom with no visible scroll on first paint
    useLayoutEffect(() => {
        scrollToBottomSync();
    }, [messages]);

    // Add scroll event handler for infinite scroll
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;

            // Check if user has scrolled to the top (within 100px threshold)
            if (scrollTop <= 100 && hasMoreMessages && !loadingPrevious) {
                loadPreviousMessages();
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMoreMessages, loadingPrevious]);




    // Additional scroll update for media loading
    // useEffect(() => {
    //     if (messagesContainerRef.current) {
    //         // Use ResizeObserver to detect when container size changes due to image loads
    //         const resizeObserver = new ResizeObserver(() => {
    //             // Check if we're near the bottom, and if so, scroll to bottom
    //             if (messagesContainerRef.current) {
    //                 const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    //                 const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    //                 if (isNearBottom) {
    //                     // setTimeout(() => scrollToBottomImmediate(), 100);
    //                 }
    //             }
    //         });

    //         // Also use MutationObserver for DOM changes
    //         const mutationObserver = new MutationObserver(() => {
    //             if (messagesContainerRef.current) {
    //                 const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    //                 const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    //                 if (isNearBottom) {
    //                   //  setTimeout(() => scrollToBottomImmediate(), 100);
    //                 }
    //             }
    //         });

    //         resizeObserver.observe(messagesContainerRef.current);
    //         mutationObserver.observe(messagesContainerRef.current, {
    //             childList: true,
    //             subtree: true,
    //             attributes: true,
    //             attributeFilter: ['style', 'class']
    //         });

    //         return () => {
    //             resizeObserver.disconnect();
    //             mutationObserver.disconnect();
    //         };
    //     }
    // }, [messages]);

    const scrollToBottom = () => {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({
                    behavior: "auto",
                    block: "end",
                    inline: "nearest"
                });
                initialScrollDoneRef.current = true;
            }
        }, 0);
    };

    // Alternative scroll method for immediate scrolling
    const scrollToBottomImmediate = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: "auto",
                block: "end",
                inline: "nearest"
            });
            initialScrollDoneRef.current = true;
        }
    };

    // Synchronous bottom scroll used in layout effect to avoid visual jump
    const scrollToBottomSync = () => {
        if (messagesEndRef.current) {
            try {
                messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end", inline: "nearest" });
                initialScrollDoneRef.current = true;
            } catch (_) { }
        }
    };

    // Handle media load scroll updates
    const handleMediaLoad = () => {
        // Use a small delay to ensure DOM has updated
        setTimeout(() => {
            // scrollToBottomImmediate();
        }, 50);
    };

    const syncWithAPI = async (isLoadingPrevious = false) => {
        if (!activeChat || (isLoadingPrevious ? loadingPrevious : loadingHistory)) return;

        if (isLoadingPrevious) {
            setLoadingPrevious(true);
        } else {
            setLoadingHistory(true);
        }

        try {
            const messagePayload = {
                project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                number: activeChat.number,
                last_id: isLoadingPrevious ? lastId : "0"
            };

            const { data, key } = Encrypt(messagePayload);
            const data_pass = JSON.stringify({ "data": data, "key": key });

            const response = await axios.post(
                `https://api.w1chat.com/message/chat-history`,
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.error && response.data.data) {
                // Extract last_id from response
                const apiLastId = response.data.last_id;
                // console.log('API Response:', {
                //     messageCount: response.data.data.length,
                //     lastId: apiLastId,
                //     isLoadingPrevious,
                //     currentLastId: lastId
                // });
                await processApiResponse(response.data.data, isLoadingPrevious, apiLastId);
            } else if (isLoadingPrevious && (!response.data.data || response.data.data.length === 0)) {
                // No more messages to load
                setHasMoreMessages(false);
            }
        } catch (error) {
            console.error('Failed to fetch message history:', error);
        } finally {
            if (isLoadingPrevious) {
                setLoadingPrevious(false);
            } else {
                setLoadingHistory(false);
            }
        }
    };

    const loadPreviousMessages = async () => {
        if (!hasMoreMessages || loadingPrevious) return;
        await syncWithAPI(true);
    };

    // Fetch contact details function
    const fetchContactDetails = useCallback(async (number) => {
        if (!tokens?.token || !tokens?.username) return;

        setContactDetailsLoading(true);
        setContactDetailsError('');

        try {
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                number: number
            };

            console.log('📤 Fetching contact details for:', payload);

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/contact/contact-details',
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('📥 Contact details response:', response.data);

            if (!response?.data?.error) {
                setContactDetails(response.data);
            } else {
                setContactDetailsError(response?.data?.message || 'Failed to fetch contact details');
            }
        } catch (error) {
            console.error('Failed to fetch contact details:', error);
            setContactDetailsError('Failed to fetch contact details. Please try again.');
        } finally {
            setContactDetailsLoading(false);
        }
    }, [tokens?.token, tokens?.username, tokens.projects]);

    // Auto-fetch contact details when activeChat changes and panel is open
    useEffect(() => {
        if (showContactDetails && activeChat?.number && tokens?.token) {
            console.log('🔄 Active chat changed, fetching contact details for:', activeChat.number);
            fetchContactDetails(activeChat.number);
        }
    }, [activeChat?.number, showContactDetails, tokens?.token, fetchContactDetails]);

    // Reset contact details when switching chats
    useEffect(() => {
        if (activeChat?.number) {
            // Reset contact details state when switching to a new chat
            setContactDetails(null);
            setContactDetailsError('');
        }
    }, [activeChat?.number]);

    const processApiResponse = async (apiMessages, isLoadingPrevious = false, apiLastId = null) => {
        try {
            console.log(apiMessages);
            const messageList = apiMessages.map(apiMessage => {
                // Build readable text for template if server message is missing/empty



                let resolvedMessage = apiMessage.message || '';
                if ((apiMessage.message_type === 'template' || apiMessage.is_template) && (!resolvedMessage || resolvedMessage.length === 0)) {
                    // Prefer template.body if present
                    let bodyText = '';
                    if (apiMessage.template?.components) {
                        const bodyComp = apiMessage.template.components.find(c => c.type === 'BODY');
                        bodyText = bodyComp?.text || '';
                    } else if (apiMessage.template?.body) {
                        bodyText = apiMessage.template.body;
                    }
                    const params = (apiMessage.component || []).find(c => c.type?.toLowerCase() === 'body')?.parameters || [];
                    const matches = bodyText.match(/\{\{\d+\}\}/g) || [];
                    resolvedMessage = matches.reduce((acc, ph, idx) => {
                        const val = params[idx]?.text || `Variable ${idx + 1}`;
                        return acc.replace(ph, val);
                    }, bodyText) || '';
                }

                // Extract header media URL from component parameters for templates
                let headerMediaUrl = apiMessage.media_url || '';
                let headerMediaName = apiMessage.media_name || '';
                let derivedMessageType = apiMessage.message_type || '';

                if (apiMessage.is_template && apiMessage.component) {
                    const headerComp = apiMessage.component.find(c => c.type?.toLowerCase() === 'header');
                    if (headerComp && headerComp.parameters && headerComp.parameters.length > 0) {
                        const param = headerComp.parameters[0];
                        if (param?.type === 'image' && param.image?.link) {
                            headerMediaUrl = param.image.link;
                            derivedMessageType = 'image';
                            headerMediaName = headerMediaUrl.split('/').pop() || 'Image';
                        } else if (param?.type === 'video' && param.video?.link) {
                            headerMediaUrl = param.video.link;
                            derivedMessageType = 'video';
                            headerMediaName = headerMediaUrl.split('/').pop() || 'Video';
                        } else if (param?.type === 'document' && param.document?.link) {
                            headerMediaUrl = param.document.link;
                            derivedMessageType = 'document';
                            headerMediaName = headerMediaUrl.split('/').pop() || 'Document';
                        }
                    }
                }

                // Fallback: Determine header media for templates if API provides media_url
                if (apiMessage.is_template && headerMediaUrl && !derivedMessageType) {
                    const lower = (headerMediaUrl || '').toLowerCase();
                    if (/(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/.test(lower)) derivedMessageType = 'image';
                    else if (/(\.mp4|\.mov|\.avi|\.webm)$/.test(lower)) derivedMessageType = 'video';
                    else if (/(\.mp3|\.wav|\.ogg|\.m4a)$/.test(lower)) derivedMessageType = 'audio';
                    else derivedMessageType = 'document';
                }

                return ({
                    message_id: apiMessage.message_id || '',
                    wamid: apiMessage.wamid || '',
                    create_date: apiMessage.create_date || '',
                    type: apiMessage.type || '',
                    message_type: derivedMessageType || apiMessage.message_type || '',
                    message: resolvedMessage,
                    is_template: apiMessage.is_template || false,
                    is_forwarded: apiMessage.is_forwarded || false,
                    is_reply: apiMessage.is_reply || false,
                    status: apiMessage.status || '',
                    id: apiMessage.id || '',
                    send_by_username: apiMessage.send_by?.username || '',
                    send_by_name: apiMessage.send_by?.name || '',
                    send_by_mobile: apiMessage.send_by?.mobile || '',
                    send_by_email: apiMessage.send_by?.email || '',
                    send_by_status: apiMessage.send_by?.status || false,
                    is_read: apiMessage.is_read || false,
                    read_by_username: apiMessage.read_by?.username || '',
                    read_by_name: apiMessage.read_by?.name || '',
                    read_by_mobile: apiMessage.read_by?.mobile || '',
                    read_by_email: apiMessage.read_by?.email || '',
                    read_by_status: apiMessage.read_by?.status || false,
                    failed_reason: apiMessage.failed_reason || '',
                    media_url: headerMediaUrl || apiMessage.media_url || '',
                    media_name: headerMediaName || apiMessage.media_name || '',
                    is_voice: apiMessage.is_voice || false,
                    address: apiMessage.address || '',
                    latitude: apiMessage.latitude || '',
                    longitude: apiMessage.longitude || '',
                    name: apiMessage.name || '',
                    reply_wamid: apiMessage.reply_wamid || '',
                    timestamp: apiMessage.timestamp || (apiMessage.create_date ? new Date(apiMessage.create_date).getTime() : ''),
                    retryCount: apiMessage.retryCount || '',
                    chat_number: activeChat.number,
                    // Store template and component data for rendering
                    template: apiMessage.template || null,
                    component: apiMessage.component || null
                });
            });

            if (isLoadingPrevious) {
                // Store current scroll position before prepending
                const container = messagesContainerRef.current;
                const scrollHeightBefore = container ? container.scrollHeight : 0;
                const scrollTopBefore = container ? container.scrollTop : 0;

                // Filter out duplicates by checking message_id and id
                setMessages(prev => {
                    const existingIds = new Set([
                        ...prev.map(m => m.message_id),
                        ...prev.map(m => m.id)
                    ]);

                    const newMessages = messageList.filter(msg =>
                        !existingIds.has(msg.message_id) && !existingIds.has(msg.id)
                    );

                    // console.log('Duplicate filtering:', {
                    //     totalReceived: messageList.length,
                    //     duplicatesFiltered: messageList.length - newMessages.length,
                    //     newMessagesAdded: newMessages.length,
                    //     existingCount: prev.length
                    // });

                    return [...newMessages, ...prev];
                });

                // Update lastId from API response (last_id + 20)
                if (apiLastId !== null && apiLastId !== undefined) {
                    const nextLastId = parseInt(apiLastId);
                    // console.log('Updating lastId:', { currentLastId: apiLastId, nextLastId });
                    setLastId(nextLastId.toString());
                }

                // If we got no messages or fewer than expected, we might be at the end
                if (messageList.length === 0) {
                    setHasMoreMessages(false);
                }

                // Restore scroll position after DOM updates
                setTimeout(() => {
                    if (container) {
                        const scrollHeightAfter = container.scrollHeight;
                        const scrollDifference = scrollHeightAfter - scrollHeightBefore;
                        container.scrollTop = scrollTopBefore + scrollDifference;
                    }
                }, 50);
            } else {
                // Initial load - replace all messages
                setMessages(messageList);

                // Set lastId from API response for pagination
                if (apiLastId !== null && apiLastId !== undefined) {
                    const nextLastId = parseInt(apiLastId);
                    setLastId(nextLastId.toString());
                }
            }

            // Save to local DB (without duplicates)
            if (dbAvailable) {
                await dbHelper.saveMessage(messageList);
            }
        } catch (error) {
            console.error('Error processing API response:', error);
        }
    };

    const markAsRead = async (number) => {
        try {
            const messagePayload = {
                project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                number: number
            };

            const { data, key } = Encrypt(messagePayload);
            const data_pass = JSON.stringify({ "data": data, "key": key });

            await axios.post(
                `https://api.w1chat.com/message/mark-as-read`,
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.error('Failed to mark message as read:', error);
        }
    };

    const renderFilePreview = (message) => {
        const fileInfo = {
            serverUrl: message.media_url,
            name: message.media_name || 'File',
            size: 0
        };

        switch (message.message_type) {
            case 'image':
            case 'photo':
                return (
                    <ImagePreview
                        fileInfo={fileInfo}
                        isOwnMessage={message.send_by === 'You'}
                        onImageLoad={handleMediaLoad}
                    />
                );
            case 'video':
                return (
                    <VideoPreview
                        fileInfo={fileInfo}
                        isOwnMessage={message.send_by === 'You'}
                        onVideoLoad={handleMediaLoad}
                    />
                );
            case 'audio':
                return (
                    <AudioPreview
                        fileInfo={fileInfo}
                        isOwnMessage={message.send_by === 'You'}
                        isVoiceMessage={message.is_voice || false}
                    />
                );
            case 'document':
                return (
                    <DocumentPreview
                        fileInfo={fileInfo}
                        isOwnMessage={message.send_by === 'You'}
                    />
                );
            case 'location':
                return (
                    <LocationPreview
                        latitude={message.latitude}
                        longitude={message.longitude}
                        address={message.address}
                        name={message.name}
                        isOwnMessage={message.send_by === 'You'}
                    />
                );
            case 'contact':
                return (
                    <ContactPreview
                        contactInfo={{
                            name: message.name,
                            phone: message.message
                        }}
                        isOwnMessage={message.send_by === 'You'}
                    />
                );
            default:
                return (
                    <DocumentPreview
                        fileInfo={fileInfo}
                        isOwnMessage={message.send_by === 'You'}
                    />
                );
        }
    };

    // Handle template selection
    const handleTemplateSelect = (template) => {
        // Extract template content and set it as message input
        if (template.template_data?.body) {
            setMessageInput(template.template_data.body);
        } else if (template.template_data?.components) {
            // Handle structured templates
            const textComponents = template.template_data.components.filter(comp => comp.type === 'BODY');
            if (textComponents.length > 0) {
                setMessageInput(textComponents[0].text || '');
            }
        }
    };

    // Handle template preview
    const handleTemplatePreview = (template) => {
        setSelectedTemplate(template);
        setShowTemplatePreview(true);
    };


    const handleSendMessage = async () => {
        if (!messageInput.trim() && !selectedFile) return;

        if (selectedFile) {
            await handleFileUpload();
        } else {
            await sendTextMessage(messageInput);
        }
    };

    const sendTextMessage = async (text) => {
        const tempMessageId = `temp_${Date.now()}`;
        const newMessage = {
            id: Date.now().toString(),
            message_id: tempMessageId,
            type: 'out',
            message_type: 'text',
            message: text,
            status: 'pending',
            timestamp: Date.now(),
            send_by: 'You',
            chat_number: activeChat.number
        };

        setMessages(prev => [...prev, newMessage]);
        setMessageInput('');
        // Scroll immediately for new messages
        // setTimeout(() => scrollToBottomImmediate(), 50);

        // Persist temp message and update chat list immediately
        try {
            if (dbAvailable) {
                await dbHelper.addMessage(activeChat.number, newMessage);
                await dbHelper.saveChats([
                    {
                        number: activeChat.number,
                        name: activeChat.name,
                        is_favorite: activeChat.is_favorite || false,
                        wamid: '',
                        create_date: new Date().toISOString(),
                        type: 'out',
                        message_type: 'text',
                        message: text,
                        status: 'pending',
                        unique_id: tempMessageId,
                        last_id: Date.now(),
                        send_by_username: tokens?.username || '',
                        send_by_mobile: ''
                    }
                ]);
            }
            // Trigger parent to refresh chat list with pending state
            if (onMessageStatusUpdate) {
                onMessageStatusUpdate(activeChat.number, tempMessageId, 'pending');
            }
        } catch (e) {
            console.error('Failed to persist temp message/chat row:', e);
        }

        try {
            const messagePayload = {
                project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                message: text,
                number: activeChat.number
            };

            const { data, key } = Encrypt(messagePayload);
            const data_pass = JSON.stringify({ "data": data, "key": key });

            const response = await axios.post(
                `https://api.w1chat.com/message/send-text-message`,
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.error) {
                // Update message status to sent
                setMessages(prev =>
                    prev.map(msg =>
                        msg.message_id === tempMessageId
                            ? { ...msg, status: 'sent' }
                            : msg
                    )
                );

                if (dbAvailable) {
                    await dbHelper.updateMessageStatus(tempMessageId, 'sent');
                }

                // Notify parent component about status update
                if (onMessageStatusUpdate) {
                    onMessageStatusUpdate(activeChat.number, tempMessageId, 'sent');
                }
            } else {
                // Update message status to failed
                setMessages(prev =>
                    prev.map(msg =>
                        msg.message_id === tempMessageId
                            ? { ...msg, status: 'failed' }
                            : msg
                    )
                );

                if (dbAvailable) {
                    await dbHelper.updateMessageStatus(tempMessageId, 'failed');
                }

                // Notify parent component about status update
                if (onMessageStatusUpdate) {
                    onMessageStatusUpdate(activeChat.number, tempMessageId, 'failed');
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Update message status to failed
            setMessages(prev =>
                prev.map(msg =>
                    msg.message_id === tempMessageId
                        ? { ...msg, status: 'failed' }
                        : msg
                )
            );

            if (dbAvailable) {
                await dbHelper.updateMessageStatus(tempMessageId, 'failed');
            }

            // Notify parent component about status update
            if (onMessageStatusUpdate) {
                onMessageStatusUpdate(activeChat.number, tempMessageId, 'failed');
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Voice recording functions
    const startRecording = async () => {
        try {
            alert('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            alert('Microphone access granted, creating MediaRecorder...');
            const recorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            // Clear previous chunks
            audioChunksRef.current = [];
            
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);
            
            // Start timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            
            recorder.ondataavailable = (event) => {
                console.log('Audio data available:', event.data.size, 'bytes');
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            recorder.onstop = () => {
                console.log('Recording stopped, total chunks:', audioChunksRef.current.length);
                stream.getTracks().forEach(track => track.stop());
                
                // Process the recording after a short delay
                setTimeout(() => {
                    if (audioChunksRef.current.length > 0) {
                        sendVoiceMessage();
                    }
                }, 100);
            };
            
            recorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                toast.error('Recording error: ' + event.error);
            };
            
            recorder.start(1000); // Collect data every second
            console.log('Recording started...');
            toast.success('Recording started! Tap mic again to stop.');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            if (error.name === 'NotAllowedError') {
                toast.error('Microphone permission denied. Please allow microphone access and try again.');
            } else if (error.name === 'NotFoundError') {
                toast.error('No microphone found. Please connect a microphone and try again.');
            } else {
                toast.error('Could not access microphone: ' + error.message);
            }
        }
    };

    const stopRecording = () => {
        console.log('Stopping recording...');
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
            
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            
            toast.success('Recording stopped! Processing...');
        }
    };

    const cancelRecording = () => {
        console.log('Cancelling recording...');
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        
        setIsRecording(false);
        setRecordingTime(0);
        audioChunksRef.current = [];
        
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        
        toast.info('Recording cancelled');
    };

    const sendVoiceMessage = async () => {
        console.log('Sending voice message, chunks:', audioChunksRef.current.length);
        if (audioChunksRef.current.length === 0) {
            console.log('No audio chunks to send');
            toast.error('No audio recorded');
            return;
        }
        
        try {
            // Create audio blob
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            console.log('Created audio blob, size:', audioBlob.size, 'bytes');
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', audioBlob, `voice_${Date.now()}.webm`);
            formData.append('project_id', tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c');
            
            // Upload audio file first
            const uploadResponse = await axios.post(
                'https://api.w1chat.com/upload/upload-media',
                formData,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            if (uploadResponse.data.error) {
                throw new Error(uploadResponse.data.message || 'Failed to upload audio');
            }
            
            const audioUrl = uploadResponse.data.data.file_url;
            
            // Send voice message
            const tempMessageId = `temp_${Date.now()}`;
            const newMessage = {
                id: Date.now().toString(),
                message_id: tempMessageId,
                type: 'out',
                message_type: 'audio',
                message: '',
                status: 'pending',
                timestamp: Date.now(),
                send_by: 'You',
                chat_number: activeChat.number,
                media_url: audioUrl,
                is_voice: true
            };
            
            // Add message to UI immediately
            setMessages(prev => [...prev, newMessage]);
            
            // Save to local DB if available
            if (dbAvailable) {
                try {
                    await dbHelper.saveMessage([newMessage]);
                } catch (e) {
                    console.warn('Failed to persist temp message:', e);
                }
            }
            
            // Trigger parent to refresh chat list with pending state
            if (onMessageStatusUpdate) {
                onMessageStatusUpdate(activeChat.number, tempMessageId, 'pending');
            }
            
            const messagePayload = {
                project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                message: '',
                number: activeChat.number,
                audio_link: audioUrl,
                is_voice: true
            };
            
            const { data, key } = Encrypt(messagePayload);
            const data_pass = JSON.stringify({ "data": data, "key": key });
            
            const messageResponse = await axios.post(
                `https://api.w1chat.com/message/send-audio-message`,
                data_pass,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!messageResponse.data.error) {
                // Update message status to sent
                setMessages(prev =>
                    prev.map(msg =>
                        msg.message_id === tempMessageId
                            ? { ...msg, status: 'sent' }
                            : msg
                    )
                );
                
                if (dbAvailable) {
                    await dbHelper.updateMessageStatus(tempMessageId, 'sent');
                }
                
                if (onMessageStatusUpdate) {
                    onMessageStatusUpdate(activeChat.number, tempMessageId, 'sent');
                }
                
                toast.success('Voice message sent!');
            } else {
                // Update message status to failed
                setMessages(prev =>
                    prev.map(msg =>
                        msg.message_id === tempMessageId
                            ? { ...msg, status: 'failed' }
                            : msg
                    )
                );
                
                if (dbAvailable) {
                    await dbHelper.updateMessageStatus(tempMessageId, 'failed');
                }
                
                if (onMessageStatusUpdate) {
                    onMessageStatusUpdate(activeChat.number, tempMessageId, 'failed');
                }
                
                toast.error('Failed to send voice message');
            }
            
        } catch (error) {
            console.error('Error sending voice message:', error);
            toast.error('Failed to send voice message');
        } finally {
            // Clean up
            audioChunksRef.current = [];
            setRecordingTime(0);
        }
    };

    const handleMicClick = () => {
        alert('hitt')
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // Note: Recording completion is now handled in the recorder.onstop event

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, []);

    const handleFileSelect = (fileType) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = getFileAccept(fileType);
        input.multiple = false;

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                setSelectedFile({
                    file,
                    type: fileType
                });
                setShowMediaModal(false);
            }
        };

        input.click();
    };

    const getFileAccept = (fileType) => {
        switch (fileType) {
            case 'photo':
                return 'image/*';
            case 'video':
                return 'video/*';
            case 'audio':
                return 'audio/*';
            case 'document':
                return '.pdf,.doc,.docx,.txt,.xlsx,.pptx,.zip,.rar';
            default:
                return '*';
        }
    };

    const getFileTypeLabel = (fileType) => {
        switch (fileType) {
            case 'photo':
                return 'Photo';
            case 'video':
                return 'Video';
            case 'audio':
                return 'Audio';
            case 'document':
                return 'Document';
            default:
                return 'File';
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !activeChat) return;

        setIsUploading(true);
        setUploadProgress(0);
        const tempMessageId = `temp_${Date.now()}`;

        try {
            const formData = new FormData();
            formData.append('file', selectedFile.file);

            const uploadResponse = await axios.post(
                `https://api.w1chat.com/upload/upload-media`,
                formData,
                {
                    headers: {
                        'token': tokens.token,
                        'username': tokens.username,
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(progress);
                    }
                }
            );

            if (uploadResponse.data && !uploadResponse.data.error && uploadResponse.data.link) {
                const fileUrl = uploadResponse.data.link;
                const fileType = selectedFile.type;
                const fileName = selectedFile.file.name;

                const tempMessage = {
                    id: Date.now().toString(),
                    message_id: tempMessageId,
                    type: 'out',
                    message_type: fileType,
                    message: messageInput || `Sent a ${getFileTypeLabel(fileType).toLowerCase()}`,
                    media_url: fileUrl,
                    media_name: fileName,
                    status: 'pending',
                    timestamp: Date.now(),
                    send_by: 'You',
                    chat_number: activeChat.number,
                    create_date: new Date().toISOString()
                };

                if (dbAvailable) {
                    await dbHelper.addMessage(activeChat.number, tempMessage);
                    await dbHelper.saveChats([
                        {
                            number: activeChat.number,
                            name: activeChat.name,
                            is_favorite: activeChat.is_favorite || false,
                            wamid: '',
                            create_date: tempMessage.create_date,
                            type: 'out',
                            message_type: fileType,
                            message: tempMessage.message,
                            status: 'pending',
                            unique_id: tempMessageId,
                            last_id: Date.now(),
                            send_by_username: tokens?.username || '',
                            send_by_mobile: ''
                        }
                    ]);
                }
                setMessages(prev => [...prev, tempMessage]);
                setSelectedFile(null);
                setMessageInput('');
                // Scroll immediately for file uploads
                // setTimeout(() => scrollToBottomImmediate(), 50);

                // Trigger parent to refresh chat list with pending state immediately
                if (onMessageStatusUpdate) {
                    onMessageStatusUpdate(activeChat.number, tempMessageId, 'pending');
                }

                const messagePayload = {
                    project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                    message: messageInput || '',
                    number: activeChat.number
                };

                if (fileType === 'photo') messagePayload.image_link = fileUrl;
                else if (fileType === 'video') messagePayload.video_link = fileUrl;
                else if (fileType === 'audio') {
                    messagePayload.audio_link = fileUrl;
                    messagePayload.is_voice = false; // Regular audio file, not voice message
                }
                else if (fileType === 'document') messagePayload.document_link = fileUrl;

                let api_url = 'send-text-message';
                if (fileType === 'photo') api_url = 'send-image-message';
                else if (fileType === 'video') api_url = 'send-video-message';
                else if (fileType === 'audio') api_url = 'send-audio-message';
                else if (fileType === 'document') api_url = 'send-document-message';

                const { data, key } = Encrypt(messagePayload);
                const data_pass = JSON.stringify({ "data": data, "key": key });

                const messageResponse = await axios.post(
                    `https://api.w1chat.com/message/${api_url}`,
                    data_pass,
                    {
                        headers: {
                            'token': tokens.token,
                            'username': tokens.username,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!messageResponse.data.error) {
                    const serverWamid = messageResponse?.data?.wamid || '';
                    const serverMessageId = messageResponse?.data?.message_id || '';
                    const serverId = messageResponse?.data?.id || '';

                    if (dbAvailable) {
                        // Update message with server's message_id, wamid, and id (like text messages)
                        if (serverMessageId) {
                            // Update the message_id from temp to server's real message_id
                            await dbHelper.updateMessageIdentifiersByMessageId(tempMessageId, {
                                message_id: serverMessageId,
                                wamid: serverWamid,
                                id: serverId,
                                status: 'sent'
                            });
                        } else {
                            // Fallback: just update wamid and status if no message_id
                            await dbHelper.updateMessageStatus(tempMessageId, 'sent');
                            await dbHelper.updateMessageIdentifiersByMessageId(tempMessageId, {
                                wamid: serverWamid,
                                id: serverId
                            });
                        }
                    }
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.message_id === tempMessageId
                                ? {
                                    ...msg,
                                    status: 'sent',
                                    message_id: serverMessageId || tempMessageId, // Use server's message_id if available
                                    wamid: serverWamid,
                                    id: serverId || msg.id
                                }
                                : msg
                        )
                    );

                    // Notify parent component about status update
                    if (onMessageStatusUpdate) {
                        // Use server's message_id if available, otherwise fall back to temp
                        onMessageStatusUpdate(activeChat.number, serverMessageId || tempMessageId, 'sent');
                    }
                } else {
                    if (dbAvailable) {
                        await dbHelper.updateMessageStatus(tempMessageId, 'failed');
                    }
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.message_id === tempMessageId
                                ? {
                                    ...msg,
                                    status: 'failed'
                                } : msg
                        )
                    );

                    // Notify parent component about status update
                    if (onMessageStatusUpdate) {
                        onMessageStatusUpdate(activeChat.number, tempMessageId, 'failed');
                    }
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setMessages(prev =>
                prev.map(msg =>
                    msg.message_id === tempMessageId
                        ? {
                            ...msg,
                            status: 'failed'
                        } : msg
                )
            );

            // Notify parent component about status update
            if (onMessageStatusUpdate) {
                onMessageStatusUpdate(activeChat.number, tempMessageId, 'failed');
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
    };

    // Handle template use from preview
    const handleTemplateUse = (finalContent) => {
        setMessageInput(finalContent);
        setShowTemplatePreview(false);
        setSelectedTemplate(null);
    };

    // Send Template (append to conversation immediately with pending status and update on API response)
    const sendTemplateMessage = async (template, providedComponents = null, previewText = '') => {
        try {
            if (!tokens?.token || !tokens?.username || !activeChat?.number || !template?.id) {
                console.error('Missing data to send template');
                return;
            }

            // Build components if not provided
            let formattedComponents = providedComponents || [];
            if (!providedComponents || providedComponents.length === 0) {
                if (template.template_data?.components) {
                    template.template_data.components.forEach((component) => {
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
            }

            // Resolve message body text for local echo
            let messageBody = previewText;
            if (!messageBody) {
                let content = '';
                if (template.template_data?.body) {
                    content = template.template_data.body;
                } else if (template.template_data?.components) {
                    const bodyComponent = template.template_data.components.find((c) => c.type === 'BODY');
                    content = bodyComponent?.text || '';
                }
                // Replace placeholders with parameter values if present
                const params = formattedComponents.find((c) => c.type === 'body')?.parameters || [];
                const matches = content.match(/\{\{\d+\}\}/g) || [];
                messageBody = matches.reduce((acc, ph, idx) => {
                    const val = params[idx]?.text || `Variable ${idx + 1}`;
                    return acc.replace(ph, val);
                }, content);
            }

            const tempMessageId = `temp_${Date.now()}`;
            // Detect header media from providedComponents for local preview
            let headerMediaLink = '';
            let headerMediaType = '';
            const headerComp = (formattedComponents || []).find((c) => (c.type || '').toLowerCase() === 'header');
            if (headerComp && Array.isArray(headerComp.parameters) && headerComp.parameters.length > 0) {
                const p = headerComp.parameters[0];
                if (p?.type === 'image' && p.image?.link) { headerMediaType = 'image'; headerMediaLink = p.image.link; }
                if (p?.type === 'video' && p.video?.link) { headerMediaType = 'video'; headerMediaLink = p.video.link; }
                if (p?.type === 'document' && p.document?.link) { headerMediaType = 'document'; headerMediaLink = p.document.link; }
            }

            const templatePayload = template.template_data || template.template || {};

            const tempMessage = {
                id: Date.now().toString(),
                message_id: tempMessageId,
                type: 'out',
                message_type: headerMediaType || 'text',
                message: messageBody,
                is_template: true,
                status: 'pending',
                timestamp: Date.now(),
                send_by: 'You',
                chat_number: activeChat.number,
                create_date: new Date().toISOString(),
                media_url: headerMediaLink || '',
                media_name: headerMediaLink ? (headerMediaLink.split('/').pop() || 'File') : '',
                template: templatePayload,
                component: formattedComponents
            };

            // Update UI immediately
            setMessages((prev) => [...prev, tempMessage]);
            // setTimeout(() => scrollToBottomImmediate(), 50);

            // Persist to DB and chat list
            try {
                if (dbAvailable) {
                    await dbHelper.addMessage(activeChat.number, tempMessage);
                    await dbHelper.saveChats([
                        {
                            number: activeChat.number,
                            name: activeChat.name,
                            is_favorite: activeChat.is_favorite || false,
                            wamid: '',
                            create_date: tempMessage.create_date,
                            type: 'out',
                            message_type: 'text',
                            message: messageBody,
                            status: 'pending',
                            unique_id: tempMessageId,
                            last_id: Date.now(),
                            send_by_username: tokens?.username || '',
                            send_by_mobile: ''
                        }
                    ]);
                }
                if (onMessageStatusUpdate) {
                    onMessageStatusUpdate(activeChat.number, tempMessageId, 'pending');
                }
            } catch (e) {
                console.error('Failed to persist temp template message/chat row:', e);
            }

            // Send template via API
            const payload = {
                project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                number: activeChat.number,
                template_id: template.id,
                component: formattedComponents
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
                'https://api.w1chat.com/message/send-template',
                data_pass,
                {
                    headers: {
                        token: tokens.token,
                        username: tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response?.data?.error) {
                const serverWamid = response?.data?.wamid || '';
                const serverMessageId = response?.data?.message_id || '';
                const serverId = response?.data?.id || '';

                if (dbAvailable) {
                    // Update message with server's message_id, wamid, and id (like text messages)
                    if (serverMessageId) {
                        // Update the message_id from temp to server's real message_id
                        await dbHelper.updateMessageIdentifiersByMessageId(tempMessageId, {
                            message_id: serverMessageId,
                            wamid: serverWamid,
                            id: serverId,
                            status: 'sent'
                        });
                    } else {
                        // Fallback: just update wamid and status if no message_id
                        await dbHelper.updateMessageStatus(tempMessageId, 'sent');
                        await dbHelper.updateMessageIdentifiersByMessageId(tempMessageId, {
                            wamid: serverWamid,
                            id: serverId
                        });
                    }
                    // Update chats row with latest identifiers
                    await dbHelper.saveChats([
                        {
                            number: activeChat.number,
                            name: activeChat.name,
                            is_favorite: activeChat.is_favorite || false,
                            wamid: serverWamid,
                            create_date: new Date().toISOString(),
                            type: 'out',
                            message_type: 'template',
                            message: messageBody,
                            status: 'sent',
                            unique_id: serverMessageId || serverWamid,
                            last_id: serverId || Date.now(),
                            send_by_username: tokens?.username || '',
                            send_by_mobile: ''
                        }
                    ]);
                }

                // Update UI: mark sent and update with server's message_id, wamid, and id (like text messages)
                setMessages((prev) => prev.map((m) => (
                    m.message_id === tempMessageId
                        ? {
                            ...m,
                            status: 'sent',
                            message_id: serverMessageId || tempMessageId, // Use server's message_id if available
                            wamid: serverWamid,
                            id: serverId || m.id
                        }
                        : m
                )));

                if (onMessageStatusUpdate) {
                    // Use server's message_id if available, otherwise fall back to temp
                    onMessageStatusUpdate(activeChat.number, serverMessageId || tempMessageId, 'sent');
                }
            } else {
                // Failed
                if (dbAvailable) {
                    await dbHelper.updateMessageStatus(tempMessageId, 'failed');
                }
                setMessages((prev) => prev.map((m) => (m.message_id === tempMessageId ? { ...m, status: 'failed' } : m)));
                if (onMessageStatusUpdate) {
                    onMessageStatusUpdate(activeChat.number, tempMessageId, 'failed');
                }
            }
        } catch (error) {
            console.error('Failed to send template:', error);
        }
    };

    const MediaSelectionModal = () => (
        <AnimatePresence>
            {showMediaModal && (
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
                        className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md"
                    >
                        <div className="flex justify-between items-center mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                Send Media
                            </h3>
                            <button
                                onClick={() => setShowMediaModal(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {[
                                { type: 'photo', icon: FiImage, label: 'Photo', color: 'bg-green-500' },
                                { type: 'video', icon: FiVideo, label: 'Video', color: 'bg-purple-500' },
                                { type: 'audio', icon: FiMusic, label: 'Audio', color: 'bg-blue-500' },
                                { type: 'document', icon: FiFile, label: 'Document', color: 'bg-orange-500' }
                            ].map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <button
                                        key={item.type}
                                        onClick={() => handleFileSelect(item.type)}
                                        className="flex flex-col items-center p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105"
                                    >
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${item.color} rounded-lg flex items-center justify-center mb-2 sm:mb-3`}>
                                            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="flex h-full bg-white dark:bg-gray-900 w-full">
            {/* Main conversation area */}
            <div className={`flex flex-col transition-all duration-300 ${showContactDetails ? 'w-2/3' : 'w-full'}`}>
                {/* Chat header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 w-full">
                    {/* user profile name or number */}
                    <div
                        className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                        onClick={() => {
                            setShowContactDetails(true);
                            fetchContactDetails(activeChat.number);
                        }}
                    >
                        <button
                            className="md:hidden mr-1 text-gray-700 dark:text-gray-300 p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onBack();
                            }}
                        >
                            <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                        <div className="relative">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm sm:text-base">
                                {activeChat.name.charAt(0).toUpperCase()}
                            </div>
                            {activeChat.isFavorite && (
                                <div className="absolute -top-1 -right-1">
                                    <FiStar className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                                {activeChat.name}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="relative flex">
                            <button
                                onClick={handleSearchMenuClick}
                                className="flex w-full items-center space-x-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                                    <FiSearch className="h-4 w-4" />
                                </div>
                            </button>

                            <button
                                ref={headerMenuButtonRef}
                                onClick={() => setShowHeaderMenu((prev) => !prev)}
                                className="p-1 sm:p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                                aria-label="Conversation options"
                            >
                                <FiMoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>



                            <AnimatePresence>
                                {showHeaderMenu && (
                                    <motion.div
                                        key="conversation-header-menu"
                                        ref={headerMenuRef}
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                        className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white py-2 shadow-xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800 z-30"
                                    >
                                        <button
                                            onClick={handleContactMenuClick}
                                            className="flex w-full items-center space-x-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                                                <FiEdit2 className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">Save / Edit Contact</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Keep details in local storage</p>
                                            </div>
                                        </button>


                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 w-full">
                    {loadingHistory ? (
                        <div className="flex items-center justify-center py-6 sm:py-8">
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Loading indicator for previous messages */}
                            {loadingPrevious && (
                                <div className="flex items-center justify-center py-3 sm:py-4">
                                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-500"></div>
                                    <span className="ml-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Loading previous messages...</span>
                                </div>
                            )}

                            {groupMessagesByDate(messages).map((dateGroup, groupIndex) => (
                                <div key={dateGroup.date}>
                                    {/* Date Separator */}
                                    <DateSeparator displayDate={dateGroup.displayDate} dateId={`date-separator-${dateGroup.date}`} />

                                    {/* Messages for this date */}
                                    <div className="space-y-3 sm:space-y-4">
                                        {dateGroup.messages.map((msg) => {
                                            const messageKey = getMessageKey(msg);
                                            return (
                                                <MessageItem
                                                    key={messageKey}
                                                    messageKey={messageKey}
                                                    highlightedMessageId={highlightedMessageId}
                                                    msg={msg}
                                                    activeChat={activeChat}
                                                    darkMode={darkMode}
                                                    renderFilePreview={renderFilePreview}
                                                    formatTime={formatTime}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {isUploading && (
                                <div className="flex justify-end w-full mt-3 sm:mt-4">
                                    <div className="max-w-[80%] p-3 sm:p-4 rounded-2xl bg-blue-500 text-white rounded-br-md">
                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                            <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <div className="flex-1">
                                                <p className="text-xs sm:text-sm font-medium">Uploading file...</p>
                                                <div className="w-full bg-white bg-opacity-30 rounded-full h-1.5 sm:h-2 mt-1 sm:mt-2">
                                                    <div
                                                        className="bg-white h-1.5 sm:h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs mt-0.5 sm:mt-1 opacity-90">{uploadProgress}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Selected File Preview */}
                {selectedFile && (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 w-full">
                        <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                    {selectedFile.type === 'photo' && <FiImage className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />}
                                    {selectedFile.type === 'video' && <FiVideo className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />}
                                    {selectedFile.type === 'audio' && <FiMusic className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />}
                                    {selectedFile.type === 'document' && <FiFile className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {selectedFile.file.name}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                        {getFileTypeLabel(selectedFile.type)} • {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={removeSelectedFile}
                                className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Recording Indicator */}
                {isRecording && (
                    <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                                    Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                            <button
                                onClick={cancelRecording}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-3 sm:p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 w-full">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <button
                            onClick={() => setShowMediaModal(true)}
                            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <FiPaperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                        <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-gray-100 dark:bg-gray-700 border border-transparent focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-800 transition-all relative">
                            <button
                                ref={emojiButtonRef}
                                onClick={() => setShowEmojiPicker((v) => !v)}
                                aria-label="Toggle emoji picker"
                                className="mr-2 sm:mr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                <FiSmile className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white text-sm sm:text-base"
                                value={messageInput}
                                ref={messageInputRef}
                                onChange={(e) => {
                                    setMessageInput(e.target.value);
                                    updateSelectionFromInput();
                                }}
                                onClick={updateSelectionFromInput}
                                onKeyUp={updateSelectionFromInput}
                                onSelect={updateSelectionFromInput}
                                onKeyPress={handleKeyPress}
                                disabled={isUploading || loadingHistory}
                            />
                            <EmojiPickerPopover
                                open={showEmojiPicker}
                                onEmojiClick={(emojiData) => handleEmojiSelect(emojiData.emoji)}
                                onClose={() => setShowEmojiPicker(false)}
                                anchorRef={emojiButtonRef}
                                darkMode={darkMode}
                                className="m-auto"
                            />
                            <button 
                                onClick={handleMicClick}
                                className={`ml-2 sm:ml-3 transition-colors ${
                                    isRecording 
                                        ? 'text-red-500 hover:text-red-600 animate-pulse' 
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                            >
                                <FiMic className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    setShowTemplateModal(true);
                                    // Auto-fetch contact details if not already available
                                    if (!contactDetails && activeChat?.number && tokens?.token) {
                                        fetchContactDetails(activeChat.number);
                                    }
                                }}
                                className="Templates ml-2 sm:ml-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                <FiLayers className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        <button
                            onClick={handleSendMessage}
                            disabled={(!messageInput.trim() && !selectedFile) || isUploading || loadingHistory}
                            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200 ${(messageInput.trim() || selectedFile) && !isUploading && !loadingHistory
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <LuSendHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                <ContactFormModal
                    isOpen={showContactModal}
                    onClose={handleCloseContactModal}
                    formData={contactForm}
                    onChange={handleContactFieldChange}
                    onSubmit={handleContactSave}
                    loading={contactLoading}
                    submitting={contactSubmitting}
                    error={contactError}
                    isExistingContact={Boolean(existingContactId)}
                />

                <SearchChatModal
                    isOpen={searchModalOpen}
                    onClose={handleCloseSearchModal}
                    query={searchQuery}
                    onQueryChange={handleSearchQueryChange}
                    results={searchResults}
                    onResultClick={handleSearchResultClick}
                    onDateClick={handleDateClick}
                />

                {/* Media Selection Modal */}
                <MediaSelectionModal />

                {/* Template Selection Modal */}
                <ChatTemplateModal
                    isOpen={showTemplateModal}
                    onClose={() => setShowTemplateModal(false)}
                    tokens={tokens}
                    onTemplateSelect={handleTemplateSelect}
                    onTemplatePreview={handleTemplatePreview}
                    darkMode={darkMode}
                    activeChat={activeChat}
                    contactDetails={contactDetails}
                    onSendTemplate={sendTemplateMessage}
                />

                {/* Template Preview Modal */}
                <TemplatePreview
                    isOpen={showTemplatePreview}
                    onClose={() => {
                        setShowTemplatePreview(false);
                        setSelectedTemplate(null);
                    }}
                    selectedTemplate={selectedTemplate}
                    darkMode={darkMode}
                    onUseTemplate={handleTemplateUse}
                    tokens={tokens}
                    activeChat={activeChat}
                    contactDetails={contactDetails}
                    onSendTemplate={sendTemplateMessage}
                    onCloseAll={() => {
                        // Close both Preview and Template selection modal after successful send
                        setShowTemplatePreview(false);
                        setSelectedTemplate(null);
                        setShowTemplateModal(false);
                    }}
                />
            </div>

            {/* Contact Details Side Panel */}
            <AnimatePresence>
                {showContactDetails && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="w-1/3 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col"
                    >
                        {/* Contact Details Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Contact Details
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                                    <span>{activeChat?.name} • {activeChat?.number}</span>
                                    {contactDetailsLoading && (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowContactDetails(false)}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Contact Details Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {contactDetailsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : contactDetailsError ? (
                                <div className="text-center py-8">
                                    <div className="text-red-500 dark:text-red-400 mb-4">
                                        <FiAlertCircle className="w-12 h-12 mx-auto mb-2" />
                                        <p>{contactDetailsError}</p>
                                    </div>
                                    <button
                                        onClick={() => fetchContactDetails(activeChat.number)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : contactDetails ? (
                                contactDetails.has_contact ? (
                                    <div className="space-y-6">
                                        {/* Profile Section */}
                                        <div className="text-center">
                                            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-2xl mb-4">
                                                {contactDetails.contact.name.charAt(0).toUpperCase()}
                                            </div>
                                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                                                {contactDetails.contact.name}
                                            </h4>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {contactDetails.contact.number}
                                            </p>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="space-y-4">
                                            <h5 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                                                Contact Information
                                            </h5>

                                            {contactDetails.contact.email && (
                                                <div className="flex items-center space-x-3">
                                                    <FiMail className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                                        <p className="text-gray-900 dark:text-white">{contactDetails.contact.email}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {contactDetails.contact.firm_name && (
                                                <div className="flex items-center space-x-3">
                                                    <FiHome className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                                                        <p className="text-gray-900 dark:text-white">{contactDetails.contact.firm_name}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {contactDetails.contact.website && (
                                                <div className="flex items-center space-x-3">
                                                    <FiGlobe className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                                                        <a
                                                            href={contactDetails.contact.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                                        >
                                                            {contactDetails.contact.website}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {contactDetails.contact.remark && (
                                                <div className="flex items-start space-x-3">
                                                    <FiFileText className="w-5 h-5 text-gray-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                                                        <p className="text-gray-900 dark:text-white">{contactDetails.contact.remark}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Timestamps */}
                                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <h5 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                                                History
                                            </h5>

                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Created</p>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {new Date(contactDetails.contact.create_date).toLocaleDateString()} by {contactDetails.contact.create_by?.name}
                                                    </p>
                                                </div>

                                                {contactDetails.contact.modify_date && (
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">Last Modified</p>
                                                        <p className="text-gray-900 dark:text-white">
                                                            {new Date(contactDetails.contact.modify_date).toLocaleDateString()} by {contactDetails.contact.modify_by?.name}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleContactMenuClick}
                                            className="flex items-center space-x-3 px-4 py-2.5 text-left text-sm text-white transition hover:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 bg-green-600 w-3/5 m-auto rounded-lg justify-center"
                                        >
                                           <span className='font-bold'>Update Contact</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="mb-6">
                                            <FiUser className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                Contact Not Found
                                            </h4>
                                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                                This contact is not saved in your contacts list.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setShowContactModal(true);
                                                setContactForm({
                                                    name: activeChat?.name || '',
                                                    number: activeChat?.number || '',
                                                    email: '',
                                                    firm_name: '',
                                                    website: '',
                                                    remark: '',
                                                    language_code: '',
                                                    country: ''
                                                });
                                            }}
                                            disabled={contactDetailsLoading}
                                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                        >
                                            <FiUser className="w-4 h-4" />
                                            <span>Save Contact</span>
                                        </button>
                                    </div>
                                )
                            ) : null}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contact Form Modal */}
            <ContactFormModal
                isOpen={showContactModal}
                onClose={handleCloseContactModal}
                formData={contactForm}
                onChange={handleContactFieldChange}
                onSubmit={handleContactSave}
                loading={contactLoading}
                submitting={contactSubmitting}
                error={contactError}
                isExistingContact={false}
            />
        </div>
    );
}

// Helper function to format time
const formatTime = (value) => {
    if (!value) return '';
    try {
        const date = typeof value === 'number' ? new Date(value) : new Date(value);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
};

// Helper function to get date string for grouping
const getDateString = (timestamp) => {
    if (!timestamp) return '';
    try {
        const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
        return date.toDateString(); // Returns format like "Mon Oct 26 2025"
    } catch {
        return '';
    }
};

// Helper function to format date for display
const formatDateForDisplay = (timestamp) => {
    if (!timestamp) return '';
    try {
        const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time to compare only dates
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        if (messageDate.getTime() === todayDate.getTime()) {
            return 'Today';
        } else if (messageDate.getTime() === yesterdayDate.getTime()) {
            return 'Yesterday';
        } else {
            // Format as DD/MM/YYYY
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
    } catch {
        return '';
    }
};

// Helper function to group messages by date
const groupMessagesByDate = (messages) => {
    const groups = {};
    //i dont want to work any more

    messages.forEach(message => {
        const dateString = getDateString(message.timestamp || message.create_date);
        if (dateString) {
            if (!groups[dateString]) {
                groups[dateString] = [];
            }
            groups[dateString].push(message);
        }
    });

    // Sort groups by date (newest first)
    const sortedGroups = Object.keys(groups)
        .sort((a, b) => new Date(a) - new Date(b))
        .map(dateString => ({
            date: dateString,
            displayDate: formatDateForDisplay(new Date(dateString)),
            messages: groups[dateString]
        }));

    return sortedGroups;

};

export default Conversation;