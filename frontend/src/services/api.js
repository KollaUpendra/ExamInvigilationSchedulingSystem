/**
 * @file src/services/api.js
 * @description Axios client pre-configured with the backend base URL.
 * All API calls in the app should import from this module for
 * consistent timeout handling, base URL, and future interceptor support.
 *
 * Usage:
 *   import api from '../services/api';
 *   const res = await api.post('/leads', { name, email, institution });
 */

import axios from 'axios';

const api = axios.create({
    // Read VITE_API_URL so the same build works in every environment.
    // Falls back to localhost:5000 for local development.
    baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

export default api;
