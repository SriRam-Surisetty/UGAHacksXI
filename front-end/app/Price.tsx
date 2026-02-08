import React from 'react';
import { router, useRouter } from 'expo-router';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Dimensions,
    Platform,
    Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';

const { width } = Dimensions.get('window');

const pricingPlans = [
    {
        name: 'Starter',
        price: '$0',
        description: 'Perfect for small cafes starting their waste-reduction journey.',
        features: ['Up to 50 Inventory Items', 'Basic AI Forecasting', 'Daily Overview Reports', '1 Admin Account'],
        cta: 'Current Plan',
        highlighted: false,
        onPress: () => router.push('/Dashboard'),
    },
    {
        name: 'Professional',
        price: '$49',
        description: 'Advanced features for growing restaurants and busy kitchens.',
        features: ['Unlimited Inventory', 'Advanced ML Predictions', 'Priority Support', '5 Staff Accounts'],
        cta: 'Upgrade Now',
        highlighted: true,
        onPress: () => router.push('/Dashboard'),
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        description: 'Scalable solutions for large chains and industrial warehouses.',
        features: ['Multi-location Sync', 'Custom API Integration', 'Dedicated Account Manager', 'Custom ML Models', 'SSO Auth'],
        cta: 'Contact Sales',
        highlighted: false,
        onPress: () => router.push('/Support'),
    }
];

export default function PriceScreen() {
    const isWide = width >= 768;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <AuthHeader activeRoute="/Price" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <Text style={styles.title}>Simple, Transparent Pricing</Text>
                    <Text style={styles.subtitle}>
                        Choose the plan that best fits your business needs and start saving on waste today.
                    </Text>
                </View>

                <View style={[styles.plansGrid, isWide && styles.plansGridWide]}>
                    {pricingPlans.map((plan, index) => (
                        <View
                            key={index}
                            style={[
                                styles.planCard,
                                plan.highlighted && styles.highlightedCard,
                                isWide ? { width: '31%' } : { width: '100%' }
                            ]}
                        >
                            {plan.highlighted && (
                                <View style={styles.popularBadge}>
                                    <Text style={styles.popularText}>MOST POPULAR</Text>
                                </View>
                            )}

                            <Text style={[styles.planName, plan.highlighted && styles.whiteText]}>{plan.name}</Text>
                            <View style={styles.priceContainer}>
                                <Text style={[styles.planPrice, plan.highlighted && styles.whiteText]}>{plan.price}</Text>
                                {plan.price !== 'Custom' && <Text style={[styles.pricePeriod, plan.highlighted && styles.whiteText]}>/mo</Text>}
                            </View>
                            <Text style={[styles.planDescription, plan.highlighted && styles.whiteText]}>{plan.description}</Text>

                            <View style={styles.divider} />

                            <View style={styles.featuresList}>
                                {plan.features.map((feature, fIndex) => (
                                    <View key={fIndex} style={styles.featureRow}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color={plan.highlighted ? '#FFF' : Colors.landing.primaryPurple}
                                        />
                                        <Text style={[styles.featureText, plan.highlighted && styles.whiteText]}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.ctaButton,
                                    plan.highlighted ? styles.ctaWhite : styles.ctaPurple
                                ]}
                                onPress={plan.onPress}
                            >
                                <Text style={[
                                    styles.ctaButtonText,
                                    plan.highlighted ? styles.purpleText : styles.whiteText
                                ]}>
                                    {plan.cta}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <FloatingChatButton />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        paddingBottom: 40,
        alignItems: 'center',
    },
    headerSection: {
        paddingVertical: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.landing.black,
        textAlign: 'center',
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: 600,
        lineHeight: 24,
    },
    plansGrid: {
        width: '100%',
        paddingHorizontal: 20,
        gap: 20,
    },
    plansGridWide: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        maxWidth: 1200,
    },
    planCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 3 },
            web: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }
        }),
    },
    highlightedCard: {
        backgroundColor: Colors.landing.primaryPurple,
        borderColor: Colors.landing.primaryPurple,
        transform: [{ scale: 1.02 }],
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        backgroundColor: Colors.landing.accentPurple,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 99,
    },
    popularText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    planName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.landing.black,
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    planPrice: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.landing.black,
    },
    pricePeriod: {
        fontSize: 16,
        color: '#6B7280',
        marginLeft: 4,
    },
    planDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 20,
        height: 60,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 20,
        opacity: 0.5,
    },
    featuresList: {
        gap: 12,
        marginBottom: 32,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureText: {
        fontSize: 14,
        color: '#4B5563',
    },
    ctaButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 'auto',
    },
    ctaPurple: {
        backgroundColor: Colors.landing.primaryPurple,
    },
    ctaWhite: {
        backgroundColor: '#FFF',
    },
    ctaButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
    whiteText: { color: '#FFF' },
    purpleText: { color: Colors.landing.primaryPurple },
});