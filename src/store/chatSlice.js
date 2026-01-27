import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    chats: [],
    activeChat: null,
    isLoading: false,
    lastUpdate: null
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // Set all chats (preserves higher status values to avoid overwriting with stale data)
        setChats: (state, action) => {
            const newChats = action.payload;
            console.log('🔴 Redux setChats called with', newChats.length, 'chats, first chat status:', newChats[0]?.status);
            
            // Define status hierarchy (higher number = higher status)
            const statusHierarchy = {
                'pending': 1,
                'sent': 2,
                'delivered': 3,
                'read': 4,
                'failed': 0
            };
            
            // Merge new chats while preserving higher status values
            const mergedChats = newChats.map(newChat => {
                const existingChat = state.chats.find(c => c.number === newChat.number);
                
                if (existingChat) {
                    const existingStatusLevel = statusHierarchy[existingChat.status] || 0;
                    const newStatusLevel = statusHierarchy[newChat.status] || 0;
                    
                    // If existing status is higher (and not failed), preserve it
                    if (existingStatusLevel > newStatusLevel && newChat.status !== 'failed') {
                        console.log('🛡️ Preserving higher status for', newChat.number, ':', existingChat.status, '(incoming:', newChat.status + ')');
                        return {
                            ...newChat,
                            status: existingChat.status
                        };
                    }
                }
                
                return newChat;
            });
            
            state.chats = mergedChats;
            state.lastUpdate = Date.now();
        },

        // Update a single chat
        updateChat: (state, action) => {
            const { number, updates } = action.payload;
            const chatIndex = state.chats.findIndex(chat => chat.number === number);
            
            if (chatIndex !== -1) {
                state.chats[chatIndex] = {
                    ...state.chats[chatIndex],
                    ...updates
                };
                state.lastUpdate = Date.now();
            }
        },

        // Update message status for a chat
        updateMessageStatus: (state, action) => {
            const { chatNumber, messageId, status, timestamp } = action.payload;
            const chatIndex = state.chats.findIndex(chat => chat.number === chatNumber);
            
            if (chatIndex !== -1) {
                // Define status hierarchy (higher number = higher status)
                const statusHierarchy = {
                    'pending': 1,
                    'sent': 2,
                    'delivered': 3,
                    'read': 4,
                    'failed': 0 // Failed can override any status
                };
                
                const currentStatus = state.chats[chatIndex].status;
                const currentStatusLevel = statusHierarchy[currentStatus] || 0;
                const newStatusLevel = statusHierarchy[status] || 0;
                
                // Only update if new status is higher or if it's a failure
                if (newStatusLevel > currentStatusLevel || status === 'failed') {
                    console.log('🔵 Redux updateMessageStatus:', chatNumber, currentStatus, '→', status);
                    const updates = { status };
                    
                    // Update timestamp if provided
                    if (timestamp) {
                        updates.timestamp = timestamp;
                        updates.create_date = new Date(timestamp).toISOString();
                    }
                    
                    state.chats[chatIndex] = {
                        ...state.chats[chatIndex],
                        ...updates
                    };
                    state.lastUpdate = Date.now();
                } else {
                    console.log('⚠️ Redux updateMessageStatus skipped (downgrade):', chatNumber, currentStatus, '→', status);
                }
            }
        },

        // Handle websocket updates
        handleSocketChats: (state, action) => {
            const { socketChats, activeChat } = action.payload;
            
            if (!socketChats || socketChats.length === 0) return;

            const updatedChats = socketChats.map(socketChat => {
                // Find existing chat to preserve unread_count
                const existingChat = state.chats.find(c => c.number === socketChat.number);
                
                // Check if this is the currently open chat
                const isCurrentlyOpen = activeChat?.number === socketChat.number;
                
                // If chat is currently open, keep count at 0
                if (isCurrentlyOpen) {
                    return {
                        ...socketChat,
                        unread_count: 0,
                        unread: false
                    };
                }
                
                // Check if this chat received a NEW incoming message
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

            state.chats = updatedChats;
            state.lastUpdate = Date.now();
        },

        // Clear unread count for a chat
        clearUnreadCount: (state, action) => {
            const chatNumber = action.payload;
            const chatIndex = state.chats.findIndex(chat => chat.number === chatNumber);
            
            if (chatIndex !== -1) {
                state.chats[chatIndex] = {
                    ...state.chats[chatIndex],
                    unread_count: 0,
                    unread: false
                };
                state.lastUpdate = Date.now();
            }
        },

        // Set active chat
        setActiveChat: (state, action) => {
            state.activeChat = action.payload;
        },

        // Set loading state
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },

        // Reset chat state
        resetChatState: () => initialState
    }
});

export const {
    setChats,
    updateChat,
    updateMessageStatus,
    handleSocketChats,
    clearUnreadCount,
    setActiveChat,
    setLoading,
    resetChatState
} = chatSlice.actions;

export default chatSlice.reducer;
