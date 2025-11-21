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


