import React, { useState, useEffect, useRef } from 'react';
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
    FiEye
} from 'react-icons/fi';
import { FaRegEye } from "react-icons/fa6";
import { MdOutlineCancel } from "react-icons/md";
import { LuSendHorizontal } from "react-icons/lu";
import { FaDownload, FaFilePdf, FaFileWord, FaFileExcel, FaFile, FaFileImage, FaFileVideo, FaFileAudio } from 'react-icons/fa';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Encrypt } from './encryption/payload-encryption';
import { dbHelper } from './db';
import ReactPlayer from 'react-player';
import ChatTemplateModal from '../component/Modals/ChatTemplateModal';
import TemplatePreview from '../component/Modals/TemplatePreview';

// Error Modal Component
const ErrorModal = ({ isOpen, onClose, errorMessage }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="flex-shrink-0">
                            <FiAlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Message Failed
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        {errorMessage}
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Message Info Modal Component
const MessageInfoModal = ({ isOpen, onClose, message, activeChat }) => {
    if (!isOpen || !message) return null;

    const formatDateTime = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const getMessageTypeDisplay = (messageType) => {
        switch (messageType) {
            case 'text': return 'Text Message';
            case 'image': return 'Image';
            case 'video': return 'Video';
            case 'audio': return 'Audio';
            case 'document': return 'Document';
            case 'location': return 'Location';
            case 'contact': return 'Contact';
            default: return 'Unknown';
        }
    };

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'sent': return 'Sent';
            case 'delivered': return 'Delivered';
            case 'read': return 'Read';
            case 'failed': return 'Failed';
            default: return 'Unknown';
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="flex-shrink-0">
                            <FiUser className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Message Details
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {/* Message Content Preview */}
                        {/* <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message Content</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto">
                                {message.message_type === 'text' ? (
                                    <p className="whitespace-pre-wrap">{message.message}</p>
                                ) : (
                                    <p className="italic">{getMessageTypeDisplay(message.message_type)} - {message.message}</p>
                                )}
                            </div>
                        </div> */}

                        {/* Message Details */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</span>
                                <span className="text-sm text-gray-900 dark:text-white">{getMessageTypeDisplay(message.message_type)}</span>
                            </div> */}

                            {/* Sender/Receiver Information - Read from local DB flattened fields */}
                            {message.type === 'out' && (message.send_by_name || message.send_by_mobile) && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sent by</span>
                                    <div className="text-right">
                                        {message.send_by_name && (
                                            <div className="text-sm text-gray-900 dark:text-white font-medium">
                                                {message.send_by_name}
                                            </div>
                                        )}
                                        {message.send_by_mobile && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {message.send_by_mobile}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {message.type === 'in' && (message.read_by_name || message.read_by_mobile) && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Read by</span>
                                    <div className="text-right">
                                        {message.read_by_name && (
                                            <div className="text-sm text-gray-900 dark:text-white font-medium">
                                                {message.read_by_name}
                                            </div>
                                        )}
                                        {message.read_by_mobile && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {message.read_by_mobile}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Direction</span>
                                <span className="text-sm text-gray-900 dark:text-white">
                                    {message.type === 'out' ? 'Outgoing' : 'Incoming'}
                                </span>
                            </div>

                            {
                                message.status && message.type === 'out' ?
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</span>
                                        <span className={`text-sm font-medium ${message.status === 'failed' ? 'text-red-500' :
                                            message.status === 'read' ? 'text-green-500' :
                                                message.status === 'delivered' ? 'text-blue-500' :
                                                    'text-gray-500'
                                            }`}>
                                            {getStatusDisplay(message.status)}
                                        </span>

                                    </div>
                                    : ''
                            }

                            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Timestamp</span>
                                <span className="text-sm text-gray-900 dark:text-white">
                                    {formatDateTime(message.timestamp || message.create_date)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Chat</span>
                                <span className="text-sm text-gray-900 dark:text-white">{activeChat?.name || 'Unknown'}</span>
                            </div>

                            {message.failed_reason && (
                                <div className="flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-600">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Error</span>
                                    <span className="text-sm text-red-500 max-w-xs text-right">{message.failed_reason}</span>
                                </div>
                            )}

                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Message Status Indicator Component
const MessageStatusIndicator = ({ status, isOwnMessage, darkMode, failedReason }) => {
    const [showErrorModal, setShowErrorModal] = useState(false);

    if (!isOwnMessage) return null;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <FiClock className="w-3 h-3" />;
            case 'sent':
                return <FiCheck className="w-3 h-3" />;
            case 'delivered':
                return (
                    <div className="flex">
                        <FiCheck className="w-3 h-3" />
                        <FiCheck className="w-3 h-3 -ml-1" />
                    </div>
                );
            case 'read':
                return (
                    <div className="flex">
                        <FiCheck className="w-3 h-3 text-green-500" />
                        <FiCheck className="w-3 h-3 -ml-1 text-green-500" />
                    </div>
                );
            case 'failed':
                return <FiAlertCircle className="w-3 h-3 text-red-500" />;
            default:
                return <FiClock className="w-3 h-3" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'text-gray-400 dark:text-gray-500';
            case 'sent':
                return 'text-gray-400 dark:text-gray-500';
            case 'delivered':
                return 'text-gray-400 dark:text-gray-500';
            case 'read':
                return 'text-blue-500 dark:text-blue-400';
            case 'failed':
                return 'text-red-500 dark:text-red-400';
            default:
                return 'text-gray-400 dark:text-gray-500';
        }
    };

    const isFailed = status === 'failed' && failedReason;

    const handleClick = (e) => {
        if (isFailed) {
            e.stopPropagation();
            setShowErrorModal(true);
        }
    };

    return (
        <>
            <div
                className={`flex items-center space-x-1 ${getStatusColor(status)} ${isFailed ? 'cursor-help' : ''}`}
                title={isFailed ? 'Click to view error details' : undefined}
                onClick={handleClick}
            >
                {getStatusIcon(status)}
            </div>
            <ErrorModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                errorMessage={failedReason}
            />
        </>
    );
};

// Professional Media Modal Component
const MediaModal = ({ isOpen, onClose, mediaItem, type }) => {
    if (!isOpen || !mediaItem) return null;

    const getFileIcon = (fileName) => {
        const extension = fileName?.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf': return <FaFilePdf className="w-12 h-12 sm:w-16 sm:h-16 text-red-500" />;
            case 'doc': case 'docx': return <FaFileWord className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500" />;
            case 'xls': case 'xlsx': return <FaFileExcel className="w-12 h-12 sm:w-16 sm:h-16 text-green-500" />;
            case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': return <FaFileImage className="w-12 h-12 sm:w-16 sm:h-16 text-purple-500" />;
            case 'mp4': case 'avi': case 'mov': case 'webm': return <FaFileVideo className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500" />;
            case 'mp3': case 'wav': case 'ogg': case 'm4a': return <FaFileAudio className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500" />;
            default: return <FaFile className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500" />;
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const renderMediaContent = () => {
        switch (type) {
            case 'image':
                return (
                    <div className="flex items-center justify-center h-full p-2 sm:p-4">
                        <img
                            src={mediaItem.serverUrl}
                            alt={mediaItem.name || 'Image'}
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    </div>
                );
            case 'video':
                return (
                    <div className="w-full h-full bg-black rounded-lg overflow-hidden">
                        <ReactPlayer
                            url={mediaItem.serverUrl}
                            width="100%"
                            height="100%"
                            controls
                            playing
                            config={{
                                file: {
                                    attributes: {
                                        controlsList: 'nodownload'
                                    }
                                }
                            }}
                        />
                    </div>
                );
            case 'audio':
                return (
                    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8">
                        <FaFileAudio className="w-16 h-16 sm:w-24 sm:h-24 text-blue-500 mb-4 sm:mb-6" />
                        <audio
                            controls
                            className="w-full max-w-md"
                            autoPlay
                        >
                            <source src={mediaItem.serverUrl} type="audio/mpeg" />
                            <source src={mediaItem.serverUrl} type="audio/wav" />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 text-center">
                        {getFileIcon(mediaItem.name)}
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mt-3 sm:mt-4 mb-2">
                            Document Preview
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-2">
                            This document cannot be previewed in the browser. Please download to view.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                            <a
                                href={mediaItem.serverUrl}
                                download={mediaItem.name}
                                className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
                            >
                                <FiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Download</span>
                            </a>
                            <a
                                href={mediaItem.serverUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
                            >
                                <FiExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Open</span>
                            </a>
                        </div>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl w-full h-full sm:max-w-6xl sm:max-h-[90vh] sm:h-auto overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                                {type === 'image' && <FiImage className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />}
                                {type === 'video' && <FiVideo className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />}
                                {type === 'audio' && <FiMusic className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />}
                                {type === 'document' && <div className="flex-shrink-0">{getFileIcon(mediaItem.name)}</div>}
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                                        {mediaItem.name || `Untitled ${type}`}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {formatFileSize(mediaItem.size)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                <a
                                    href={mediaItem.serverUrl}
                                    download={mediaItem.name}
                                    className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-xs sm:text-sm"
                                >
                                    <FiDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Download</span>
                                </a>
                                <button
                                    onClick={onClose}
                                    className="p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Media Content */}
                        <div className="flex-1 p-2 sm:p-4 overflow-auto">
                            <div className="h-full w-full">
                                {renderMediaContent()}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Professional Document Preview Component
const DocumentPreview = ({ fileInfo, isOwnMessage }) => {

    const getFileIcon = (fileName) => {
        const extension = fileName?.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf': return <FaFilePdf className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />;
            case 'doc': case 'docx': return <FaFileWord className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />;
            case 'xls': case 'xlsx': return <FaFileExcel className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />;
            case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': return <FaFileImage className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500" />;
            case 'mp4': case 'avi': case 'mov': case 'webm': return <FaFileVideo className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500" />;
            case 'mp3': case 'wav': case 'ogg': case 'm4a': return <FaFileAudio className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500" />;
            case 'zip': case 'rar': case '7z': return <FiFile className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" />;
            case 'txt': return <FiFile className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500" />;
            default: return <FaFile className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500" />;
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const getFileType = (fileName) => {
        const extension = fileName?.split('.').pop()?.toLowerCase() || 'file';
        return extension.toUpperCase() + ' File';
    };

    const downloadFile = async (url, filename = 'file') => {
        try {
            const res = await fetch(url, { credentials: 'omit' });
            const blob = await res.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = filename || 'file';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (err) {
            console.error('Download failed, falling back to open:', err);
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleDownload = (e) => {
        e.stopPropagation();
        downloadFile(fileInfo.serverUrl, fileInfo.name);
    };

    if (!fileInfo?.serverUrl) {
        return (
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 w-full max-w-xs sm:max-w-sm">
                <FaFile className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-1 sm:mb-2">
                    Document unavailable
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    Failed to load document
                </p>
            </div>
        );
    }

    return (
        <>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 w-full max-w-xs sm:max-w-sm overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
                {/* Header */}
                <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-shrink-0">
                        {getFileIcon(fileInfo.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {fileInfo.name || 'Untitled Document'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {getFileType(fileInfo.name)} • {formatFileSize(fileInfo.size)}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-750">
                    <div className="flex items-center justify-between">
                        <a
                            href={fileInfo.serverUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                            <FaRegEye className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Preview</span>
                        </a>
                        <button
                            onClick={handleDownload}
                            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                        >
                            <FiDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Download</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

// Professional Image Preview Component
const ImagePreview = ({ fileInfo, isOwnMessage, onImageLoad }) => {
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleImageLoad = () => {
        setIsLoading(false);
        // Trigger scroll update when image loads
        if (onImageLoad) {
            setTimeout(() => onImageLoad(), 100);
        }
    };
    const handleImageError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    if (hasError || !fileInfo?.serverUrl) {
        return (
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 w-full max-w-xs sm:max-w-sm">
                <FaFileImage className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-1 sm:mb-2">
                    Image unavailable
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    Failed to load image
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="relative group w-full max-w-xs sm:max-w-sm">
                {isLoading && (
                    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center z-10">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                <div
                    className="relative overflow-hidden rounded-xl cursor-pointer transform transition-transform duration-200 group-hover:scale-[1.02]"
                    onClick={() => setShowModal(true)}
                >
                    <img
                        src={fileInfo.serverUrl}
                        alt={fileInfo.name || 'Image'}
                        className={`w-full max-w-xs sm:max-w-sm max-h-64 sm:max-h-96 object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        loading="lazy"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                            <FiZoomIn className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
                        </div>
                    </div>
                </div>

                {/* Image info */}
                {fileInfo.name && (
                    <div className="mt-1 sm:mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                        {fileInfo.name}
                    </div>
                )}
            </div>

            <MediaModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                mediaItem={fileInfo}
                type="image"
            />
        </>
    );
};

// Professional Video Preview Component
const VideoPreview = ({ fileInfo, isOwnMessage, onVideoLoad }) => {
    const [showModal, setShowModal] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleError = () => {
        setHasError(true);
        setIsLoading(false);
    };

    const handleReady = () => {
        setIsLoading(false);
        // Trigger scroll update when video is ready
        if (onVideoLoad) {
            setTimeout(() => onVideoLoad(), 100);
        }
    };

    if (hasError || !fileInfo?.serverUrl) {
        return (
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 w-full max-w-xs sm:max-w-sm">
                <FaFileVideo className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-1 sm:mb-2">
                    Video unavailable
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    Failed to load video
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="relative group w-full max-w-xs sm:max-w-sm">
                {isLoading && (
                    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center z-10">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                <div
                    className="relative overflow-hidden rounded-xl bg-black cursor-pointer"
                    onClick={() => setShowModal(true)}
                >
                    {/* Video thumbnail with play button */}
                    <div className="relative aspect-video">
                        <ReactPlayer
                            url={fileInfo.serverUrl}
                            width="100%"
                            height="100%"
                            light={true}
                            playIcon={
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center transform transition-transform group-hover:scale-110">
                                    <FiPlay className="w-6 h-6 sm:w-8 sm:h-8 text-black ml-0.5 sm:ml-1" />
                                </div>
                            }
                            onClickPreview={() => setShowModal(true)}
                            onReady={handleReady}
                            onError={handleError}
                        />
                    </div>

                    {/* Video info */}
                    <div className="p-2 sm:p-3 bg-gradient-to-t from-black to-transparent absolute bottom-0 left-0 right-0">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-white truncate">
                                    {fileInfo.name || 'Video'}
                                </p>
                                <p className="text-xs text-gray-300">
                                    Click to play
                                </p>
                            </div>
                            <button
                                className="ml-1 sm:ml-2 p-1 sm:p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowModal(true);
                                }}
                            >
                                <FiZoomIn className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <MediaModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                mediaItem={fileInfo}
                type="video"
            />
        </>
    );
};

// Professional Audio Preview Component
const AudioPreview = ({ fileInfo, isOwnMessage }) => {
    const [showModal, setShowModal] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleError = () => setHasError(true);

    if (hasError || !fileInfo?.serverUrl) {
        return (
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 w-full max-w-xs sm:max-w-sm">
                <FaFileAudio className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-1 sm:mb-2">
                    Audio unavailable
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    Failed to load audio
                </p>
            </div>
        );
    }

    return (
        <>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 w-full max-w-xs sm:max-w-sm overflow-hidden shadow-sm cursor-pointer"
                onClick={() => setShowModal(true)}
            >
                {/* Header */}
                <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4">
                    <div className="flex-shrink-0">
                        <FaFileAudio className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {fileInfo.name || 'Audio File'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Audio File • Click to play
                        </p>
                    </div>
                </div>

                {/* Audio Player */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <audio
                        controls
                        className="w-full h-10 sm:h-12"
                        onError={handleError}
                    >
                        <source src={fileInfo.serverUrl} type="audio/mpeg" />
                        <source src={fileInfo.serverUrl} type="audio/wav" />
                        <source src={fileInfo.serverUrl} type="audio/ogg" />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            </div>

            <MediaModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                mediaItem={fileInfo}
                type="audio"
            />
        </>
    );
};

// Professional Location Preview Component
const LocationPreview = ({ latitude, longitude, address, name, isOwnMessage }) => {
    const [hasError, setHasError] = useState(false);

    const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l+ff0000(${longitude},${latitude})/${longitude},${latitude},14,0/400x200?access_token=pk.eyJ1IjoiZHVtbXltYXAiLCJhIjoiY2x2OXR6b2VpMDB3eTJrcGZtZ3J0dW1xciJ9.dummy_key_replace_with_your_key`;
    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    const handleImageError = () => setHasError(true);

    if (hasError || !latitude || !longitude) {
        return (
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 w-full max-w-xs sm:max-w-sm">
                <FiMapPin className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-1 sm:mb-2">
                    Location unavailable
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    {address || 'Invalid location data'}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 w-full max-w-xs sm:max-w-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Map Image */}
            <div className="relative h-24 sm:h-32 bg-gray-200 dark:bg-gray-700">
                <img
                    src={staticMapUrl}
                    alt="Location Map"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                />
                <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium flex items-center space-x-1">
                    <FiMapPin className="w-2 h-2 sm:w-3 sm:h-3" />
                    <span className="text-xs">Location</span>
                </div>
            </div>

            {/* Location Info */}
            <div className="p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {name || 'Shared Location'}
                </h3>
                {address && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 line-clamp-2">
                        {address}
                    </p>
                )}

                {/* Coordinates */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 truncate">
                    {latitude}, {longitude}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                        <FiMapPin className="w-2 h-2 sm:w-3 sm:h-3" />
                        <span className="text-xs">Open in Maps</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

// Professional Contact Preview Component
const ContactPreview = ({ contactInfo, isOwnMessage }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 w-full max-w-xs sm:max-w-sm overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiUser className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {contactInfo?.name || 'Contact'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Contact Card
                    </p>
                </div>
            </div>

            {/* Contact Details */}
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                {contactInfo?.phone && (
                    <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                {contactInfo.phone}
                            </p>
                        </div>
                        <a
                            href={`tel:${contactInfo.phone}`}
                            className="inline-flex items-center space-x-1 px-2 sm:px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
                        >
                            <span>Call</span>
                        </a>
                    </div>
                )}

                {contactInfo?.email && (
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                            {contactInfo.email}
                        </p>
                    </div>
                )}
            </div>

            {/* Save Contact Button */}
            <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
                <button className="w-full inline-flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors">
                    <FiUser className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Save Contact</span>
                </button>
            </div>
        </div>
    );
};

// Date Separator Component
const DateSeparator = ({ displayDate }) => {
    return (
        <div className="flex items-center justify-center my-4 sm:my-6">
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

// Message Item Component with Info Button
const MessageItem = ({ msg, activeChat, darkMode, renderFilePreview, formatTime }) => {
    const [showInfoModal, setShowInfoModal] = useState(false);

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
                            className={`p-3 sm:p-4 rounded-2xl ${msg.type === 'out'
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700'
                                } max-w-full relative`}
                        >
                            {msg.message_type === 'text' ? (
                                <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{msg.message}</p>
                            ) : (
                                renderFilePreview(msg)
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
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showTemplatePreview, setShowTemplatePreview] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        markAsRead(activeChat.number);
    }, [activeChat, messages]);

    // Load message history when active chat changes
    useEffect(() => {
        if (!tokens || !activeChat) return;

        (async () => {
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
            setTimeout(() => scrollToBottomImmediate(), 200);
        })();
    }, [tokens, activeChat?.number]);

    // 🔹 When a new socket message arrives
    useEffect(() => {
        console.log("live update", socketMessage);
        if (socketMessage.length > 0) {
            console.log(socketMessage[0].chat_number);
            // Ensure it's for the currently active chat
            if (socketMessage[0].chat_number === activeChat.number) {
                console.log("💬 New socket message for active chat:", socketMessage);
                // Append it safely without duplicating
                setMessages(socketMessage);
                // Scroll immediately for new socket messages
                setTimeout(() => scrollToBottomImmediate(), 50);
            }
        }
    }, [socketMessage, activeChat]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Additional scroll update for media loading
    useEffect(() => {
        if (messagesContainerRef.current) {
            // Use ResizeObserver to detect when container size changes due to image loads
            const resizeObserver = new ResizeObserver(() => {
                // Check if we're near the bottom, and if so, scroll to bottom
                if (messagesContainerRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
                    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

                    if (isNearBottom) {
                        setTimeout(() => scrollToBottomImmediate(), 100);
                    }
                }
            });

            // Also use MutationObserver for DOM changes
            const mutationObserver = new MutationObserver(() => {
                if (messagesContainerRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
                    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

                    if (isNearBottom) {
                        setTimeout(() => scrollToBottomImmediate(), 100);
                    }
                }
            });

            resizeObserver.observe(messagesContainerRef.current);
            mutationObserver.observe(messagesContainerRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });

            return () => {
                resizeObserver.disconnect();
                mutationObserver.disconnect();
            };
        }
    }, [messages]);

    const scrollToBottom = () => {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                    inline: "nearest"
                });
            }
        }, 100);
    };

    // Alternative scroll method for immediate scrolling
    const scrollToBottomImmediate = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: "auto",
                block: "end",
                inline: "nearest"
            });
        }
    };

    // Handle media load scroll updates
    const handleMediaLoad = () => {
        // Use a small delay to ensure DOM has updated
        setTimeout(() => {
            scrollToBottomImmediate();
        }, 50);
    };

    const syncWithAPI = async () => {
        if (!activeChat || loadingHistory) return;
        setLoadingHistory(true);
        try {
            const messagePayload = {
                project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                number: activeChat.number,
                last_id: "0"
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
                await processApiResponse(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch message history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const processApiResponse = async (apiMessages) => {
        try {
            const messageList = apiMessages.map(apiMessage => ({
                message_id: apiMessage.message_id || '',
                wamid: apiMessage.wamid || '',
                create_date: apiMessage.create_date || '',
                type: apiMessage.type || '',
                message_type: apiMessage.message_type || '',
                message: apiMessage.message || '',
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
                media_url: apiMessage.media_url || '',
                media_name: apiMessage.media_name || '',
                is_voice: apiMessage.is_voice || false,
                address: apiMessage.address || '',
                latitude: apiMessage.latitude || '',
                longitude: apiMessage.longitude || '',
                name: apiMessage.name || '',
                reply_wamid: apiMessage.reply_wamid || '',
                timestamp: apiMessage.timestamp || (apiMessage.create_date ? new Date(apiMessage.create_date).getTime() : ''),
                retryCount: apiMessage.retryCount || '',
                chat_number: activeChat.number
            }));

            if (dbAvailable) {
                await dbHelper.saveMessage(messageList);
            }

            setMessages(messageList);
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
        setTimeout(() => scrollToBottomImmediate(), 50);

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
                setTimeout(() => scrollToBottomImmediate(), 50);

                // Trigger parent to refresh chat list with pending state immediately
                if (onMessageStatusUpdate) {
                    onMessageStatusUpdate(activeChat.number, tempMessageId, 'pending');
                }

                const messagePayload = {
                    project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                    message: messageInput || 'Hello',
                    number: activeChat.number
                };

                if (fileType === 'photo') messagePayload.image_link = fileUrl;
                else if (fileType === 'video') messagePayload.video_link = fileUrl;
                else if (fileType === 'audio') messagePayload.audio_link = fileUrl;
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
                    if (dbAvailable) {
                        await dbHelper.updateMessageStatus(tempMessageId, 'sent');
                    }
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.message_id === tempMessageId
                                ? {
                                    ...msg,
                                    status: 'sent'
                                }
                                : msg
                        )
                    );

                    // Notify parent component about status update
                    if (onMessageStatusUpdate) {
                        onMessageStatusUpdate(activeChat.number, tempMessageId, 'sent');
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
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 w-full">
            {/* Chat header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 w-full">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                        className="md:hidden mr-1 text-gray-700 dark:text-gray-300 p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        onClick={onBack}
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
                    <button className="p-1 sm:p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <FiMoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 w-full scroll-smooth">
                {loadingHistory ? (
                    <div className="flex items-center justify-center py-6 sm:py-8">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {groupMessagesByDate(messages).map((dateGroup, groupIndex) => (
                            <div key={dateGroup.date}>
                                {/* Date Separator */}
                                <DateSeparator displayDate={dateGroup.displayDate} />

                                {/* Messages for this date */}
                                <div className="space-y-3 sm:space-y-4">
                                    {dateGroup.messages.map((msg) => (
                                        <MessageItem
                                            key={msg.id}
                                            msg={msg}
                                            activeChat={activeChat}
                                            darkMode={darkMode}
                                            renderFilePreview={renderFilePreview}
                                            formatTime={formatTime}
                                        />
                                    ))}
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

            {/* Input Area */}
            <div className="p-3 sm:p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 w-full">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                        onClick={() => setShowMediaModal(true)}
                        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <FiPaperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-gray-100 dark:bg-gray-700 border border-transparent focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-800 transition-all">
                        <button className="mr-2 sm:mr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                            <FiSmile className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white text-sm sm:text-base"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isUploading || loadingHistory}
                        />
                        <button className="ml-2 sm:ml-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                            <FiMic className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                            onClick={() => setShowTemplateModal(true)}
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