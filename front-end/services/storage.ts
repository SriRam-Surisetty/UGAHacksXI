import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const USER_ID_KEY = 'user_id';
const TOKEN_KEY = 'auth_token';
const USER_PROFILE_KEY = 'user_profile';

// --- User ID ---

export const saveUserId = async (id: string): Promise<void> => {
    if (Platform.OS === 'web') {
        localStorage.setItem(USER_ID_KEY, id);
        return;
    }
    await SecureStore.setItemAsync(USER_ID_KEY, id);
};

export const getUserId = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
        return localStorage.getItem(USER_ID_KEY);
    }
    return await SecureStore.getItemAsync(USER_ID_KEY);
};

export const deleteUserId = async (): Promise<void> => {
    if (Platform.OS === 'web') {
        localStorage.removeItem(USER_ID_KEY);
        return;
    }
    await SecureStore.deleteItemAsync(USER_ID_KEY);
};

// --- Auth Token ---

export const saveToken = async (token: string): Promise<void> => {
    if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
        return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const deleteToken = async (): Promise<void> => {
    if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
        return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// --- User Profile ---

type CachedUserProfile = {
    orgName?: string | null;
    role?: string | null;
    email?: string | null;
};

export const saveUserProfile = async (profile: CachedUserProfile): Promise<void> => {
    const payload = JSON.stringify(profile ?? {});
    if (Platform.OS === 'web') {
        localStorage.setItem(USER_PROFILE_KEY, payload);
        return;
    }
    await SecureStore.setItemAsync(USER_PROFILE_KEY, payload);
};

export const getUserProfile = async (): Promise<CachedUserProfile | null> => {
    const raw = Platform.OS === 'web'
        ? localStorage.getItem(USER_PROFILE_KEY)
        : await SecureStore.getItemAsync(USER_PROFILE_KEY);

    if (!raw) return null;

    try {
        return JSON.parse(raw) as CachedUserProfile;
    } catch (error) {
        return null;
    }
};

export const deleteUserProfile = async (): Promise<void> => {
    if (Platform.OS === 'web') {
        localStorage.removeItem(USER_PROFILE_KEY);
        return;
    }
    await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
};
