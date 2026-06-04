import axios from 'axios';

/**
 * Vite injects env at build time. Only variables prefixed with VITE_ are exposed.
 * - Local dev: set in client/.env (see .env.example)
 * - Vercel: set VITE_API_URL in Project → Settings → Environment Variables
 */
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export { API_BASE_URL };
