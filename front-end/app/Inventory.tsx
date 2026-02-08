import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';

type Dish = {
    id: number;
    name: string;
    category: string;
    lastUpdated: string;
    usageCount: number;
};

type Ingredient = {
    id: number;
    name: string;
    category: string;
    unit: string;
    lastUpdated: string;
    usageCount: number;
};

type TabKey = 'dishes' | 'ingredients';

const dishes: Dish[] = [
    { id: 101, name: 'Margherita Pizza', category: 'Main Course', lastUpdated: '2024-02-01', usageCount: 450 },
    { id: 102, name: 'Caprese Salad', category: 'Appetizer', lastUpdated: '2024-02-03', usageCount: 120 },
    { id: 103, name: 'Tomato Bruschetta', category: 'Appetizer', lastUpdated: '2024-02-05', usageCount: 85 },
];

const ingredients: Ingredient[] = [
    { id: 1, name: 'Roma Tomatoes', category: 'Produce', unit: 'kg', lastUpdated: '2024-02-05', usageCount: 12 },
    { id: 2, name: 'Buffalo Mozzarella', category: 'Dairy', unit: 'kg', lastUpdated: '2024-02-06', usageCount: 8 },
    { id: 3, name: 'Fresh Basil', category: 'Produce', unit: 'kg', lastUpdated: '2024-02-07', usageCount: 15 },
    { id: 4, name: 'Extra Virgin Olive Oil', category: 'Pantry', unit: 'L', lastUpdated: '2024-01-20', usageCount: 22 },
    { id: 5, name: 'Double Zero Flour', category: 'Pantry', unit: 'kg', lastUpdated: '2024-02-01', usageCount: 30 },
];

export default function Inventory() {
    const [activeTab, setActiveTab] = useState<TabKey>('dishes');
    const [search, setSearch] = useState('');

    const filteredDishes = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return dishes;
        return dishes.filter((dish) => dish.name.toLowerCase().includes(needle));
    }, [search]);

    const filteredIngredients = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return ingredients;
        return ingredients.filter((ingredient) => ingredient.name.toLowerCase().includes(needle));
    }, [search]);

    const tableHeaders = activeTab === 'dishes'
        ? ['Dish Name', 'Category', 'Popularity (Monthly)', 'Last Modified']
        : ['Ingredient Name', 'Category', 'Base Unit', 'Linked Dishes'];

    const addLabel = activeTab === 'dishes' ? 'Add Dish' : 'Add Ingredient';
    const tableRows = activeTab === 'dishes' ? filteredDishes : filteredIngredients;

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar style="dark" />
			<AuthHeader activeRoute="/Inventory" />
			<ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
				<View style={styles.contentWrapper}>
					<View style={styles.headerRow}>
						<View>
							<Text style={styles.title}>Master Inventory</Text>
							<Text style={styles.subtitle}>Configure global item types and recipe relationships</Text>
						</View>
						<TouchableOpacity style={styles.primaryButton}>
							<Text style={styles.primaryButtonText}>{addLabel}</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.tabRow}>
						<TouchableOpacity
							style={[styles.tabButton, activeTab === 'dishes' && styles.tabButtonActive]}
							onPress={() => setActiveTab('dishes')}
						>
							<Text style={[styles.tabText, activeTab === 'dishes' && styles.tabTextActive]}>Dishes</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.tabButton, activeTab === 'ingredients' && styles.tabButtonActive]}
							onPress={() => setActiveTab('ingredients')}
						>
							<Text style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}>
								Ingredients
							</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.filtersCard}>
						<View style={styles.filterRow}>
							<View style={styles.searchWrapper}>
								<TextInput
									style={styles.searchInput}
									placeholder="Search master list..."
									value={search}
									onChangeText={setSearch}
								/>
							</View>
							<TouchableOpacity style={styles.selectButton}>
								<Text style={styles.selectText}>All Categories</Text>
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.tableCard}>
						<View style={styles.tableHeader}>
							{tableHeaders.map((label) => (
								<View key={label} style={styles.tableHeaderCell}>
									<Text style={styles.tableHeaderText}>{label}</Text>
								</View>
							))}
							<View style={styles.tableHeaderCell} />
						</View>

						{tableRows.map((row) => (
							<View key={row.id} style={styles.tableRow}>
								<View style={[styles.tableCell, styles.cellName]}>
									<Text style={styles.cellPrimary}>{row.name}</Text>
								</View>
								<View style={[styles.tableCell, styles.cellCategory]}>
									<Text style={styles.cellSecondary}>{row.category}</Text>
								</View>
								<View style={[styles.tableCell, styles.cellMetric]}>
									{activeTab === 'dishes' ? (
										<Text style={styles.cellMetricText}>{row.usageCount}</Text>
									) : (
										<Text style={styles.cellSecondary}>{(row as Ingredient).unit}</Text>
									)}
								</View>
								<View style={[styles.tableCell, styles.cellMetric]}>
									<Text style={styles.cellSecondary}>
										{activeTab === 'dishes' ? row.lastUpdated : (row as Ingredient).usageCount}
									</Text>
								</View>
								<View style={[styles.tableCell, styles.cellActions]}>
									<View style={styles.actionRow}>
										<View style={styles.iconButton} />
										<View style={styles.iconButton} />
									</View>
								</View>
							</View>
						))}
					</View>
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
	page: {
		paddingVertical: 32,
		paddingHorizontal: 24,
	},
	contentWrapper: {
		width: '100%',
		maxWidth: 1280,
		alignSelf: 'center',
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 16,
		flexWrap: 'wrap',
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '600',
		color: '#111827',
	},
	subtitle: {
		fontSize: 13,
		color: '#6b7280',
		marginTop: 4,
	},
	primaryButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		backgroundColor: Colors.landing.primaryPurple,
		borderRadius: 8,
	},
	primaryButtonText: {
		color: Colors.landing.white,
		fontSize: 13,
		fontWeight: '600',
	},
	tabRow: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
		marginBottom: 20,
	},
	tabButton: {
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	tabButtonActive: {
		borderBottomWidth: 2,
		borderBottomColor: Colors.landing.primaryPurple,
	},
	tabText: {
		fontSize: 13,
		fontWeight: '600',
		color: '#6b7280',
	},
	tabTextActive: {
		color: Colors.landing.primaryPurple,
	},
	filtersCard: {
		backgroundColor: Colors.landing.lightPurple,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
	},
	filterRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flexWrap: 'wrap',
	},
	searchWrapper: {
		flex: 1,
		minWidth: 220,
	},
	searchInput: {
		width: '100%',
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 8,
		fontSize: 13,
		backgroundColor: Colors.landing.white,
	},
	selectButton: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 8,
		backgroundColor: Colors.landing.white,
		minWidth: 160,
		alignItems: 'center',
	},
	selectText: {
		fontSize: 13,
		color: '#374151',
		fontWeight: '500',
	},
	tableCard: {
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		overflow: 'hidden',
		backgroundColor: Colors.landing.white,
	},
	tableHeader: {
		flexDirection: 'row',
		backgroundColor: Colors.landing.lightPurple,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	tableHeaderCell: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	tableHeaderText: {
		fontSize: 11,
		fontWeight: '600',
		color: '#6b7280',
		textTransform: 'uppercase',
	},
	tableRow: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	tableCell: {
		paddingVertical: 14,
		paddingHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	cellName: {
		flex: 1.6,
	},
	cellCategory: {
		flex: 1.2,
	},
	cellMetric: {
		flex: 1.1,
		justifyContent: 'flex-end',
	},
	cellActions: {
		flex: 0.6,
		justifyContent: 'flex-end',
	},
	cellPrimary: {
		fontSize: 13,
		fontWeight: '600',
		color: Colors.landing.primaryPurple,
	},
	cellSecondary: {
		fontSize: 12,
		color: '#6b7280',
	},
	cellMetricText: {
		fontSize: 12,
		color: '#111827',
		fontVariant: ['tabular-nums'],
		fontWeight: '600',
	},
	actionRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 8,
	},
	iconButton: {
		width: 28,
		height: 28,
		borderRadius: 8,
		backgroundColor: '#f3f4f6',
	},
	},
);
