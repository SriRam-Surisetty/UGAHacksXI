import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  SafeAreaView, 
  Platform, 
  Animated 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LandingPage = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const startY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(startY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const navigateToLogin = () => {
    router.push('/login');
  };

  const navigateToSignup = () => {
    // Assuming you have a signup route, otherwise push to login or register
     router.push('/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Navigation */}
      <View style={styles.nav}>
        <View style={styles.navContainer}>
            <View style={styles.logoContainer}>
                <Text style={styles.logoIcon}>◆</Text>
                <Text style={styles.logoText}>StockSense</Text>
            </View>
            
            <View style={styles.navActions}>
                <TouchableOpacity onPress={navigateToLogin} style={styles.navLoginBtn}>
                    <Text style={styles.navLoginText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={navigateToSignup} style={styles.navCtaBtn}>
                     <Text style={styles.navCtaText}>Get Started</Text>
                </TouchableOpacity>
            </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: startY }] }]}>
            <View style={styles.badge}>
                <Text style={styles.badgeIcon}>✦</Text>
                <Text style={styles.badgeText}>AI-Powered Intelligence</Text>
            </View>
            
            <Text style={styles.heroTitle}>The Future of</Text>
            <Text style={styles.heroTitleGradient}>Waste Prevention</Text>
            
            <Text style={styles.heroDescription}>
                Harness advanced AI to predict stockouts, eliminate waste, and maximize profit. Transform your inventory into intelligent, self-optimizing systems.
            </Text>

            <View style={styles.heroButtons}>
                <TouchableOpacity onPress={navigateToSignup} style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Start Free Trial</Text>
                    <Ionicons name="arrow-forward" size={20} color={Colors.landing.white} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryBtn}>
                    <Text style={styles.secondaryBtnText}>Watch Demo</Text>
                </TouchableOpacity>
            </View>

            {/* Dashboard Preview */}
            <View style={styles.dashboardPreview}>
                <View style={styles.dashboardHeader}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>
                <View style={styles.dashboardContent}>
                    <Text style={styles.dashboardLabel}>PREDICTIVE AI SYSTEM</Text>
                    <Text style={styles.dashboardTitle}>Intelligence Dashboard</Text>
                </View>
            </View>
        </Animated.View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
            <View style={styles.statCard}>
                <Text style={styles.statValue}>40%</Text>
                <Text style={styles.statLabel}>Waste Reduction</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statValue}>$15K</Text>
                <Text style={styles.statLabel}>Monthly Savings</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statValue}>95%</Text>
                <Text style={styles.statLabel}>AI Accuracy</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statValue}>2.5K+</Text>
                <Text style={styles.statLabel}>Active Users</Text>
            </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Advanced</Text>
                <Text style={styles.sectionTitleGradient}>AI Intelligence</Text>
                <Text style={styles.sectionDesc}>
                    Neural networks and machine learning algorithms that continuously optimize your inventory in real-time.
                </Text>
            </View>

            {/* Feature 1 */}
            <View style={styles.featureShowcase}>
                <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Predictive Forecasting</Text>
                    <Text style={styles.featureText}>
                        Advanced AI algorithms analyze millions of data points to predict stockouts with 95% accuracy.
                    </Text>
                    <TouchableOpacity onPress={navigateToSignup}>
                        <Text style={styles.featureLink}>Explore AI →</Text>
                    </TouchableOpacity>
                </View>
                 <View style={styles.featureVisual}>
                    <Text style={styles.featureIcon}>🧠</Text>
                    <Text style={styles.featureVisualLabel}>Neural Network</Text>
                </View>
            </View>

            {/* Feature 2 (Reverse on wide screens, same stack on mobile) */}
            <View style={styles.featureShowcase}>
                <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Live Inventory Intelligence</Text>
                    <Text style={styles.featureText}>
                        Watch your inventory levels update instantly across all touchpoints. Real-time data synchronization.
                    </Text>
                    <TouchableOpacity onPress={navigateToSignup}>
                        <Text style={styles.featureLink}>Start Tracking →</Text>
                    </TouchableOpacity>
                </View>
                 <View style={styles.featureVisual}>
                    <Text style={styles.featureIcon}>⚡</Text>
                    <Text style={styles.featureVisualLabel}>Real-Time Sync</Text>
                </View>
            </View>

             {/* Feature 3 */}
             <View style={styles.featureShowcase}>
                <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Smart Waste Detection</Text>
                    <Text style={styles.featureText}>
                        Machine learning identifies waste patterns and provides actionable recommendations.
                    </Text>
                    <TouchableOpacity onPress={navigateToSignup}>
                        <Text style={styles.featureLink}>View Analytics →</Text>
                    </TouchableOpacity>
                </View>
                 <View style={styles.featureVisual}>
                    <Text style={styles.featureIcon}>📊</Text>
                    <Text style={styles.featureVisualLabel}>Pattern Recognition</Text>
                </View>
            </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>Ready to Transform Your Business?</Text>
            <Text style={styles.ctaText}>
                Join thousands of SMB owners using AI to eliminate waste and boost profits.
            </Text>
            <TouchableOpacity onPress={navigateToSignup} style={styles.ctaBtn}>
                <Text style={styles.ctaBtnText}>Get Started Free</Text>
            </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
            <Text style={styles.footerBrand}>StockSense</Text>
            <Text style={styles.footerText}>© 2026 StockSense. All rights reserved.</Text>
        </View>

         <View style={{height: 100}} /> 
      </ScrollView>

      {/* Floating Chatbot Button (Cosmetic) */}
      <TouchableOpacity style={styles.chatbotBtn}>
         <Ionicons name="chatbubble-ellipses" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.landing.white,
  },
  scrollContent: {
    paddingTop: 80, // Space for fixed header
  },
  // Nav
  nav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 80,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52, 23, 85, 0.1)',
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1400,
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 20,
    color: Colors.landing.primaryPurple,
    marginRight: 5,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.landing.primaryPurple,
    letterSpacing: -0.5,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navLoginBtn: {
    marginRight: 15,
    padding: 8,
  },
  navLoginText: {
    color: Colors.landing.black,
    fontWeight: '600',
    fontSize: 15,
  },
  navCtaBtn: {
    backgroundColor: Colors.landing.primaryPurple,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  navCtaText: {
    color: Colors.landing.white,
    fontWeight: '600',
    fontSize: 15,
  },
  // Hero
  hero: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.landing.lightPurple,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(52, 23, 85, 0.2)',
    marginBottom: 20,
  },
  badgeIcon: {
    color: Colors.landing.primaryPurple,
    marginRight: 6,
    fontSize: 12,
  },
  badgeText: {
    color: Colors.landing.primaryPurple,
    fontWeight: '600',
    fontSize: 14,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.landing.black,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 48,
  },
  heroTitleGradient: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.landing.accentPurple, // Fallback for gradient
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 48,
    marginBottom: 20,
  },
  heroDescription: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 600,
    marginBottom: 30,
  },
  heroButtons: {
    flexDirection: 'column',
    width: '100%',
    gap: 15,
    marginBottom: 50,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.landing.primaryPurple,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.landing.primaryPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    minWidth: 200,
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: Colors.landing.white,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryBtn: {
    backgroundColor: Colors.landing.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    minWidth: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.landing.black,
    fontSize: 18,
    fontWeight: '600',
  },
  // Dashboard Preview
  dashboardPreview: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: Colors.landing.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 23, 85, 0.1)',
    shadowColor: Colors.landing.primaryPurple,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  dashboardHeader: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.landing.lightPurple,
    borderWidth: 1,
    borderColor: 'rgba(52, 23, 85, 0.2)',
  },
  dashboardContent: {
    backgroundColor: Colors.landing.softPurple,
    borderRadius: 16,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 23, 85, 0.1)',
  },
  dashboardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.landing.primaryPurple,
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.landing.primaryPurple,
  },
  // Stats
  statsSection: {
    backgroundColor: Colors.landing.softPurple,
    paddingVertical: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'center',
  },
  statCard: {
    backgroundColor: Colors.landing.white,
    padding: 20,
    borderRadius: 16,
    width: '45%', // 2 per row
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 23, 85, 0.1)',
    minWidth: 140,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.landing.primaryPurple,
    marginBottom: 5,
  },
  statLabel: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Features
  featuresSection: {
    padding: 20,
    paddingVertical: 60,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.landing.black,
    textAlign: 'center',
  },
  sectionTitleGradient: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.landing.accentPurple,
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionDesc: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  featureShowcase: {
    marginBottom: 60,
  },
  featureContent: {
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    color: Colors.landing.black,
  },
  featureText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 15,
  },
  featureLink: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.landing.primaryPurple,
  },
  featureVisual: {
    backgroundColor: Colors.landing.white,
    borderWidth: 1,
    borderColor: 'rgba(52, 23, 85, 0.1)',
    borderRadius: 20,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(52, 23, 85, 0.5)',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  featureIcon: {
    fontSize: 50,
    marginBottom: 10,
    opacity: 0.5,
  },
  featureVisualLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.landing.primaryPurple,
    opacity: 0.5,
  },
  // CTA
  ctaSection: {
    backgroundColor: Colors.landing.primaryPurple,
    padding: 40,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.landing.white,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 34,
  },
  ctaText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  ctaBtn: {
    backgroundColor: Colors.landing.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  ctaBtnText: {
    color: Colors.landing.primaryPurple,
    fontSize: 18,
    fontWeight: '600',
  },
  // Footer
  footer: {
    padding: 40,
    backgroundColor: Colors.landing.white,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 23, 85, 0.1)',
  },
  footerBrand: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.landing.primaryPurple,
    marginBottom: 10,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
  // Chatbot
  chatbotBtn: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.landing.primaryPurple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.landing.primaryPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default LandingPage;
