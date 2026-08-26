import axios from 'axios';

// Automatically handle missing '/api' in VITE_API_URL, or use relative '/api' in production
let API_URL = import.meta.env.VITE_API_URL;
if (API_URL) {
  // Ensure it doesn't end with slash, then append /api if missing
  API_URL = API_URL.replace(/\/$/, '');
  if (!API_URL.endsWith('/api')) {
    API_URL += '/api';
  }
} else {
  API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
}

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('tvTimeUser');
  if (storedUser) {
    const { token } = JSON.parse(storedUser);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear local storage to force user to log in again
      localStorage.removeItem('tvTimeUser');
      // We can also redirect to login page by changing window location
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
