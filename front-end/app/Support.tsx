import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import { useState } from 'react';

export default function Support() {
	const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

	const handleContactSupport = () => {
		console.log('Contact support clicked');
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
					<Text style={styles.subtitle}>We're here to help you succeed with StockSense</Text>
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
							<TouchableOpacity onPress={() => Linking.openURL('mailto:stocksense@mailinator.com')}>
								<Text style={styles.contactText}>stocksense@mailinator.com</Text>
							</TouchableOpacity>
							<Text style={styles.responseTime}>Response in 24 hours</Text>
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
					<Text style={styles.ctaTitle}>Still need help?</Text>
					<Text style={styles.ctaText}>Our support team is ready to assist you</Text>
					<TouchableOpacity style={styles.ctaButton} onPress={handleContactSupport}>
						<Text style={styles.ctaButtonText}>Contact Support</Text>
						<Ionicons name="arrow-forward" size={18} color={Colors.landing.white} />
					</TouchableOpacity>
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
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 40,
	},
	header: {
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 24,
		backgroundColor: Colors.landing.white,
	},
	title: {
		fontSize: 32,
		fontWeight: '700',
		color: Colors.landing.black,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#4a4a4a',
		lineHeight: 22,
	},
	section: {
		marginTop: 24,
		paddingHorizontal: 24,
	},
	sectionTitle: {
		fontSize: 22,
		fontWeight: '700',
		color: Colors.landing.black,
		marginBottom: 16,
	},
	contactGrid: {
		flexDirection: 'row',
		gap: 16,
	},
	contactCard: {
		flex: 1,
		backgroundColor: Colors.landing.white,
		borderRadius: 16,
		padding: 20,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(52, 23, 85, 0.08)',
		shadowColor: '#111111',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 3,
	},
	iconCircle: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: 'rgba(52, 23, 85, 0.08)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	contactTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: Colors.landing.black,
		marginBottom: 4,
		textAlign: 'center',
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
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: 'rgba(52, 23, 85, 0.08)',
	},
	faqHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 6,
	},
	faqQuestion: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.landing.black,
		flex: 1,
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
		borderRadius: 12,
		padding: 16,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(52, 23, 85, 0.08)',
	},
	resourceTitle: {
		fontSize: 14,
		fontWeight: '700',
		color: Colors.landing.black,
		marginTop: 8,
		marginBottom: 4,
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
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
	},
	ctaTitle: {
		fontSize: 22,
		fontWeight: '700',
		color: Colors.landing.white,
		marginBottom: 8,
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
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 12,
		gap: 8,
	},
	ctaButtonText: {
		color: Colors.landing.primaryPurple,
		fontSize: 16,
		fontWeight: '700',
	},
});