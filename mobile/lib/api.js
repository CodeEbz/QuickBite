import axios from 'axios';
import { getAuthToken } from './authStorage';

// Set EXPO_PUBLIC_API_URL to the deployed Node backend URL for production/team testing.
const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://quickbite-api-production-903f.up.railway.app';

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to automatically attach authorization header
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('API client: Error retrieving token from AsyncStorage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Utility to dynamically update the API base URL.
 * Useful for switching between local development machines and deployed backend hosts.
 */
export const updateBaseURL = (newUrl) => {
  if (newUrl) {
    api.defaults.baseURL = newUrl;
    console.log(`API client: Base URL updated to: ${newUrl}`);
  }
};

export default api;
