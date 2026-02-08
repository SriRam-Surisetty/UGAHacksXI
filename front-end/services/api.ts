import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5001';
    }
    return 'http://localhost:5001';
};

import { deleteToken, deleteUserId, getToken } from './storage';

const api = axios.create({
    baseURL: getBaseUrl(),
});

api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        const url = config.baseURL ? `${config.baseURL}${config.url || ''}` : config.url || '';
        console.warn('[api] Missing auth token for request:', url);
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        const reason = error?.response?.data?.reason;
        if (status === 422 && typeof reason === 'string' && reason.toLowerCase().includes('subject must be a string')) {
            await deleteToken();
            await deleteUserId();
            console.warn('[api] Cleared auth token due to invalid JWT subject. Please log in again.');
        }
        return Promise.reject(error);
    }
);

export default api;
