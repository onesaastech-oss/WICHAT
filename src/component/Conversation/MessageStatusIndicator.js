import React, { useState } from 'react';
import { FiClock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import ErrorModal from '../Modals/Conversation/ErrorModal';

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

export default MessageStatusIndicator;

