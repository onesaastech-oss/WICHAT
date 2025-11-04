import React from 'react';
import { FiDownload, FiFile } from 'react-icons/fi';
import { FaFilePdf, FaFileWord, FaFileExcel, FaFile, FaFileImage, FaFileVideo, FaFileAudio } from 'react-icons/fa';
import { FaRegEye } from "react-icons/fa6";

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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 w-full max-w-xs sm:max-w-sm overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
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
    );
};

export default DocumentPreview;

