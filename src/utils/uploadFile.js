import axios from 'axios';

const UPLOAD_API_URL =
  process.env.REACT_APP_UPLOAD_API_URL || 'https://upload.onesaas.in/api/upload';
const UPLOAD_API_KEY =
  process.env.REACT_APP_UPLOAD_API_KEY || 'onedevelopers';

/**
 * Upload a file to the external OneSaaS upload service.
 * @returns {{ url: string, link: string, meta: object }}
 */
export async function uploadFile(file, options = {}) {
  if (!file) {
    throw new Error('No file provided');
  }

  const formData = new FormData();
  formData.append('file', file, options.filename || file.name);

  const response = await axios.post(UPLOAD_API_URL, formData, {
    headers: { key: UPLOAD_API_KEY },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    onUploadProgress: options.onUploadProgress,
  });

  const data = response.data;
  if (!data?.success || !data?.url) {
    throw new Error(data?.message || data?.error || 'Upload failed');
  }

  return {
    url: data.url,
    link: data.url,
    meta: data.meta || null,
  };
}
