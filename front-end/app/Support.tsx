import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import { useState } from 'react';
import { useRouter } from 'expo-router'; // 1. Import useRouter


export default function Support() {
	const router = useRouter();
	const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

	const handleViewPlans = () => {
		console.log('Contact support clicked');
		router.push('/Price'); // 3. Redirect to Price.tsx
		// TODO: Implement contact support functionality
	};

	const handleFAQClick = (question: string) => {
		setExpandedFAQ(expandedFAQ === question ? null : question);
	};

	const faqData = [
		{
			question: 'How do I add inventory items?',
			preview: 'Learn how to quickly add and manage your inventory...',
			answer: 'To add inventory items, navigate to the Inventory page from the main menu. Click the "Add Item" button, fill in the required details such as item name, quantity, price, and category. You can also upload images and set reorder points. Once complete, click "Save" to add the item to your inventory.'
		},
		{
			question: 'How does AI forecasting work?',
			preview: 'Understand our AI-powered prediction system...',
			answer: 'Our AI forecasting system analyzes your historical sales data, seasonal trends, and market patterns to predict future inventory needs. It uses machine learning algorithms to identify patterns and provide accurate forecasts, helping you maintain optimal stock levels and reduce waste.'
		},
		{
			question: 'How do I set up low stock alerts?',
			preview: 'Configure alerts to never run out of stock...',
			answer: 'Go to Settings > Notifications and enable low stock alerts. For each inventory item, you can set a minimum threshold quantity. When stock falls below this level, you\'ll receive an automatic notification via email or push notification. You can customize alert preferences for different item categories.'
		},
		{
			question: 'Can I export my inventory data?',
			preview: 'Export your data in multiple formats...',
			answer: 'Yes! You can export your inventory data in multiple formats including CSV, Excel, and PDF. Go to the Inventory page, click the "Export" button, select your preferred format, and choose which data fields to include. You can also schedule automatic exports to run daily, weekly, or monthly.'
		}
	];

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar style="dark" />
			<AuthHeader activeRoute="/Support" />

			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
				<View style={styles.header}>
					<Text style={styles.title}>Support Center</Text>
					<Text style={styles.subtitle}>We are here to help you succeed with StockSense</Text>
				</View>

				{/* Quick Contact Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Get in Touch</Text>
					<View style={styles.contactGrid}>
						<View style={styles.contactCard}>
							<View style={styles.iconCircle}>
								<Ionicons name="mail-outline" size={24} color={Colors.landing.primaryPurple} />
							</View>
							<Text style={styles.contactTitle}>Email Support</Text>
							<TouchableOpacity style={styles.ctaButton} onPress={handleViewPlans}>
								<Text style={styles.ctaButtonText}>stocksense@mailanator.com</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.contactCard}>
							<View style={styles.iconCircle}>
								<Ionicons name="chatbubble-outline" size={24} color={Colors.landing.primaryPurple} />
							</View>
							<Text style={styles.contactTitle}>Please Contact us</Text>
							<Text style={styles.contactText}>555-123-4567</Text>
							<Text style={styles.responseTime}>9am - 6pm EST</Text>
						</View>
					</View>
				</View>

				{/* FAQ Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

					{faqData.map((faq, index) => {
						const isExpanded = expandedFAQ === faq.question;
						return (
							<TouchableOpacity
								key={index}
								style={styles.faqCard}
								onPress={() => handleFAQClick(faq.question)}
							>
								<View style={styles.faqHeader}>
									<Text style={styles.faqQuestion}>{faq.question}</Text>
									<Ionicons 
										name={isExpanded ? "chevron-down" : "chevron-forward"} 
										size={20} 
										color={Colors.landing.accentPurple} 
									/>
								</View>
								{!isExpanded && <Text style={styles.faqPreview}>{faq.preview}</Text>}
								{isExpanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
							</TouchableOpacity>
						);
					})}
				</View>

				{/* Resources Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Helpful Resources</Text>
					<View style={styles.resourcesGrid}>
						<TouchableOpacity style={styles.resourceCard}>
							<Ionicons name="book-outline" size={28} color={Colors.landing.primaryPurple} />
							<Text style={styles.resourceTitle}>Documentation</Text>
							<Text style={styles.resourceText}>Comprehensive guides</Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.resourceCard}>
							<Ionicons name="play-circle-outline" size={28} color={Colors.landing.primaryPurple} />
							<Text style={styles.resourceTitle}>Video Tutorials</Text>
							<Text style={styles.resourceText}>Step-by-step videos</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Contact Form CTA */}
				<View style={styles.ctaSection}>
					<Text style={styles.ctaTitle}>Want more features?</Text>
					<Text style={styles.ctaText}>Upgrade your plan today</Text>
					<TouchableOpacity style={styles.ctaButton} onPress={handleViewPlans}>
						<Text style={styles.ctaButtonText}>View plans</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.landing.white,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 40,
	},
	header: {
		paddingHorizontal: 24,
		paddingTop: 28,
		paddingBottom: 28,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	title: {
		fontSize: 26,
		fontWeight: '700',
		color: Colors.landing.black,
		marginBottom: 6,
		fontFamily: 'SpaceGrotesk_700Bold',
	},
	subtitle: {
		fontSize: 15,
		color: '#6b7280',
		lineHeight: 22,
	},
	section: {
		marginTop: 24,
		paddingHorizontal: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: Colors.landing.black,
		marginBottom: 16,
		fontFamily: 'SpaceGrotesk_700Bold',
	},
	contactGrid: {
		flexDirection: 'row',
		gap: 16,
	},
	contactCard: {
		flex: 1,
		backgroundColor: Colors.landing.white,
		borderRadius: 8,
		padding: 20,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderTopWidth: 3,
		borderTopColor: Colors.landing.primaryPurple,
	},
	iconCircle: {
		width: 48,
		height: 48,
		borderRadius: 10,
		backgroundColor: Colors.landing.lightPurple,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	contactTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: Colors.landing.black,
		marginBottom: 4,
		textAlign: 'center',
		fontFamily: 'SpaceGrotesk_700Bold',
	},
	contactText: {
		fontSize: 14,
		color: Colors.landing.accentPurple,
		marginBottom: 4,
		fontWeight: '600',
	},
	responseTime: {
		fontSize: 12,
		color: '#6a6a6a',
	},
	faqCard: {
		backgroundColor: Colors.landing.white,
		borderRadius: 8,
		padding: 16,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderLeftWidth: 3,
		borderLeftColor: Colors.landing.lightPurple,
	},
	faqHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 6,
	},
	faqQuestion: {
		fontSize: 15,
		fontWeight: '600',
		color: Colors.landing.black,
		flex: 1,
		fontFamily: 'SpaceGrotesk_600SemiBold',
	},
	faqPreview: {
		fontSize: 14,
		color: '#6a6a6a',
		lineHeight: 20,
	},
	faqAnswer: {
		fontSize: 14,
		color: '#4a4a4a',
		lineHeight: 22,
		marginTop: 8,
	},
	resourcesGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
	},
	resourceCard: {
		width: '48%',
		backgroundColor: Colors.landing.white,
		borderRadius: 8,
		padding: 20,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#e5e7eb',
	},
	resourceTitle: {
		fontSize: 14,
		fontWeight: '700',
		color: Colors.landing.black,
		marginTop: 10,
		marginBottom: 4,
		fontFamily: 'SpaceGrotesk_700Bold',
	},
	resourceText: {
		fontSize: 12,
		color: '#6a6a6a',
		textAlign: 'center',
	},
	ctaSection: {
		marginTop: 32,
		marginHorizontal: 24,
		backgroundColor: Colors.landing.primaryPurple,
		borderRadius: 10,
		padding: 28,
		alignItems: 'center',
	},
	ctaTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: Colors.landing.white,
		marginBottom: 8,
		fontFamily: 'SpaceGrotesk_700Bold',
	},
	ctaText: {
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.9)',
		marginBottom: 20,
		textAlign: 'center',
	},
	ctaButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.landing.white,
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 6,
		gap: 8,
	},
	ctaButtonText: {
		color: Colors.landing.primaryPurple,
		fontSize: 15,
		textAlign: 'center',
		fontWeight: '700',
		fontFamily: 'SpaceGrotesk_600SemiBold',
	},
});