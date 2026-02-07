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
    Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import api from '@/services/api';
import { saveToken, saveUserId } from '@/services/storage';

export default function SignupScreen() {
    // Personal Info
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Organization Info
    const [orgName, setOrgName] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('United States');
    const [phone, setPhone] = useState('');

    const [termsAccepted, setTermsAccepted] = useState(false);
    const router = useRouter();

    const handleSignup = async () => {
        if (!firstName || !lastName || !email || !password || !confirmPassword || !orgName || !address1 || !city || !state || !zipCode || !country || !phone) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (!termsAccepted) {
            Alert.alert('Error', 'You must agree to the Terms of Service');
            return;
        }

        try {
            // Mapping fields to backend expectation:
            // username -> email (as discussed)
            // orgName -> orgName
            const response = await api.post('/signup', { 
                username: email, 
                password,
                orgName,
                email // sending email as well for Org email
            });

            if (response.data.access_token) {
                await saveToken(response.data.access_token);
                await saveUserId(email);
                Alert.alert('Success', 'Account created successfully');
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            Alert.alert('Signup Failed', error.response?.data?.msg || 'An error occurred');
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
            
            {/* Background Decor */}
            <View style={styles.purpleHeader} />

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
                {/* Main Content */}
                <View style={styles.mainContent}>
                    <View style={styles.registerContainer}>
                        <View style={styles.registerHeader}>
                            <Text style={styles.title}>Create your account</Text>
                            <View style={styles.subtitleContainer}>
                                <Text style={styles.subtitle}>Already have an account? </Text>
                                <TouchableOpacity onPress={navigateToLogin}>
                                    <Text style={styles.linkText}>Sign in</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Personal Information */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Personal Information</Text>
                            
                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={styles.input}
                                        value={firstName}
                                        onChangeText={setFirstName}
                                    />
                                </View>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={styles.input}
                                        value={lastName}
                                        onChangeText={setLastName}
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Organization Email <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@company.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                                <Text style={styles.helperText}>Please use your organization email address</Text>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Admin Password <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                                <Text style={styles.helperText}>Minimum 8 characters, include uppercase, lowercase, and numbers</Text>
                            </View>
                            
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Confirm Admin Password <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        {/* Organization Information */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Organization Information</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Organization Name <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your business name"
                                    value={orgName}
                                    onChangeText={setOrgName}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Address Line 1 <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Street address"
                                    value={address1}
                                    onChangeText={setAddress1}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Address Line 2</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Apartment, suite, unit, etc. (optional)"
                                    value={address2}
                                    onChangeText={setAddress2}
                                />
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>City <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={styles.input}
                                        value={city}
                                        onChangeText={setCity}
                                    />
                                </View>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>State / Province <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={styles.input}
                                        value={state}
                                        onChangeText={setState}
                                    />
                                </View>
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>ZIP / Postal Code <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={styles.input}
                                        value={zipCode}
                                        onChangeText={setZipCode}
                                    />
                                </View>
                                <View style={[styles.formGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>Country <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={styles.input}
                                        value={country}
                                        onChangeText={setCountry}
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="(555) 123-4567"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        {/* Terms */}
                        <TouchableOpacity 
                            style={styles.termsAgreement} 
                            onPress={() => setTermsAccepted(!termsAccepted)}
                        >
                             <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                                {termsAccepted && <Ionicons name="checkmark" size={12} color="white" />}
                            </View>
                            <Text style={styles.termsText}>
                                I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>, and consent to receive emails about StockSense products and services.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnRegister} onPress={handleSignup}>
                            <Text style={styles.btnRegisterText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Benefits Section */}
                <View style={styles.benefitsSection}>
                    <View style={styles.benefitsContainer}>
                        <Text style={styles.benefitsTitle}>What you'll get with StockSense</Text>
                        <View style={styles.benefitsGrid}>
                            <View style={styles.benefitItem}>
                                <View style={styles.benefitIcon}>
                                    <Text style={{fontSize: 24}}>📊</Text>
                                </View>
                                <Text style={styles.benefitHeading}>AI-Powered Insights</Text>
                                <Text style={styles.benefitText}>Advanced predictive analytics that forecast stockouts and optimize reordering with 95% accuracy.</Text>
                            </View>
                            
                            <View style={styles.benefitItem}>
                                <View style={styles.benefitIcon}>
                                    <Text style={{fontSize: 24}}>💰</Text>
                                </View>
                                <Text style={styles.benefitHeading}>Cost Savings</Text>
                                <Text style={styles.benefitText}>Save an average of $15K monthly by reducing waste and optimizing inventory levels across your business.</Text>
                            </View>

                            <View style={styles.benefitItem}>
                                <View style={styles.benefitIcon}>
                                    <Text style={{fontSize: 24}}>🌱</Text>
                                </View>
                                <Text style={styles.benefitHeading}>Environmental Impact</Text>
                                <Text style={styles.benefitText}>Reduce food waste by 40% and contribute to a sustainable future while improving your bottom line.</Text>
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
        height: 300,
        backgroundColor: Colors.landing.primaryPurple,
        zIndex: 0,
    },
    nav: {
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 20,
        zIndex: 10,
        backgroundColor: Colors.landing.primaryPurple, 
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
    },
    mainContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 60,
        zIndex: 1,
    },
    registerContainer: {
        width: '100%',
        maxWidth: 600,
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
    registerHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.landing.black,
        marginBottom: 10,
        textAlign: 'center',
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
    formSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.landing.black,
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: Colors.landing.lightPurple,
    },
    formRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 5,
    },
    halfWidth: {
        flex: 1,
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
    required: {
        color: '#e74c3c',
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
    helperText: {
        fontSize: 13,
        color: '#666',
        marginTop: 5,
    },
    termsAgreement: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 25,
        // alignItems: 'flex-start',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#ccc',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: Colors.landing.primaryPurple,
        borderColor: Colors.landing.primaryPurple,
    },
    termsText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        flex: 1,
    },
    btnRegister: {
        width: '100%',
        padding: 15,
        backgroundColor: Colors.landing.primaryPurple,
        borderRadius: 6,
        alignItems: 'center',
    },
    btnRegisterText: {
        color: Colors.landing.white,
        fontSize: 16,
        fontWeight: '600',
    },
    benefitsSection: {
        backgroundColor: Colors.landing.white,
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    benefitsContainer: {
        maxWidth: 1200,
        alignSelf: 'center',
    },
    benefitsTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.landing.black,
        textAlign: 'center',
        marginBottom: 40,
    },
    benefitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 30,
    },
    benefitItem: {
        width: '30%',
        minWidth: 280,
        backgroundColor: Colors.landing.lightPurple,
        padding: 30,
        borderRadius: 8,
        alignItems: 'center',
    },
    benefitIcon: {
        width: 60,
        height: 60,
        backgroundColor: Colors.landing.primaryPurple,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    benefitHeading: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.landing.black,
        marginBottom: 10,
        textAlign: 'center',
    },
    benefitText: {
        color: '#555',
        lineHeight: 24,
        textAlign: 'center',
        fontSize: 15,
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
