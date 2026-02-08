import { useState } from 'react';
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    card: {
        width: '100%',
        maxWidth: 580,
        backgroundColor: Colors.landing.white,
        borderRadius: 12,
        padding: 28,
        borderWidth: 1,
        borderColor: '#e5e7eb',
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
    section: {
        marginBottom: 20,
        padding: 16,
        borderRadius: 10,
        backgroundColor: Colors.landing.lightPurple,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
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
    termsAgreement: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 20,
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
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: Colors.landing.primaryPurple,
        borderColor: Colors.landing.primaryPurple,
    },
    termsText: {
        flex: 1,
        fontSize: 13,
        color: '#6b7280',
    },
    linkText: {
        color: Colors.landing.primaryPurple,
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
