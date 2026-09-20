/**
 * Centralized API Client & Environment Configuration
 * 
 * Architectural Role:
 * - Centralizes HTTP network dispatching for the entire frontend application.
 * - Dynamic Environment Adaptability: Resolves the API base URL from `import.meta.env.VITE_API_URL`,
 *   falling back to `http://localhost:5001` during local development.
 * - Request Interceptor: Automatically injects the active Bearer JWT token from `localStorage`
 *   into outgoing requests, eliminating repetitive auth header boilerplate.
 */

import axios from 'axios';

// Resolves backend API URL dynamically based on environment (Vercel production vs local)
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

// Configured Axios instance with automatic authorization token injection
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
