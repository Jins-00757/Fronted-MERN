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

// Response interceptor: normalize error messages, but keep the standard
// axios response shape (response.data) intact - every caller in this app
// reads response.data.status / response.data.success / response.data.data,
// so unwrapping here would silently corrupt every request.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A canceled request (AbortController/CancelToken) has no meaningful
    // response body - preserve axios's own `code` untouched so callers can
    // still tell "the request was aborted on purpose" apart from a real
    // network/server failure (see AdvancedSearch.jsx's suggestions fetch).
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      const err = new Error(error.message || 'Request canceled');
      err.code = 'ERR_CANCELED';
      return Promise.reject(err);
    }

    const message =
      error.response?.data?.message || error.response?.data?.error || error.message || 'Network error';

    const err = new Error(message);
    err.status = error.response?.status;
    err.details = error.response?.data?.errors;
    err.response = error.response;

    return Promise.reject(err);
  }
);

export default api;