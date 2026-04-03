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
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

export default api;
