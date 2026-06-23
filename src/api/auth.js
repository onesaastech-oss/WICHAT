import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Encrypt } from '../pages/encryption/payload-encryption';

// Submit new password with reset token (from email link)
export const submitPasswordResetWithToken = async ({ token, password, captcha_token }) => {
  const payload = { token, password, captcha_token };

  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/account/reset-password`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Request password reset - sends link to email
export const requestPasswordReset = async ({ email, captcha_token }) => {
  const payload = { email, captcha_token };

  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/account/reset-password-request`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Perform login and return the raw API response data
// captchaToken: Cloudflare Turnstile response token
export const loginUser = async ({ email, password, captcha_token }) => {
  const payload = { email, password, ...(captcha_token && { captcha_token }) };

  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/account/login`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Fetch user profile with projects
export const fetchUserProfile = async () => {
  // Get user data and project count
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      return null;
    }
  };

  const userData = getUserData();
  const token = userData?.token;
  const username = userData?.username;
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/account/profile`,
    headers: {
      'token': token,
      'username': username,
      'Content-Type': 'application/json'
    }
  };

  const response = await axios.request(config);
  const apiData = response.data;

  // Transform API response to localStorage format and update localStorage
  if (!apiData.error) {
    const updatedUserData = {
      error: apiData.error,
      username: apiData.username,
      token: token, // Keep existing token
      profile: apiData.profile,
      balance: apiData.balance,
      project_count: apiData.projects?.project_count || 0,
      projects: apiData.projects?.list || [],
      selected_project_id: userData?.selected_project_id || apiData.projects?.list?.[0]?.project_id || ''
    };

    // Update localStorage with transformed data
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
  }

  return apiData;
};

// Update user profile
export const updateUserProfile = async ({ name, country_code, mobile, gender, firm_name, business_name, business_type }) => {
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      return null;
    }
  };

  const userData = getUserData();
  const token = userData?.token;
  const username = userData?.username;

  if (!token || !username) {
    throw new Error('Session expired');
  }

  const payload = {
    name,
    country_code,
    mobile,
    gender,
    firm_name,
    business_name,
    business_type,
  };

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/account/edit-profile`,
    headers: {
      'token': token,
      'username': username,
      'Content-Type': 'application/json'
    },
    data: data_pass
  };

  const response = await axios.request(config);
  const apiData = response.data;

  if (!apiData.error && apiData.profile) {
    const updatedUserData = {
      ...userData,
      profile: apiData.profile,
    };
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
  }

  return apiData;
};

// Create payment order (wallet topup – no project_id)
export const createPaymentOrder = async ({ amount, redirect_url, origin }) => {
  // Load auth tokens from localStorage to match existing API requirements
  const stored =
    typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
  const parsed = stored ? JSON.parse(stored) : null;
  const token = parsed?.token;
  const username = parsed?.username;

  if (!token || !username) {
    throw new Error('Session expired');
  }

  const payload = {
    amount,
    redirect_url,
    ...(origin ? { origin } : {})
  };


  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/payment/wallet-topup`,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      'username': username
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Verify payment
export const verifyPayment = async ({
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
  amount,
  bonus,
  discount
}) => {
  const token = localStorage.getItem('token');

  const payload = {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    amount,
    bonus,
    discount
  };

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/payment/verify`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Validate promo code
export const validatePromoCode = async (code) => {
  const token = localStorage.getItem('token');

  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/payment/promo-code/validate?code=${code}`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const response = await axios.request(config);
  return response.data;
};

// Get payment transactions
export const getPaymentTransactions = async () => {
  const token = localStorage.getItem('token');

  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/payment/transactions`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const response = await axios.request(config);
  return response.data;
};

// Check payment status
export const checkPaymentStatus = async ({ project_id, order_id }) => {
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      return null;
    }
  };

  const userData = getUserData();
  const token = userData?.token;
  const username = userData?.username;
  console.log(token, username);


  if (!token || !username) {
    throw new Error('Session expired');
  }

  const payload = {
    project_id,
    order_id
  };

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/payment/payment-status`,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      'username': username
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Get project meta details
export const getProjectMetaDetails = async ({ project_id }) => {
  // Load auth tokens from localStorage to match existing API requirements
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      return null;
    }
  };

  const userData = getUserData();
  const token = userData?.token;
  const username = userData?.username;

  if (!token || !username) {
    throw new Error('Session expired 2');
  }

  const payload = {
    project_id
  };

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/project/meta-details`,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      'username': username
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Update WABA profile picture
export const updateWabaProfilePicture = async ({ project_id, profile_picture }) => {
  // Load auth tokens from localStorage to match existing API requirements
  const stored =
    typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
  const parsed = stored ? JSON.parse(stored) : null;
  const token = parsed?.token;
  const username = parsed?.username;

  if (!token || !username) {
    throw new Error('Session expired');
  }

  const payload = {
    project_id,
    profile_picture
  };

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/project/update-waba-profile-picture`,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      'username': username
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Update WABA profile details (includes profile_picture URL)
export const updateWabaProfileDetails = async ({
  project_id,
  profile_picture,
  about,
  address,
  vertical,
  email,
  websites,
  description
}) => {
  // Load auth tokens from localStorage to match existing API requirements
  const stored =
    typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
  const parsed = stored ? JSON.parse(stored) : null;
  const token = parsed?.token;
  const username = parsed?.username;

  if (!token || !username) {
    throw new Error('Session expired');
  }

  const payload = {
    project_id,
    ...(profile_picture != null && profile_picture !== '' ? { profile_picture } : {}),
    about,
    address,
    vertical,
    email,
    websites,
    description
  };

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/project/update-waba-profile-details`,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      'username': username
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Get embed signup link
export const getEmbedSignupLink = async ({ project_id }) => {
  // Load auth tokens from localStorage to match existing API requirements
  const stored =
    typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
  const parsed = stored ? JSON.parse(stored) : null;
  const token = parsed?.token;
  const username = parsed?.username;

  if (!token || !username) {
    throw new Error('Session expired');
  }

  const payload = {
    project_id
  };

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/project/embed-signup`,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      'username': username
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Submit WABA ID after Facebook signup
export const submitWabaId = async ({ project_id, waba_id }) => {
  // Load auth tokens from localStorage
  const stored =
    typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
  const parsed = stored ? JSON.parse(stored) : null;
  const token = parsed?.token;
  const username = parsed?.username;

  if (!token || !username) {
    throw new Error('Session expired');
  }

  const payload = {
    project_id,
    waba_id
  };

  // Log payload before encryption for debugging
  console.log('[submitWabaId] Payload before encryption:', payload);

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  console.log('[submitWabaId] Encrypted data length:', data.length);
  console.log('[submitWabaId] Encryption key length:', key.length);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/project/submit-waba-id`,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      'username': username
    },
    data: data_pass
  };

  console.log('[submitWabaId] Making API request to:', config.url);
  console.log('[submitWabaId] Request headers:', {
    'Content-Type': config.headers['Content-Type'],
    'token': token ? `${token.substring(0, 10)}...` : 'missing',
    'username': username || 'missing'
  });

  const response = await axios.request(config);

  console.log('[submitWabaId] API response status:', response.status);
  console.log('[submitWabaId] API response data:', response.data);

  return response.data;
};

// Create project
export const createProject = async ({ company_name, project_name, package_id }) => {
  // Load auth tokens from localStorage to match existing API requirements
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      return null;
    }
  };

  const userData = getUserData();
  const token = userData?.token;
  const username = userData?.username;

  if (!token || !username) {
    throw new Error('Session expired');
  }

  const payload = {
    company_name,
    project_name,
    ...(package_id != null && package_id !== '' ? { package_id } : {})
  };

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/project/create-project`,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      'username': username
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};


// Check user session
export const checkSession = async () => {
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      return null;
    }
  };

  const userData = getUserData();
  const token = userData?.token;
  const username = userData?.username;

  if (!token || !username) {
    // If no token locally, effectively logged out
    return { error: "session expired" };
  }

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/account/session-check`,
    headers: {
      'token': token,
      'username': username,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    // If API call fails (e.g. 401), consider session expired
    return { error: "session expired" };
  }
};

// Change password
export const changePassword = async ({ old_password, new_password }) => {
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      return null;
    }
  };

  const userData = getUserData();
  const token = userData?.token;
  const username = userData?.username;

  if (!token || !username) {
    throw new Error('Session expired');
  }

  const payload = {
    old_password,
    new_password
  };

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/account/change-password`,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      'username': username
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Get subscription packs
export const getSubscriptionPacks = async () => {
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      return null;
    }
  };

  const userData = getUserData();
  const token = userData?.token;
  const username = userData?.username;

  if (!token || !username) {
    throw new Error('Session expired');
  }

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/plan`,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      'username': username
    }
  };

  const response = await axios.request(config);
  return response.data;
};

// Purchase plan - subscribe selected projects to packages
export const purchasePlan = async ({ project }) => {
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      return null;
    }
  };

  const userData = getUserData();
  const token = userData?.token;
  const username = userData?.username;

  if (!token || !username) {
    throw new Error('Session expired');
  }



  const payload = {
    projects: project
  };

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/plan/purchase`,
    headers: {
      'Content-Type': 'application/json',
      token,
      username
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Get total unread message count
export const getTotalUnreadCount = async ({ project_id }) => {
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      return null;
    }
  };

  const userData = getUserData();
  const token = userData?.token;
  const username = userData?.username;

  if (!token || !username) {
    throw new Error('Session expired');
  }

  const payload = {
    project_id
  };

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${API_BASE_URL}/message/total-unread-count`,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      'username': username
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};
