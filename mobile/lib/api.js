import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Render production endpoint by default
const DEFAULT_BASE_URL = 'https://quickbite-backend-x63n.onrender.com';

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
      const token = await AsyncStorage.getItem('token');
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
 * Useful for switching between local development machines and Render.
 */
export const updateBaseURL = (newUrl) => {
  if (newUrl) {
    api.defaults.baseURL = newUrl;
    console.log(`API client: Base URL updated to: ${newUrl}`);
  }
};

export default api;
