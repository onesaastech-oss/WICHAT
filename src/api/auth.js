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
  const token = localStorage.getItem('token');
  
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://api.w1chat.com/account/profile',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const response = await axios.request(config);
  return response.data;
};

// Create payment order
export const createPaymentOrder = async ({ amount, currency = 'INR', payment_method }) => {
  const token = localStorage.getItem('token');
  
  const payload = {
    amount,
    currency,
    payment_method
  };

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.w1chat.com/payment/create-order',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    data: JSON.stringify(payload)
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

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.w1chat.com/payment/verify',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    data: JSON.stringify(payload)
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

