import { useEffect, useState } from 'react';
import {
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
// Ensure these functions are exported in your @/services/storage.ts file
import {
    getToken,
    saveToken,
    saveUserId,
    saveRememberedEmail,
    getRememberedEmail,
    removeRememberedEmail
} from '@/services/storage';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        let isActive = true;

        const checkSessionAndPreferences = async () => {
            try {
                // 1. Check if user is already logged in (Session check)
                const token = await getToken();
                if (token && isActive) {
                    router.replace('/Dashboard');
                    return;
                }

                // 2. Load the remembered email from local device storage
                const savedEmail = await getRememberedEmail();
                if (savedEmail && isActive) {
                    setEmail(savedEmail);
                    setRememberMe(true);
                }
            } catch (error) {
                console.error("Error loading local storage:", error);
            }
        };

        checkSessionAndPreferences();

        return () => {
            isActive = false;
        };
    }, [router]);

    const handleLogin = async () => {
        if (!email || !password) {
            setNotice({ type: 'error', message: 'Please fill in all fields.' });
            return;
        }

        if (isLoading) return;
        setIsLoading(true);
        setNotice(null);

        try {
            // Check credentials against your MySQL database via the API
            const response = await api.post('/login', { email, password });

            if (response.data.access_token) {
                // 3. Handle Local Remember Me Logic
                if (rememberMe) {
                    await saveRememberedEmail(email);
                } else {
                    await removeRememberedEmail();
                }

                // Save session tokens
                await saveToken(response.data.access_token);
                await saveUserId(email);

                setNotice({ type: 'success', message: 'Login successful. Redirecting...' });
                router.replace('/Dashboard');
            }
        } catch (error: any) {
            const status = error?.response?.status;
            const message =
                status === 401 || status === 400
                    ? 'Invalid email or password.'
                    : error.response?.data?.msg || 'An error occurred during sign in.';
            setNotice({ type: 'error', message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        setNotice({ type: 'error', message: 'Password reset is not available yet.' });
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

            {/* Navigation Header */}
            <View style={styles.nav}>
                <View style={styles.navContainer}>
                    <TouchableOpacity onPress={navigateToHome} style={styles.logoWrap}>
                        <Text style={styles.logo}>StockSense</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={navigateToHome} style={styles.backLink}>
                        <Ionicons name="arrow-back" size={16} color={Colors.landing.primaryPurple} />
                        <Text style={styles.backLinkText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.mainContent}>
                    <View
                        style={[styles.card, isLoading && styles.cardDisabled]}
                        pointerEvents={isLoading ? 'none' : 'auto'}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.kicker}>Sign in</Text>
                            <Text style={styles.title}>Welcome back.</Text>
                            <Text style={styles.subtitle}>Use your account to get back to your inventory.</Text>
                        </View>

                        {/* Error/Success Notifications */}
                        {notice && (
                            <View style={[styles.notice, notice.type === 'success' ? styles.noticeSuccess : styles.noticeError]}>
                                <Text style={styles.noticeText}>{notice.message}</Text>
                            </View>
                        )}

                        {/* Form Inputs */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="you@company.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!isLoading}
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
                                editable={!isLoading}
                            />
                        </View>

                        {/* Options Section */}
                        <View style={styles.formOptions}>
                            <TouchableOpacity
                                style={styles.rememberMe}
                                onPress={() => setRememberMe(!rememberMe)}
                                disabled={isLoading}
                            >
                                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                    {rememberMe && <Ionicons name="checkmark" size={12} color="white" />}
                                </View>
                                <Text style={styles.rememberLabel}>Remember me</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                                <Text style={styles.forgotPassword}>Forgot password?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Action Button */}
                        <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={isLoading}>
                            <Text style={styles.btnPrimaryText}>
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.inlineFooter}>
                            <Text style={styles.inlineText}>New here?</Text>
                            <TouchableOpacity onPress={navigateToSignup} disabled={isLoading}>
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
    nav: {
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: Colors.landing.white,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        paddingBottom: 12,
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
    logo: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.landing.primaryPurple,
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    backLinkText: {
        color: Colors.landing.primaryPurple,
        fontWeight: '600',
        fontSize: 14,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 40,
        paddingBottom: 40,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        minHeight: 500,
    },
    card: {
        width: '100%',
        maxWidth: 440,
        backgroundColor: Colors.landing.white,
        borderRadius: 12,
        padding: 28,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
            android: { elevation: 4 },
        })
    },
    cardDisabled: {
        opacity: 0.6,
    },
    cardHeader: {
        marginBottom: 24,
    },
    kicker: {
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontSize: 11,
        fontWeight: '600',
        color: Colors.landing.accentPurple,
        marginBottom: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: Colors.landing.black,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    notice: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
    },
    noticeSuccess: {
        backgroundColor: '#eefaf2',
        borderColor: '#bbf7d0',
    },
    noticeError: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
    },
    noticeText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
    },
    formGroup: {
        marginBottom: 18,
    },
    label: {
        marginBottom: 6,
        color: Colors.landing.black,
        fontWeight: '600',
        fontSize: 13,
    },
    input: {
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        fontSize: 15,
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
        borderWidth: 1.5,
        borderColor: '#d1d5db',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.landing.white,
    },
    checkboxChecked: {
        backgroundColor: Colors.landing.primaryPurple,
        borderColor: Colors.landing.primaryPurple,
    },
    rememberLabel: {
        fontSize: 13,
        color: '#6b7280',
    },
    forgotPassword: {
        color: Colors.landing.accentPurple,
        fontSize: 13,
        fontWeight: '600',
    },
    btnPrimary: {
        width: '100%',
        paddingVertical: 12,
        backgroundColor: Colors.landing.primaryPurple,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnPrimaryText: {
        color: Colors.landing.white,
        fontSize: 15,
        fontWeight: '600',
    },
    inlineFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 18,
    },
    inlineText: {
        color: '#6b7280',
        fontSize: 13,
    },
    inlineLink: {
        color: Colors.landing.primaryPurple,
        fontWeight: '600',
        fontSize: 13,
    },
});