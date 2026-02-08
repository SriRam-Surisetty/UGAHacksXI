import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ScrollView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import FloatingChatButton from '@/components/FloatingChatButton';

const { width } = Dimensions.get('window');

export default function LandingPage() {

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.backgroundBase} />
            {/* Background Orbs */}
            <View style={styles.orbTop} />
            <View style={styles.orbBottom} />
            <View style={styles.gridOverlay} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Navigation Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>StockSense</Text>
                    <Link href="/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.loginLink}>Login</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>AI-Powered Intelligence</Text>
                    </View>

                    <Text style={styles.heroTitle}>
                        The Future of{'\n'}
                        <Text style={styles.heroTitleGradient}>Waste Prevention</Text>
                    </Text>

                    <Text style={styles.heroDescription}>
                        Harness advanced AI to predict stockouts, eliminate waste, and maximize profit. Transform your inventory into intelligent, self-optimizing systems.
                    </Text>

                    <View style={styles.buttonGroup}>
                        <Link href="/signup" asChild>
                            <TouchableOpacity style={styles.primaryButton}>
                                <Text style={styles.primaryButtonText}>Get Started Free</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                {/* Dashboard Preview (Abstract Representation) */}
                <View style={styles.previewContainer}>
                    <View style={styles.previewCard}>
                        <View style={styles.previewHeader}>
                            <View style={styles.previewDot} />
                            <View style={styles.previewDot} />
                            <View style={styles.previewDot} />
                        </View>
                        <View style={styles.previewContent}>
                            <Ionicons name="stats-chart" size={48} color={Colors.landing.primaryPurple} style={{ opacity: 0.2, marginBottom: 16 }} />
                            <Text style={styles.previewTitle}>Intelligence Dashboard</Text>
                            <Text style={styles.previewSubtitle}>Real-time analytics & predictions</Text>
                        </View>
                    </View>
                </View>

                {/* Features / Footer */}
                <View style={styles.featuresSection}>
                    <Text style={styles.footerText}>Trusted by modern businesses</Text>
                    <View style={styles.footerLinks}>
                        <TouchableOpacity><Text style={styles.linkText}>Pricing</Text></TouchableOpacity>
                        <TouchableOpacity><Text style={styles.linkText}>Contact</Text></TouchableOpacity>
                        <TouchableOpacity><Text style={styles.linkText}>Terms</Text></TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            {/* Floating Chat Button */}
            <FloatingChatButton />
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
        zIndex: -1,
    },
    orbTop: {
        position: 'absolute',
        top: -width * 0.5,
        right: -width * 0.2,
        width: width * 1.2,
        height: width * 1.2,
        borderRadius: width * 0.6,
        backgroundColor: Colors.landing.primaryPurple,
        opacity: 0.08,
        zIndex: -1,
    },
    orbBottom: {
        position: 'absolute',
        bottom: -width * 0.4,
        left: -width * 0.2,
        width: width,
        height: width,
        borderRadius: width * 0.5,
        backgroundColor: Colors.landing.accentPurple,
        opacity: 0.05,
        zIndex: -1,
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.02,
        zIndex: -1,
        borderWidth: 1, // Placeholder for grid texture if we had one
        borderColor: Colors.landing.primaryPurple,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.landing.primaryPurple,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    loginLink: {
        fontSize: 16,
        color: Colors.landing.primaryPurple,
        fontWeight: '600',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    badgeContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(52, 23, 85, 0.1)',
        marginBottom: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.landing.accentPurple,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 42,
        fontWeight: '800',
        color: Colors.landing.black,
        textAlign: 'center',
        lineHeight: 48,
        marginBottom: 16,
    },
    heroTitleGradient: {
        color: Colors.landing.primaryPurple,
    },
    heroDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        maxWidth: 300,
    },
    buttonGroup: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        backgroundColor: Colors.landing.primaryPurple,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: Colors.landing.primaryPurple,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(52, 23, 85, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    secondaryButtonText: {
        color: Colors.landing.primaryPurple,
        fontSize: 16,
        fontWeight: '600',
    },
    previewContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    previewCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(52, 23, 85, 0.1)',
        shadowColor: '#341755',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10,
    },
    previewHeader: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    previewDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#eaeaf4',
    },
    previewContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.landing.black,
        marginBottom: 4,
    },
    previewSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    featuresSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    footerText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 16,
    },
    footerLinks: {
        flexDirection: 'row',
        gap: 24,
    },
    linkText: {
        fontSize: 14,
        color: Colors.landing.primaryPurple,
        fontWeight: '500',
    },
});
