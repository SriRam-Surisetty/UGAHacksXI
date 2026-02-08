import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';

export default function Support() {
	const handleContactSupport = () => {
		console.log('Contact support clicked');
		// TODO: Implement contact support functionality
	};

	const handleFAQClick = (question: string) => {
		console.log('FAQ clicked:', question);
		// TODO: Implement FAQ expansion
	};

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
						<TouchableOpacity style={styles.contactCard}>
							<View style={styles.iconCircle}>
								<Ionicons name="mail-outline" size={24} color={Colors.landing.primaryPurple} />
							</View>
							<Text style={styles.contactTitle}>Email Support</Text>
							<Text style={styles.contactText}>support@stocksense.com</Text>
							<Text style={styles.responseTime}>Response in 24 hours</Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.contactCard}>
							<View style={styles.iconCircle}>
								<Ionicons name="chatbubble-outline" size={24} color={Colors.landing.primaryPurple} />
							</View>
							<Text style={styles.contactTitle}>Please Contact Us</Text>
							<Text style={styles.contactText}>Call: 123-456-7890</Text>
							<Text style={styles.responseTime}>9am - 6pm EST</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* FAQ Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

					<TouchableOpacity
						style={styles.faqCard}
						onPress={() => handleFAQClick('How do I add inventory items?')}
					>
						<View style={styles.faqHeader}>
							<Text style={styles.faqQuestion}>How do I add inventory items?</Text>
							<Ionicons name="chevron-forward" size={20} color={Colors.landing.accentPurple} />
						</View>
						<Text style={styles.faqPreview}>Learn how to quickly add and manage your inventory...</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.faqCard}
						onPress={() => handleFAQClick('How does AI forecasting work?')}
					>
						<View style={styles.faqHeader}>
							<Text style={styles.faqQuestion}>How does AI forecasting work?</Text>
							<Ionicons name="chevron-forward" size={20} color={Colors.landing.accentPurple} />
						</View>
						<Text style={styles.faqPreview}>Understand our AI-powered prediction system...</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.faqCard}
						onPress={() => handleFAQClick('How do I set up low stock alerts?')}
					>
						<View style={styles.faqHeader}>
							<Text style={styles.faqQuestion}>How do I set up low stock alerts?</Text>
							<Ionicons name="chevron-forward" size={20} color={Colors.landing.accentPurple} />
						</View>
						<Text style={styles.faqPreview}>Configure alerts to never run out of stock...</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.faqCard}
						onPress={() => handleFAQClick('Can I export my inventory data?')}
					>
						<View style={styles.faqHeader}>
							<Text style={styles.faqQuestion}>Can I export my inventory data?</Text>
							<Ionicons name="chevron-forward" size={20} color={Colors.landing.accentPurple} />
						</View>
						<Text style={styles.faqPreview}>Export your data in multiple formats...</Text>
					</TouchableOpacity>
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

						<TouchableOpacity style={styles.resourceCard}>
							<Ionicons name="people-outline" size={28} color={Colors.landing.primaryPurple} />
							<Text style={styles.resourceTitle}>Community</Text>
							<Text style={styles.resourceText}>Connect with users</Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.resourceCard}>
							<Ionicons name="code-slash-outline" size={28} color={Colors.landing.primaryPurple} />
							<Text style={styles.resourceTitle}>API Docs</Text>
							<Text style={styles.resourceText}>For developers</Text>
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