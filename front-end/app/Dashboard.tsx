import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Dimensions, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import Svg, { Circle } from 'react-native-svg';

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

type Prediction = {
	ingName: string;
	category: string;
	unit: string;
	currentStock: number;
	avgDailyUsage: number;
	daysUntilStockout: number | null;
	reorderUrgency: 'out-of-stock' | 'critical' | 'warning' | 'ok';
	needsReorder: boolean;
	suggestedReorderQty: number | null;
	supplierLeadTimeDays: number;
};

type PredictionSummary = {
	totalIngredients: number;
	outOfStock: number;
	critical: number;
	warning: number;
	healthy: number;
	noUsageData: number;
	healthScore: number;
	supplierLeadTimeDays: number;
};

type PredictionData = {
	predictions: Prediction[];
	summary: PredictionSummary;
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

/* ---------- Radial Gauge ---------- */
function RadialGauge({ score, size = 110, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const progress = Math.max(0, Math.min(100, score));
	const strokeDashoffset = circumference - (progress / 100) * circumference;
	const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#c81d25';

	return (
		<View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
			<Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
				{/* Background track */}
				<Circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="rgba(255,255,255,0.2)"
					strokeWidth={strokeWidth}
					fill="none"
				/>
				{/* Progress arc */}
				<Circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={color}
					strokeWidth={strokeWidth}
					fill="none"
					strokeDasharray={`${circumference}`}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
				/>
			</Svg>
			{/* Centered label */}
			<View style={{ position: 'absolute', alignItems: 'center' }}>
				<Text style={styles.gaugeValue}>{score}</Text>
				<Text style={styles.gaugeLabel}>/100</Text>
			</View>
		</View>
	);
}

export default function Dashboard() {
	const isWide = width >= 900;
	const isMid = width >= 720;
	const router = useRouter();

	const [data, setData] = useState<DashboardData | null>(null);
	const [predictions, setPredictions] = useState<PredictionData | null>(null);
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
			const [dashRes, predRes] = await Promise.all([
				api.get('/dashboard'),
				api.get('/predict/stockouts').catch(() => null),
			]);
			setData(dashRes.data);
			if (predRes) setPredictions(predRes.data);
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

					{/* Inventory Health Score & Stockout Predictions */}
					{predictions && predictions.predictions.length > 0 && (
						<View style={[styles.predictionSection, isMid && styles.predictionSectionWide]}>
							{/* Reorder Suggestions – takes majority of space */}
							<View style={[styles.cardShell, { flex: 3 }]}>
								<View style={styles.cardHeader}>
									<View style={styles.cardHeaderLeft}>
										<Ionicons name="cart-outline" size={16} color={Colors.landing.primaryPurple} />
										<Text style={styles.cardHeaderTitle}>Reorder Suggestions</Text>
									</View>
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
										<View style={styles.leadTimeBadge}>
											<Ionicons name="time-outline" size={10} color="#6b3fa0" />
											<Text style={styles.leadTimeText}>
												{predictions.summary.supplierLeadTimeDays}d lead time
											</Text>
										</View>
										<TouchableOpacity
											style={styles.viewAllOrderBtn}
											onPress={() => router.push('/Order')}
										>
											<Text style={styles.viewAllOrderText}>Order Page</Text>
											<Ionicons name="arrow-forward" size={12} color={Colors.landing.primaryPurple} />
										</TouchableOpacity>
									</View>
								</View>
								<View style={styles.cardBody}>
									{predictions.predictions.filter(p => p.needsReorder).length === 0 ? (
										<View style={styles.emptyState}>
											<Ionicons name="checkmark-circle-outline" size={28} color="#22c55e" />
											<Text style={styles.emptyStateText}>All stock levels are healthy — no reorders needed!</Text>
										</View>
									) : (
										predictions.predictions.filter(p => p.needsReorder).slice(0, 6).map((pred, idx) => (
											<React.Fragment key={`${pred.ingName}-${pred.unit}`}>
												{idx > 0 && <View style={styles.divider} />}
												<TouchableOpacity
													style={styles.predRow}
													activeOpacity={0.7}
													onPress={() => router.push(`/Order?ingredient=${encodeURIComponent(pred.ingName)}&urgency=${pred.reorderUrgency}`)}
												>
													<View style={{ flex: 1 }}>
														<View style={styles.predTitleRow}>
															<Text style={styles.itemTitle}>{pred.ingName}</Text>
															<View style={[styles.urgencyBadge,
																pred.reorderUrgency === 'out-of-stock' ? styles.urgencyOOS
																	: pred.reorderUrgency === 'critical' ? styles.urgencyCritical
																		: styles.urgencyWarning
															]}>
																<Text style={[styles.urgencyText,
																	pred.reorderUrgency === 'out-of-stock' ? styles.urgencyTextOOS
																		: pred.reorderUrgency === 'critical' ? styles.urgencyTextCritical
																			: styles.urgencyTextWarning
																]}>
																	{pred.reorderUrgency === 'out-of-stock' ? 'OUT'
																		: pred.reorderUrgency === 'critical' ? 'CRITICAL' : 'LOW'}
																</Text>
															</View>
														</View>
														<Text style={styles.itemMeta}>
															{pred.currentStock} {pred.unit} remaining • {pred.avgDailyUsage} {pred.unit}/day
														</Text>
														{pred.daysUntilStockout !== null && pred.daysUntilStockout > 0 && (
															<Text style={styles.predDays}>
																~{pred.daysUntilStockout} days until stockout
															</Text>
														)}
													</View>
													{pred.suggestedReorderQty != null && pred.suggestedReorderQty > 0 && (
														<View style={styles.reorderQty}>
															<Text style={styles.reorderQtyLabel}>Order</Text>
															<Text style={styles.reorderQtyValue}>
																{pred.suggestedReorderQty}
															</Text>
															<Text style={styles.reorderQtyUnit}>{pred.unit}</Text>
														</View>
													)}
													<Ionicons name="chevron-forward" size={16} color="#d1d5db" style={{ marginLeft: 4 }} />
												</TouchableOpacity>
											</React.Fragment>
										))
									)}
								</View>
							</View>

							{/* Health Score Radial – compact side card */}
							<View style={[styles.healthScoreCard, isMid && { maxWidth: 200 }]}>
								<View style={styles.healthScoreHeader}>
									<Ionicons name="pulse-outline" size={16} color="#fff" />
									<Text style={styles.healthScoreTitle}>Health Score</Text>
								</View>
								<View style={styles.healthGaugeCenter}>
									<RadialGauge score={predictions.summary.healthScore} />
								</View>
								<View style={styles.healthScoreBreakdown}>
									{predictions.summary.outOfStock > 0 && (
										<View style={styles.healthScorePill}>
											<View style={[styles.pillDot, { backgroundColor: '#c81d25' }]} />
											<Text style={styles.pillText}>{predictions.summary.outOfStock} out</Text>
										</View>
									)}
									{predictions.summary.critical > 0 && (
										<View style={styles.healthScorePill}>
											<View style={[styles.pillDot, { backgroundColor: '#f59e0b' }]} />
											<Text style={styles.pillText}>{predictions.summary.critical} critical</Text>
										</View>
									)}
									{predictions.summary.warning > 0 && (
										<View style={styles.healthScorePill}>
											<View style={[styles.pillDot, { backgroundColor: '#fb923c' }]} />
											<Text style={styles.pillText}>{predictions.summary.warning} warning</Text>
										</View>
									)}
									<View style={styles.healthScorePill}>
										<View style={[styles.pillDot, { backgroundColor: '#22c55e' }]} />
										<Text style={styles.pillText}>{predictions.summary.healthy} healthy</Text>
									</View>
								</View>
							</View>
						</View>
					)}

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

						{/* Sidebar: quick actions */}
						<View style={styles.sidebar}>
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
	// Prediction / Reorder section
	predictionSection: {
		gap: 16,
		marginBottom: 20,
	},
	predictionSectionWide: {
		flexDirection: 'row',
	},
	healthScoreCard: {
		flex: 1,
		backgroundColor: Colors.landing.primaryPurple,
		borderRadius: 12,
		padding: 20,
		gap: 12,
		alignItems: 'center',
	},
	healthScoreHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		alignSelf: 'flex-start',
	},
	healthScoreTitle: {
		...fontBold,
		fontSize: 10,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 1.4,
		color: 'rgba(255,255,255,0.85)',
	},
	healthGaugeCenter: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 4,
	},
	gaugeValue: {
		...fontGroteskBold,
		fontSize: 28,
		fontWeight: '700',
		color: '#fff',
	},
	gaugeLabel: {
		...fontSemiBold,
		fontSize: 11,
		fontWeight: '600',
		color: 'rgba(255,255,255,0.5)',
		marginTop: -2,
	},
	healthScoreBreakdown: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 4,
	},
	healthScorePill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		backgroundColor: 'rgba(255,255,255,0.15)',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
	},
	pillDot: {
		width: 7,
		height: 7,
		borderRadius: 4,
	},
	pillText: {
		...fontSemiBold,
		fontSize: 10,
		fontWeight: '600',
		color: '#fff',
	},
	leadTimeBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: Colors.landing.lightPurple,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 999,
	},
	leadTimeText: {
		...fontSemiBold,
		fontSize: 9,
		fontWeight: '600',
		color: '#6b3fa0',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	predRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
	predTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 4,
	},
	urgencyBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 999,
		borderWidth: 1,
	},
	urgencyOOS: {
		backgroundColor: '#fdecec',
		borderColor: '#f5c2c7',
	},
	urgencyCritical: {
		backgroundColor: '#fff3df',
		borderColor: '#f5d3a9',
	},
	urgencyWarning: {
		backgroundColor: '#fff8ed',
		borderColor: '#fde5b1',
	},
	urgencyText: {
		...fontBold,
		fontSize: 8,
		fontWeight: '900',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
	},
	urgencyTextOOS: {
		color: '#b42318',
	},
	urgencyTextCritical: {
		color: '#b45309',
	},
	urgencyTextWarning: {
		color: '#c2780a',
	},
	predDays: {
		...fontMedium,
		fontSize: 10,
		color: '#b45309',
		fontWeight: '500',
		marginTop: 2,
	},
	reorderQty: {
		alignItems: 'center',
		backgroundColor: Colors.landing.lightPurple,
		borderRadius: 10,
		paddingHorizontal: 14,
		paddingVertical: 8,
		minWidth: 64,
	},
	reorderQtyLabel: {
		...fontSemiBold,
		fontSize: 8,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 1,
		color: '#6b3fa0',
		marginBottom: 2,
	},
	reorderQtyValue: {
		...fontGroteskBold,
		fontSize: 20,
		fontWeight: '700',
		color: Colors.landing.primaryPurple,
	},
	reorderQtyUnit: {
		...fontMedium,
		fontSize: 9,
		color: '#6b3fa0',
	},
	viewAllOrderBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	viewAllOrderText: {
		...fontBold,
		fontSize: 10,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 1.2,
		color: Colors.landing.primaryPurple,
		textDecorationLine: 'underline',
	},
});
