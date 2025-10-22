import { io } from "socket.io-client";
import { dbHelper } from './db';

class SocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.messageCallbacks = [];
        this.chatUpdateCallbacks = [];
    }

    connect(token, username) {
        try {
            this.socket = io("https://api.w1chat.com", {
                transports: ["polling"],
                auth: {
                    token: token,
                    username: username
                }
            });

            this.socket.on("connect", () => {
                console.log("✅ Socket Connected:", this.socket.id);
                this.isConnected = true;

                // Emit auth event after connection
                this.socket.emit("auth", { username, token });
            });

            this.socket.on("auth_status", (msg) => {
                console.log("✅ Auth Status:", msg);
            });

            this.socket.on("chat", async (data) => {
                await this.handleIncomingMessage(data);

                // Notify all registered callbacks
                this.messageCallbacks.forEach(callback => callback(data));
            });

            this.socket.on("connect_error", (error) => {
                console.log("❌ Socket Connection error:", error.message);
                this.isConnected = false;
            });

            this.socket.on("disconnect", (reason) => {
                console.log("🔌 Socket Disconnected:", reason);
                this.isConnected = false;
            });

        } catch (error) {
            console.error("Socket connection failed:", error);
        }
    }

    async handleIncomingMessage(messageData) {
        try {
            console.log(messageData);
            const chatNumber = messageData.contact?.number;
            if (!chatNumber) {
                console.warn('Could not determine chat number for message:', messageData);
                return;
            }

            // New Message
            const messageList = [{
                message_id: messageData.message.message_id || '',
                wamid: messageData.message.wamid || '',
                create_date: messageData.message.create_date || '',
                type: messageData.message.type || '',
                message_type: messageData.message.message_type || '',
                message: messageData.message.message || '',
                is_template: messageData.message.is_template || false,
                is_forwarded: messageData.message.is_forwarded || false,
                is_reply: messageData.message.is_reply || false,
                status: messageData.message.status || '',
                id: messageData.message.id || '',
                
                // ✅ Nested send_by fields with safe checks
                send_by_username: messageData.message.send_by?.username || '',
                send_by_name: messageData.message.send_by?.name || '',
                send_by_mobile: messageData.message.send_by?.mobile || '',
                send_by_email: messageData.message.send_by?.email || '',
                send_by_status: messageData.message.send_by?.status || false,


                is_read: messageData.message.is_read || false,

                // ✅ Nested read_by fields with safe checks
                read_by_username: messageData.message.read_by?.username || '',
                read_by_name: messageData.message.read_by?.name || '',
                read_by_mobile: messageData.message.read_by?.mobile || '',
                read_by_email: messageData.message.read_by?.email || '',
                read_by_status: messageData.message.read_by?.status || false,

                failed_reason: messageData.message.failed_reason || '',
                media_url: messageData.message.media_url || '',
                media_name: messageData.message.media_name || '',
                is_voice: messageData.message.is_voice || false,
                address: messageData.message.address || '',
                latitude: messageData.message.latitude || '',
                longitude: messageData.message.longitude || '',
                name: messageData.message.name || '',
                reply_wamid: messageData.message.reply_wamid || '',
                timestamp: messageData.message.timestamp || '',
                retryCount: messageData.message.retryCount || '',
                chat_number: messageData.contact.number
            }]

            // New Chat
            const chatList = [{
                number: messageData.contact.number,
                name: messageData.contact.name || messageData.contact.number,
                is_favorite: false,
                wamid: messageData.message.wamid || '',
                create_date: messageData.message.create_date || '',
                type: messageData.message.type || '',
                message_type: messageData.message.message_type || '',
                message: messageData.message.message || '',
                status: messageData.message.status || '',
                unique_id: messageData.message.message_id || '',
                last_id: messageData.message.id || '',
            }]

            // Save to IndexedDB if available
            console.log("DB Available");
            await dbHelper.saveMessage(messageList);
            await dbHelper.saveChats(chatList);

        } catch (error) {
            console.error('Error handling incoming message:', error);
        }
    }

    mapMessageType(apiType) {
        const typeMap = {
            'text': 'text',
            'image': 'photo',
            'video': 'video',
            'audio': 'audio',
            'document': 'document'
        };
        return typeMap[apiType] || 'text';
    }

    mapMessageStatus(apiStatus) {
        const statusMap = {
            'pending': 'pending',
            'sent': 'sent',
            'delivered': 'delivered',
            'read': 'read',
            'failed': 'failed',
            'received': 'received'
        };
        return statusMap[apiStatus] || 'sent';
    }

    onMessage(callback) {
        this.messageCallbacks.push(callback);
        return () => {
            this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
        };
    }

    onChatUpdate(callback) {
        this.chatUpdateCallbacks.push(callback);
        return () => {
            this.chatUpdateCallbacks = this.chatUpdateCallbacks.filter(cb => cb !== callback);
        };
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
        }
    }

    isConnected() {
        return this.isConnected;
    }
}

// Create singleton instance
export const socketManager = new SocketManager();