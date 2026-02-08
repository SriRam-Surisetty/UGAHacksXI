import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Dimensions, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';

const { width } = Dimensions.get('window');

type BatchInfo = {
	ingID: number;
	ingName: string;
	category?: string | null;
	expiry?: string | null;
	batchNum?: string | null;
	qty?: number | null;
	unit?: string | null;
};

type DashboardData = {
	orgName: string | null;
	counts: {
		ingredients: number;
		dishes: number;
		users: number;
		batches: number;
		healthy: number;
		expiring: number;
		expired: number;
	};
	expiringBatches: BatchInfo[];
	expiredBatches: BatchInfo[];
	categories: Record<string, number>;
};

function getTimeLeft(expiryStr: string): string {
	const now = new Date();
	const exp = new Date(expiryStr);
	const diffMs = exp.getTime() - now.getTime();
	const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
	if (diffHours < 0) return 'Expired';
	if (diffHours < 24) return `${diffHours}h left`;
	const days = Math.ceil(diffHours / 24);
	return `${days}d left`;
}

function getBadgeStyle(expiryStr: string) {
	const now = new Date();
	const exp = new Date(expiryStr);
	const diffMs = exp.getTime() - now.getTime();
	const diffHours = diffMs / (1000 * 60 * 60);
	if (diffHours < 0) return { bg: styles.badgeDanger, text: styles.badgeTextDanger };
	if (diffHours < 24) return { bg: styles.badgeDanger, text: styles.badgeTextDanger };
	return { bg: styles.badgeWarning, text: styles.badgeTextWarning };
}

export default function Dashboard() {
	const isWide = width >= 900;
	const isMid = width >= 720;

	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const today = useMemo(() => {
		const d = new Date();
		return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	}, []);

	useEffect(() => {
		fetchDashboard();
	}, []);

	const fetchDashboard = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.get('/dashboard');
			setData(res.data);
		} catch (err: any) {
			setError(err?.response?.data?.error || 'Failed to load dashboard');
		} finally {
			setLoading(false);
		}
	};

	const categoryEntries = useMemo(() => {
		if (!data?.categories) return [];
		return Object.entries(data.categories).sort((a, b) => b[1] - a[1]);
	}, [data]);

	const totalCategoryCount = useMemo(() => {
		return categoryEntries.reduce((sum, [, count]) => sum + count, 0);
	}, [categoryEntries]);

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<StatusBar style="dark" />
				<AuthHeader activeRoute="/Dashboard" />
				<View style={styles.centered}>
					<ActivityIndicator size="large" color={Colors.landing.primaryPurple} />
					<Text style={styles.loadingText}>Loading dashboard…</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error || !data) {
		return (
			<SafeAreaView style={styles.container}>
				<StatusBar style="dark" />
				<AuthHeader activeRoute="/Dashboard" />
				<View style={styles.centered}>
					<Ionicons name="warning-outline" size={40} color="#c81d25" />
					<Text style={styles.errorText}>{error || 'No data'}</Text>
					<TouchableOpacity onPress={fetchDashboard} style={styles.retryButton}>
						<Text style={styles.retryText}>Retry</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	const { counts, expiringBatches, expiredBatches } = data;
	const urgentBatches = [...expiredBatches, ...expiringBatches];

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar style="dark" />
			<AuthHeader activeRoute="/Dashboard" />

			<ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
				<View style={styles.contentWrapper}>
					{/* Page header */}
					<View style={styles.pageHeader}>
						<Text style={styles.pageTitle}>Daily Overview</Text>
						<Text style={styles.pageDate}>{today}</Text>
					</View>

					{/* KPI cards */}
					<View style={[styles.kpiRow, isMid && styles.kpiRowWide]}>
						<View style={[styles.kpiCard, { borderLeftColor: Colors.landing.primaryPurple }]}>
							<Ionicons name="restaurant-outline" size={20} color={Colors.landing.primaryPurple} />
							<Text style={styles.kpiValue}>{counts.dishes}</Text>
							<Text style={styles.kpiLabel}>Dishes</Text>
						</View>
						<View style={[styles.kpiCard, { borderLeftColor: '#6b3fa0' }]}>
							<Ionicons name="leaf-outline" size={20} color="#6b3fa0" />
							<Text style={styles.kpiValue}>{counts.ingredients}</Text>
							<Text style={styles.kpiLabel}>Ingredients</Text>
						</View>
						<View style={[styles.kpiCard, { borderLeftColor: '#22c55e' }]}>
							<Ionicons name="cube-outline" size={20} color="#22c55e" />
							<Text style={styles.kpiValue}>{counts.batches}</Text>
							<Text style={styles.kpiLabel}>Stock Batches</Text>
						</View>
						<View style={[styles.kpiCard, { borderLeftColor: '#3b82f6' }]}>
							<Ionicons name="people-outline" size={20} color="#3b82f6" />
							<Text style={styles.kpiValue}>{counts.users}</Text>
							<Text style={styles.kpiLabel}>Users</Text>
						</View>
					</View>

					{/* Main grid */}
					<View style={[styles.primaryGrid, isMid && styles.primaryGridWide]}>
						{/* Expiring / urgent batches */}
						<View style={styles.cardShell}>
							<View style={styles.cardHeader}>
								<View style={styles.cardHeaderLeft}>
									<View style={styles.alertDot} />
									<Text style={styles.cardHeaderTitle}>Expiring &amp; Expired Batches</Text>
								</View>
								<Link href="/Stock">
									<View style={styles.linkWrapper}>
										<Text style={styles.cardHeaderLink}>View Stock</Text>
										<Ionicons name="arrow-forward" size={12} color={Colors.landing.primaryPurple} />
									</View>
								</Link>
							</View>
							<View style={styles.cardBody}>
								{urgentBatches.length === 0 ? (
									<View style={styles.emptyState}>
										<Ionicons name="checkmark-circle-outline" size={28} color="#22c55e" />
										<Text style={styles.emptyStateText}>All stock is healthy — nothing expiring soon!</Text>
									</View>
								) : (
									urgentBatches.slice(0, 5).map((batch, idx) => (
										<React.Fragment key={batch.ingID}>
											{idx > 0 && <View style={styles.divider} />}
											<View style={styles.rowBetween}>
												<View style={{ flex: 1 }}>
													<Text style={styles.itemTitle}>{batch.ingName}</Text>
													<Text style={styles.itemMeta}>
														{batch.qty != null ? `${batch.qty} ${batch.unit || ''}` : 'No qty'} remaining
														{batch.batchNum ? (
															<Text style={styles.itemMetaStrong}> • Batch #{batch.batchNum}</Text>
														) : null}
													</Text>
												</View>
												{batch.expiry && (
													<View style={[styles.badge, getBadgeStyle(batch.expiry).bg]}>
														<Text style={[styles.badgeText, getBadgeStyle(batch.expiry).text]}>
															{getTimeLeft(batch.expiry)}
														</Text>
													</View>
												)}
											</View>
										</React.Fragment>
									))
								)}
							</View>
						</View>

						{/* Stock health summary */}
						<View style={styles.cardShell}>
							<View style={styles.cardHeader}>
								<View style={styles.cardHeaderLeft}>
									<View style={styles.iconCircle} />
									<Text style={styles.cardHeaderTitle}>Stock Health</Text>
								</View>
								<Link href="/Stock">
									<View style={styles.linkWrapper}>
										<Text style={styles.cardHeaderLink}>Manage Stock</Text>
										<Ionicons name="arrow-forward" size={12} color={Colors.landing.primaryPurple} />
									</View>
								</Link>
							</View>
							<View style={styles.cardBody}>
								<View style={styles.healthRow}>
									<View style={[styles.healthDot, { backgroundColor: '#22c55e' }]} />
									<Text style={styles.healthLabel}>Healthy</Text>
									<Text style={styles.healthValue}>{counts.healthy}</Text>
								</View>
								<View style={styles.divider} />
								<View style={styles.healthRow}>
									<View style={[styles.healthDot, { backgroundColor: '#f59e0b' }]} />
									<Text style={styles.healthLabel}>Expiring Soon</Text>
									<Text style={styles.healthValue}>{counts.expiring}</Text>
								</View>
								<View style={styles.divider} />
								<View style={styles.healthRow}>
									<View style={[styles.healthDot, { backgroundColor: '#c81d25' }]} />
									<Text style={styles.healthLabel}>Expired</Text>
									<Text style={styles.healthValue}>{counts.expired}</Text>
								</View>

								{counts.batches > 0 && (
									<>
										<View style={styles.divider} />
										<View style={styles.progressSection}>
											<Text style={styles.progressLabel}>
												{counts.batches > 0 ? Math.round((counts.healthy / counts.batches) * 100) : 0}% healthy
											</Text>
											<View style={styles.progressTrack}>
												<View
													style={[
														styles.progressSegment,
														{
															flex: counts.healthy,
															backgroundColor: '#22c55e',
															borderTopLeftRadius: 999,
															borderBottomLeftRadius: 999,
														},
													]}
												/>
												<View style={[styles.progressSegment, { flex: counts.expiring, backgroundColor: '#f59e0b' }]} />
												<View
													style={[
														styles.progressSegment,
														{
															flex: counts.expired,
															backgroundColor: '#c81d25',
															borderTopRightRadius: 999,
															borderBottomRightRadius: 999,
														},
													]}
												/>
											</View>
										</View>
									</>
								)}
							</View>
						</View>
					</View>

					{/* Secondary row */}
					<View style={[styles.secondaryGrid, isWide && styles.secondaryGridWide]}>
						{/* Categories breakdown */}
						<View style={[styles.cardShell, styles.cardLarge]}>
							<View style={styles.cardHeader}>
								<Text style={styles.cardHeaderTitle}>Ingredient Categories</Text>
								<Link href="/Inventory">
									<View style={styles.linkWrapper}>
										<Text style={styles.cardHeaderLink}>Manage Inventory</Text>
										<Ionicons name="arrow-forward" size={12} color={Colors.landing.primaryPurple} />
									</View>
								</Link>
							</View>
							<View style={styles.cardBody}>
								{categoryEntries.length === 0 ? (
									<View style={styles.emptyState}>
										<Text style={styles.emptyStateText}>No ingredient categories yet.</Text>
									</View>
								) : (
									categoryEntries.map(([cat, count], idx) => (
										<React.Fragment key={cat}>
											{idx > 0 && <View style={styles.divider} />}
											<View style={styles.categoryRow}>
												<View style={styles.categoryInfo}>
													<Text style={styles.categoryName}>{cat}</Text>
													<Text style={styles.categoryCount}>{count} ingredient{count !== 1 ? 's' : ''}</Text>
												</View>
												<View style={styles.categoryBarTrack}>
													<View
														style={[
															styles.categoryBarFill,
															{ width: `${totalCategoryCount > 0 ? (count / totalCategoryCount) * 100 : 0}%` },
														]}
													/>
												</View>
											</View>
										</React.Fragment>
									))
								)}
							</View>
						</View>

						{/* Sidebar: quick stats + actions */}
						<View style={styles.sidebar}>
							<View style={styles.cardShell}>
								<View style={styles.centeredBlock}>
									<Text style={styles.metricLabel}>Total Stock Batches</Text>
									<Text style={styles.metricValue}>{counts.batches}</Text>
									<View style={styles.progressTrack}>
										<View
											style={[
												styles.progressFill,
												{ width: counts.batches > 0 ? `${Math.round((counts.healthy / counts.batches) * 100)}%` : '0%' },
											]}
										/>
									</View>
									<Text style={styles.metricHint}>
										{counts.healthy} of {counts.batches} batches are in healthy condition.
									</Text>
									<Link href="/Inventory" style={styles.purpleButton}>
										<Text style={styles.purpleButtonText}>Manage Inventory</Text>
									</Link>
								</View>
							</View>

							<View style={styles.statusCard}>
								<Text style={styles.statusTitle}>Quick Actions</Text>
								<Link href="/Stock">
									<View style={styles.quickAction}>
										<Ionicons name="add-circle-outline" size={16} color={Colors.landing.primaryPurple} />
										<Text style={styles.quickActionText}>Add Stock Batch</Text>
									</View>
								</Link>
								<Link href="/Inventory">
									<View style={styles.quickAction}>
										<Ionicons name="create-outline" size={16} color={Colors.landing.primaryPurple} />
										<Text style={styles.quickActionText}>Create New Dish</Text>
									</View>
								</Link>
								<Link href="/Users">
									<View style={styles.quickAction}>
										<Ionicons name="person-add-outline" size={16} color={Colors.landing.primaryPurple} />
										<Text style={styles.quickActionText}>Manage Users</Text>
									</View>
								</Link>
							</View>
						</View>
					</View>
				</View>
			</ScrollView>

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

const baseFont = { fontFamily: fontFamilies.regular };
const fontMedium = { fontFamily: fontFamilies.medium };
const fontSemiBold = { fontFamily: fontFamilies.semiBold };
const fontBold = { fontFamily: fontFamilies.bold };
const fontGroteskBold = { fontFamily: fontFamilies.groteskBold };

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.landing.white,
	},
	centered: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		padding: 24,
	},
	loadingText: {
		...fontMedium,
		fontSize: 14,
		color: '#6f6f76',
		marginTop: 8,
	},
	errorText: {
		...fontMedium,
		fontSize: 14,
		color: '#c81d25',
		textAlign: 'center',
	},
	retryButton: {
		backgroundColor: Colors.landing.primaryPurple,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
		marginTop: 8,
	},
	retryText: {
		...fontBold,
		fontSize: 12,
		color: '#fff',
		textTransform: 'uppercase',
		letterSpacing: 1,
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
	// KPI row
	kpiRow: {
		gap: 12,
		marginBottom: 20,
	},
	kpiRowWide: {
		flexDirection: 'row',
	},
	kpiCard: {
		flex: 1,
		backgroundColor: Colors.landing.white,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderLeftWidth: 4,
		padding: 16,
		gap: 6,
	},
	kpiValue: {
		...fontGroteskBold,
		fontSize: 28,
		fontWeight: '700',
		color: Colors.landing.primaryPurple,
	},
	kpiLabel: {
		...fontSemiBold,
		fontSize: 11,
		fontWeight: '600',
		color: '#6f6f76',
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	// Primary grid
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
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#e5e7eb',
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
		textDecorationLine: 'underline',
	},
	linkWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
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
		backgroundColor: '#22c55e',
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
	// Health rows
	healthRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	healthDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	healthLabel: {
		...fontMedium,
		flex: 1,
		fontSize: 13,
		color: '#333',
	},
	healthValue: {
		...fontBold,
		fontSize: 16,
		fontWeight: '700',
		color: Colors.landing.primaryPurple,
	},
	progressSection: {
		gap: 8,
		marginTop: 4,
	},
	progressLabel: {
		...fontSemiBold,
		fontSize: 11,
		color: '#6f6f76',
	},
	progressTrack: {
		width: '100%',
		height: 6,
		borderRadius: 999,
		backgroundColor: Colors.landing.lightPurple,
		overflow: 'hidden',
		flexDirection: 'row',
	},
	progressSegment: {
		height: '100%',
	},
	progressFill: {
		height: '100%',
		backgroundColor: Colors.landing.primaryPurple,
		borderRadius: 999,
	},
	// Category rows
	categoryRow: {
		gap: 8,
	},
	categoryInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	categoryName: {
		...fontBold,
		fontSize: 13,
		fontWeight: '700',
		color: Colors.landing.black,
	},
	categoryCount: {
		...fontMedium,
		fontSize: 11,
		color: '#6f6f76',
	},
	categoryBarTrack: {
		width: '100%',
		height: 6,
		borderRadius: 999,
		backgroundColor: Colors.landing.lightPurple,
		overflow: 'hidden',
	},
	categoryBarFill: {
		height: '100%',
		backgroundColor: Colors.landing.primaryPurple,
		borderRadius: 999,
	},
	// Empty state
	emptyState: {
		alignItems: 'center',
		paddingVertical: 16,
		gap: 8,
	},
	emptyStateText: {
		...fontMedium,
		fontSize: 13,
		color: '#6f6f76',
		textAlign: 'center',
	},
	// Sidebar
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
		...fontGroteskBold,
		fontSize: 28,
		fontWeight: '700',
		color: Colors.landing.primaryPurple,
		marginBottom: 12,
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
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: 'center',
	},
	purpleButtonText: {
		...fontBold,
		fontSize: 11,
		fontWeight: '800',
		color: Colors.landing.white,
		textTransform: 'uppercase',
		letterSpacing: 1.2,
		textAlign: 'center',
	},
	statusCard: {
		backgroundColor: Colors.landing.lightPurple,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#e5e7eb',
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
	quickAction: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: Colors.landing.white,
	},
	quickActionText: {
		...fontSemiBold,
		fontSize: 12,
		color: Colors.landing.primaryPurple,
		fontWeight: '600',
	},
});
