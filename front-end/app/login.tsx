import { useEffect, useState } from 'react';
import {
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
import { getToken, saveToken, saveUserId } from '@/services/storage';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        let isActive = true;

        const checkSession = async () => {
            try {
                const token = await getToken();
                if (token && isActive) {
                    router.replace('/Dashboard');
                }
            } catch (error) {
                // No-op: if storage is unavailable, stay on login screen.
            }
        };

        checkSession();

        return () => {
            isActive = false;
        };
    }, [router]);

    const handleLogin = async () => {
        if (!email || !password) {
            setNotice({ type: 'error', message: 'Please fill in all fields.' });
            return;
        }

        if (isLoading) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/login', { email, password });

            if (response.data.access_token) {
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
                    : error.response?.data?.msg || 'An error occurred';
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
                    <View
                        style={[styles.card, isLoading && styles.cardDisabled]}
                        pointerEvents={isLoading ? 'none' : 'auto'}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.kicker}>Sign in</Text>
                            <Text style={styles.title}>Welcome back.</Text>
                            <Text style={styles.subtitle}>Use your account to get back to your inventory.</Text>
                        </View>

                        {notice && (
                            <View style={[styles.notice, notice.type === 'success' ? styles.noticeSuccess : styles.noticeError]}>
                                <Text style={styles.noticeText}>{notice.message}</Text>
                            </View>
                        )}

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

                        <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={isLoading}>
                            <Text style={styles.btnPrimaryText}>Sign in</Text>
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
    cardDisabled: {
        opacity: 0.6,
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
    notice: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginTop: 16,
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
