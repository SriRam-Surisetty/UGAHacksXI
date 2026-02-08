import axios from 'axios';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';

// Set EXPO_PUBLIC_API_URL in your env or .env to point at the deployed backend.
// Falls back to local dev server when not set.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const getBaseUrl = () => {
    if (API_URL) return API_URL;
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5001';
    }
    return 'http://localhost:5001';
};

import { deleteToken, deleteUserId, deleteUserProfile, getToken } from './storage';

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
        const message = error?.response?.data?.message;
        
        // Handle invalid JWT subject
        if (status === 422 && typeof reason === 'string' && reason.toLowerCase().includes('subject must be a string')) {
            await deleteToken();
            await deleteUserId();
            await deleteUserProfile();
            console.warn('[api] Cleared auth token due to invalid JWT subject. Please log in again.');
            
            Alert.alert(
                'Session Expired',
                'Your session has expired. Please log in again.',
                [{ text: 'OK', onPress: () => router.replace('/login') }]
            );
            return Promise.reject(error);
        }
        
        // Handle token expiration or unauthorized access (401)
        if (status === 401) {
            await deleteToken();
            await deleteUserId();
            await deleteUserProfile();
            console.warn('[api] Token expired or unauthorized. Redirecting to login.');
            
            Alert.alert(
                'Session Expired',
                'Your session has expired. Please log in again.',
                [{ text: 'OK', onPress: () => router.replace('/login') }]
            );
            return Promise.reject(error);
        }
        
        return Promise.reject(error);
    }
);

export default api;
