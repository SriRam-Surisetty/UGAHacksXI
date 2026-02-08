import React, { useState } from 'react';
import { Dimensions, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';

const { width } = Dimensions.get('window');

export default function Dashboard() {
	const isWide = width >= 900;
	const isMid = width >= 720;

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar style="dark" />
			<AuthHeader activeRoute="/Dashboard" />

			<ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
				<View style={styles.contentWrapper}>
					<View style={styles.pageHeader}>
						<Text style={styles.pageTitle}>Daily Overview</Text>
						<Text style={styles.pageDate}>Saturday, February 7, 2026</Text>
					</View>

					<View style={[styles.primaryGrid, isMid && styles.primaryGridWide]}>
						<View style={styles.cardShell}>
							<View style={styles.cardHeader}>
								<View style={styles.cardHeaderLeft}>
									<View style={styles.alertDot} />
									<Text style={styles.cardHeaderTitle}>Use Now: Expiring Batches</Text>
								</View>
								<Text style={styles.cardHeaderLink}>Manage Inventory</Text>
							</View>
							<View style={styles.cardBody}>
								<View style={styles.rowBetween}>
									<View>
										<Text style={styles.itemTitle}>Fresh Basil Leaves</Text>
										<Text style={styles.itemMeta}>
											1.5 kg remaining • <Text style={styles.itemMetaStrong}>Batch #BTH-082</Text>
										</Text>
									</View>
									<View style={[styles.badge, styles.badgeDanger]}>
										<Text style={[styles.badgeText, styles.badgeTextDanger]}>18 Hours Left</Text>
									</View>
								</View>
								<View style={styles.divider} />
								<View style={styles.rowBetween}>
									<View>
										<Text style={styles.itemTitle}>Buffalo Mozzarella</Text>
										<Text style={styles.itemMeta}>
											12.0 kg remaining • <Text style={styles.itemMetaStrong}>Batch #BTH-002</Text>
										</Text>
									</View>
									<View style={[styles.badge, styles.badgeWarning]}>
										<Text style={[styles.badgeText, styles.badgeTextWarning]}>2 Days Left</Text>
									</View>
								</View>
							</View>
						</View>

						<View style={styles.cardShell}>
							<View style={styles.cardHeader}>
								<View style={styles.cardHeaderLeft}>
									<View style={styles.iconCircle} />
									<Text style={styles.cardHeaderTitle}>Restock: Low Inventory</Text>
								</View>
								<Text style={styles.cardHeaderLink}>Update Stock</Text>
							</View>
							<View style={styles.cardBody}>
								<View style={styles.rowBetween}>
									<View>
										<Text style={styles.itemTitle}>Double Zero Flour</Text>
										<Text style={styles.itemMeta}>
											12.0 kg left • <Text style={styles.itemMetaMuted}>Needs 38.0 kg</Text>
										</Text>
									</View>
									<View style={[styles.badge, styles.badgeDangerPlain]}>
										<Text style={[styles.badgeText, styles.badgeTextDanger]}>Critical</Text>
									</View>
								</View>
								<View style={styles.divider} />
								<View style={styles.rowBetween}>
									<View>
										<Text style={styles.itemTitle}>Extra Virgin Olive Oil</Text>
										<Text style={styles.itemMeta}>
											4.0 L left • <Text style={styles.itemMetaMuted}>Needs 6.0 L</Text>
										</Text>
									</View>
									<View style={[styles.badge, styles.badgeWarning]}>
										<Text style={[styles.badgeText, styles.badgeTextWarning]}>Warning</Text>
									</View>
								</View>
							</View>
						</View>
					</View>

					<View style={[styles.secondaryGrid, isWide && styles.secondaryGridWide]}>
						<View style={[styles.cardShell, styles.cardLarge]}>
							<View style={styles.cardHeader}>
								<Text style={styles.cardHeaderTitle}>Local Demand Signals</Text>
								<View style={styles.headerChip}>
									<View style={styles.statusDot} />
									<Text style={styles.headerChipText}>Athens, GA Feed</Text>
								</View>
							</View>
							<View style={styles.cardBody}>
								<View style={styles.demandItem}>
									<View style={styles.demandHeader}>
										<Text style={styles.demandTitle}>UGA Football Game Day</Text>
										<View style={styles.demandBadgeDark}>
											<Text style={styles.demandBadgeDarkText}>Extreme Traffic</Text>
										</View>
									</View>
									<Text style={styles.demandBody}>
										Tomorrow • 12:00 PM • 2.5 mi away. Expected 80,000+ fans. High demand for finger foods predicted.
									</Text>
									<View style={styles.primaryButton}>
										<Text style={styles.primaryButtonText}>View Prep Plan</Text>
									</View>
								</View>
								<View style={styles.divider} />
								<View style={styles.demandItem}>
									<View style={styles.demandHeader}>
										<Text style={styles.demandTitle}>Community Food Bank</Text>
										<View style={styles.demandBadgeLight}>
											<Text style={styles.demandBadgeLightText}>Donation Track</Text>
										</View>
									</View>
									<Text style={styles.demandBody}>
										Pickup Feb 9. Finalize list for batches expiring between Feb 10-12 to maximize CSR credit.
									</Text>
									<View style={styles.secondaryButton}>
										<Text style={styles.secondaryButtonText}>Draft List</Text>
									</View>
								</View>
							</View>
						</View>

						<View style={styles.sidebar}>
							<View style={styles.cardShell}>
								<View style={styles.centeredBlock}>
									<Text style={styles.metricLabel}>Recoverable Revenue</Text>
									<Text style={styles.metricValue}>$4,250.00</Text>
									<View style={styles.progressTrack}>
										<View style={styles.progressFill} />
									</View>
									<Text style={styles.metricHint}>
										85% of expiring value can be recovered through suggested specials.
									</Text>
									<View style={styles.purpleButton}>
										<Text style={styles.purpleButtonText}>Dish Ideas</Text>
									</View>
								</View>
							</View>

							<View style={styles.statusCard}>
								<Text style={styles.statusTitle}>System Status</Text>
								<View style={styles.statusRow}>
									<View style={styles.statusDot} />
									<Text style={styles.statusText}>
										Market pricing: <Text style={styles.statusBold}>Active</Text>
									</Text>
								</View>
								<View style={styles.statusRow}>
									<View style={styles.statusDot} />
									<Text style={styles.statusText}>
										Supply chain: <Text style={styles.statusBold}>Stable</Text>
									</Text>
								</View>
							</View>
						</View>
					</View>
				</View>
			</ScrollView>

			{/* Floating Chat Button */}
			<FloatingChatButton />
		</SafeAreaView>
	);
}

const fontFamilies = {
	regular: 'IBMPlexSans_400Regular',
	medium: 'IBMPlexSans_500Medium',
	semiBold: 'IBMPlexSans_600SemiBold',
	bold: 'IBMPlexSans_700Bold',
	groteskMedium: 'SpaceGrotesk_500Medium',
	groteskSemiBold: 'SpaceGrotesk_600SemiBold',
	groteskBold: 'SpaceGrotesk_700Bold',
};

const baseFont = {
	fontFamily: fontFamilies.regular,
};

const fontMedium = {
	fontFamily: fontFamilies.medium,
};

const fontSemiBold = {
	fontFamily: fontFamilies.semiBold,
};

const fontBold = {
	fontFamily: fontFamilies.bold,
};

const fontGroteskBold = {
	fontFamily: fontFamilies.groteskBold,
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.landing.lightPurple,
	},
	page: {
		paddingVertical: 32,
		paddingHorizontal: 24,
	},
	contentWrapper: {
		width: '100%',
		maxWidth: 1280,
		alignSelf: 'center',
	},
	pageHeader: {
		marginBottom: 20,
	},
	pageTitle: {
		...fontGroteskBold,
		fontSize: 24,
		fontWeight: '700',
		color: Colors.landing.primaryPurple,
		marginBottom: 6,
	},
	pageDate: {
		...fontSemiBold,
		fontSize: 12,
		color: '#6f6f76',
		fontWeight: '600',
	},
	primaryGrid: {
		gap: 16,
		marginBottom: 20,
	},
	primaryGridWide: {
		flexDirection: 'row',
	},
	secondaryGrid: {
		gap: 18,
	},
	secondaryGridWide: {
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	cardShell: {
		backgroundColor: Colors.landing.white,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: 'rgba(52, 23, 85, 0.08)',
		shadowColor: '#111111',
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 8 },
		shadowRadius: 16,
		elevation: 5,
		flex: 1,
	},
	cardLarge: {
		flex: 2,
	},
	cardHeader: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0, 0, 0, 0.06)',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	cardHeaderLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flexShrink: 1,
	},
	cardHeaderTitle: {
		...fontBold,
		fontSize: 12,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 1.6,
		color: Colors.landing.primaryPurple,
		flexShrink: 1,
	},
	cardHeaderLink: {
		...fontBold,
		fontSize: 10,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 1.4,
		color: Colors.landing.primaryPurple,
	},
	alertDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#c81d25',
	},
	iconCircle: {
		width: 14,
		height: 14,
		borderRadius: 7,
		backgroundColor: '#f3b16e',
	},
	cardBody: {
		padding: 20,
		gap: 14,
	},
	rowBetween: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
	itemTitle: {
		...fontBold,
		fontSize: 14,
		fontWeight: '700',
		color: Colors.landing.black,
		marginBottom: 4,
	},
	itemMeta: {
		...fontMedium,
		fontSize: 11,
		color: '#6f6f76',
		fontWeight: '500',
	},
	itemMetaStrong: {
		...fontBold,
		color: Colors.landing.primaryPurple,
		fontWeight: '700',
	},
	itemMetaMuted: {
		...fontBold,
		color: '#9a9aa1',
		fontStyle: 'italic',
		fontWeight: '700',
	},
	divider: {
		height: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.06)',
	},
	badge: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
		borderWidth: 1,
	},
	badgeDanger: {
		backgroundColor: '#fdecec',
		borderColor: '#f5c2c7',
	},
	badgeDangerPlain: {
		backgroundColor: '#fdecec',
		borderColor: 'transparent',
	},
	badgeWarning: {
		backgroundColor: '#fff3df',
		borderColor: '#f5d3a9',
	},
	badgeText: {
		...fontBold,
		fontSize: 9,
		fontWeight: '900',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
	},
	badgeTextDanger: {
		color: '#b42318',
	},
	badgeTextWarning: {
		color: '#b45309',
	},
	headerChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	statusDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#22c55e',
	},
	headerChipText: {
		...fontBold,
		fontSize: 9,
		fontWeight: '800',
		color: '#9a9aa1',
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	demandItem: {
		gap: 10,
	},
	demandHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
	demandTitle: {
		...fontGroteskBold,
		fontSize: 16,
		fontWeight: '700',
		color: Colors.landing.black,
		flexShrink: 1,
	},
	demandBody: {
		...baseFont,
		fontSize: 11,
		color: '#5f5f66',
		fontStyle: 'italic',
		lineHeight: 16,
	},
	demandBadgeDark: {
		backgroundColor: Colors.landing.primaryPurple,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
	},
	demandBadgeDarkText: {
		...fontBold,
		fontSize: 9,
		fontWeight: '900',
		color: Colors.landing.white,
		textTransform: 'uppercase',
		letterSpacing: 0.8,
	},
	demandBadgeLight: {
		backgroundColor: '#eaf7ef',
		borderWidth: 1,
		borderColor: '#c7e9d3',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
	},
	demandBadgeLightText: {
		...fontBold,
		fontSize: 9,
		fontWeight: '900',
		color: '#15803d',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
	},
	primaryButton: {
		alignSelf: 'flex-start',
		backgroundColor: Colors.landing.black,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 8,
	},
	primaryButtonText: {
		...fontBold,
		fontSize: 10,
		fontWeight: '800',
		color: Colors.landing.white,
		textTransform: 'uppercase',
		letterSpacing: 1.4,
	},
	secondaryButton: {
		alignSelf: 'flex-start',
		backgroundColor: Colors.landing.white,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#e0e0e0',
	},
	secondaryButtonText: {
		...fontBold,
		fontSize: 10,
		fontWeight: '800',
		color: '#5f5f66',
		textTransform: 'uppercase',
		letterSpacing: 1.4,
	},
	sidebar: {
		gap: 16,
		flex: 1,
	},
	centeredBlock: {
		alignItems: 'center',
		padding: 20,
	},
	metricLabel: {
		...fontBold,
		fontSize: 10,
		fontWeight: '900',
		letterSpacing: 3,
		textTransform: 'uppercase',
		color: '#9a9aa1',
		marginBottom: 8,
	},
	metricValue: {
		...fontBold,
		fontSize: 28,
		fontWeight: '700',
		color: Colors.landing.primaryPurple,
		marginBottom: 12,
	},
	progressTrack: {
		width: '100%',
		height: 6,
		borderRadius: 999,
		backgroundColor: Colors.landing.lightPurple,
		overflow: 'hidden',
		marginBottom: 12,
	},
	progressFill: {
		width: '85%',
		height: '100%',
		backgroundColor: Colors.landing.primaryPurple,
	},
	metricHint: {
		...fontMedium,
		fontSize: 11,
		color: '#6f6f76',
		textAlign: 'center',
		marginBottom: 16,
		lineHeight: 16,
	},
	purpleButton: {
		width: '100%',
		backgroundColor: Colors.landing.primaryPurple,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: 'center',
	},
	purpleButtonText: {
		...fontBold,
		fontSize: 11,
		fontWeight: '800',
		color: Colors.landing.white,
		textTransform: 'uppercase',
		letterSpacing: 1.2,
	},
	statusCard: {
		backgroundColor: 'rgba(234, 234, 244, 0.6)',
		borderRadius: 18,
		borderWidth: 1,
		borderColor: 'rgba(52, 23, 85, 0.12)',
		padding: 18,
		gap: 12,
	},
	statusTitle: {
		...fontBold,
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 1.6,
		color: Colors.landing.primaryPurple,
	},
	statusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	statusText: {
		...fontSemiBold,
		fontSize: 11,
		color: '#6f6f76',
		fontWeight: '600',
	},
	statusBold: {
		...fontBold,
		fontWeight: '800',
		color: Colors.landing.black,
	},
});
