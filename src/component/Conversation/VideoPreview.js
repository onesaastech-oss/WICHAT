import React, { useState } from 'react';
import { FiZoomIn, FiPlay } from 'react-icons/fi';
import { FaFileVideo } from 'react-icons/fa';
import ReactPlayer from 'react-player';
import MediaModal from '../Modals/Conversation/MediaModal';

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

export default VideoPreview;

