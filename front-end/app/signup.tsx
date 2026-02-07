import { useState } from 'react';
import { StyleSheet, TextInput as NativeTextInput, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/services/api';
import { saveToken, saveUserId } from '@/services/storage';

// Cast TextInput to any to fix strict TS error
const TextInput = NativeTextInput as any;

export default function SignupScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [orgName, setOrgName] = useState('');
    const [email, setEmail] = useState('');
    const router = useRouter();

    const handleSignup = async () => {
        try {
            const response = await api.post('/signup', { 
                username, 
                password,
                orgName,
                email
            });

            if (response.data.access_token) {
                await saveToken(response.data.access_token);
                await saveUserId(username);
                Alert.alert('Success', 'Account created successfully');
                router.replace('/(tabs)'); // Go to main app
            }
        } catch (error: any) {
            Alert.alert('Signup Failed', error.response?.data?.msg || 'An error occurred');
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Sign Up</ThemedText>

            <TextInput
                style={styles.input}
                placeholder="Organization Name"
                value={orgName}
                onChangeText={setOrgName}
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Button title="Sign Up" onPress={handleSignup} />
            <Button title="Back to Login" onPress={() => router.back()} color="gray" />
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
