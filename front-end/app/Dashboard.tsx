import { Dimensions, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';

const { width } = Dimensions.get('window');

export default function Dashboard() {
	return (
		<SafeAreaView style={styles.container}>
			<StatusBar style="dark" />
			<View style={styles.backgroundBase}>
				<View style={styles.orbTop} />
				<View style={styles.orbBottom} />
				<View style={styles.gridOverlay} />
			</View>

			<AuthHeader activeRoute="/Dashboard" />

			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<Text style={styles.kicker}>Inventory intelligence</Text>
					<Text style={styles.title}>Dashboard</Text>
					<Text style={styles.subtitle}>Live snapshots of demand, waste risk, and restock health.</Text>
				</View>

				<View style={styles.cardGrid}>
					<View style={styles.card}>
						<Text style={styles.cardLabel}>At-risk items</Text>
						<Text style={styles.cardValue}>12</Text>
						<Text style={styles.cardHint}>Items predicted to expire soon.</Text>
					</View>
					<View style={styles.card}>
						<Text style={styles.cardLabel}>Restock alerts</Text>
						<Text style={styles.cardValue}>7</Text>
						<Text style={styles.cardHint}>Critical SKUs below reorder point.</Text>
					</View>
					<View style={styles.cardWide}>
						<Text style={styles.cardLabel}>Forecast signal</Text>
						<Text style={styles.cardValue}>High confidence</Text>
						<Text style={styles.cardHint}>Sales trends align with seasonal baselines.</Text>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.landing.softPurple,
	},
	backgroundBase: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: Colors.landing.softPurple,
	},
	orbTop: {
		position: 'absolute',
		top: -width * 0.3,
		left: -width * 0.15,
		width: width * 0.75,
		height: width * 0.75,
		borderRadius: width * 0.375,
		backgroundColor: Colors.landing.accentPurple,
		opacity: 0.18,
	},
	orbBottom: {
		position: 'absolute',
		bottom: -width * 0.4,
		right: -width * 0.2,
		width: width * 0.9,
		height: width * 0.9,
		borderRadius: width * 0.45,
		backgroundColor: Colors.landing.primaryPurple,
		opacity: 0.08,
	},
	gridOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'transparent',
		opacity: 0.06,
		borderTopWidth: 1,
		borderLeftWidth: 1,
		borderColor: Colors.landing.primaryPurple,
		transform: [{ rotate: '-1deg' }],
	},
	scrollContent: {
		paddingTop: Platform.OS === 'ios' ? 32 : 24,
		paddingBottom: 40,
		paddingHorizontal: 20,
	},
	header: {
		marginBottom: 24,
	},
	kicker: {
		textTransform: 'uppercase',
		letterSpacing: 2,
		fontSize: 12,
		fontWeight: '700',
		color: Colors.landing.accentPurple,
		marginBottom: 10,
	},
	title: {
		fontSize: 32,
		fontWeight: '700',
		color: Colors.landing.black,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 15,
		color: '#4a4a4a',
		maxWidth: 520,
	},
	cardGrid: {
		gap: 16,
	},
	card: {
		backgroundColor: Colors.landing.white,
		borderRadius: 18,
		padding: 18,
		borderWidth: 1,
		borderColor: 'rgba(52, 23, 85, 0.08)',
		shadowColor: '#111111',
		shadowOpacity: 0.16,
		shadowOffset: { width: 0, height: 14 },
		shadowRadius: 20,
		elevation: 8,
	},
	cardWide: {
		backgroundColor: Colors.landing.white,
		borderRadius: 18,
		padding: 20,
		borderWidth: 1,
		borderColor: 'rgba(52, 23, 85, 0.08)',
		shadowColor: '#111111',
		shadowOpacity: 0.16,
		shadowOffset: { width: 0, height: 14 },
		shadowRadius: 20,
		elevation: 8,
	},
	cardLabel: {
		fontSize: 13,
		textTransform: 'uppercase',
		letterSpacing: 1.4,
		color: '#5b4b7a',
		fontWeight: '700',
		marginBottom: 6,
	},
	cardValue: {
		fontSize: 26,
		fontWeight: '700',
		color: Colors.landing.black,
		marginBottom: 6,
	},
	cardHint: {
		fontSize: 13,
		color: '#4a4a4a',
	},
});
