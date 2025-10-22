import React, { useState, useEffect } from 'react';
import { FaDownload, FaRedo, FaFilePdf, FaFileWord, FaFileExcel, FaFile, FaFileImage, FaFileVideo, FaFileAudio } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';

// Document Thumbnail Component
export const DocumentThumbnail = ({ fileInfo, isOwnMessage }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    const getFileIcon = (fileName) => {
        const extension = fileName?.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'pdf':
                return <FaFilePdf className="w-8 h-8 text-red-500" />;
            case 'doc':
            case 'docx':
                return <FaFileWord className="w-8 h-8 text-blue-500" />;
            case 'xls':
            case 'xlsx':
                return <FaFileExcel className="w-8 h-8 text-green-500" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return <FaFileImage className="w-8 h-8 text-purple-500" />;
            case 'mp4':
            case 'avi':
            case 'mov':
                return <FaFileVideo className="w-8 h-8 text-orange-500" />;
            case 'mp3':
            case 'wav':
            case 'ogg':
                return <FaFileAudio className="w-8 h-8 text-yellow-500" />;
            default:
                return <FaFile className="w-8 h-8 text-gray-500" />;
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


    if (hasError || !fileInfo?.serverUrl) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 max-w-xs">
                <div className="text-gray-400 dark:text-gray-500 mb-3">
                    <FaFile className="w-12 h-12" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
                    Failed to load document
                </p>
                <button
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <FaRedo className="w-4 h-4" />
                    )}
                    <span>Retry</span>
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-600 rounded-lg border dark:border-gray-500 max-w-xs hover:shadow-md transition-shadow">
            <div className="flex-shrink-0">
                {getFileIcon(fileInfo.name)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {fileInfo.name || 'Document'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(fileInfo.size)}
                </p>
            </div>
            <a
                href={fileInfo.serverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center justify-center w-8 h-8 text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-full transition-colors"
                title="Download"
            >
                <FiDownload className="w-4 h-4" />
            </a>
        </div>
    );
};

// Image Component with Error Handling
export const ImageMessage = ({ fileInfo, isOwnMessage }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        if (fileInfo?.serverUrl) {
            setImageUrl(fileInfo.serverUrl);
            setHasError(false);
            setIsLoading(true);
        }
    }, [fileInfo?.serverUrl]);

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    if (hasError) {
        return (
            <div className="relative max-w-xs">
                <div className="w-64 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                    <div className="text-gray-400 dark:text-gray-500 mb-3">
                        <FaFileImage className="w-12 h-12" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
                        Failed to load image
                    </p>
                    <button
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FaRedo className="w-4 h-4" />
                        )}
                        <span>Retry</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative max-w-xs">
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            <img
                src={imageUrl}
                alt={fileInfo?.name || 'Image'}
                className={`rounded-lg max-w-full h-auto transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
            />
        </div>
    );
};

// Video Component with Error Handling
export const VideoMessage = ({ fileInfo, isOwnMessage }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleError = () => {
        setHasError(true);
    };


    if (hasError) {
        return (
            <div className="relative max-w-xs">
                <div className="w-64 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                    <div className="text-gray-400 dark:text-gray-500 mb-3">
                        <FaFileVideo className="w-12 h-12" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
                        Failed to load video
                    </p>
                    <button
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FaRedo className="w-4 h-4" />
                        )}
                        <span>Retry</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xs">
            <video
                controls
                className="rounded-lg max-w-full h-auto"
                onError={handleError}
                preload="metadata"
            >
                <source src={fileInfo?.serverUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

// Audio Component with Error Handling
export const AudioMessage = ({ fileInfo, isOwnMessage }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleError = () => {
        setHasError(true);
    };


    if (hasError) {
        return (
            <div className="max-w-xs">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                    <div className="text-gray-400 dark:text-gray-500 mb-3">
                        <FaFileAudio className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
                        Failed to load audio
                    </p>
                    <button
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FaRedo className="w-4 h-4" />
                        )}
                        <span>Retry</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xs">
            <audio
                controls
                className="w-full"
                onError={handleError}
            >
                <source src={fileInfo?.serverUrl} type="audio/mpeg" />
                Your browser does not support the audio tag.
            </audio>
        </div>
    );
};