import { io } from "socket.io-client";
import { dbHelper } from './db';

const normalizeSocketMessagePayload = (message = {}) => {
    const isTemplate = message.message_type === 'template' || message.is_template;
    let resolvedMessage = message.message || '';

    // Normalize `component` (socket can deliver array or JSON-stringified array)
    const normalizedComponent = (() => {
        const c = message?.component;
        if (!c) return [];
        if (Array.isArray(c)) return c;
        if (typeof c === 'string') {
            try {
                const parsed = JSON.parse(c);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.warn('Failed to parse template component JSON (socket):', c);
                return [];
            }
        }
        return [];
    })();

    if (isTemplate && (!resolvedMessage || resolvedMessage.length === 0)) {
        let bodyText = '';
        if (Array.isArray(message.template?.components)) {
            const bodyComp = message.template.components.find(
                (c) => (c.type || '').toUpperCase() === 'BODY'
            );
            bodyText = bodyComp?.text || '';
        } else if (message.template?.body) {
            bodyText = message.template.body;
        }

        const params =
            (normalizedComponent || []).find(
                (c) => (c.type || '').toLowerCase() === 'body'
            )?.parameters || [];

        const matches = bodyText.match(/\{\{\d+\}\}/g) || [];
        resolvedMessage =
            matches.reduce((acc, placeholder, idx) => {
                const val = params[idx]?.text || `Variable ${idx + 1}`;
                return acc.replace(placeholder, val);
            }, bodyText) || bodyText || '';
    }

    let headerMediaUrl = message.media_url || '';
    let headerMediaName = message.media_name || '';
    let derivedMessageType = message.message_type || '';

    if (isTemplate && Array.isArray(normalizedComponent)) {
        const headerComp = normalizedComponent.find(
            (c) => (c.type || '').toLowerCase() === 'header'
        );
        const headerParam = headerComp?.parameters?.[0];

        if (headerParam?.type === 'image' && headerParam.image?.link) {
            headerMediaUrl = headerParam.image.link;
            derivedMessageType = 'image';
            headerMediaName = headerMediaUrl.split('/').pop() || 'Image';
        } else if (headerParam?.type === 'video' && headerParam.video?.link) {
            headerMediaUrl = headerParam.video.link;
            derivedMessageType = 'video';
            headerMediaName = headerMediaUrl.split('/').pop() || 'Video';
        } else if (
            headerParam?.type === 'document' &&
            headerParam.document?.link
        ) {
            headerMediaUrl = headerParam.document.link;
            derivedMessageType = 'document';
            headerMediaName = headerMediaUrl.split('/').pop() || 'Document';
        }
    }

    if (isTemplate && headerMediaUrl && !derivedMessageType) {
        const lower = headerMediaUrl.toLowerCase();
        if (/(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/.test(lower)) {
            derivedMessageType = 'image';
        } else if (/(\.mp4|\.mov|\.avi|\.webm)$/.test(lower)) {
            derivedMessageType = 'video';
        } else if (/(\.mp3|\.wav|\.ogg|\.m4a)$/.test(lower)) {
            derivedMessageType = 'audio';
        } else {
            derivedMessageType = 'document';
        }
    }

    return {
        resolvedMessage,
        headerMediaUrl,
        headerMediaName,
        derivedMessageType,
        normalizedComponent,
    };
};

class SocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.messageCallbacks = [];
        this.chatUpdateCallbacks = [];
        this.assignmentCallbacks = [];
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

            // Handle message status updates
            this.socket.on("message_status", async (data) => {
                await this.handleMessageStatusUpdate(data);

                // Notify all registered callbacks
                this.messageCallbacks.forEach(callback => callback(data));
            });

            this.socket.on("chat_assigned", async (data) => {
                console.log("📌 chat_assigned socket event:", data);
                this.assignmentCallbacks.forEach(callback => callback(data));
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

            const {
                resolvedMessage,
                headerMediaUrl,
                headerMediaName,
                derivedMessageType,
                normalizedComponent,
            } = normalizeSocketMessagePayload(messageData.message || {});

            // Check if this is a message sent by the current user (outgoing message)
            const isOutgoingMessage = messageData.message.type === 'out' ||
                messageData.message.send_by?.username ||
                messageData.message.send_by?.mobile;

            // For outgoing messages, try to merge with existing temp message to avoid duplicates
            if (isOutgoingMessage) {
                const existingMessage = await dbHelper.getMessageByMessageId(messageData.message.message_id);
                if (existingMessage) {
                    console.log('Outgoing message already exists, updating status only');
                    await dbHelper.updateMessageStatus(messageData.message.message_id, messageData.message.status, '', messageData.message.id);
                    return;
                }

                // Merge echoed server message into temp outgoing if same media
                await dbHelper.mergeServerOutgoingMessage(chatNumber, {
                    message_id: messageData.message.message_id || '',
                    wamid: messageData.message.wamid || '',
                    create_date: messageData.message.create_date || '',
                    type: messageData.message.type || '',
                    message_type: derivedMessageType || messageData.message.message_type || '',
                    message: resolvedMessage,
                    is_template: messageData.message.is_template || false,
                    is_forwarded: messageData.message.is_forwarded || false,
                    is_reply: messageData.message.is_reply || false,
                    status: messageData.message.status || '',
                    id: messageData.message.id || '',
                    send_by_username: messageData.message.send_by?.username || '',
                    send_by_name: messageData.message.send_by?.name || '',
                    send_by_mobile: messageData.message.send_by?.mobile || '',
                    send_by_email: messageData.message.send_by?.email || '',
                    send_by_status: messageData.message.send_by?.status || false,
                    is_read: messageData.message.is_read || false,
                    read_by_username: messageData.message.read_by?.username || '',
                    read_by_name: messageData.message.read_by?.name || '',
                    read_by_mobile: messageData.message.read_by?.mobile || '',
                    read_by_email: messageData.message.read_by?.email || '',
                    read_by_status: messageData.message.read_by?.status || false,
                    failed_reason: messageData.message.failed_reason || '',
                    media_url: headerMediaUrl || messageData.message.media_url || '',
                    media_name: headerMediaName || messageData.message.media_name || '',
                    is_voice: messageData.message.is_voice || false,
                    address: messageData.message.address || '',
                    latitude: messageData.message.latitude || '',
                    longitude: messageData.message.longitude || '',
                    name: messageData.message.name || '',
                    reply_wamid: messageData.message.reply_wamid || '',
                    timestamp: messageData.message.timestamp || '',
                    retryCount: messageData.message.retryCount || '',
                    template: messageData.message.template || null,
                    component: (normalizedComponent?.length ? normalizedComponent : (messageData.message.component || null))
                });
                return;
            }

            // New Message
            const messageList = [{
                message_id: messageData.message.message_id || '',
                wamid: messageData.message.wamid || '',
                create_date: messageData.message.create_date || '',
                type: messageData.message.type || '',
                message_type: derivedMessageType || messageData.message.message_type || '',
                message: resolvedMessage,
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
                media_url: headerMediaUrl || messageData.message.media_url || '',
                media_name: headerMediaName || messageData.message.media_name || '',
                is_voice: messageData.message.is_voice || false,
                address: messageData.message.address || '',
                latitude: messageData.message.latitude || '',
                longitude: messageData.message.longitude || '',
                name: messageData.message.name || '',
                reply_wamid: messageData.message.reply_wamid || '',
                timestamp: messageData.message.timestamp || '',
                retryCount: messageData.message.retryCount || '',
                chat_number: messageData.contact.number,
                template: messageData.message.template || null,
                component: (normalizedComponent?.length ? normalizedComponent : (messageData.message.component || null))
            }]

            // New Chat
            const chatList = [{
                number: messageData.contact.number,
                name: messageData.contact.name || messageData.contact.number,
                is_favorite: false,
                wamid: messageData.message.wamid || '',
                create_date: messageData.message.create_date || '',
                type: messageData.message.type || '',
                message_type: derivedMessageType || messageData.message.message_type || '',
                message: resolvedMessage,
                status: messageData.message.status || '',
                unique_id: messageData.message.message_id || '',
                last_id: messageData.message.id || '',
                send_by_username: messageData.message.send_by?.username || '',
                send_by_mobile: messageData.message.send_by?.mobile || '',
            }]

            // Save to IndexedDB if available
            console.log("DB Available");
            await dbHelper.saveMessage(messageList);
            await dbHelper.saveChats(chatList);

        } catch (error) {
            console.error('Error handling incoming message:', error);
        }
    }

    async handleMessageStatusUpdate(statusData) {
        try {
            console.log('📊 Message status update received:', statusData);

            const { message_id, changes, failed_reason, last_id } = statusData;

            if (!message_id && !last_id) {
                console.warn('No message_id or last_id in status update:', statusData);
                return;
            }

            // Map status changes to our internal status
            let newStatus = changes;
            if (changes === 'failed') {
                newStatus = 'failed';
            } else if (changes === 'sent') {
                newStatus = 'sent';
            } else if (changes === 'delivered') {
                newStatus = 'delivered';
            } else if (changes === 'read') {
                newStatus = 'read';
            }

            // Update message status in database (try message_id, wamid, or last_id)
            await dbHelper.updateMessageStatus(message_id || '', newStatus, failed_reason, last_id);

            console.log(`✅ Message ${message_id || last_id} status updated to: ${newStatus}`);

        } catch (error) {
            console.error('Error handling message status update:', error);
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

    onAssignment(callback) {
        this.assignmentCallbacks.push(callback);
        return () => {
            this.assignmentCallbacks = this.assignmentCallbacks.filter(cb => cb !== callback);
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