import axios from 'axios';
import { Encrypt } from '../pages/encryption/payload-encryption';

// Perform login and return the raw API response data
export const loginUser = async ({ email, password }) => {
  const payload = { email, password };

  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.w1chat.com/account/login',
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
    url: 'https://api.w1chat.com/account/profile',
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
export const updateUserProfile = async ({ name, email, country_code, mobile, gender }) => {
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
    email,
    country_code,
    mobile,
    gender
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
    url: 'https://api.w1chat.com/account/edit-profile',
    headers: {
      'token': token,
      'username': username,
      'Content-Type': 'application/json'
    },
    data: data_pass
  };

  const response = await axios.request(config);
  return response.data;
};

// Create payment order
export const createPaymentOrder = async ({ project_id, amount, redirect_url }) => {
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
    amount,
    redirect_url
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
    url: 'https://api.w1chat.com/payment/wallet-topup',
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
    url: 'https://api.w1chat.com/payment/verify',
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
    url: `https://api.w1chat.com/payment/promo-code/validate?code=${code}`,
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
    url: 'https://api.w1chat.com/payment/transactions',
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
    url: 'https://api.w1chat.com/payment/payment-status',
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
    url: 'https://api.w1chat.com/project/meta-details',
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
    url: 'https://api.w1chat.com/project/update-waba-profile-picture',
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

// Update WABA profile details
export const updateWabaProfileDetails = async ({
  project_id,
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
    url: 'https://api.w1chat.com/project/update-waba-profile-details',
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
    url: 'https://api.w1chat.com/project/embed-signup',
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

  // Encrypt the payload
  const { data, key } = Encrypt(payload);

  const data_pass = JSON.stringify({
    data,
    key
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.w1chat.com/project/submit-waba-id',
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

// Create project
export const createProject = async ({ company_name, project_name }) => {
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
    project_name
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
    url: 'https://api.w1chat.com/project/create-project',
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
    url: 'https://api.w1chat.com/account/session-check',
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
    url: 'https://api.w1chat.com/account/change-password',
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
