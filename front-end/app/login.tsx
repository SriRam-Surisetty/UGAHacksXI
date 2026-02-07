import { useState } from 'react';
import { StyleSheet, TextInput as NativeTextInput, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/services/api';
import { saveToken, saveUserId } from '@/services/storage';

// Cast TextInput to any to fix strict TS error
const TextInput = NativeTextInput as any;

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        try {
            const response = await api.post('/login', { username, password });

            if (response.data.access_token) {
                await saveToken(response.data.access_token);
                await saveUserId(username); // Using username as ID for this demo
                Alert.alert('Success', 'Login Successful');
                router.replace('/'); // Go to home
            }
        } catch (error: any) {
            Alert.alert('Login Failed', error.response?.data?.msg || 'An error occurred');
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Login</ThemedText>

            <TextInput
                style={styles.input}
                placeholder="Username (Hint: test)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Password (Hint: test)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Button title="Login" onPress={handleLogin} />
            <Button title="Don't have an account? Sign Up" onPress={() => router.push('/signup')} color="gray" />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        gap: 16,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
});
