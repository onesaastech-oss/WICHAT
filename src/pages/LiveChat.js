import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChatList from './ChatList';
import Conversation from './Conversation';
import { dbHelper } from './db';
import { socketManager } from './socket';

function LiveChat() {
    const navigate = useNavigate();
    const [tokens, setTokens] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [dbAvailable, setDbAvailable] = useState(false);
    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);

    // Initialize app
    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            // Check session data first
            const sessionData = localStorage.getItem("userData");
            if (!sessionData) {
                navigate("/login");
                return;
            }

            const parsedData = JSON.parse(sessionData);
            if (!parsedData || typeof parsedData !== "object") {
                navigate("/login");
                return;
            }

            if (parsedData.projects?.[0]?.project_id) {
                const dbInitSuccess = await dbHelper.init(parsedData.projects?.[0]?.project_id || 'default_project');
                setDbAvailable(dbInitSuccess);
            }

            setTokens(parsedData);
            setIsInitialized(true);

            // Initialize socket connection
            socketManager.connect(parsedData.token, parsedData.username);

            // Load initial data
            await loadInitialData();

        } catch (error) {
            console.error('Initialization error:', error);
            // Fallback to localStorage only
            navigate("/login");
        }
    };

    const loadInitialData = async () => {
        try {
            // Load chats from database first
            let localChats = [];
            if (dbAvailable) {
                localChats = await dbHelper.getChats();
                setChats(localChats);
            }

        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    // Set up socket listeners
    useEffect(() => {
        if (!isInitialized) return;

        const unsubscribeMessage = socketManager.onMessage(async (messageData) => {
            console.log('🔄 New message received via socket:', messageData);

            // Refresh chats to show updated data
            if (dbAvailable) {
                const updatedChats = await dbHelper.getChats();
                setChats(updatedChats);

                if (activeChat?.number) {
                    const updatedMessage = await dbHelper.getMessages(activeChat.number);
                    setMessages(updatedMessage);
                }
            }

            // If active chat is the one receiving message, refresh messages
            if (activeChat) {
                const messageChatNumber = messageData.send_by?.mobile || messageData.read_by?.mobile;
                if (messageChatNumber === activeChat.number) {
                    // Trigger refresh in Conversation component
                    setActiveChat(prev => ({ ...prev, refresh: Date.now() }));
                }
            }
        });

        return () => {
            unsubscribeMessage();
        };
    }, [isInitialized, activeChat, dbAvailable]);

    // Set dark mode class on body
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const handleChatSelect = (chat) => {
        setActiveChat(chat);
    };

    const handleBackToChatList = () => {
        setActiveChat(null);
    };

    if (!isInitialized) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900"
            >
                <div className="text-center">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"
                    />
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-gray-600 dark:text-gray-400"
                    >
                        Initializing chat...
                    </motion.p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900"
        >
            {/* Header */}
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
                <div className="flex items-center">
                    <h1 className="text-xl font-semibold">WhatsApp Chat</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDarkMode(!darkMode)}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/30"
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </motion.button>
                </div>
            </motion.div>

            {/* Main Container */}
            <div className="flex flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeChat ? 'chat-list-hidden' : 'chat-list-visible'}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className={`w-full md:w-1/3 border-r flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}
                    >
                        <ChatList
                            tokens={tokens}
                            onChatSelect={handleChatSelect}
                            activeChat={activeChat}
                            darkMode={darkMode}
                            dbAvailable={dbAvailable}
                            socket_chats={chats}
                        />
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {activeChat ? (
                        <motion.div 
                            key="conversation-active"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className={`w-full md:w-2/3 flex flex-col ${activeChat ? 'flex' : 'hidden md:flex'}`}
                        >
                            <Conversation
                                activeChat={activeChat}
                                tokens={tokens}
                                onBack={handleBackToChatList}
                                darkMode={darkMode}
                                dbAvailable={dbAvailable}
                                refresh={activeChat.refresh}
                                socketMessage={messages}
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="conversation-placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 hidden md:flex items-center justify-center text-gray-400 dark:text-gray-500"
                        >
                            Select a chat to start messaging
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default LiveChat;