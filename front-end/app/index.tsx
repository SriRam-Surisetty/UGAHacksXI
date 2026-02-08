import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ScrollView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import FloatingChatButton from '@/components/FloatingChatButton';

const { width } = Dimensions.get('window');

// Mobile UI Component (iOS)
function MobileUI() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.backgroundBase} />
            <View style={styles.orbTop} />
            <View style={styles.orbBottom} />
            <View style={styles.gridOverlay} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.logo}>StockSense</Text>
                    <Link href="/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.loginLink}>Login</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

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

                <View style={styles.featuresSection}>
                    <Text style={styles.footerText}>Trusted by modern businesses</Text>
                    <View style={styles.footerLinks}>
                        <TouchableOpacity><Text style={styles.linkText}>Pricing</Text></TouchableOpacity>
                        <TouchableOpacity><Text style={styles.linkText}>Contact</Text></TouchableOpacity>
                        <TouchableOpacity><Text style={styles.linkText}>Terms</Text></TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <FloatingChatButton />
        </SafeAreaView>
    );
}

// Web UI Component (Desktop-optimized)
function WebUI() {
    return (
        <SafeAreaView style={styles.webContainer}>
            <ScrollView contentContainerStyle={styles.webScrollContent} showsVerticalScrollIndicator={false}>
                {/* Simple Header */}
                <View style={styles.webHeader}>
                    <Text style={styles.webLogo}>StockSense</Text>
                    <View style={styles.webNav}>
                        <Link href="/login" asChild>
                            <TouchableOpacity style={styles.webLoginButton}>
                                <Text style={styles.webLoginText}>Login</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                {/* Hero Section */}
                <View style={styles.webHero}>
                    <View style={styles.webBadge}>
                        <Text style={styles.webBadgeText}>✨ AI-POWERED INTELLIGENCE</Text>
                    </View>

                    <Text style={styles.webHeroTitle}>
                        The Future of <Text style={styles.webHeroTitleAccent}>Waste Prevention</Text>
                    </Text>

                    <Text style={styles.webHeroDescription}>
                        Harness advanced AI to predict stockouts, eliminate waste, and maximize profit.{'\n'}
                        Transform your inventory into intelligent, self-optimizing systems.
                    </Text>

                    <Link href="/signup" asChild>
                        <TouchableOpacity style={styles.webCTA}>
                            <Text style={styles.webCTAText}>Get Started Free</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </Link>

                    {/* Features Grid */}
                    <View style={styles.webFeaturesGrid}>
                        <View style={styles.webFeatureCard}>
                            <Ionicons name="analytics" size={32} color={Colors.landing.primaryPurple} />
                            <Text style={styles.webFeatureTitle}>Smart Analytics</Text>
                            <Text style={styles.webFeatureText}>Real-time insights powered by AI</Text>
                        </View>
                        <View style={styles.webFeatureCard}>
                            <Ionicons name="trending-up" size={32} color={Colors.landing.primaryPurple} />
                            <Text style={styles.webFeatureTitle}>Predictive Alerts</Text>
                            <Text style={styles.webFeatureText}>Prevent stockouts before they happen</Text>
                        </View>
                        <View style={styles.webFeatureCard}>
                            <Ionicons name="leaf" size={32} color={Colors.landing.primaryPurple} />
                            <Text style={styles.webFeatureTitle}>Waste Reduction</Text>
                            <Text style={styles.webFeatureText}>Minimize loss, maximize profit</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.webFooter}>
                    <Text style={styles.webFooterText}>Trusted by modern businesses worldwide</Text>
                    <View style={styles.webFooterLinks}>
                        <TouchableOpacity><Text style={styles.webFooterLink}>Pricing</Text></TouchableOpacity>
                        <Text style={styles.webFooterDivider}>•</Text>
                        <TouchableOpacity><Text style={styles.webFooterLink}>Contact</Text></TouchableOpacity>
                        <Text style={styles.webFooterDivider}>•</Text>
                        <TouchableOpacity><Text style={styles.webFooterLink}>Terms</Text></TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <FloatingChatButton />
        </SafeAreaView>
    );
}

export default function LandingPage() {
    const isWeb = Platform.OS === 'web';

    return isWeb ? <WebUI /> : <MobileUI />;
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

    // Web-specific styles (Desktop-optimized)
    webContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    webScrollContent: {
        paddingBottom: 60,
    },
    webHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 80,
        paddingVertical: 24,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    webLogo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.landing.primaryPurple,
    },
    webNav: {
        flexDirection: 'row',
        gap: 24,
    },
    webLoginButton: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.landing.primaryPurple,
    },
    webLoginText: {
        color: Colors.landing.primaryPurple,
        fontSize: 15,
        fontWeight: '600',
    },
    webHero: {
        alignItems: 'center',
        paddingHorizontal: 80,
        paddingVertical: 80,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
    },
    webBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.landing.lightPurple,
        marginBottom: 32,
    },
    webBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.landing.accentPurple,
        letterSpacing: 1.5,
    },
    webHeroTitle: {
        fontSize: 64,
        fontWeight: '800',
        color: Colors.landing.black,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 72,
    },
    webHeroTitleAccent: {
        color: Colors.landing.primaryPurple,
    },
    webHeroDescription: {
        fontSize: 20,
        color: '#666',
        textAlign: 'center',
        lineHeight: 32,
        marginBottom: 48,
        maxWidth: 700,
    },
    webCTA: {
        backgroundColor: Colors.landing.primaryPurple,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 36,
        paddingVertical: 18,
        borderRadius: 12,
        shadowColor: Colors.landing.primaryPurple,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 80,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        } as any),
    },
    webCTAText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    webFeaturesGrid: {
        flexDirection: 'row',
        gap: 32,
        width: '100%',
        maxWidth: 1000,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    webFeatureCard: {
        flex: 1,
        minWidth: 280,
        maxWidth: 320,
        backgroundColor: '#ffffff',
        padding: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    webFeatureTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.landing.black,
        marginTop: 16,
        marginBottom: 8,
    },
    webFeatureText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    webFooter: {
        alignItems: 'center',
        paddingVertical: 40,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 40,
    },
    webFooterText: {
        fontSize: 14,
        color: '#999',
        marginBottom: 16,
    },
    webFooterLinks: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    webFooterLink: {
        fontSize: 14,
        color: Colors.landing.primaryPurple,
        fontWeight: '500',
    },
    webFooterDivider: {
        fontSize: 14,
        color: '#ddd',
    },
});
