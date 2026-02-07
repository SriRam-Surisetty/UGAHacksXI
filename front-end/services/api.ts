import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5001';
    }
    return 'http://localhost:5001';
};

import { getToken } from './storage';

const api = axios.create({
    baseURL: getBaseUrl(),
});

api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
