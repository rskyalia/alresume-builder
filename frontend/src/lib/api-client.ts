import axios, { type InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

// Request interceptor: attach XSRF token, fetching the cookie first if missing
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let xsrfToken = Cookies.get('XSRF-TOKEN');

    if (!xsrfToken) {
      await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {
        withCredentials: true,
      });
      xsrfToken = Cookies.get('XSRF-TOKEN');
    }

    if (xsrfToken) {
      config.headers.set('X-XSRF-TOKEN', decodeURIComponent(xsrfToken));
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: redirect to /login on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
