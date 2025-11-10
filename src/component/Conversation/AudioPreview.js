import React, { useState } from 'react';
import { FaFileAudio } from 'react-icons/fa';
import { FiMic } from 'react-icons/fi';
import MediaModal from '../Modals/Conversation/MediaModal';

const AudioPreview = ({ fileInfo, isOwnMessage, isVoiceMessage = false }) => {
    const [showModal, setShowModal] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleError = () => setHasError(true);

    if (hasError || !fileInfo?.serverUrl) {
        return (
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 w-full max-w-xs sm:max-w-sm">
                {isVoiceMessage ? (
                    <FiMic className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                ) : (
                    <FaFileAudio className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                )}
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-1 sm:mb-2">
                    {isVoiceMessage ? 'Voice message unavailable' : 'Audio unavailable'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    Failed to load {isVoiceMessage ? 'voice message' : 'audio'}
                </p>
            </div>
        );
    }

    // Voice message UI - more compact and voice-specific
    if (isVoiceMessage) {
        return (
            <>
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 w-full max-w-xs overflow-hidden shadow-sm cursor-pointer"
                    onClick={() => setShowModal(true)}
                >
                    {/* Voice Message Header */}
                    <div className="flex items-center space-x-3 p-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <FiMic className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Voice Message
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Tap to play
                            </p>
                        </div>
                    </div>

                    {/* Compact Audio Player */}
                    <div className="px-3 pb-3">
                        <audio
                            controls
                            className="w-full h-8"
                            onError={handleError}
                            style={{ filter: 'sepia(1) hue-rotate(200deg) saturate(2)' }}
                        >
                            <source src={fileInfo.serverUrl} type="audio/webm" />
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
    }

    // Regular audio file UI
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

export default AudioPreview;

