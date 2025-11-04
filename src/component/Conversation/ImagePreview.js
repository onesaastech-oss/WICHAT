import React, { useState } from 'react';
import { FiZoomIn } from 'react-icons/fi';
import { FaFileImage } from 'react-icons/fa';
import MediaModal from '../Modals/Conversation/MediaModal';

const ImagePreview = ({ fileInfo, isOwnMessage, onImageLoad }) => {
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleImageLoad = () => {
        setIsLoading(false);
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

export default ImagePreview;

