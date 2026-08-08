import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const LiveChatContext = createContext(null);

const getRoomId = (room) => room?.number || room?.id || room?.roomId || null;

/**
 * State shared by the live-chat list and its active chat room.
 * Keep this provider close to the live-chat route so its state is reset when
 * the user leaves that area of the application.
 */
export function LiveChatProvider({ children }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messagesByRoom, setMessagesByRoom] = useState({});
  const [typingByRoom, setTypingByRoom] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const selectRoom = useCallback((room) => {
    setActiveRoom(room || null);
  }, []);

  const upsertRoom = useCallback((room) => {
    const roomId = getRoomId(room);
    if (!roomId) return;

    setRooms((currentRooms) => {
      const index = currentRooms.findIndex((item) => getRoomId(item) === roomId);
      if (index === -1) return [room, ...currentRooms];

      const nextRooms = [...currentRooms];
      nextRooms[index] = { ...nextRooms[index], ...room };
      return nextRooms;
    });

    setActiveRoom((currentRoom) => (
      getRoomId(currentRoom) === roomId ? { ...currentRoom, ...room } : currentRoom
    ));
  }, []);

  const setRoomMessages = useCallback((roomId, messages) => {
    if (!roomId) return;
    setMessagesByRoom((currentMessages) => ({
      ...currentMessages,
      [roomId]: Array.isArray(messages) ? messages : [],
    }));
  }, []);

  const appendMessage = useCallback((roomId, message) => {
    if (!roomId || !message) return;

    setMessagesByRoom((currentMessages) => {
      const roomMessages = currentMessages[roomId] || [];
      const messageId = message.message_id || message.wamid || message.id;
      const existingIndex = messageId
        ? roomMessages.findIndex((item) => (item.message_id || item.wamid || item.id) === messageId)
        : -1;

      const nextMessages = [...roomMessages];
      if (existingIndex >= 0) {
        nextMessages[existingIndex] = { ...nextMessages[existingIndex], ...message };
      } else {
        nextMessages.push(message);
      }

      return { ...currentMessages, [roomId]: nextMessages };
    });
  }, []);

  const updateMessage = useCallback((roomId, messageId, updates) => {
    if (!roomId || !messageId) return;

    setMessagesByRoom((currentMessages) => ({
      ...currentMessages,
      [roomId]: (currentMessages[roomId] || []).map((message) => (
        (message.message_id || message.wamid || message.id) === messageId
          ? { ...message, ...updates }
          : message
      )),
    }));
  }, []);

  const setTyping = useCallback((roomId, isTyping) => {
    if (!roomId) return;
    setTypingByRoom((currentTyping) => ({ ...currentTyping, [roomId]: Boolean(isTyping) }));
  }, []);

  const resetLiveChat = useCallback(() => {
    setRooms([]);
    setActiveRoom(null);
    setMessagesByRoom({});
    setTypingByRoom({});
    setConnectionStatus('disconnected');
  }, []);

  const value = useMemo(() => ({
    rooms,
    setRooms,
    activeRoom,
    selectRoom,
    upsertRoom,
    messagesByRoom,
    setRoomMessages,
    appendMessage,
    updateMessage,
    typingByRoom,
    setTyping,
    connectionStatus,
    setConnectionStatus,
    resetLiveChat,
  }), [
    rooms,
    activeRoom,
    selectRoom,
    upsertRoom,
    messagesByRoom,
    setRoomMessages,
    appendMessage,
    updateMessage,
    typingByRoom,
    setTyping,
    connectionStatus,
    resetLiveChat,
  ]);

  return <LiveChatContext.Provider value={value}>{children}</LiveChatContext.Provider>;
}

export function useLiveChat() {
  const context = useContext(LiveChatContext);

  if (!context) {
    throw new Error('useLiveChat must be used inside a LiveChatProvider.');
  }

  return context;
}

export default LiveChatContext;
