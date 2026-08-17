import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Encrypt } from '../pages/encryption/payload-encryption';

const getAuthHeaders = () => {
    try {
        const stored = localStorage.getItem('userData');
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        if (!parsed?.token || !parsed?.username) return null;
        return {
            token: parsed.token,
            username: parsed.username
        };
    } catch (e) {
        console.error('Failed to get auth headers:', e);
        return null;
    }
};

// Fetch paginated scanned users for a project with optional search
export const getScannedUsers = async ({ project_id, search = '', page = 1, limit = 20 }) => {
    const auth = getAuthHeaders();
    if (!auth) throw new Error('Session expired');

    const payload = { project_id, search, page, limit };
    const { data, key } = Encrypt(payload);

    const response = await axios.post(
        `${API_BASE_URL}/qrcode/scanned-users/list`,
        JSON.stringify({ data, key }),
        {
            headers: {
                'Content-Type': 'application/json',
                token: auth.token,
                username: auth.username,
            }
        }
    );
    return response.data;
};

// Add a new scanned user manually
export const addScannedUser = async (formData) => {
    const auth = getAuthHeaders();
    if (!auth) throw new Error('Session expired');

    const { data, key } = Encrypt(formData);

    const response = await axios.post(
        `${API_BASE_URL}/qrcode/scanned-users/add`,
        JSON.stringify({ data, key }),
        {
            headers: {
                'Content-Type': 'application/json',
                token: auth.token,
                username: auth.username,
            }
        }
    );
    return response.data;
};

// Update an existing scanned user
export const updateScannedUser = async (formData) => {
    const auth = getAuthHeaders();
    if (!auth) throw new Error('Session expired');

    const { data, key } = Encrypt(formData);

    const response = await axios.post(
        `${API_BASE_URL}/qrcode/scanned-users/update`,
        JSON.stringify({ data, key }),
        {
            headers: {
                'Content-Type': 'application/json',
                token: auth.token,
                username: auth.username,
            }
        }
    );
    return response.data;
};

// Soft delete a scanned user
export const deleteScannedUser = async ({ scan_id, project_id }) => {
    const auth = getAuthHeaders();
    if (!auth) throw new Error('Session expired');

    const payload = { scan_id, project_id };
    const { data, key } = Encrypt(payload);

    const response = await axios.post(
        `${API_BASE_URL}/qrcode/scanned-users/delete`,
        JSON.stringify({ data, key }),
        {
            headers: {
                'Content-Type': 'application/json',
                token: auth.token,
                username: auth.username,
            }
        }
    );
    return response.data;
};

// Get total count of scanned users
export const getScannedUsersCount = async ({ project_id }) => {
    const auth = getAuthHeaders();
    if (!auth) throw new Error('Session expired');

    const payload = { project_id };
    const { data, key } = Encrypt(payload);

    const response = await axios.post(
        `${API_BASE_URL}/qrcode/scanned-users/count`,
        JSON.stringify({ data, key }),
        {
            headers: {
                'Content-Type': 'application/json',
                token: auth.token,
                username: auth.username,
            }
        }
    );
    return response.data;
};
