import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Encrypt } from '../pages/encryption/payload-encryption';

const authHeaders = () => {
  const user = JSON.parse(localStorage.getItem('userData') || '{}');
  return { token: user.token || '', username: user.username || '', 'Content-Type': 'application/json' };
};

const request = async (path, payload = {}) => {
  const encrypted = Encrypt(payload);
  const response = await axios.post(`${API_BASE_URL}/flow-builder${path}`, encrypted, { headers: authHeaders() });
  return response.data;
};

export const getFlowStatus = (project_id) => axios.get(`${API_BASE_URL}/flow-builder/status`, { params: { project_id }, headers: authHeaders() }).then((r) => r.data);
export const listFlows = (project_id) => request('/list', { project_id });
export const getFlow = (project_id, flow_id) => request('/get', { project_id, flow_id });
export const createFlow = (payload) => request('/create', payload);
export const updateFlowDraft = (payload) => request('/update-draft', payload);
export const validateFlow = (payload) => request('/validate', payload);
export const publishFlow = (payload) => request('/publish', payload);
export const toggleFlow = (payload) => request('/toggle', payload);
export const deleteFlow = (payload) => {
  if (payload?.flow_id && !payload?.flow_ids) {
    return request('/delete', { ...payload, flow_ids: [payload.flow_id] });
  }
  return request('/delete', payload);
};
export const deleteFlows = (project_id, flow_ids) => {
  const ids = Array.isArray(flow_ids) ? flow_ids : [flow_ids];
  return request('/delete', { project_id, flow_ids: ids });
};
