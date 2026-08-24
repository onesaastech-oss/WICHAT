import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Encrypt } from '../pages/encryption/payload-encryption';

export const sendInteractiveMessage = async ({ tokens, project_id, number, interactive, is_reply = false, reply_wamid = '' }) => {
    const payload = { project_id, number, interactive, ...(is_reply ? { is_reply, reply_wamid } : {}) };
    const { data, key } = Encrypt(payload);
    const response = await axios.post(`${API_BASE_URL}/message/send-interactive-message`, JSON.stringify({ data, key }), {
        headers: { token: tokens?.token || '', username: tokens?.username || '', 'Content-Type': 'application/json' }
    });
    return response.data;
};

