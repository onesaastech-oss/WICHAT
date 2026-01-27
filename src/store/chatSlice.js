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
        // Set all chats
        setChats: (state, action) => {
            state.chats = action.payload;
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
