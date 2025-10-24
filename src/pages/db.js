import Dexie from 'dexie';

let dbInstance = null;
let changeListeners = [];

class ChatDatabase extends Dexie {
    constructor(dbName) {
        super(dbName || 'ChatDatabase');
        this.version(2).stores({
            chats: '++id, number, name, is_favorite, wamid, create_date, type, message_type, message, status, unique_id, last_id, lastUpdated, send_by_username, send_by_mobile',
            messages: `
                ++id,
                message_id,
                wamid,
                create_date,
                type,
                message_type,
                message,
                is_template,
                is_forwarded,
                is_reply,
                status,
                send_by_username,
                send_by_name,
                send_by_mobile,
                send_by_email,
                send_by_status,
                is_read,
                read_by_username,
                read_by_name,
                read_by_mobile,
                read_by_email,
                read_by_status,
                failed_reason,
                media_url,
                media_name,
                is_voice,
                address,
                latitude,
                longitude,
                name,
                reply_wamid,
                timestamp,
                retryCount,
                chat_number
            `,
        });

        // Set up database change listeners
        this.setupChangeListeners();
    }

    setupChangeListeners() {
        // Listen for changes on chats table
        this.chats.hook('creating', (primKey, obj, transaction) => {
            this.notifyChangeListeners('chats', 'create', obj);
        });

        this.chats.hook('updating', (modifications, primKey, obj, transaction) => {
            this.notifyChangeListeners('chats', 'update', { ...obj, ...modifications });
        });

        this.chats.hook('deleting', (primKey, obj, transaction) => {
            this.notifyChangeListeners('chats', 'delete', obj);
        });

        // Listen for changes on messages table
        this.messages.hook('creating', (primKey, obj, transaction) => {
            this.notifyChangeListeners('messages', 'create', obj);
        });

        this.messages.hook('updating', (modifications, primKey, obj, transaction) => {
            this.notifyChangeListeners('messages', 'update', { ...obj, ...modifications });
        });

        this.messages.hook('deleting', (primKey, obj, transaction) => {
            this.notifyChangeListeners('messages', 'delete', obj);
        });
    }

    notifyChangeListeners(table, operation, data) {
        changeListeners.forEach(listener => {
            try {
                listener(table, operation, data);
            } catch (error) {
                console.error('Error in change listener:', error);
            }
        });
    }
}

export const dbHelper = {
    async init(projectId) {
        if (!projectId) {
            console.warn('⚠️ Missing projectId in init()');
            projectId = 'default_project';
        }

        const dbName = `ChatDB_${projectId}`;

        try {
            if (dbInstance?.isOpen()) {
                dbInstance.close();
            }

            dbInstance = new ChatDatabase(dbName);
            await dbInstance.open();

            console.log('✅ Database opened successfully:', dbName);
            return true;
        } catch (error) {
            console.error('❌ Failed to open database:', error);
            try {
                if (dbInstance) {
                    dbInstance.close();
                    await dbInstance.delete();
                }
                dbInstance = new ChatDatabase(dbName);
                await dbInstance.open();
                console.log('✅ Database recreated successfully:', dbName);
                return true;
            } catch (recreateError) {
                console.error('❌ Failed to recreate database:', recreateError);
                return false;
            }
        }
    },

    get db() {
        if (!dbInstance) throw new Error("Database not initialized. Call dbHelper.init(projectId) first.");
        return dbInstance;
    },

    // Add change listener
    setOnDataChange(callback) {
        changeListeners.push(callback);
        return () => {
            changeListeners = changeListeners.filter(cb => cb !== callback);
        };
    },

    // Remove change listener
    removeOnDataChange(callback) {
        changeListeners = changeListeners.filter(cb => cb !== callback);
    },

    async saveChats(chatList = []) {
        try {
            const db = this.db;

            if (!Array.isArray(chatList) || chatList.length === 0) {
                console.warn("⚠️ No chats to save.");
                return;
            }

            await db.transaction('rw', db.chats, async () => {
                for (const chat of chatList) {
                    const existing = await db.chats.where('number').equals(chat.number).first();

                    const safeName = (chat.name && String(chat.name).trim() !== '')
                        ? chat.name
                        : (existing?.name || chat.number);

                    const data = {
                        number: chat.number,
                        name: safeName,
                        is_favorite: typeof chat.is_favorite === 'boolean' ? chat.is_favorite : (existing?.is_favorite || false),
                        wamid: chat.wamid,
                        create_date: chat.create_date,
                        type: chat.type,
                        message_type: chat.message_type,
                        message: chat.message,
                        status: chat.status,
                        unique_id: chat.unique_id,
                        last_id: chat.last_id,
                        send_by_username: chat.send_by_username || '',
                        send_by_mobile: chat.send_by_mobile || '',
                        lastUpdated: Date.now()
                    };

                    if (existing) {
                        await db.chats.update(existing.id, data);
                    } else {
                        await db.chats.add(data);
                    }
                }
            });

            console.log(`💾 Chats saved/updated successfully (${chatList.length} items).`);
        } catch (error) {
            console.error("❌ Error saving chats:", error);
        }
    },

    async getChats() {
        try {
            const db = this.db;
            return await db.chats.orderBy("last_id").reverse().toArray();
        } catch (error) {
            console.error("❌ Error getting chats:", error);
            return [];
        }
    },

    async saveMessage(messageList = []) {
        try {
            const db = this.db;

            if (!Array.isArray(messageList) || messageList.length === 0) {
                console.warn("⚠️ No messages to save.");
                return;
            }

            await db.transaction('rw', db.messages, async () => {
                for (const message of messageList) {
                    const data = {
                        message_id: message.message_id || '',
                        wamid: message.wamid || '',
                        create_date: message.create_date || '',
                        type: message.type || '',
                        message_type: message.message_type || '',
                        message: message.message || '',
                        is_template: message.is_template || false,
                        is_forwarded: message.is_forwarded || false,
                        is_reply: message.is_reply || false,
                        status: message.status || '',
                        id: message.id || '',
                        send_by_username: message.send_by_username || '',
                        send_by_name: message.send_by_name || '',
                        send_by_mobile: message.send_by_mobile || '',
                        send_by_email: message.send_by_email || '',
                        send_by_status: message.send_by_status || false,
                        is_read: message.is_read || false,
                        read_by_username: message.read_by_username || '',
                        read_by_name: message.read_by_name || '',
                        read_by_mobile: message.read_by_mobile || '',
                        read_by_email: message.read_by_email || '',
                        read_by_status: message.read_by_status || false,
                        failed_reason: message.failed_reason || '',
                        media_url: message.media_url || '',
                        media_name: message.media_name || '',
                        is_voice: message.is_voice || false,
                        address: message.address || '',
                        latitude: message.latitude || '',
                        longitude: message.longitude || '',
                        name: message.name || '',
                        reply_wamid: message.reply_wamid || '',
                        timestamp: (
                            message.timestamp
                            || (message.create_date ? new Date(message.create_date).getTime() : undefined)
                            || Date.now()
                        ),
                        retryCount: message.retryCount || '',
                        chat_number: message.chat_number
                    };

                    const existing = await db.messages.where('message_id').equals(message.message_id).first();

                    if (existing) {
                        await db.messages.update(existing.id, data);
                    } else {
                        await db.messages.add(data);
                    }
                }
            });

            console.log(`💾 Messages saved/updated successfully (${messageList.length} items).`);
        } catch (error) {
            console.error("❌ Error saving messages:", error);
        }
    },

    async getMessages(chatNumber) {
        try {
            const db = this.db;
            return await db.messages
                .where('chat_number')
                .equals(chatNumber)
                .sortBy('id');
        } catch (error) {
            console.error("❌ Error getting messages:", error);
            return [];
        }
    },

    async addMessage(chatNumber, message) {
        try {
            const db = this.db;
            const data = {
                ...message,
                chat_number: chatNumber,
                timestamp: Date.now()
            };
            await db.messages.add(data);
        } catch (error) {
            console.error("❌ Error adding message:", error);
        }
    },

    async updateMessageStatus(messageId, status, failedReason = '') {
        try {
            const db = this.db;
            
            // Get current message to check existing status
            const message = await db.messages.where('message_id').equals(messageId).first();
            
            if (!message) {
                console.warn(`Message with ID ${messageId} not found`);
                return;
            }

            // Define status hierarchy (higher number = higher status)
            const statusHierarchy = {
                'pending': 1,
                'sent': 2,
                'delivered': 3,
                'read': 4,
                'failed': 0 // Failed can override any status
            };

            const currentStatusLevel = statusHierarchy[message.status] || 0;
            const newStatusLevel = statusHierarchy[status] || 0;

            // Only update if new status is higher or if it's a failure
            if (newStatusLevel > currentStatusLevel || status === 'failed') {
                const updateData = { status };
                if (failedReason && status === 'failed') {
                    updateData.failed_reason = failedReason;
                }
                
                await db.messages.where('message_id').equals(messageId).modify(updateData);
                console.log(`✅ Message ${messageId} status updated from ${message.status} to ${status}`);

                // Update the chat's last message status if this is the latest message
                await this.updateChatLastMessageStatus(message.chat_number, messageId, status);
            } else {
                console.log(`⚠️ Message ${messageId} status not updated: ${message.status} → ${status} (downgrade not allowed)`);
            }
        } catch (error) {
            console.error("❌ Error updating message status:", error);
        }
    },

    async updateChatLastMessageStatus(chatNumber, messageId, status) {
        try {
            const db = this.db;
            
            // Try to update by matching the chat's last message identifiers first
            const chatRow = await db.chats.where('number').equals(chatNumber).first();

            let shouldUpdate = false;
            if (chatRow) {
                const msgIdStr = String(messageId);
                const byWamid = chatRow.wamid && String(chatRow.wamid) === msgIdStr;
                const byUniqueId = chatRow.unique_id && String(chatRow.unique_id) === msgIdStr;
                const byLastId = typeof chatRow.last_id !== 'undefined' && String(chatRow.last_id) === msgIdStr;

                if (byWamid || byUniqueId || byLastId) {
                    shouldUpdate = true;
                }
            }

            // Fallback: compare against the latest message stored for this chat
            if (!shouldUpdate) {
                const latestMessage = await db.messages
                    .where('chat_number')
                    .equals(chatNumber)
                    .orderBy('timestamp')
                    .reverse()
                    .first();

                if (latestMessage && latestMessage.message_id === messageId) {
                    shouldUpdate = true;
                }
            }

            if (shouldUpdate) {
                await db.chats.where('number').equals(chatNumber).modify({ status, lastUpdated: Date.now() });
                console.log(`✅ Chat ${chatNumber} last message status updated to: ${status}`);
            } else {
                console.log(`ℹ️ Skipped updating chat ${chatNumber} status; message ${messageId} is not the last chat message.`);
            }
        } catch (error) {
            console.error("❌ Error updating chat last message status:", error);
        }
    },

    async incrementRetryCount(messageId) {
        try {
            const db = this.db;
            const message = await db.messages.where('message_id').equals(messageId).first();
            if (message) {
                await db.messages.where('message_id').equals(messageId).modify({
                    retryCount: (message.retryCount || 0) + 1
                });
            }
        } catch (error) {
            console.error("❌ Error incrementing retry count:", error);
        }
    },

    // Merge server-echoed outgoing message into existing temp message (handles media and text)
    async mergeServerOutgoingMessage(chatNumber, serverMessage) {
        try {
            const db = this.db;

            const mediaUrl = serverMessage.media_url || '';
            const isText = !mediaUrl && (serverMessage.message_type === 'text' || !serverMessage.message_type);

            // Find a recent outgoing temp message in the same chat matching media or text
            const recentMessages = await db.messages
                .where('chat_number')
                .equals(chatNumber)
                .sortBy('id');

            const candidate = [...recentMessages].reverse().find(m => {
                if (!m || m.type !== 'out') return false;
                const isPendingish = (m.status === 'pending' || m.status === 'sent' || !m.status);
                if (!isPendingish) return false;
                // Prefer temp ids for safer merge
                const isTempId = typeof m.message_id === 'string' && m.message_id.startsWith('temp_');
                if (isText) {
                    return (m.message_type === 'text') && (m.message === serverMessage.message) && isTempId;
                }
                return m.media_url === mediaUrl;
            });

            if (candidate) {
                // Update the temp message with server identifiers and status
                await db.messages.update(candidate.id, {
                    message_id: serverMessage.message_id || candidate.message_id,
                    wamid: serverMessage.wamid || candidate.wamid,
                    id: serverMessage.id || candidate.id,
                    create_date: serverMessage.create_date || candidate.create_date,
                    status: serverMessage.status || candidate.status,
                    message_type: serverMessage.message_type || candidate.message_type,
                    message: serverMessage.message || candidate.message,
                    timestamp: (
                        serverMessage.timestamp
                        || (serverMessage.create_date ? new Date(serverMessage.create_date).getTime() : undefined)
                        || candidate.timestamp
                        || Date.now()
                    )
                });
                // Also ensure chat row reflects latest identifiers
                const existingChat = await db.chats.where('number').equals(chatNumber).first();
                await this.saveChats([{
                    number: chatNumber,
                    name: existingChat?.name || chatNumber,
                    wamid: serverMessage.wamid || '',
                    create_date: serverMessage.create_date || '',
                    type: serverMessage.type || 'out',
                    message_type: serverMessage.message_type || candidate.message_type,
                    message: serverMessage.message || candidate.message,
                    status: serverMessage.status || candidate.status,
                    unique_id: serverMessage.message_id || candidate.message_id,
                    last_id: serverMessage.id || candidate.id,
                    send_by_username: serverMessage.send_by_username || '',
                    send_by_mobile: serverMessage.send_by_mobile || ''
                }]);
                return;
            }

            // Fallback: no candidate found, save as new message
            await this.saveMessage([{
                ...serverMessage,
                chat_number: chatNumber,
                timestamp: (
                    serverMessage.timestamp
                    || (serverMessage.create_date ? new Date(serverMessage.create_date).getTime() : undefined)
                    || Date.now()
                )
            }]);
        } catch (error) {
            console.error('❌ Error merging outgoing message:', error);
        }
    },

    async updateChat(chatNumber, updates) {
        try {
            const db = this.db;
            await db.chats.where('number').equals(chatNumber).modify(updates);
        } catch (error) {
            console.error("❌ Error updating chat:", error);
        }
    },

    async getMessageByMessageId(messageId) {
        try {
            const db = this.db;
            return await db.messages.where('message_id').equals(messageId).first();
        } catch (error) {
            console.error("❌ Error getting message by message_id:", error);
            return null;
        }
    }
};