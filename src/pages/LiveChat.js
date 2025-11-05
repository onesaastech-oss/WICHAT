import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import ChatList from './ChatList';
import Conversation from './Conversation';
import { dbHelper } from './db';
import { socketManager } from './socket';
import { FiArrowLeft, FiSun, FiMoon } from 'react-icons/fi';
function LiveChat() {
    const navigate = useNavigate();
    const { phone } = useParams();
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

    // Sync activeChat with URL phone parameter
    useEffect(() => {
        if (!isInitialized) return;

        if (phone) {
            // Only try to set activeChat if db is available and chats are loaded
            if (!dbAvailable || chats.length === 0) return;
            
            // Find the chat with matching phone number
            const chat = chats.find(c => c.number === phone);
            if (chat) {
                // Only update if the activeChat is different or doesn't exist
                setActiveChat(prev => {
                    if (!prev || prev.number !== phone) {
                        return chat;
                    }
                    return prev;
                });
            } else {
                // Phone in URL but chat not found, clear activeChat
                setActiveChat(null);
            }
        } else {
            // Always clear activeChat when no phone in URL (no need to wait for db/chats)
            setActiveChat(null);
        }
    }, [phone, chats, isInitialized, dbAvailable]);

    // Set up socket listeners
    useEffect(() => {
        if (!isInitialized) return;

        const unsubscribeMessage = socketManager.onMessage(async (messageData) => {
            console.log('🔄 New message received via socket:', messageData);

            // Check if this is a message status update
            if (messageData.changes && ['sent', 'delivered', 'read', 'failed'].includes(messageData.changes)) {
                console.log('📊 Message status update received:', messageData);

                // Refresh messages for active chat if it's affected
                if (activeChat?.number && dbAvailable) {
                    const updatedMessage = await dbHelper.getMessages(activeChat.number);
                    setMessages([...updatedMessage]);
                }

                // Refresh chat list to show updated status
                if (dbAvailable) {
                    const updatedChats = await dbHelper.getChats();
                    console.log('✅ Refreshing chat list after status update:', updatedChats.length);
                    setChats([...updatedChats]);
                }
                return;
            }

            // Handle regular message updates
            // Refresh chats to show updated data
            if (dbAvailable) {
                const updatedChats = await dbHelper.getChats();
                setChats([...updatedChats]);

                if (activeChat?.number) {
                    const updatedMessage = await dbHelper.getMessages(activeChat.number);
                    setMessages([...updatedMessage]);
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

    // Handle ESC key to go back to live-chat page
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                // Only navigate if we're on a chat page (has phone parameter)
                if (phone) {
                    setActiveChat(null);
                    navigate('/live-chat', { replace: true });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [phone, navigate]);

    const handleChatSelect = (chat) => {
        setActiveChat(chat);
        // If already on /live-chat/:phone, replace the URL to avoid stacking history
        // Otherwise, navigate to /live-chat/:phone from /live-chat
        if (phone) {
            navigate(`/live-chat/${chat.number}`, { replace: true });
        } else {
            navigate(`/live-chat/${chat.number}`);
        }
    };

    const handleBackToChatList = () => {
        setActiveChat(null);
        navigate('/live-chat', { replace: true });
    };

    const handleMessageStatusUpdate = async (chatNumber, messageId, status) => {
        try {
            console.log('🔄 handleMessageStatusUpdate called:', { chatNumber, messageId, status });
            // Refresh the chat list to show updated status
            if (dbAvailable) {
                const updatedChats = await dbHelper.getChats();
                console.log('✅ Updated chats fetched from DB:', updatedChats.length);
                // Create a new array reference to trigger React re-render
                setChats([...updatedChats]);
            }
        } catch (error) {
            console.error('Error updating chat list after status change:', error);
        }
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
        <>
            <Toaster />
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
                className="flex items-center justify-between p-2 pl-4 pr-4 border-b dark:border-gray-700 bg-gradient-to-r from-green-500 to-green-600 text-white"
            >

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30"
                >
                    <FiArrowLeft className="w-4 h-4" />
                </motion.button>
                <div className="flex items-center">
                    <h1 className="text-md font-semibold">WhatsApp Chat</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDarkMode(!darkMode)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30"
                    >
                        {darkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
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
                                onMessageStatusUpdate={handleMessageStatusUpdate}
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
        </>
    );
}

export default LiveChat;