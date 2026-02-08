import { useState } from 'react';
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

const { width } = Dimensions.get('window');

export default function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [orgName, setOrgName] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('United States');

    const [termsAccepted, setTermsAccepted] = useState(false);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleSignup = async () => {
        if (!email || !password || !confirmPassword || !orgName || !address1 || !city || !state || !zipCode || !country) {
            setNotice({ type: 'error', message: 'Please fill in all required fields.' });
            return;
        }

        if (password !== confirmPassword) {
            setNotice({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        if (!termsAccepted) {
            setNotice({ type: 'error', message: 'You must agree to the Terms of Service.' });
            return;
        }

        if (isLoading) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/signup', {
                email,
                password,
                orgName,
            });

            if (response.status === 201) {
                setNotice({ type: 'success', message: 'Account created. Please sign in.' });
                router.replace('/login');
                return;
            }

            setNotice({ type: 'error', message: response.data?.msg || 'An error occurred.' });
        } catch (error: any) {
            setNotice({ type: 'error', message: error.response?.data?.msg || 'An error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToHome = () => {
        router.push('/');
    };

    const navigateToLogin = () => {
        router.push('/login');
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
                            <Text style={styles.kicker}>Create account</Text>
                            <Text style={styles.title}>Set up your workspace.</Text>
                            <Text style={styles.subtitle}>Tell us who you are and where you operate.</Text>
                        </View>

                        {notice && (
                            <View style={[styles.notice, notice.type === 'success' ? styles.noticeSuccess : styles.noticeError]}>
                                <Text style={styles.noticeText}>{notice.message}</Text>
                            </View>
                        )}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Account</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Admin email</Text>
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

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>Password</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Create a password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        editable={!isLoading}
                                    />
                                </View>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>Confirm</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Repeat password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Organization</Text>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Organization name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your business name"
                                    value={orgName}
                                    onChangeText={setOrgName}
                                    editable={!isLoading}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Address line 1</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Street address"
                                    value={address1}
                                    onChangeText={setAddress1}
                                    editable={!isLoading}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Address line 2</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Suite, unit, or floor"
                                    value={address2}
                                    onChangeText={setAddress2}
                                    editable={!isLoading}
                                />
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>City</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={city}
                                        onChangeText={setCity}
                                        editable={!isLoading}
                                    />
                                </View>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>State</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={state}
                                        onChangeText={setState}
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>ZIP code</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={zipCode}
                                        onChangeText={setZipCode}
                                        editable={!isLoading}
                                    />
                                </View>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>Country</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={country}
                                        onChangeText={setCountry}
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.termsAgreement}
                            onPress={() => setTermsAccepted(!termsAccepted)}
                            disabled={isLoading}
                        >
                            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                                {termsAccepted && <Ionicons name="checkmark" size={12} color="white" />}
                            </View>
                            <Text style={styles.termsText}>
                                I agree to the <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                                <Text style={styles.linkText}>Privacy Policy</Text>.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnPrimary} onPress={handleSignup} disabled={isLoading}>
                            <Text style={styles.btnPrimaryText}>Create account</Text>
                        </TouchableOpacity>

                        <View style={styles.inlineFooter}>
                            <Text style={styles.inlineText}>Already have an account?</Text>
                            <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
                                <Text style={styles.inlineLink}>Sign in</Text>
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
        top: -width * 0.45,
        right: -width * 0.2,
        width: width * 1.0,
        height: width * 1.0,
        borderRadius: width * 0.5,
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        minHeight: 700,
    },
    card: {
        width: '100%',
        maxWidth: 620,
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
    section: {
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
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(234, 234, 244, 0.5)',
        borderWidth: 1,
        borderColor: 'rgba(52, 23, 85, 0.08)',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.landing.black,
        marginBottom: 14,
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
    },
    formGroup: {
        marginBottom: 14,
        flex: 1,
    },
    halfWidth: {
        flex: 1,
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
    termsAgreement: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 20,
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
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: Colors.landing.primaryPurple,
        borderColor: Colors.landing.primaryPurple,
    },
    termsText: {
        flex: 1,
        fontSize: 13,
        color: '#4a4a4a',
    },
    linkText: {
        color: Colors.landing.primaryPurple,
        fontWeight: '700',
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
