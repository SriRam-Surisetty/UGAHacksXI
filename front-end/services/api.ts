import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5000';
    }
    return 'http://localhost:5000';
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

export default api;
