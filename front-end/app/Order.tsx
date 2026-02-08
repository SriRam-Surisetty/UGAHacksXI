import React, { useEffect, useState, useMemo } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	Modal,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
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
	unitPrice: number;
	totalCost: number;
};

type OrderLineItem = {
	lineNumber: number;
	ingredient: string;
	vendor: string;
	qty: number;
	unit: string;
	unitPrice: number;
	lineCost: number;
	batchNum: string;
	batchID: number | null;
	estimatedDelivery: string;
};

type OrderReceipt = {
	poNumber: string;
	placedAt: string;
	placedBy: string;
	estimatedDelivery: string;
	lineItems: OrderLineItem[];
	totalCost: number;
	itemCount: number;
	status: string;
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
	const [customQty, setCustomQty] = useState<Record<string, string>>({});
	const [placing, setPlacing] = useState(false);
	const [activeTab, setActiveTab] = useState<'reorder' | 'all'>('reorder');
	const [expandedItem, setExpandedItem] = useState<string | null>(ingredient || null);
	const [reviewOpen, setReviewOpen] = useState(false);
	const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

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
		return activeTab === 'reorder' ? items.filter(i => i.needsReorder) : items;
	}, [items, activeTab]);

	/* ---- qty helpers ---- */
	const getQtyForItem = (ingName: string, vendor: Vendor): number => {
		const custom = customQty[ingName];
		if (custom !== undefined && custom !== '') {
			const parsed = parseFloat(custom);
			if (!isNaN(parsed) && parsed > 0) return Math.max(parsed, vendor.minOrder);
		}
		return vendor.qtyForTotal;
	};

	const computeCost = (ingName: string, vendor: Vendor): number => {
		const qty = getQtyForItem(ingName, vendor);
		return Math.round(vendor.unitPrice * qty * 100) / 100;
	};

	const toggleVendor = (ingName: string, vendor: Vendor) => {
		setSelected(prev => {
			if (prev[ingName]?.vendorName === vendor.vendorName) {
				const copy = { ...prev };
				delete copy[ingName];
				return copy;
			}
			const qty = getQtyForItem(ingName, vendor);
			return {
				...prev,
				[ingName]: {
					ingName,
					vendorName: vendor.vendorName,
					qty,
					unit: vendor.unit,
					unitPrice: vendor.unitPrice,
					totalCost: Math.round(vendor.unitPrice * qty * 100) / 100,
				},
			};
		});
	};

	/* Recalculate selected costs when customQty changes */
	useEffect(() => {
		setSelected(prev => {
			const updated = { ...prev };
			let changed = false;
			for (const key of Object.keys(updated)) {
				const item = items.find(i => i.ingName === key);
				const vendor = item?.vendors.find(v => v.vendorName === updated[key].vendorName);
				if (!vendor) continue;
				const qty = getQtyForItem(key, vendor);
				const cost = Math.round(vendor.unitPrice * qty * 100) / 100;
				if (updated[key].qty !== qty || updated[key].totalCost !== cost) {
					updated[key] = { ...updated[key], qty, totalCost: cost };
					changed = true;
				}
			}
			return changed ? updated : prev;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [customQty]);

	const totalOrderCost = useMemo(() => {
		return Object.values(selected).reduce((s, v) => s + v.totalCost, 0);
	}, [selected]);

	const openReview = () => {
		if (Object.keys(selected).length === 0) return;
		setReviewOpen(true);
	};

	const exportPO = async (order: OrderReceipt) => {
		try {
			const res = await api.post('/vendors/order/export', order, { responseType: 'blob' });
			if (Platform.OS === 'web') {
				const blob = new Blob([res.data], { type: 'text/csv' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.setAttribute('download', `${order.poNumber}.csv`);
				document.body.appendChild(a);
				a.click();
				a.remove();
				window.URL.revokeObjectURL(url);
			} else {
				try {
					// @ts-ignore — optional native deps
					const FileSystem = await import('expo-file-system');
					// @ts-ignore
					const Sharing = await import('expo-sharing');
					const cacheDir = (FileSystem as any).cacheDirectory || '';
					const filePath = `${cacheDir}${order.poNumber}.csv`;
					const text: string = await new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onloadend = () => resolve(reader.result as string);
						reader.onerror = reject;
						reader.readAsText(res.data);
					});
					await (FileSystem as any).writeAsStringAsync(filePath, text);
					await (Sharing as any).shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: `Purchase Order ${order.poNumber}` });
				} catch {
					Alert.alert('Export Error', 'Sharing is not available on this device.');
				}
			}
		} catch {
			// Silently fail export — order is already placed
		}
	};

	const placeOrder = async () => {
		const orderItems = Object.values(selected);
		if (orderItems.length === 0) return;
		setPlacing(true);
		try {
			const res = await api.post('/vendors/order', { items: orderItems });
			const order: OrderReceipt = res.data.order;
			setReceipt(order);
			setReviewOpen(false);
			setSelected({});
			setCustomQty({});
			// Auto-export the PO sheet
			exportPO(order);
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
									onPress={openReview}
								>
									<Text style={styles.orderBarButtonText}>Review Order</Text>
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

												{/* Qty customisation */}
												<View style={styles.qtySection}>
													<Text style={styles.sectionLabel}>Order Quantity</Text>
													<View style={styles.qtyRow}>
														<View style={styles.qtyInputWrap}>
															<TextInput
																style={styles.qtyInput}
																keyboardType="numeric"
																placeholder={String(item.suggestedQty || item.vendors[0]?.qtyForTotal || 0)}
																placeholderTextColor="#a1a1aa"
																value={customQty[item.ingName] ?? ''}
																onChangeText={(val) => setCustomQty(prev => ({ ...prev, [item.ingName]: val }))}
															/>
															<Text style={styles.qtyUnit}>{item.unit}</Text>
														</View>
														{item.suggestedQty > 0 && (
															<TouchableOpacity
																style={styles.qtyPreset}
																onPress={() => setCustomQty(prev => ({ ...prev, [item.ingName]: String(item.suggestedQty) }))}
															>
																<Text style={styles.qtyPresetText}>Use suggested ({item.suggestedQty})</Text>
															</TouchableOpacity>
														)}
														{item.vendors[0] && (
															<TouchableOpacity
																style={styles.qtyPreset}
																onPress={() => setCustomQty(prev => ({ ...prev, [item.ingName]: String(item.vendors[0].minOrder) }))}
															>
																<Text style={styles.qtyPresetText}>Min order ({item.vendors[0].minOrder})</Text>
															</TouchableOpacity>
														)}
													</View>
												</View>

												{/* Vendor comparison */}
												<View style={styles.vendorSection}>
													<Text style={styles.sectionLabel}>Vendor Comparison</Text>
													<View style={[styles.vendorGrid, isMid && styles.vendorGridWide]}>
														{item.vendors.map((v, vi) => {
															const isSelected = selectedVendor?.vendorName === v.vendorName;
															const isCheapest = vi === 0;
															const displayQty = getQtyForItem(item.ingName, v);
															const displayCost = computeCost(item.ingName, v);
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
																			{displayQty} {v.unit}
																		</Text>
																		<Text style={styles.vendorTotalPrice}>
																			${displayCost.toFixed(2)}
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

			{/* ---- Order Review Modal ---- */}
			<Modal transparent visible={reviewOpen} animationType="fade" onRequestClose={() => setReviewOpen(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<ScrollView style={{ maxHeight: '80%' }} showsVerticalScrollIndicator={false}>
							<View style={styles.modalHeaderRow}>
								<Ionicons name="receipt-outline" size={22} color={Colors.landing.primaryPurple} />
								<Text style={styles.modalTitle}>Review Purchase Order</Text>
							</View>
							<View style={styles.reviewMeta}>
								<Text style={styles.reviewMetaText}>
									<Text style={styles.reviewMetaLabel}>Supplier lead time: </Text>{leadTime} day{leadTime > 1 ? 's' : ''}
								</Text>
								<Text style={styles.reviewMetaText}>
									<Text style={styles.reviewMetaLabel}>Line items: </Text>{Object.keys(selected).length}
								</Text>
							</View>
							<View style={styles.reviewTable}>
								<View style={styles.reviewTableHeader}>
									<Text style={[styles.reviewTh, { flex: 2 }]}>Item</Text>
									<Text style={[styles.reviewTh, { flex: 1.5 }]}>Vendor</Text>
									<Text style={[styles.reviewTh, { flex: 1, textAlign: 'right' }]}>Qty</Text>
									<Text style={[styles.reviewTh, { flex: 1, textAlign: 'right' }]}>Unit $</Text>
									<Text style={[styles.reviewTh, { flex: 1, textAlign: 'right' }]}>Total</Text>
								</View>
								{Object.values(selected).map((s, idx) => (
									<View key={idx} style={[styles.reviewTableRow, idx % 2 === 0 && styles.reviewTableRowAlt]}>
										<Text style={[styles.reviewTd, { flex: 2 }]} numberOfLines={1}>{s.ingName}</Text>
										<Text style={[styles.reviewTd, { flex: 1.5 }]} numberOfLines={1}>{s.vendorName}</Text>
										<Text style={[styles.reviewTd, { flex: 1, textAlign: 'right' }]}>{s.qty} {s.unit}</Text>
										<Text style={[styles.reviewTd, { flex: 1, textAlign: 'right' }]}>${s.unitPrice.toFixed(2)}</Text>
										<Text style={[styles.reviewTdBold, { flex: 1, textAlign: 'right' }]}>${s.totalCost.toFixed(2)}</Text>
									</View>
								))}
							</View>
							<View style={styles.reviewTotalRow}>
								<Text style={styles.reviewTotalLabel}>Order Total</Text>
								<Text style={styles.reviewTotalValue}>${totalOrderCost.toFixed(2)}</Text>
							</View>
						</ScrollView>
						<View style={styles.reviewActions}>
							<TouchableOpacity style={styles.reviewConfirmBtn} onPress={placeOrder} disabled={placing}>
								{placing ? (
									<ActivityIndicator size="small" color="#fff" />
								) : (
									<>
										<Ionicons name="checkmark-circle" size={16} color="#fff" />
										<Text style={styles.reviewConfirmText}>Confirm & Place Order</Text>
									</>
								)}
							</TouchableOpacity>
							<TouchableOpacity style={styles.reviewCancelBtn} onPress={() => setReviewOpen(false)}>
								<Text style={styles.reviewCancelText}>Back to Editing</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* ---- Order Receipt Modal ---- */}
			<Modal transparent visible={receipt !== null} animationType="fade" onRequestClose={() => setReceipt(null)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<ScrollView style={{ maxHeight: '80%' }} showsVerticalScrollIndicator={false}>
							<View style={styles.receiptHeader}>
								<View style={styles.receiptCheckCircle}>
									<Ionicons name="checkmark" size={32} color="#fff" />
								</View>
								<Text style={styles.receiptTitle}>Order Confirmed</Text>
								<Text style={styles.receiptSubtitle}>Your purchase order has been exported as a CSV</Text>
							</View>
							{receipt && (
								<View style={styles.receiptBody}>
									<View style={styles.receiptInfoGrid}>
										<View style={styles.receiptInfoItem}>
											<Text style={styles.receiptInfoLabel}>PO Number</Text>
											<Text style={styles.receiptInfoValue}>{receipt.poNumber}</Text>
										</View>
										<View style={styles.receiptInfoItem}>
											<Text style={styles.receiptInfoLabel}>Status</Text>
											<View style={styles.receiptStatusBadge}>
												<Ionicons name="time-outline" size={10} color="#22c55e" />
												<Text style={styles.receiptStatusText}>{receipt.status}</Text>
											</View>
										</View>
										<View style={styles.receiptInfoItem}>
											<Text style={styles.receiptInfoLabel}>Placed</Text>
											<Text style={styles.receiptInfoValue}>
												{new Date(receipt.placedAt).toLocaleString()}
											</Text>
										</View>
										<View style={styles.receiptInfoItem}>
											<Text style={styles.receiptInfoLabel}>Est. Delivery</Text>
											<Text style={styles.receiptInfoValue}>{receipt.estimatedDelivery}</Text>
										</View>
										<View style={styles.receiptInfoItem}>
											<Text style={styles.receiptInfoLabel}>Ordered By</Text>
											<Text style={styles.receiptInfoValue}>{receipt.placedBy}</Text>
										</View>
										<View style={styles.receiptInfoItem}>
											<Text style={styles.receiptInfoLabel}>Total</Text>
											<Text style={[styles.receiptInfoValue, { color: Colors.landing.primaryPurple, fontWeight: '800' }]}>
												${receipt.totalCost.toFixed(2)}
											</Text>
										</View>
									</View>
									<View style={styles.receiptLineItems}>
										<Text style={styles.receiptLineItemsTitle}>Line Items</Text>
										{receipt.lineItems.map((li) => (
											<View key={li.lineNumber} style={styles.receiptLine}>
												<View style={{ flex: 1 }}>
													<Text style={styles.receiptLineName}>{li.ingredient}</Text>
													<Text style={styles.receiptLineMeta}>
														{li.vendor} · Batch {li.batchNum}
													</Text>
												</View>
												<View style={{ alignItems: 'flex-end' }}>
													<Text style={styles.receiptLineQty}>{li.qty} {li.unit}</Text>
													<Text style={styles.receiptLineCost}>${li.lineCost.toFixed(2)}</Text>
												</View>
											</View>
										))}
									</View>
								</View>
							)}
						</ScrollView>
						<View style={styles.reviewActions}>
							<TouchableOpacity
								style={styles.exportBtn}
								onPress={() => receipt && exportPO(receipt)}
							>
								<Ionicons name="download-outline" size={14} color={Colors.landing.primaryPurple} />
								<Text style={styles.exportBtnText}>Download PO Again</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.reviewConfirmBtn}
								onPress={() => { setReceipt(null); fetchPricing(); }}
							>
								<Ionicons name="checkmark" size={14} color="#fff" />
								<Text style={styles.reviewConfirmText}>Done</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

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

	/* Qty customisation */
	qtySection: { gap: 8 },
	qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
	qtyInputWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 8,
		backgroundColor: '#fff',
		paddingHorizontal: 12,
		paddingVertical: 6,
		gap: 6,
		minWidth: 120,
	},
	qtyInput: { ...fontSemiBold, fontSize: 16, color: '#111827', minWidth: 60, paddingVertical: 2, outlineStyle: 'none' as any },
	qtyUnit: { ...fontMedium, fontSize: 12, color: '#6f6f76' },
	qtyPreset: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
		backgroundColor: Colors.landing.lightPurple,
	},
	qtyPresetText: { ...fontSemiBold, fontSize: 11, color: '#6b3fa0' },

	/* Modal shared */
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	modalCard: {
		width: '100%',
		maxWidth: 620,
		maxHeight: '90%',
		backgroundColor: Colors.landing.white,
		borderRadius: 14,
		padding: 24,
	},
	modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
	modalTitle: { ...fontGroteskBold, fontSize: 20, color: Colors.landing.primaryPurple },

	/* Review modal */
	reviewMeta: { flexDirection: 'row', gap: 20, marginBottom: 16, flexWrap: 'wrap' },
	reviewMetaText: { ...fontMedium, fontSize: 12, color: '#6f6f76' },
	reviewMetaLabel: { ...fontSemiBold, color: '#374151' },
	reviewTable: {
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 8,
		overflow: 'hidden',
		marginBottom: 16,
	},
	reviewTableHeader: {
		flexDirection: 'row',
		backgroundColor: '#f9fafb',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	reviewTh: { ...fontBold, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8 },
	reviewTableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
	reviewTableRowAlt: { backgroundColor: '#fafafa' },
	reviewTd: { ...fontMedium, fontSize: 12, color: '#374151' },
	reviewTdBold: { ...fontBold, fontSize: 12, color: Colors.landing.primaryPurple },
	reviewTotalRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderTopWidth: 2,
		borderTopColor: Colors.landing.primaryPurple,
		paddingTop: 12,
		marginBottom: 8,
	},
	reviewTotalLabel: { ...fontGroteskBold, fontSize: 16, color: '#111827' },
	reviewTotalValue: { ...fontGroteskBold, fontSize: 22, color: Colors.landing.primaryPurple },
	reviewActions: { gap: 8, marginTop: 12 },
	reviewConfirmBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: Colors.landing.primaryPurple,
		borderRadius: 10,
		paddingVertical: 14,
	},
	reviewConfirmText: { ...fontBold, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
	reviewCancelBtn: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 10,
	},
	reviewCancelText: { ...fontSemiBold, fontSize: 12, color: '#6b7280' },

	/* Export button */
	exportBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		borderWidth: 1.5,
		borderColor: Colors.landing.primaryPurple,
		borderRadius: 10,
		paddingVertical: 12,
		backgroundColor: '#fff',
	},
	exportBtnText: { ...fontBold, fontSize: 12, color: Colors.landing.primaryPurple, textTransform: 'uppercase', letterSpacing: 1 },

	/* Receipt modal */
	receiptHeader: { alignItems: 'center', marginBottom: 20, gap: 8 },
	receiptCheckCircle: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: '#22c55e',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 4,
	},
	receiptTitle: { ...fontGroteskBold, fontSize: 22, color: '#111827' },
	receiptSubtitle: { ...fontMedium, fontSize: 13, color: '#6f6f76' },
	receiptBody: { gap: 16 },
	receiptInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
	receiptInfoItem: {
		minWidth: 140,
		flex: 1,
		backgroundColor: '#f9fafb',
		borderRadius: 8,
		padding: 12,
		gap: 4,
	},
	receiptInfoLabel: { ...fontSemiBold, fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },
	receiptInfoValue: { ...fontBold, fontSize: 14, color: '#111827' },
	receiptStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
	receiptStatusText: { ...fontBold, fontSize: 12, color: '#22c55e', textTransform: 'uppercase' },
	receiptLineItems: { gap: 8 },
	receiptLineItemsTitle: { ...fontBold, fontSize: 11, color: Colors.landing.primaryPurple, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
	receiptLine: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#f9fafb',
		borderRadius: 6,
		padding: 10,
		gap: 12,
	},
	receiptLineName: { ...fontSemiBold, fontSize: 13, color: '#111827' },
	receiptLineMeta: { ...fontMedium, fontSize: 10, color: '#9ca3af', marginTop: 2 },
	receiptLineQty: { ...fontMedium, fontSize: 12, color: '#6f6f76' },
	receiptLineCost: { ...fontBold, fontSize: 14, color: Colors.landing.primaryPurple },
});
