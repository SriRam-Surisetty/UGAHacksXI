import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import FloatingChatButton from '@/components/FloatingChatButton';

// Mobile UI Component (iOS)
function MobileUI() {
    return (
        <SafeAreaView style={styles.container}>
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
                        <Link href="/Price" asChild>
                            <TouchableOpacity>
                                <Text style={styles.webFooterLink}>Pricing</Text>
                            </TouchableOpacity>
                        </Link>                        <TouchableOpacity><Text style={styles.linkText}>Contact</Text></TouchableOpacity>
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
                {/* Header */}
                <View style={styles.webHeader}>
                    <View style={styles.webLogoRow}>
                        <View style={styles.webLogoMark} />
                        <Text style={styles.webLogo}>StockSense</Text>
                    </View>
                    <View style={styles.webNav}>
                        <Link href="/login" asChild>
                            <TouchableOpacity style={styles.webLoginButton}>
                                <Text style={styles.webLoginText}>Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                        <Link href="/signup" asChild>
                            <TouchableOpacity style={styles.webSignupButton}>
                                <Text style={styles.webSignupText}>Get Started</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                {/* Hero Section */}
                <View style={styles.webHero}>
                    <View style={styles.webBadge}>
                        <Ionicons name="sparkles" size={14} color={Colors.landing.accentPurple} />
                        <Text style={styles.webBadgeText}>AI-POWERED INTELLIGENCE</Text>
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
                            <View style={styles.webFeatureIconCircle}>
                                <Ionicons name="analytics" size={24} color={Colors.landing.primaryPurple} />
                            </View>
                            <Text style={styles.webFeatureTitle}>Smart Analytics</Text>
                            <Text style={styles.webFeatureText}>Real-time insights powered by machine learning to optimize every decision across your supply chain.</Text>
                        </View>
                        <View style={styles.webFeatureCard}>
                            <View style={styles.webFeatureIconCircle}>
                                <Ionicons name="trending-up" size={24} color={Colors.landing.primaryPurple} />
                            </View>
                            <Text style={styles.webFeatureTitle}>Predictive Alerts</Text>
                            <Text style={styles.webFeatureText}>Anticipate stockouts and demand shifts before they impact your bottom line.</Text>
                        </View>
                        <View style={styles.webFeatureCard}>
                            <View style={styles.webFeatureIconCircle}>
                                <Ionicons name="leaf" size={24} color={Colors.landing.primaryPurple} />
                            </View>
                            <Text style={styles.webFeatureTitle}>Waste Reduction</Text>
                            <Text style={styles.webFeatureText}>Intelligent expiry tracking and batch management to minimize loss and maximize margins.</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.webFooter}>
                    <Text style={styles.webFooterText}>Trusted by modern businesses worldwide</Text>
                    <View style={styles.webFooterLinks}>
                        <Link href="/Price" asChild>
                            <TouchableOpacity>
                                <Text style={styles.webFooterLink}>Pricing</Text>
                            </TouchableOpacity>
                        </Link>                        <Text style={styles.webFooterDivider}>•</Text>
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
        backgroundColor: '#ffffff',
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
        fontFamily: 'SpaceGrotesk_700Bold',
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
        backgroundColor: Colors.landing.lightPurple,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
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
        fontFamily: 'SpaceGrotesk_700Bold',
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
        borderRadius: 8,
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
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
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
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e5e7eb',
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
        fontFamily: 'SpaceGrotesk_700Bold',
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
        paddingVertical: 18,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    webLogoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    webLogoMark: {
        width: 10,
        height: 28,
        borderRadius: 3,
        backgroundColor: Colors.landing.primaryPurple,
    },
    webLogo: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.landing.primaryPurple,
        letterSpacing: -0.5,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    webNav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    webLoginButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
    },
    webLoginText: {
        color: Colors.landing.primaryPurple,
        fontSize: 15,
        fontWeight: '600',
    },
    webSignupButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
        backgroundColor: Colors.landing.primaryPurple,
    },
    webSignupText: {
        color: '#ffffff',
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: Colors.landing.lightPurple,
        borderWidth: 1,
        borderColor: 'rgba(107, 63, 160, 0.15)',
        marginBottom: 32,
    },
    webBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.landing.accentPurple,
        letterSpacing: 1.5,
    },
    webHeroTitle: {
        fontSize: 56,
        fontWeight: '800',
        color: Colors.landing.black,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 66,
        letterSpacing: -1,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    webHeroTitleAccent: {
        color: Colors.landing.primaryPurple,
    },
    webHeroDescription: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        lineHeight: 30,
        marginBottom: 48,
        maxWidth: 620,
    },
    webCTA: {
        backgroundColor: Colors.landing.primaryPurple,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 36,
        paddingVertical: 18,
        borderRadius: 8,
        marginBottom: 80,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        } as any),
    },
    webCTAText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'SpaceGrotesk_600SemiBold',
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
        maxWidth: 340,
        backgroundColor: '#ffffff',
        padding: 32,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderTopWidth: 3,
        borderTopColor: Colors.landing.primaryPurple,
        alignItems: 'flex-start',
    },
    webFeatureIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: Colors.landing.lightPurple,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    webFeatureTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.landing.black,
        marginTop: 16,
        marginBottom: 8,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    webFeatureText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'left',
        lineHeight: 22,
    },
    webFooter: {
        alignItems: 'center',
        paddingVertical: 40,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
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
