import { useState } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    TextInput, 
    TouchableOpacity, 
    Alert, 
    ScrollView, 
    SafeAreaView, 
    Platform,
    Dimensions
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
            // Note: The backend expects 'username', but the UI asks for 'email'. 
            // Depending on backend, we might need to send email as username or adjust backend.
            // For now, I'll send email as username to match the previous implementation's contract, 
            // assuming the user might use email as username or the backend handles it.
            // Or better, I will use email as the value for username field.
            const response = await api.post('/login', { username: email, password });

            if (response.data.access_token) {
                await saveToken(response.data.access_token);
                await saveUserId(email); 
                Alert.alert('Success', 'Login Successful');
                router.replace('/(tabs)'); 
            }
        } catch (error: any) {
            console.log(error);
            Alert.alert('Login Failed', error.response?.data?.msg || 'An error occurred');
        }
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
            
            {/* Navigation */}
            <View style={styles.nav}>
                <View style={styles.navContainer}>
                    <TouchableOpacity onPress={navigateToHome}>
                        <Text style={styles.logo}>StockSense</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={navigateToHome} style={styles.backLink}>
                        <Ionicons name="arrow-back" size={16} color="white" />
                        <Text style={styles.backLinkText}>Back to home</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Background Decor */}
                <View style={styles.purpleHeader} />

                {/* Main Content */}
                <View style={styles.mainContent}>
                    <View style={styles.loginContainer}>
                        <View style={styles.loginHeader}>
                            <Text style={styles.title}>Welcome back</Text>
                            <View style={styles.subtitleContainer}>
                                <Text style={styles.subtitle}>Don't have an account? </Text>
                                <TouchableOpacity onPress={navigateToSignup}>
                                    <Text style={styles.linkText}>Sign up for free</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email address (Hint: test)</Text>
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
                            <Text style={styles.label}>Password (Hint: test)</Text>
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
                            <TouchableOpacity>
                                <Text style={styles.forgotPassword}>Forgot password?</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.btnLogin} onPress={handleLogin}>
                            <Text style={styles.btnLoginText}>Sign in</Text>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialLogin}>
                            <TouchableOpacity style={styles.btnSocial}>
                                <Ionicons name="logo-google" size={20} color="#DB4437" />
                                <Text style={styles.btnSocialText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSocial}>
                                <Ionicons name="logo-facebook" size={20} color="#4267B2" />
                                <Text style={styles.btnSocialText}>Facebook</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Stats Section */}
                <View style={styles.statsSection}>
                    <View style={styles.statsContainer}>
                        <Text style={styles.statsTitle}>
                            Join thousands of SMB owners already saving with StockSense
                        </Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>40%</Text>
                                <Text style={styles.statLabel}>Average Waste Reduction</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>$15K</Text>
                                <Text style={styles.statLabel}>Average Monthly Savings</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>95%</Text>
                                <Text style={styles.statLabel}>Prediction Accuracy</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>2.5K+</Text>
                                <Text style={styles.statLabel}>Active SMBs</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 StockSense. All rights reserved.</Text>
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
    purpleHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 400,
        backgroundColor: Colors.landing.primaryPurple,
        zIndex: 0,
    },
    nav: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: Platform.OS === 'ios' ? 100 : 80,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        zIndex: 100, // Increased to ensure it sits above content
        elevation: 20, // Added for Android
        backgroundColor: Colors.landing.primaryPurple, 
        justifyContent: 'center',
    },
    navContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        maxWidth: 1400,
        alignSelf: 'center',
        width: '100%',
    },
    logo: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.landing.white,
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    backLinkText: {
        color: Colors.landing.white,
        fontWeight: '500',
        fontSize: 15,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: Platform.OS === 'ios' ? 100 : 80,
    },
    mainContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginTop: 40,
        marginBottom: 60,
        zIndex: 1,
    },
    loginContainer: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: Colors.landing.white,
        borderRadius: 12,
        padding: 30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    loginHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.landing.black,
        marginBottom: 10,
    },
    subtitleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    subtitle: {
        color: '#666',
        fontSize: 16,
    },
    linkText: {
        color: Colors.landing.primaryPurple,
        fontWeight: '600',
        fontSize: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        color: Colors.landing.black,
        fontWeight: '500',
        fontSize: 15,
    },
    input: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 6,
        fontSize: 16,
        backgroundColor: Colors.landing.white,
    },
    formOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
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
        borderColor: '#ccc',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: Colors.landing.primaryPurple,
        borderColor: Colors.landing.primaryPurple,
    },
    rememberLabel: {
        fontSize: 14,
        color: '#666',
    },
    forgotPassword: {
        color: Colors.landing.primaryPurple,
        fontSize: 14,
        fontWeight: '500',
    },
    btnLogin: {
        width: '100%',
        padding: 15,
        backgroundColor: Colors.landing.primaryPurple,
        borderRadius: 6,
        alignItems: 'center',
    },
    btnLoginText: {
        color: Colors.landing.white,
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 25,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    dividerText: {
        marginHorizontal: 15,
        color: '#999',
        fontSize: 14,
    },
    socialLogin: {
        flexDirection: 'row',
        gap: 15,
    },
    btnSocial: {
        flex: 1,
        padding: 12,
        backgroundColor: Colors.landing.white,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    btnSocialText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.landing.black,
    },
    statsSection: {
        backgroundColor: Colors.landing.primaryPurple,
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    statsContainer: {
        maxWidth: 1200,
        alignSelf: 'center',
        alignItems: 'center',
    },
    statsTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.landing.white,
        textAlign: 'center',
        marginBottom: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 30,
        width: '100%',
    },
    statItem: {
        alignItems: 'center',
        minWidth: 150,
    },
    statNumber: {
        fontSize: 40,
        fontWeight: '700',
        color: Colors.landing.white,
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    footer: {
        backgroundColor: Colors.landing.black,
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
});
