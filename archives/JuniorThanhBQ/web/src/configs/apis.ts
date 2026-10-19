import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const apiClient = axios.create({
  baseURL: rawBaseURL.replace(/\/graphql\/?$/, ''),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
