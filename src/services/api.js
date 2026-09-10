import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // Send httpOnly cookies automatically
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor: handle errors uniformly
api.interceptors.response.use(
  (response) => response.data.data || response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network error';
    const status = error.response?.status;
    const details = error.response?.data?.errors;

    const err = new Error(message);
    err.status = status;
    err.details = details;

    throw err;
  }
);

export default api;