import axios from 'axios';
import toast from 'react-hot-toast';

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

let activeRequests = 0;
let backendWakeupTimeout: ReturnType<typeof setTimeout> | null = null;
let toastId: string | null = null;

const handleResponseEnd = () => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    if (backendWakeupTimeout) {
      clearTimeout(backendWakeupTimeout);
      backendWakeupTimeout = null;
    }
    if (toastId) {
      toast.dismiss(toastId);
      toast.success('Backend server is awake!', { id: 'backend-awake' });
      toastId = null;
    }
  }
};

api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('tvTimeUser');
  if (storedUser) {
    const { token } = JSON.parse(storedUser);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  activeRequests++;
  if (activeRequests === 1 && !backendWakeupTimeout) {
    backendWakeupTimeout = setTimeout(() => {
      toastId = toast.loading('Waking up the backend server from sleep... Please wait, this may take up to 50 seconds.', { duration: 50000 });
    }, 5000);
  }

  return config;
});
api.interceptors.response.use(
  (response) => {
    handleResponseEnd();
    return response;
  },
  (error) => {
    handleResponseEnd();
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
