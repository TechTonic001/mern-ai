import axios from 'axios';

const PRODUCTION_API_URL = 'https://mern-ai-nu.vercel.app';
const LOCAL_API_URL = 'http://localhost:5000';

/**
 * Vite exposes only VITE_* variables at build time.
 * Priority: VITE_API_URL → production default → localhost (dev)
 */
const API_BASE_URL = (
  import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? PRODUCTION_API_URL : LOCAL_API_URL)
).replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (import.meta.env.DEV) {
  console.info('[api] base URL:', API_BASE_URL);
}

export { API_BASE_URL };
