import React, { useState, useEffect } from 'react';
import { FiSearch, FiStar } from 'react-icons/fi';
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';
import { dbHelper } from './db';

function ChatList({ tokens, onChatSelect, activeChat, darkMode, dbAvailable, socket_chats = [] }) {
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState([]);

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

    // 🔹 When a new socket message arrives
    useEffect(() => {
        if (socket_chats.length > 0) {
            setChats(socket_chats);
        }


    }, [socket_chats]);



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
            const chatList = apiChats.map(apiChat => ({
                number: apiChat.contact.number,
                name: apiChat.contact.name || apiChat.contact.number,
                is_favorite: apiChat.contact.is_favorite || false,
                wamid: apiChat.last_message.wamid,
                create_date: apiChat.last_message.create_date,
                type: apiChat.last_message.type,
                message_type: apiChat.last_message.message_type,
                message: apiChat.last_message.message,
                status: apiChat.last_message.status,
                unique_id: apiChat.last_message.unique_id,
                last_id: apiChat.last_message.id
            }));

            // Save to IndexedDB if available
            if (dbAvailable) {
                console.log("DB Available");
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

    // Group chats by favorite status
    const groupedChats = () => {
        const filtered = chats.filter((chat) => {
            const matchesSearch =
                chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
            let matchesTab = true;
            if (activeTab === 'Unread') matchesTab = chat.unread;
            if (activeTab === 'Favourites') matchesTab = chat.isFavorite;
            if (activeTab === 'Groups') matchesTab = chat.isGroup;
            return matchesSearch && matchesTab;
        });

        if (activeTab === 'All') {
            const favorites = filtered.filter(chat => chat.isFavorite);
            const others = filtered.filter(chat => !chat.isFavorite);

            return [
                ...(favorites.length > 0 ? [{ isGroup: true, groupName: 'Favorites', chats: favorites }] : []),
                ...(others.length > 0 ? [{ isGroup: false, groupName: 'All Chats', chats: others }] : [])
            ];
        }

        return [{ isGroup: false, groupName: activeTab, chats: filtered }];
    };

    const handleChatClick = async (chat) => {
        // Mark as read in IndexedDB if unread
        if (chat.unread) {
            await dbHelper.updateChat(chat.number, { unread: false });
            setChats(prevChats =>
                prevChats.map(c =>
                    c.number === chat.number ? { ...c, unread: false } : c
                )
            );
        }
        onChatSelect(chat);
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
                {['All', 'Unread', 'Favourites', 'Groups'].map((tab) => (
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
                                {/* Group Header for Favorites */}
                                {group.isGroup && (
                                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            {group.groupName}
                                        </h3>
                                    </div>
                                )}

                                {/* Chat Items */}
                                <div className="divide-y" style={{ divideColor: darkMode ? '#374151' : '#e5e7eb' }}>
                                    {group.chats.map((chat) => (
                                        <div
                                            key={chat.id}
                                            onClick={() => handleChatClick(chat)}
                                            className={`p-4 cursor-pointer transition-colors ${chat.unread && !darkMode ? 'bg-blue-50' : ''
                                                } ${chat.unread && darkMode ? 'bg-blue-900/30' : ''
                                                } ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 text-white font-semibold">
                                                        {chat.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {chat.isFavorite && (
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
                                                        <div className="flex items-center space-x-1">
                                                            {chat.unread && (
                                                                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                                                            )}
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {chat.time}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm truncate text-gray-500 dark:text-gray-400">
                                                            {chat.lastMessage}
                                                        </p>
                                                        {chat.unread && (
                                                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 ml-2"></span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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