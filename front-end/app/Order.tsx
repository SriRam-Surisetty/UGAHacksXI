import React, { useEffect, useState, useMemo } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	Alert,
	Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import Svg, { Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

const { width } = Dimensions.get('window');

/* ---------- types ---------- */
type Vendor = {
	vendorName: string;
	rating: number;
	unitPrice: number;
	unit: string;
	minOrder: number;
	deliveryDays: number;
	sustainable: boolean;
	totalCost: number;
	qtyForTotal: number;
};

type ForecastDay = { day: number; projectedStock: number };

type OrderItem = {
	ingID: number;
	ingName: string;
	category: string;
	unit: string;
	currentStock: number;
	avgDailyUsage: number;
	daysUntilStockout: number | null;
	reorderUrgency: 'out-of-stock' | 'critical' | 'warning' | 'ok';
	needsReorder: boolean;
	suggestedQty: number;
	vendors: Vendor[];
	forecast: ForecastDay[];
};

type SelectedVendor = {
	ingName: string;
	vendorName: string;
	qty: number;
	unit: string;
	totalCost: number;
};

/* ---------- mini sparkline ---------- */
function MiniSparkline({ forecast, width: w = 120, height: h = 36 }: { forecast: ForecastDay[]; width?: number; height?: number }) {
	if (!forecast || forecast.length < 2) return null;
	const maxVal = Math.max(...forecast.map(f => f.projectedStock), 1);

	const points = forecast.map((f, i) => ({
		x: (i / (forecast.length - 1)) * (w - 8) + 4,
		y: h - 4 - ((f.projectedStock / maxVal) * (h - 8)),
	}));

	return (
		<Svg width={w} height={h}>
			<Defs>
				<LinearGradient id="spark" x1="0" y1="0" x2="1" y2="0">
					<Stop offset="0" stopColor={Colors.landing.primaryPurple} />
					<Stop offset="1" stopColor="#c81d25" />
				</LinearGradient>
			</Defs>
			{points.map((p, i) => {
				if (i === 0) return null;
				return (
					<Line
						key={i}
						x1={points[i - 1].x}
						y1={points[i - 1].y}
						x2={p.x}
						y2={p.y}
						stroke="url(#spark)"
						strokeWidth={2}
						strokeLinecap="round"
					/>
				);
			})}
			{points.map((p, i) => (
				<Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={2.5} fill={Colors.landing.primaryPurple} />
			))}
		</Svg>
	);
}

/* ---------- component ---------- */
export default function Order() {
	const isMid = width >= 720;

	// Optional filter from reorder suggestions
	const { ingredient } = useLocalSearchParams<{ ingredient?: string; urgency?: string }>();

	const [items, setItems] = useState<OrderItem[]>([]);
	const [leadTime, setLeadTime] = useState(3);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selected, setSelected] = useState<Record<string, SelectedVendor>>({});
	const [placing, setPlacing] = useState(false);
	const [activeTab, setActiveTab] = useState<'reorder' | 'all'>('reorder');
	const [expandedItem, setExpandedItem] = useState<string | null>(ingredient || null);

	useEffect(() => {
		fetchPricing();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchPricing = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.get('/vendors/pricing');
			setItems(res.data.items);
			setLeadTime(res.data.supplierLeadTimeDays);
			// If navigated from reorder, expand that ingredient
			if (ingredient) {
				setExpandedItem(ingredient);
				setActiveTab('reorder');
			}
		} catch (err: any) {
			setError(err?.response?.data?.error || 'Failed to load vendor pricing');
		} finally {
			setLoading(false);
		}
	};

	const filteredItems = useMemo(() => {
		const list = activeTab === 'reorder' ? items.filter(i => i.needsReorder) : items;
		return list;
	}, [items, activeTab]);

	const toggleVendor = (ingName: string, vendor: Vendor) => {
		setSelected(prev => {
			const key = ingName;
			if (prev[key]?.vendorName === vendor.vendorName) {
				const copy = { ...prev };
				delete copy[key];
				return copy;
			}
			return {
				...prev,
				[key]: {
					ingName,
					vendorName: vendor.vendorName,
					qty: vendor.qtyForTotal,
					unit: vendor.unit,
					totalCost: vendor.totalCost,
				},
			};
		});
	};

	const totalOrderCost = useMemo(() => {
		return Object.values(selected).reduce((s, v) => s + v.totalCost, 0);
	}, [selected]);

	const placeOrder = async () => {
		const orderItems = Object.values(selected);
		if (orderItems.length === 0) return;
		setPlacing(true);
		try {
			await api.post('/vendors/order', { items: orderItems });
			if (Platform.OS === 'web') {
				window.alert(`Order placed! ${orderItems.length} item(s) for $${totalOrderCost.toFixed(2)}`);
			} else {
				Alert.alert('Order Placed', `${orderItems.length} item(s) for $${totalOrderCost.toFixed(2)}`);
			}
			setSelected({});
		} catch (err: any) {
			const msg = err?.response?.data?.error || 'Failed to place order';
			if (Platform.OS === 'web') {
				window.alert(msg);
			} else {
				Alert.alert('Error', msg);
			}
		} finally {
			setPlacing(false);
		}
	};

	const urgencyColor = (u: string) => {
		switch (u) {
			case 'out-of-stock': return '#c81d25';
			case 'critical': return '#f59e0b';
			case 'warning': return '#fb923c';
			default: return '#22c55e';
		}
	};



	const priorityLevel = (u: string) => {
		switch (u) {
			case 'out-of-stock': return { label: 'P0 – Immediate', color: '#c81d25', bg: '#fdecec' };
			case 'critical': return { label: 'P1 – Urgent', color: '#b45309', bg: '#fff3df' };
			case 'warning': return { label: 'P2 – Plan Ahead', color: '#c2780a', bg: '#fff8ed' };
			default: return { label: 'P3 – Monitor', color: '#22c55e', bg: '#ecfdf5' };
		}
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<StatusBar style="dark" />
				<AuthHeader activeRoute="/Order" />
				<View style={styles.centered}>
					<ActivityIndicator size="large" color={Colors.landing.primaryPurple} />
					<Text style={styles.loadingText}>Loading vendor pricing…</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView style={styles.container}>
				<StatusBar style="dark" />
				<AuthHeader activeRoute="/Order" />
				<View style={styles.centered}>
					<Ionicons name="warning-outline" size={40} color="#c81d25" />
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity onPress={fetchPricing} style={styles.retryButton}>
						<Text style={styles.retryText}>Retry</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar style="dark" />
			<AuthHeader activeRoute="/Order" />

			<ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
				<View style={styles.contentWrapper}>
					{/* Header */}
					<View style={styles.pageHeader}>
						<View>
							<Text style={styles.pageTitle}>Order & Procurement</Text>
							<Text style={styles.pageSubtitle}>
								Compare vendors, track priority levels, and forecast demand
							</Text>
						</View>

						{/* Order summary bar */}
						{Object.keys(selected).length > 0 && (
							<View style={styles.orderBar}>
								<View style={styles.orderBarInfo}>
									<Ionicons name="cart" size={18} color="#fff" />
									<Text style={styles.orderBarText}>
										{Object.keys(selected).length} item{Object.keys(selected).length > 1 ? 's' : ''} · ${totalOrderCost.toFixed(2)}
									</Text>
								</View>
								<TouchableOpacity
									style={styles.orderBarButton}
									onPress={placeOrder}
									disabled={placing}
								>
									{placing ? (
										<ActivityIndicator size="small" color={Colors.landing.primaryPurple} />
									) : (
										<Text style={styles.orderBarButtonText}>Place Order</Text>
									)}
								</TouchableOpacity>
							</View>
						)}
					</View>

					{/* Tabs */}
					<View style={styles.tabRow}>
						<TouchableOpacity
							style={[styles.tab, activeTab === 'reorder' && styles.tabActive]}
							onPress={() => setActiveTab('reorder')}
						>
							<Ionicons name="alert-circle-outline" size={14} color={activeTab === 'reorder' ? '#fff' : Colors.landing.primaryPurple} />
							<Text style={[styles.tabText, activeTab === 'reorder' && styles.tabTextActive]}>
								Needs Reorder ({items.filter(i => i.needsReorder).length})
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.tab, activeTab === 'all' && styles.tabActive]}
							onPress={() => setActiveTab('all')}
						>
							<Ionicons name="list-outline" size={14} color={activeTab === 'all' ? '#fff' : Colors.landing.primaryPurple} />
							<Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
								All Ingredients ({items.length})
							</Text>
						</TouchableOpacity>
						<View style={styles.leadTimePill}>
							<Ionicons name="time-outline" size={12} color="#6b3fa0" />
							<Text style={styles.leadTimePillText}>{leadTime}d lead time</Text>
						</View>
					</View>

					{/* Items list */}
					{filteredItems.length === 0 ? (
						<View style={styles.emptyState}>
							<Ionicons name="checkmark-circle-outline" size={48} color="#22c55e" />
							<Text style={styles.emptyTitle}>All stocked up!</Text>
							<Text style={styles.emptySubtitle}>No reorders needed right now.</Text>
						</View>
					) : (
						<View style={styles.itemsList}>
							{filteredItems.map((item) => {
								const isExpanded = expandedItem === item.ingName;
								const priority = priorityLevel(item.reorderUrgency);
								const selectedVendor = selected[item.ingName];

								return (
									<View key={item.ingID} style={styles.itemCard}>
										{/* Item header */}
										<TouchableOpacity
											style={styles.itemHeader}
											onPress={() => setExpandedItem(isExpanded ? null : item.ingName)}
											activeOpacity={0.7}
										>
											<View style={{ flex: 1 }}>
												<View style={styles.itemTitleRow}>
													<Text style={styles.itemName}>{item.ingName}</Text>
													<View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
														<Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
													</View>
													{selectedVendor && (
														<View style={styles.selectedCheck}>
															<Ionicons name="checkmark-circle" size={16} color="#22c55e" />
														</View>
													)}
												</View>
												<View style={styles.itemMetaRow}>
													<Text style={styles.itemMeta}>
														{item.currentStock} {item.unit} left
													</Text>
													<Text style={styles.itemMetaDot}>•</Text>
													<Text style={styles.itemMeta}>
														{item.avgDailyUsage} {item.unit}/day
													</Text>
													{item.daysUntilStockout != null && (
														<>
															<Text style={styles.itemMetaDot}>•</Text>
															<Text style={[styles.itemMeta, { color: urgencyColor(item.reorderUrgency) }]}>
																{item.daysUntilStockout <= 0 ? 'Stocked out' : `~${item.daysUntilStockout}d left`}
															</Text>
														</>
													)}
												</View>
											</View>
											<Ionicons
												name={isExpanded ? 'chevron-up' : 'chevron-down'}
												size={20}
												color="#6b7280"
											/>
										</TouchableOpacity>

										{/* Expanded detail */}
										{isExpanded && (
											<View style={styles.itemDetail}>
												{/* Forecast mini chart */}
												<View style={styles.forecastSection}>
													<Text style={styles.sectionLabel}>7-Day Stock Forecast</Text>
													<View style={styles.forecastRow}>
														<MiniSparkline forecast={item.forecast} width={isMid ? 200 : 140} height={40} />
														<View style={styles.forecastLegend}>
															{item.forecast.filter((_, i) => i % 2 === 0 || i === item.forecast.length - 1).map(f => (
																<Text key={f.day} style={styles.forecastLabel}>
																	D{f.day}: {f.projectedStock} {item.unit}
																</Text>
															))}
														</View>
													</View>
													{item.suggestedQty > 0 && (
														<View style={styles.suggestedBox}>
															<Ionicons name="bulb-outline" size={14} color="#6b3fa0" />
															<Text style={styles.suggestedText}>
																Suggested order: <Text style={styles.suggestedBold}>{item.suggestedQty} {item.unit}</Text> (covers {leadTime * 2} days)
															</Text>
														</View>
													)}
												</View>

												{/* Vendor comparison */}
												<View style={styles.vendorSection}>
													<Text style={styles.sectionLabel}>Vendor Comparison</Text>
													<View style={[styles.vendorGrid, isMid && styles.vendorGridWide]}>
														{item.vendors.map((v, vi) => {
															const isSelected = selectedVendor?.vendorName === v.vendorName;
															const isCheapest = vi === 0;
															return (
																<TouchableOpacity
																	key={v.vendorName}
																	style={[
																		styles.vendorCard,
																		isSelected && styles.vendorCardSelected,
																		isCheapest && styles.vendorCardBest,
																	]}
																	onPress={() => toggleVendor(item.ingName, v)}
																	activeOpacity={0.7}
																>
																	{isCheapest && (
																		<View style={styles.bestBadge}>
																			<Text style={styles.bestBadgeText}>BEST PRICE</Text>
																		</View>
																	)}
																	{v.sustainable && (
																		<View style={styles.ecoBadge}>
																			<Ionicons name="leaf" size={10} color="#22c55e" />
																		</View>
																	)}
																	<Text style={styles.vendorName}>{v.vendorName}</Text>
																	<View style={styles.vendorStars}>
																		<Ionicons name="star" size={11} color="#f59e0b" />
																		<Text style={styles.vendorRating}>{v.rating}</Text>
																	</View>
																	<Text style={styles.vendorPrice}>
																		${v.unitPrice.toFixed(2)}
																		<Text style={styles.vendorPriceUnit}>/{v.unit}</Text>
																	</Text>
																	<View style={styles.vendorMeta}>
																		<Text style={styles.vendorMetaText}>
																			Min: {v.minOrder} {v.unit}
																		</Text>
																		<Text style={styles.vendorMetaText}>
																			{v.deliveryDays}d delivery
																		</Text>
																	</View>
																	<View style={styles.vendorTotal}>
																		<Text style={styles.vendorTotalLabel}>
																			{v.qtyForTotal} {v.unit}
																		</Text>
																		<Text style={styles.vendorTotalPrice}>
																			${v.totalCost.toFixed(2)}
																		</Text>
																	</View>
																	{isSelected && (
																		<View style={styles.vendorSelectedBar}>
																			<Ionicons name="checkmark" size={12} color="#fff" />
																			<Text style={styles.vendorSelectedText}>Selected</Text>
																		</View>
																	)}
																</TouchableOpacity>
															);
														})}
													</View>
												</View>
											</View>
										)}
									</View>
								);
							})}
						</View>
					)}
				</View>
			</ScrollView>

			<FloatingChatButton />
		</SafeAreaView>
	);
}

/* ---------- styles ---------- */
const fontFamilies = {
	regular: 'IBMPlexSans_400Regular',
	medium: 'IBMPlexSans_500Medium',
	semiBold: 'IBMPlexSans_600SemiBold',
	bold: 'IBMPlexSans_700Bold',
	groteskMedium: 'SpaceGrotesk_500Medium',
	groteskSemiBold: 'SpaceGrotesk_600SemiBold',
	groteskBold: 'SpaceGrotesk_700Bold',
};

const fontMedium = { fontFamily: fontFamilies.medium };
const fontSemiBold = { fontFamily: fontFamilies.semiBold };
const fontBold = { fontFamily: fontFamilies.bold };
const fontGroteskBold = { fontFamily: fontFamilies.groteskBold };

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.landing.white },
	centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
	loadingText: { ...fontMedium, fontSize: 14, color: '#6f6f76', marginTop: 8 },
	errorText: { ...fontMedium, fontSize: 14, color: '#c81d25', textAlign: 'center' },
	retryButton: { backgroundColor: Colors.landing.primaryPurple, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
	retryText: { ...fontBold, fontSize: 12, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },

	page: { paddingVertical: 32, paddingHorizontal: 24 },
	contentWrapper: { width: '100%', maxWidth: 1280, alignSelf: 'center' },

	/* Header */
	pageHeader: { marginBottom: 20, gap: 16 },
	pageTitle: { ...fontGroteskBold, fontSize: 24, fontWeight: '700', color: Colors.landing.primaryPurple, marginBottom: 4 },
	pageSubtitle: { ...fontMedium, fontSize: 13, color: '#6f6f76' },

	/* Order bar */
	orderBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: Colors.landing.primaryPurple,
		borderRadius: 12,
		paddingHorizontal: 18,
		paddingVertical: 12,
	},
	orderBarInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	orderBarText: { ...fontSemiBold, color: '#fff', fontSize: 14 },
	orderBarButton: {
		backgroundColor: '#fff',
		paddingHorizontal: 18,
		paddingVertical: 8,
		borderRadius: 8,
	},
	orderBarButtonText: { ...fontBold, color: Colors.landing.primaryPurple, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },

	/* Tabs */
	tabRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
	tab: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: Colors.landing.primaryPurple,
		backgroundColor: 'transparent',
	},
	tabActive: { backgroundColor: Colors.landing.primaryPurple },
	tabText: { ...fontSemiBold, fontSize: 12, color: Colors.landing.primaryPurple },
	tabTextActive: { color: '#fff' },
	leadTimePill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: Colors.landing.lightPurple,
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 999,
		marginLeft: 'auto',
	},
	leadTimePillText: { ...fontSemiBold, fontSize: 10, color: '#6b3fa0', textTransform: 'uppercase', letterSpacing: 0.6 },

	/* Empty */
	emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
	emptyTitle: { ...fontGroteskBold, fontSize: 20, color: Colors.landing.primaryPurple },
	emptySubtitle: { ...fontMedium, fontSize: 13, color: '#6f6f76' },

	/* Items list */
	itemsList: { gap: 12 },

	/* Item card */
	itemCard: {
		backgroundColor: Colors.landing.white,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		overflow: 'hidden',
	},
	itemHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 12,
	},
	itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
	itemName: { ...fontBold, fontSize: 15, color: Colors.landing.black },
	priorityBadge: {
		paddingHorizontal: 10,
		paddingVertical: 3,
		borderRadius: 999,
	},
	priorityText: { ...fontBold, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
	selectedCheck: { marginLeft: 4 },
	itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
	itemMeta: { ...fontMedium, fontSize: 12, color: '#6f6f76' },
	itemMetaDot: { ...fontMedium, fontSize: 12, color: '#d1d5db' },

	/* Expanded detail */
	itemDetail: {
		borderTopWidth: 1,
		borderTopColor: '#f3f4f6',
		padding: 20,
		gap: 24,
		backgroundColor: '#fafafa',
	},

	/* Forecast section */
	forecastSection: { gap: 10 },
	sectionLabel: { ...fontBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.4, color: Colors.landing.primaryPurple, marginBottom: 4 },
	forecastRow: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
	forecastLegend: { gap: 2 },
	forecastLabel: { ...fontMedium, fontSize: 10, color: '#6f6f76' },
	suggestedBox: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: Colors.landing.lightPurple,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 8,
		marginTop: 4,
	},
	suggestedText: { ...fontMedium, fontSize: 12, color: '#6b3fa0' },
	suggestedBold: { ...fontBold, fontWeight: '700' },

	/* Vendor section */
	vendorSection: { gap: 10 },
	vendorGrid: { gap: 10 },
	vendorGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
	vendorCard: {
		flex: 1,
		minWidth: 200,
		backgroundColor: '#fff',
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		padding: 16,
		gap: 6,
		position: 'relative',
	},
	vendorCardSelected: {
		borderColor: Colors.landing.primaryPurple,
		borderWidth: 2,
		backgroundColor: Colors.landing.lightPurple,
	},
	vendorCardBest: {
		borderColor: '#22c55e',
	},
	bestBadge: {
		position: 'absolute',
		top: -1,
		right: -1,
		backgroundColor: '#22c55e',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderBottomLeftRadius: 8,
		borderTopRightRadius: 9,
	},
	bestBadgeText: { ...fontBold, fontSize: 8, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.6 },
	ecoBadge: {
		position: 'absolute',
		top: 8,
		left: 8,
	},
	vendorName: { ...fontBold, fontSize: 13, color: Colors.landing.black, marginTop: 4 },
	vendorStars: { flexDirection: 'row', alignItems: 'center', gap: 3 },
	vendorRating: { ...fontSemiBold, fontSize: 11, color: '#6f6f76' },
	vendorPrice: { ...fontGroteskBold, fontSize: 22, color: Colors.landing.primaryPurple },
	vendorPriceUnit: { ...fontMedium, fontSize: 12, color: '#6f6f76' },
	vendorMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	vendorMetaText: { ...fontMedium, fontSize: 10, color: '#9ca3af' },
	vendorTotal: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderTopWidth: 1,
		borderTopColor: '#f3f4f6',
		paddingTop: 8,
		marginTop: 4,
	},
	vendorTotalLabel: { ...fontMedium, fontSize: 11, color: '#6f6f76' },
	vendorTotalPrice: { ...fontBold, fontSize: 15, color: Colors.landing.primaryPurple },
	vendorSelectedBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
		backgroundColor: Colors.landing.primaryPurple,
		borderRadius: 6,
		paddingVertical: 5,
		marginTop: 4,
	},
	vendorSelectedText: { ...fontBold, fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.8 },
});
