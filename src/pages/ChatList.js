import React, { useState, useEffect } from 'react';
import { FiSearch, FiStar, FiImage, FiVideo, FiFile, FiMusic, FiMapPin, FiUser, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';
import { dbHelper } from './db';

function ChatList({ tokens, onChatSelect, activeChat, darkMode, dbAvailable, socket_chats = [] }) {
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState([]);
    const activeChatRef = React.useRef(activeChat);

    // Update ref when activeChat changes
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    // Ensure unread badge clears as soon as a chat becomes active
    useEffect(() => {
        if (!activeChat?.number) return;

        const activeNumber = activeChat.number;
        const activeChatFromState = chats.find(chat => chat.number === activeNumber);

        if (!activeChatFromState) return;

        const unreadValue = Number(activeChatFromState.unread_count ?? 0);
        const normalizedUnread = Number.isFinite(unreadValue) ? unreadValue : 0;
        const shouldClear = normalizedUnread > 0 || activeChatFromState.unread;

        if (!shouldClear) return;

        const clearedChat = { ...activeChatFromState, unread_count: 0, unread: false };

        setChats(prevChats =>
            prevChats.map(chat =>
                chat.number === activeNumber ? clearedChat : chat
            )
        );

        activeChatRef.current = clearedChat;

        if (dbAvailable) {
            dbHelper.updateChat(activeNumber, { unread_count: 0 });
        }
    }, [activeChat?.number, chats, dbAvailable]);

    // Load conversations from IndexedDB first, then sync with API
    useEffect(() => {
        if (!tokens) return;

        (async () => {
            // 1️⃣ Load local database immediately
            if (dbAvailable) {
                const localChats = await dbHelper.getChats();
                if (localChats.length > 0) {
                    setChats(localChats);
                    setIsLoading(false);
                }
            }

            // 2️⃣ Sync with API
            await syncWithAPI();

            // 3️⃣ After API updates DB, re-fetch from local DB again
            if (dbAvailable) {
                const updatedChats = await dbHelper.getChats();
                setChats(updatedChats);
            }

            setIsLoading(false);
        })();
    }, [tokens]);

    // 🔹 When socket_chats prop changes (including status updates)
    useEffect(() => {
        if (socket_chats && socket_chats.length > 0) {
            setChats(prevChats => {
                const updatedChats = socket_chats.map(socketChat => {
                    // Find existing chat to get current unread_count
                    const existingChat = prevChats.find(c => c.number === socketChat.number);

                    // Check if this is the currently open chat
                    const isCurrentlyOpen = activeChatRef.current?.number === socketChat.number;

                    // If chat is currently open, keep count at 0
                    if (isCurrentlyOpen) {
                        return {
                            ...socketChat,
                            unread_count: 0,
                            unread: false
                        };
                    }

                    // Check if this chat received a NEW incoming message
                    // Compare message IDs to detect new messages
                    const hasNewMessage = existingChat &&
                        socketChat.type === 'in' &&
                        (socketChat.wamid !== existingChat.wamid ||
                            socketChat.unique_id !== existingChat.unique_id ||
                            socketChat.last_id !== existingChat.last_id);

                    // Only increment unread count if this specific chat received a new message
                    if (hasNewMessage) {
                        const currentUnread = existingChat?.unread_count || 0;
                        return {
                            ...socketChat,
                            unread_count: currentUnread + 1,
                            unread: true
                        };
                    }

                    // Otherwise, keep existing unread count or use the one from socket
                    const unreadCount = existingChat?.unread_count !== undefined
                        ? existingChat.unread_count
                        : (socketChat.unread_count || 0);

                    return {
                        ...socketChat,
                        unread_count: unreadCount,
                        unread: unreadCount > 0
                    };
                });

                // Save updated counts to IndexedDB
                if (dbAvailable) {
                    dbHelper.saveChats(updatedChats);
                }

                return updatedChats;
            });
        }
    }, [socket_chats, dbAvailable]);



    const syncWithAPI = async () => {
        if (!tokens) return;

        try {
            const messagePayload = {
                project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
                last_id: "0"
            };

            const { data, key } = Encrypt(messagePayload);
            const data_pass = JSON.stringify({ "data": data, "key": key });

            const response = await axios.post(
                `https://api.w1chat.com/message/chat-list`,
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
            console.error('Failed to sync conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const processApiResponse = async (apiChats) => {
        try {
            const chatList = apiChats.map(apiChat => {
                const unreadCount = typeof apiChat.unread_count === 'number'
                    ? apiChat.unread_count
                    : Number(apiChat.unread_count) || 0;

                return {
                    number: apiChat.contact.number,
                    name: apiChat.contact.name || apiChat.contact.number,
                    is_favorite: apiChat.contact.is_favorite || false,
                    wamid: apiChat.last_message.wamid,
                    create_date: apiChat.last_message.create_date,
                    timestamp: apiChat.last_message.create_date ? new Date(apiChat.last_message.create_date).getTime() : Date.now(),
                    type: apiChat.last_message.type,
                    message_type: apiChat.last_message.message_type,
                    message: apiChat.last_message.message,
                    status: apiChat.last_message.status,
                    unique_id: apiChat.last_message.unique_id,
                    last_id: apiChat.last_message.id,
                    unread_count: unreadCount,
                    unread: unreadCount > 0,
                    send_by_username: apiChat.last_message.send_by?.username || '',
                    send_by_mobile: apiChat.last_message.send_by?.mobile || ''
                };
            });

            // Save to IndexedDB if available
            if (dbAvailable) {
                // console.log("DB Available");
                await dbHelper.saveChats(chatList);
            } else {
                throw new Error("Database not available");
            }
            setChats(chatList);
        } catch (error) {
            console.error('Error processing API response:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    };

    // Format last message based on message type
    const formatLastMessage = (chat) => {
        if (!chat.message && !chat.message_type) {
            return 'No messages yet';
        }

        const messageType = chat.message_type || 'text';
        const message = chat.message || '';

        switch (messageType) {
            case 'text':
                return message || 'Message';
            case 'image':
                return '📷 Photo';
            case 'video':
                return '🎥 Video';
            case 'audio':
                return '🎵 Audio';
            case 'document':
                return '📄 Document';
            case 'location':
                return '📍 Location';
            case 'contact':
                return '👤 Contact';
            case 'sticker':
                return '😀 Sticker';
            case 'voice':
                return '🎤 Voice message';
            default:
                return message || 'Message';
        }
    };

    // Get message status icon for sent messages
    const getMessageStatusIcon = (status, isOwnMessage) => {
        if (!isOwnMessage) return null;

        switch (status) {
            case 'pending':
                return <FiClock className="w-3 h-3 text-gray-400" />;
            case 'sent':
                return <FiCheck className="w-3 h-3 text-gray-400" />;
            case 'delivered':
                return (
                    <div className="flex">
                        <FiCheck className="w-3 h-3 text-gray-400" />
                        <FiCheck className="w-3 h-3 -ml-1 text-gray-400" />
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
                return <FiClock className="w-3 h-3 text-gray-400" />;
        }
    };

    // Check if the last message was sent by the current user
    const isLastMessageFromUser = (chat) => {
        // Check if the message type is 'out' or if it's a sent message
        return chat.type === 'out' || chat.send_by_username || chat.send_by_mobile;
    };

    // Get message type icon
    const getMessageTypeIcon = (messageType) => {
        switch (messageType) {
            case 'image':
                return <FiImage className="w-3 h-3" />;
            case 'video':
                return <FiVideo className="w-3 h-3" />;
            case 'audio':
            case 'voice':
                return <FiMusic className="w-3 h-3" />;
            case 'document':
                return <FiFile className="w-3 h-3" />;
            case 'location':
                return <FiMapPin className="w-3 h-3" />;
            case 'contact':
                return <FiUser className="w-3 h-3" />;
            default:
                return null;
        }
    };

    // Format time for display
    const formatTime = (dateStringOrEpoch) => {
        if (!dateStringOrEpoch) return '';
        const date = typeof dateStringOrEpoch === 'number'
            ? new Date(dateStringOrEpoch)
            : new Date(dateStringOrEpoch);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 168) { // Less than a week
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    // Filter and sort chats by most recent
    const groupedChats = () => {
        const filtered = chats.filter((chat) => {
            const lastMessageText = formatLastMessage(chat);
            const matchesSearch =
                chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lastMessageText.toLowerCase().includes(searchQuery.toLowerCase());
            let matchesTab = true;
            if (activeTab === 'Unread') matchesTab = (chat.unread_count || 0) > 0;
            if (activeTab === 'Favourites') matchesTab = chat.is_favorite;
            if (activeTab === 'Groups') matchesTab = chat.isGroup;
            return matchesSearch && matchesTab;
        });

        // Sort by most recent (by timestamp/create_date)
        const sorted = filtered.sort((a, b) => {
            const timeA = a.timestamp || (a.create_date ? new Date(a.create_date).getTime() : 0);
            const timeB = b.timestamp || (b.create_date ? new Date(b.create_date).getTime() : 0);
            return timeB - timeA; // Most recent first
        });

        return [{ isGroup: false, groupName: activeTab, chats: sorted }];
    };

    const handleChatClick = (chat) => {
        const updatedChat = {
            ...chat,
            unread_count: 0,
            unread: false
        };

        // Immediately update the active chat ref
        activeChatRef.current = updatedChat;

        // Reset unread count immediately in UI state
        setChats(prevChats =>
            prevChats.map(c =>
                c.number === chat.number ? updatedChat : c
            )
        );

        // Update IndexedDB in background (non-blocking)
        if (dbAvailable && (chat.unread_count || 0) > 0) {
            dbHelper.updateChat(chat.number, { unread_count: 0 });
        }

        // Notify parent component with the updated chat payload
        onChatSelect(updatedChat);
    };


    return (
        <>
            <div className="p-4 border-b">
                <div className="flex items-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <FiSearch className="text-gray-500 dark:text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-transparent focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
                {['All', 'Unread', 'Favourites', 'Assigned'].map((tab) => (
                    <button
                        key={tab}
                        className={`flex-1 py-3 text-sm font-medium relative ${activeTab === tab
                            ? darkMode
                                ? 'text-blue-400'
                                : 'text-blue-600'
                            : darkMode
                                ? 'text-gray-400'
                                : 'text-gray-500'
                            }`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div
                                className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-600'
                                    }`}
                            ></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {isLoading && chats.length === 0 ? (
                    <div className="p-4 space-y-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                <div className="flex-1">
                                    <div className="h-4 w-3/4 mb-2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                    <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        {groupedChats().map((group, groupIndex) => (
                            <div key={groupIndex}>
                                {/* Chat Items */}
                                <div className="divide-y" style={{ divideColor: darkMode ? '#374151' : '#e5e7eb' }}>
                                    {group.chats.map((chat) => {
                                        const unreadValueRaw = Number(chat.unread_count ?? 0);
                                        const unreadCount = Number.isFinite(unreadValueRaw) ? Math.max(0, unreadValueRaw) : 0;
                                        const hasUnread = unreadCount > 0;
                                        const isActive = activeChat?.number === chat.number;
                                        return (
                                            <div
                                                key={chat.number || chat.id}
                                                onClick={() => handleChatClick(chat)}
                                                className={`p-4 cursor-pointer transition-colors  ${isActive && !darkMode ? 'bg-gray-100' : ''
                                                    } ${isActive && darkMode ? 'bg-gray-700' : ''
                                                    } ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 text-white font-semibold">
                                                            {chat.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        {chat.is_favorite && (
                                                            <div className="absolute -top-1 -right-1">
                                                                <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <h3 className="font-medium truncate text-gray-900 dark:text-white">
                                                                {chat.name.startsWith("91") ? `+${chat.name}` : chat.name}
                                                            </h3>
                                                            <div className="flex items-center space-x-2">
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {formatTime(chat.timestamp || chat.create_date)}
                                                                </div>
                                                                {hasUnread && !isActive && (
                                                                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-green-500 text-white text-xs font-semibold flex items-center justify-center">
                                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center space-x-1 min-w-0 flex-1">
                                                                {getMessageTypeIcon(chat.message_type)}
                                                                <p className="text-sm truncate text-gray-500 dark:text-gray-400">
                                                                    {formatLastMessage(chat)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center space-x-1 flex-shrink-0">
                                                                {getMessageStatusIcon(chat.status, isLastMessageFromUser(chat))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {chats.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <FiSearch className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No conversations found
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {searchQuery ? 'Try adjusting your search terms' : 'Start a new conversation to see it here'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

export default ChatList;