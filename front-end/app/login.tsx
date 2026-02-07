import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import api from '@/services/api';
import { saveToken, saveUserId } from '@/services/storage';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            const response = await api.post('/login', { username: email, password });

            if (response.data.access_token) {
                await saveToken(response.data.access_token);
                await saveUserId(email);
                Alert.alert('Success', 'Login successful');
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            Alert.alert('Login failed', error.response?.data?.msg || 'An error occurred');
        }
    };

    const handleForgotPassword = () => {
        Alert.alert('Reset password', 'Password reset is not available yet.');
    };

    const navigateToHome = () => {
        router.push('/');
    };

    const navigateToSignup = () => {
        router.push('/signup');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.backgroundBase}>
                <View style={styles.orbTop} />
                <View style={styles.orbBottom} />
                <View style={styles.gridOverlay} />
            </View>

            <View style={styles.nav}>
                <View style={styles.navContainer}>
                    <TouchableOpacity onPress={navigateToHome} style={styles.logoWrap}>
                        <View style={styles.logoMark} />
                        <Text style={styles.logo}>StockSense</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={navigateToHome} style={styles.backLink}>
                        <Ionicons name="arrow-back" size={16} color={Colors.landing.white} />
                        <Text style={styles.backLinkText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.mainContent}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.kicker}>Sign in</Text>
                            <Text style={styles.title}>Welcome back.</Text>
                            <Text style={styles.subtitle}>Use your account to get back to your inventory.</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="you@company.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.formOptions}>
                            <TouchableOpacity
                                style={styles.rememberMe}
                                onPress={() => setRememberMe(!rememberMe)}
                            >
                                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                    {rememberMe && <Ionicons name="checkmark" size={12} color="white" />}
                                </View>
                                <Text style={styles.rememberLabel}>Remember me</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleForgotPassword}>
                                <Text style={styles.forgotPassword}>Forgot password?</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
                            <Text style={styles.btnPrimaryText}>Sign in</Text>
                        </TouchableOpacity>

                        <View style={styles.inlineFooter}>
                            <Text style={styles.inlineText}>New here?</Text>
                            <TouchableOpacity onPress={navigateToSignup}>
                                <Text style={styles.inlineLink}>Create an account</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.landing.lightPurple,
    },
    backgroundBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.landing.lightPurple,
    },
    orbTop: {
        position: 'absolute',
        top: -width * 0.4,
        right: -width * 0.2,
        width: width * 0.9,
        height: width * 0.9,
        borderRadius: width * 0.45,
        backgroundColor: Colors.landing.primaryPurple,
        opacity: 0.9,
    },
    orbBottom: {
        position: 'absolute',
        bottom: -width * 0.3,
        left: -width * 0.2,
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
        backgroundColor: Colors.landing.accentPurple,
        opacity: 0.2,
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        opacity: 0.06,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: Colors.landing.primaryPurple,
        transform: [{ rotate: '1deg' }],
    },
    nav: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: Platform.OS === 'ios' ? 90 : 70,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        zIndex: 100,
        backgroundColor: 'transparent',
        justifyContent: 'center',
    },
    navContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
    },
    logoWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoMark: {
        width: 14,
        height: 14,
        borderRadius: 4,
        backgroundColor: Colors.landing.white,
    },
    logo: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.landing.white,
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    backLinkText: {
        color: Colors.landing.white,
        fontWeight: '600',
        fontSize: 14,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: Platform.OS === 'ios' ? 100 : 80,
        paddingBottom: 40,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        minHeight: 600,
    },
    card: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: Colors.landing.white,
        borderRadius: 20,
        padding: 28,
        shadowColor: '#111111',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(52, 23, 85, 0.08)',
    },
    cardHeader: {
        marginBottom: 24,
    },
    kicker: {
        textTransform: 'uppercase',
        letterSpacing: 2,
        fontSize: 12,
        fontWeight: '700',
        color: Colors.landing.accentPurple,
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.landing.black,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#4a4a4a',
    },
    formGroup: {
        marginBottom: 18,
    },
    label: {
        marginBottom: 8,
        color: Colors.landing.black,
        fontWeight: '600',
        fontSize: 14,
    },
    input: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(52, 23, 85, 0.15)',
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: Colors.landing.white,
    },
    formOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 22,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 2,
        borderColor: 'rgba(52, 23, 85, 0.3)',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.landing.white,
    },
    checkboxChecked: {
        backgroundColor: Colors.landing.primaryPurple,
        borderColor: Colors.landing.primaryPurple,
    },
    rememberLabel: {
        fontSize: 14,
        color: '#4a4a4a',
    },
    forgotPassword: {
        color: Colors.landing.accentPurple,
        fontSize: 14,
        fontWeight: '600',
    },
    btnPrimary: {
        width: '100%',
        paddingVertical: 14,
        backgroundColor: Colors.landing.primaryPurple,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: Colors.landing.primaryPurple,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    btnPrimaryText: {
        color: Colors.landing.white,
        fontSize: 16,
        fontWeight: '700',
    },
    inlineFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 18,
    },
    inlineText: {
        color: '#4a4a4a',
        fontSize: 14,
    },
    inlineLink: {
        color: Colors.landing.primaryPurple,
        fontWeight: '700',
        fontSize: 14,
    },
});
