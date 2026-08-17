const getBaseUrl = () => {
  let url = process.env.REACT_APP_API_BASE_URL || 'https://server.onechatting.com';
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const currentHostname = window.location.hostname;
    if (currentHostname && currentHostname !== 'localhost' && currentHostname !== '127.0.0.1') {
      url = url.replace('localhost', currentHostname).replace('127.0.0.1', currentHostname);
    }
  }
  return url.replace(/\/$/, '');
};

export const API_BASE_URL = getBaseUrl();

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

