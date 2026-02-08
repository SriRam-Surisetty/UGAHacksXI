import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';
import FoodThumbnail from '@/components/FoodThumbnail';
import api from '@/services/api';

type DishRow = {
	id: number;
	name: string;
};

type IngredientRow = {
	id: number;
	name: string;
	category: string;
	linkedDishes: string;
};

type TabKey = 'dishes' | 'ingredients';

type ModalType =
	| 'dish'
	| 'ingredient'
	| 'edit-dish'
	| 'edit-ingredient'
	| 'delete-dish'
	| 'delete-ingredient'
	| 'view-dish'
	| null;

type IngredientOption = {
	ingID: number;
	ingName: string;
	category?: string | null;
};

type SelectedIngredient = {
	ingID: number;
	ingName: string;
	qty: string;
	unit: string;
};

type DishIngredientDetail = {
	ingID: number;
	ingName: string;
	category?: string | null;
	qty?: number | null;
	unit?: string | null;
};

type SelectedRow = {
	id: number;
	name: string;
	category?: string;
};

export default function Inventory() {
	const [activeTab, setActiveTab] = useState<TabKey>('dishes');
	const [search, setSearch] = useState('');
	const [category, setCategory] = useState('');
	const [showCategoryMenu, setShowCategoryMenu] = useState(false);
	const [dishesData, setDishesData] = useState<DishRow[]>([]);
	const [ingredientsData, setIngredientsData] = useState<IngredientRow[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [modalType, setModalType] = useState<ModalType>(null);
	const [modalError, setModalError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [ingredientName, setIngredientName] = useState('');
	const [ingredientCategory, setIngredientCategory] = useState('');
	const [dishName, setDishName] = useState('');
	const [ingredientSearch, setIngredientSearch] = useState('');
	const [availableIngredients, setAvailableIngredients] = useState<IngredientOption[]>([]);
	const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
	const [selectedRow, setSelectedRow] = useState<SelectedRow | null>(null);
	const [dishIngredients, setDishIngredients] = useState<DishIngredientDetail[]>([]);
	const [dishDetailLoading, setDishDetailLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [showPerPageMenu, setShowPerPageMenu] = useState(false);

	useEffect(() => {
		if (Platform.OS !== 'web') return;
		try {
			const savedTab = localStorage.getItem('inventory_active_tab');
			if (savedTab === 'dishes' || savedTab === 'ingredients') {
				setActiveTab(savedTab);
			}
		} catch (storageError) {
			// Ignore storage errors in restricted environments.
		}
	}, []);

	useEffect(() => {
		if (Platform.OS !== 'web') return;
		try {
			localStorage.setItem('inventory_active_tab', activeTab);
		} catch (storageError) {
			// Ignore storage errors in restricted environments.
		}
	}, [activeTab]);

	useEffect(() => {
		setShowCategoryMenu(false);
	}, [activeTab]);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			setError(null);

			try {
				if (activeTab === 'dishes') {
					const response = await api.get('/inventory/dishes', {
						params: search ? { search } : undefined,
					});
					const dishes = response.data?.dishes ?? [];
					setDishesData(
						dishes.map((dish: { dishID: number; dishName?: string }) => ({
							id: dish.dishID,
							name: dish.dishName || '-',
						}))
					);
				} else {
					const params: { search?: string; category?: string } = {};
					if (search) params.search = search;
					if (category) params.category = category;

					const response = await api.get('/inventory/ingredients', {
						params: Object.keys(params).length ? params : undefined,
					});
					const ingredients = response.data?.ingredients ?? [];
					setIngredientsData(
						ingredients.map((ing: { ingID: number; ingName?: string; category?: string; linkedDishes?: number }) => ({
							id: ing.ingID,
							name: ing.ingName || '-',
							category: ing.category || '-',
							linkedDishes: typeof ing.linkedDishes === 'number' ? String(ing.linkedDishes) : '-',
						}))
					);
				}
			} catch (fetchError) {
				setError('Unable to load inventory data.');
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [activeTab, search, category, refreshKey]);

	const filteredAvailableIngredients = useMemo(() => {
		const needle = ingredientSearch.trim().toLowerCase();
		if (!needle) return availableIngredients;
		return availableIngredients.filter((ing) => ing.ingName.toLowerCase().includes(needle));
	}, [availableIngredients, ingredientSearch]);

	const categoryOptions = useMemo(() => {
		const unique = new Set<string>();
		ingredientsData.forEach((ing) => {
			if (ing.category && ing.category !== '-') {
				unique.add(ing.category);
			}
		});
		return ['All Categories', ...Array.from(unique).sort()];
	}, [ingredientsData]);

	const tableHeaders = activeTab === 'dishes'
		? ['Dish Name']
		: ['Ingredient Name', 'Category', 'Linked Dishes'];

	const addLabel = activeTab === 'dishes' ? 'Add Dish' : 'Add Ingredient';
	const tableRows = activeTab === 'dishes' ? dishesData : ingredientsData;
	const categoryLabel = category || 'All Categories';

	const totalPages = Math.max(1, Math.ceil(tableRows.length / itemsPerPage));
	const paginatedRows = tableRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

	useEffect(() => {
		setCurrentPage(1);
	}, [activeTab, search, category, itemsPerPage]);

	const openModal = (type: ModalType, row?: SelectedRow) => {
		setModalType(type);
		setModalError(null);
		setIngredientName('');
		setIngredientCategory('');
		setDishName('');
		setIngredientSearch('');
		setSelectedIngredients([]);
		setSelectedRow(row ?? null);
		setDishIngredients([]);
		if (type === 'edit-dish' && row) {
			setDishName(row.name);
		}
		if (type === 'edit-ingredient' && row) {
			setIngredientName(row.name);
			setIngredientCategory(row.category ?? '');
		}
		if (type === 'dish' || type === 'edit-dish') {
			loadAvailableIngredients();
		}
		if ((type === 'edit-dish' || type === 'view-dish') && row) {
			loadDishDetail(row.id, type === 'edit-dish');
		}
	};

	const closeModal = () => {
		setModalType(null);
		setModalError(null);
		setIsSaving(false);
		setSelectedRow(null);
		setDishIngredients([]);
	};

	const loadAvailableIngredients = async () => {
		try {
			const response = await api.get('/inventory/ingredients');
			const ingredients = response.data?.ingredients ?? [];
			setAvailableIngredients(
				ingredients.map((ing: { ingID: number; ingName?: string; category?: string | null }) => ({
					ingID: ing.ingID,
					ingName: ing.ingName || '-',
					category: ing.category ?? undefined,
				}))
			);
		} catch (fetchError) {
			setModalError('Unable to load ingredients.');
		}
	};

	const loadDishDetail = async (dishId: number, hydrateForEdit: boolean) => {
		setDishDetailLoading(true);
		try {
			const response = await api.get(`/inventory/dishes/${dishId}`);
			const dish = response.data?.dish;
			const ingredients = response.data?.ingredients ?? [];
			if (dish?.dishName) {
				setDishName(dish.dishName);
			}
			setDishIngredients(ingredients);
			if (hydrateForEdit) {
				setSelectedIngredients(
					ingredients.map((item: DishIngredientDetail) => ({
						ingID: item.ingID,
						ingName: item.ingName,
						qty: item.qty !== null && item.qty !== undefined ? String(item.qty) : '',
						unit: item.unit || '',
					}))
				);
			}
		} catch (fetchError) {
			setModalError('Unable to load dish details.');
		} finally {
			setDishDetailLoading(false);
		}
	};

	const addIngredientToDish = (ingredient: IngredientOption) => {
		setSelectedIngredients((prev) => {
			if (prev.some((item) => item.ingID === ingredient.ingID)) return prev;
			return [...prev, { ingID: ingredient.ingID, ingName: ingredient.ingName, qty: '', unit: '' }];
		});
	};

	const updateSelectedIngredient = (ingID: number, field: 'qty' | 'unit', value: string) => {
		setSelectedIngredients((prev) =>
			prev.map((item) => (item.ingID === ingID ? { ...item, [field]: value } : item))
		);
	};

	const removeSelectedIngredient = (ingID: number) => {
		setSelectedIngredients((prev) => prev.filter((item) => item.ingID !== ingID));
	};

	const handleEditRow = (row: SelectedRow) => {
		const modal = activeTab === 'dishes' ? 'edit-dish' : 'edit-ingredient';
		openModal(modal, row);
	};

	const handleDeleteRow = (row: SelectedRow) => {
		const modal = activeTab === 'dishes' ? 'delete-dish' : 'delete-ingredient';
		openModal(modal, row);
	};

	const handleConfirmDelete = async () => {
		if (!selectedRow || !modalType) return;
		setModalError(null);
		setIsSaving(true);
		try {
			if (modalType === 'delete-ingredient') {
				await api.delete(`/inventory/ingredient-types/${selectedRow.id}`);
			}
			if (modalType === 'delete-dish') {
				await api.delete(`/inventory/dishes/${selectedRow.id}`);
			}
			setRefreshKey((prev) => prev + 1);
			closeModal();
		} catch (deleteError: any) {
			const status = deleteError?.response?.status;
			const linkedDishes = deleteError?.response?.data?.linkedDishes;
			if (status === 409 && modalType === 'delete-ingredient') {
				setModalError(`This ingredient is used in ${linkedDishes ?? 'one or more'} dishes.`);
			} else {
				setModalError('Unable to delete. Please try again.');
			}
			setIsSaving(false);
		}
	};

	const handleSave = async () => {
		setModalError(null);
		setIsSaving(true);

		try {
			if (modalType === 'ingredient' || modalType === 'edit-ingredient') {
				if (!ingredientName.trim()) {
					setModalError('Ingredient name is required.');
					setIsSaving(false);
					return;
				}
				if (modalType === 'ingredient') {
					await api.post('/inventory/ingredient-types', {
						ingName: ingredientName.trim(),
						category: ingredientCategory.trim() || undefined,
					});
				}
				if (modalType === 'edit-ingredient' && selectedRow) {
					await api.patch(`/inventory/ingredient-types/${selectedRow.id}`, {
						ingName: ingredientName.trim(),
						category: ingredientCategory.trim() || undefined,
					});
				}
			}

			if (modalType === 'dish' || modalType === 'edit-dish') {
				if (!dishName.trim()) {
					setModalError('Dish name is required.');
					setIsSaving(false);
					return;
				}
				const payloadIngredients = selectedIngredients.map((item) => ({
					ingID: item.ingID,
					qty: item.qty.trim() || undefined,
					unit: item.unit.trim() || undefined,
				}));
				if (modalType === 'dish') {
					await api.post('/inventory/dishes', {
						dishName: dishName.trim(),
						ingredients: payloadIngredients,
					});
				}
				if (modalType === 'edit-dish' && selectedRow) {
					await api.patch(`/inventory/dishes/${selectedRow.id}`, {
						dishName: dishName.trim(),
						ingredients: payloadIngredients,
					});
				}
			}

			setRefreshKey((prev) => prev + 1);
			closeModal();
		} catch (saveError) {
			setModalError('Unable to save. Please try again.');
			setIsSaving(false);
		}
	};

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
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={() => openModal(activeTab === 'dishes' ? 'dish' : 'ingredient')}
						>
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
								<View style={styles.searchInputWrapper}>
									<Ionicons name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
									<TextInput
										style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
										placeholder={activeTab === 'dishes' ? 'Search dishes...' : 'Search ingredients...'}
										placeholderTextColor="#9ca3af"
										value={search}
										onChangeText={setSearch}
									/>
									{search.length > 0 && (
										<TouchableOpacity onPress={() => setSearch('')} style={styles.searchClear}>
											<Ionicons name="close-circle" size={16} color="#9ca3af" />
										</TouchableOpacity>
									)}
								</View>
							</View>
							<TouchableOpacity
								style={[styles.selectButton, activeTab !== 'ingredients' && styles.selectButtonDisabled]}
								onPress={() => activeTab === 'ingredients' && setShowCategoryMenu((prev) => !prev)}
								disabled={activeTab !== 'ingredients'}
							>
								<Ionicons name="filter" size={14} color={activeTab === 'ingredients' ? '#6b7280' : '#d1d5db'} />
								<Text style={styles.selectText}>{categoryLabel}</Text>
								<Ionicons name="chevron-down" size={14} color={activeTab === 'ingredients' ? '#6b7280' : '#d1d5db'} />
							</TouchableOpacity>
						</View>
						{activeTab === 'ingredients' && showCategoryMenu && (
							<View style={styles.categoryMenu}>
								{categoryOptions.map((option) => {
									const isActive = option === categoryLabel;
									return (
										<TouchableOpacity
											key={option}
											style={[styles.categoryOption, isActive && styles.categoryOptionActive]}
											onPress={() => {
												setCategory(option === 'All Categories' ? '' : option);
												setShowCategoryMenu(false);
											}}
										>
											<Text style={[styles.categoryOptionText, isActive && styles.categoryOptionTextActive]}>
												{option}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						)}
					</View>

					<View style={styles.tableCard}>
						<View style={styles.tableHeader}>
							<View style={styles.cellThumb} />
							{activeTab === 'dishes' ? (
								<>
									<View style={[styles.tableHeaderCell, styles.cellName]}>
										<Text style={styles.tableHeaderText}>Dish Name</Text>
									</View>
									<View style={[styles.tableHeaderCell, styles.cellActions]} />
								</>
							) : (
								<>
									<View style={[styles.tableHeaderCell, styles.cellName]}>
										<Text style={styles.tableHeaderText}>Ingredient Name</Text>
									</View>
									<View style={[styles.tableHeaderCell, styles.cellCategory]}>
										<Text style={styles.tableHeaderText}>Category</Text>
									</View>
									<View style={[styles.tableHeaderCell, styles.cellMetric]}>
										<Text style={[styles.tableHeaderText, { textAlign: 'right', width: '100%' }]}>Linked Dishes</Text>
									</View>
									<View style={[styles.tableHeaderCell, styles.cellActions]} />
								</>
							)}
						</View>

						{isLoading && (
							<View style={styles.tableRow}>
								<View style={styles.tableCell}>
									<Text style={styles.cellSecondary}>Loading...</Text>
								</View>
							</View>
						)}
						{!isLoading && error && (
							<View style={styles.tableRow}>
								<View style={styles.tableCell}>
									<Text style={styles.cellSecondary}>{error}</Text>
								</View>
							</View>
						)}
						{!isLoading && !error && tableRows.length === 0 && (
							<View style={styles.tableRow}>
								<View style={styles.tableCell}>
									<Text style={styles.cellSecondary}>No results found.</Text>
								</View>
							</View>
						)}
						{!isLoading && !error && paginatedRows.map((row) => (
							<View key={row.id} style={styles.tableRow}>
								<View style={styles.cellThumb}>
									<FoodThumbnail name={row.name} size={36} type={activeTab === 'dishes' ? 'meal' : 'ingredient'} />
								</View>
								<View style={[styles.tableCell, styles.cellName]}>
									{activeTab === 'dishes' ? (
										<TouchableOpacity onPress={() => openModal('view-dish', { id: row.id, name: row.name })}>
											<Text style={styles.cellPrimaryLink}>{row.name}</Text>
										</TouchableOpacity>
									) : (
										<Text style={styles.cellPrimary}>{row.name}</Text>
									)}
								</View>
								{activeTab === 'ingredients' && (
									<>
										<View style={[styles.tableCell, styles.cellCategory]}>
											<Text style={styles.cellSecondary}>{(row as IngredientRow).category}</Text>
										</View>
										<View style={[styles.tableCell, styles.cellMetric]}>
											<Text style={styles.cellMetricText}>{(row as IngredientRow).linkedDishes}</Text>
										</View>
									</>
								)}
								<View style={[styles.tableCell, styles.cellActions]}>
									<View style={styles.actionRow}>
										<TouchableOpacity
											style={styles.iconButton}
											onPress={() => handleEditRow({ id: row.id, name: row.name, category: activeTab === 'ingredients' ? (row as IngredientRow).category : undefined })}
										>
											<Ionicons name="pencil" size={14} color="#2563eb" />
										</TouchableOpacity>
										<TouchableOpacity
											style={styles.iconButton}
											onPress={() => handleDeleteRow({ id: row.id, name: row.name, category: activeTab === 'ingredients' ? (row as IngredientRow).category : undefined })}
										>
											<Ionicons name="trash" size={14} color="#dc2626" />
										</TouchableOpacity>
									</View>
								</View>
							</View>
						))}
					</View>

					{/* Pagination */}
					{!isLoading && !error && tableRows.length > 0 && (
						<View style={styles.paginationBar}>
							<View style={styles.paginationLeft}>
								<Text style={styles.paginationLabel}>Rows per page:</Text>
								<TouchableOpacity
									style={styles.perPageButton}
									onPress={() => setShowPerPageMenu((prev) => !prev)}
								>
									<Text style={styles.perPageText}>{itemsPerPage}</Text>
									<Ionicons name="chevron-down" size={12} color="#6b7280" />
								</TouchableOpacity>
								{showPerPageMenu && (
									<View style={styles.perPageMenu}>
										{[5, 10, 25, 50].map((n) => (
											<TouchableOpacity
												key={n}
												style={[styles.perPageOption, n === itemsPerPage && styles.perPageOptionActive]}
												onPress={() => { setItemsPerPage(n); setShowPerPageMenu(false); }}
											>
												<Text style={[styles.perPageOptionText, n === itemsPerPage && styles.perPageOptionTextActive]}>{n}</Text>
											</TouchableOpacity>
										))}
									</View>
								)}
							</View>
							<Text style={styles.paginationInfo}>
								{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, tableRows.length)} of {tableRows.length}
							</Text>
							<View style={styles.paginationButtons}>
								<TouchableOpacity
									style={[styles.pageButton, currentPage <= 1 && styles.pageButtonDisabled]}
									onPress={() => setCurrentPage(1)}
									disabled={currentPage <= 1}
								>
									<Ionicons name="play-back" size={12} color={currentPage <= 1 ? '#d1d5db' : '#374151'} />
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.pageButton, currentPage <= 1 && styles.pageButtonDisabled]}
									onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage <= 1}
								>
									<Ionicons name="chevron-back" size={14} color={currentPage <= 1 ? '#d1d5db' : '#374151'} />
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.pageButton, currentPage >= totalPages && styles.pageButtonDisabled]}
									onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									disabled={currentPage >= totalPages}
								>
									<Ionicons name="chevron-forward" size={14} color={currentPage >= totalPages ? '#d1d5db' : '#374151'} />
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.pageButton, currentPage >= totalPages && styles.pageButtonDisabled]}
									onPress={() => setCurrentPage(totalPages)}
									disabled={currentPage >= totalPages}
								>
									<Ionicons name="play-forward" size={12} color={currentPage >= totalPages ? '#d1d5db' : '#374151'} />
								</TouchableOpacity>
							</View>
						</View>
					)}
				</View>
			</ScrollView>

			<Modal transparent visible={modalType !== null} animationType="fade" onRequestClose={closeModal}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>
								{modalType === 'dish' && 'Add Dish'}
								{modalType === 'ingredient' && 'Add Ingredient'}
								{modalType === 'edit-dish' && 'Edit Dish'}
								{modalType === 'edit-ingredient' && 'Edit Ingredient'}
								{modalType === 'delete-dish' && 'Delete Dish'}
								{modalType === 'delete-ingredient' && 'Delete Ingredient'}
							</Text>
							<TouchableOpacity onPress={closeModal}>
								<Text style={styles.modalClose}>Close</Text>
							</TouchableOpacity>
						</View>

						{(modalType === 'ingredient' || modalType === 'edit-ingredient') && (
							<View style={styles.modalBody}>
								<Text style={styles.modalLabel}>Ingredient name</Text>
								<TextInput
									style={styles.modalInput}
									placeholder="e.g. Roma Tomatoes"
									value={ingredientName}
									onChangeText={setIngredientName}
								/>
								<Text style={styles.modalLabel}>Category (optional)</Text>
								<TextInput
									style={styles.modalInput}
									placeholder="e.g. Produce"
									value={ingredientCategory}
									onChangeText={setIngredientCategory}
								/>
							</View>
						)}

						{(modalType === 'dish' || modalType === 'edit-dish') && (
							<View style={styles.modalBody}>
								<Text style={styles.modalLabel}>Dish name</Text>
								<TextInput
									style={styles.modalInput}
									placeholder="e.g. Margherita Pizza"
									value={dishName}
									onChangeText={setDishName}
								/>
								{(modalType === 'dish' || modalType === 'edit-dish') && (
									<>
										<Text style={styles.modalLabel}>Search ingredients</Text>
										<TextInput
											style={styles.modalInput}
											placeholder="Search ingredients..."
											value={ingredientSearch}
											onChangeText={setIngredientSearch}
										/>
										<View style={styles.ingredientList}>
											{filteredAvailableIngredients.map((ingredient) => (
												<TouchableOpacity
													key={ingredient.ingID}
													style={styles.ingredientRow}
													onPress={() => addIngredientToDish(ingredient)}
												>
													<Text style={styles.ingredientName}>{ingredient.ingName}</Text>
													<Text style={styles.ingredientCategory}>{ingredient.category || 'Uncategorized'}</Text>
												</TouchableOpacity>
											))}
										</View>

										{selectedIngredients.length > 0 && (
											<View style={styles.selectedSection}>
												<Text style={styles.modalLabel}>Selected ingredients</Text>
												{selectedIngredients.map((item) => (
													<View key={item.ingID} style={styles.selectedRow}>
														<View style={styles.selectedInfo}>
															<Text style={styles.selectedName}>{item.ingName}</Text>
															<View style={styles.selectedInputs}>
																<TextInput
																	style={[styles.modalInput, styles.selectedInput]}
																	placeholder="Qty"
																	value={item.qty}
																	onChangeText={(value) => updateSelectedIngredient(item.ingID, 'qty', value)}
																/>
																<TextInput
																	style={[styles.modalInput, styles.selectedInput]}
																	placeholder="Unit"
																	value={item.unit}
																	onChangeText={(value) => updateSelectedIngredient(item.ingID, 'unit', value)}
																/>
															</View>
														</View>
														<TouchableOpacity onPress={() => removeSelectedIngredient(item.ingID)}>
															<Text style={styles.removeText}>Remove</Text>
														</TouchableOpacity>
													</View>
												))}
											</View>
										)}
									</>
								)}
							</View>
						)}

						{(modalType === 'delete-dish' || modalType === 'delete-ingredient') && (
							<View style={styles.modalBody}>
								<Text style={styles.modalLabel}>Confirm delete</Text>
								<Text style={styles.modalDeleteText}>
									This will permanently remove {selectedRow?.name || 'this item'}.
								</Text>
							</View>
						)}

						{modalType === 'view-dish' && (
							<View style={styles.modalBody}>
								<Text style={styles.modalLabel}>Ingredients</Text>
								{dishDetailLoading ? (
									<Text style={styles.cellSecondary}>Loading...</Text>
								) : dishIngredients.length === 0 ? (
									<Text style={styles.cellSecondary}>No ingredients linked yet.</Text>
								) : (
									<View style={styles.dishDetailList}>
										{dishIngredients.map((ingredient) => (
											<View key={ingredient.ingID} style={styles.dishDetailRow}>
												<View style={styles.dishDetailInfo}>
													<Text style={styles.dishDetailName}>{ingredient.ingName}</Text>
													<Text style={styles.dishDetailMeta}>
														{ingredient.category || 'Uncategorized'}
													</Text>
												</View>
												<Text style={styles.dishDetailQty}>
													{ingredient.qty ?? '-'} {ingredient.unit || ''}
												</Text>
											</View>
										))}
									</View>
								)}
							</View>
						)}

						{modalError && <Text style={styles.modalError}>{modalError}</Text>}

						<View style={styles.modalActions}>
							<TouchableOpacity style={styles.secondaryButton} onPress={closeModal} disabled={isSaving}>
								<Text style={styles.secondaryButtonText}>
									{modalType === 'view-dish' ? 'Close' : 'Cancel'}
								</Text>
							</TouchableOpacity>
							{modalType === 'view-dish' ? null : (modalType === 'delete-dish' || modalType === 'delete-ingredient') ? (
								<TouchableOpacity style={styles.deleteButton} onPress={handleConfirmDelete} disabled={isSaving}>
									<Text style={styles.deleteButtonText}>{isSaving ? 'Deleting...' : 'Delete'}</Text>
								</TouchableOpacity>
							) : (
								<TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={isSaving}>
									<Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>
				</View>
			</Modal>

			<FloatingChatButton />
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
		borderRadius: 6,
	},
	primaryButtonText: {
		color: Colors.landing.white,
		fontSize: 13,
		fontWeight: '600',
	},
	secondaryButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#d1d5db',
		backgroundColor: Colors.landing.white,
	},
	secondaryButtonText: {
		color: '#374151',
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
		borderRadius: 8,
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
	searchInputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 8,
		backgroundColor: Colors.landing.white,
		paddingHorizontal: 12,
	},
	searchIcon: {
		marginRight: 8,
	},
	searchInput: {
		flex: 1,
		paddingVertical: 10,
		fontSize: 13,
		color: '#111827',
	},
	searchClear: {
		paddingLeft: 8,
	},
	selectButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 8,
		backgroundColor: Colors.landing.white,
		minWidth: 180,
	},
	selectText: {
		fontSize: 13,
		color: '#374151',
		fontWeight: '500',
	},
	selectButtonDisabled: {
		opacity: 0.5,
	},
	tableCard: {
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 8,
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
	cellThumb: {
		width: 60,
		minWidth: 60,
		flexShrink: 0,
		flexGrow: 0,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 8,
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
	cellPrimaryLink: {
		fontSize: 13,
		fontWeight: '600',
		color: Colors.landing.primaryPurple,
		textDecorationLine: 'underline',
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
	categoryMenu: {
		marginTop: 12,
		backgroundColor: Colors.landing.white,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		overflow: 'hidden',
	},
	categoryOption: {
		paddingVertical: 10,
		paddingHorizontal: 12,
	},
	categoryOptionActive: {
		backgroundColor: Colors.landing.lightPurple,
	},
	categoryOptionText: {
		fontSize: 13,
		color: '#374151',
		fontWeight: '500',
	},
	categoryOptionTextActive: {
		color: Colors.landing.primaryPurple,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(15, 23, 42, 0.45)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalCard: {
		width: '100%',
		maxWidth: 520,
		backgroundColor: Colors.landing.white,
		borderRadius: 10,
		padding: 20,
		gap: 16,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#111827',
	},
	modalClose: {
		fontSize: 13,
		color: '#6b7280',
		fontWeight: '600',
	},
	modalBody: {
		gap: 12,
	},
	modalLabel: {
		fontSize: 12,
		color: '#6b7280',
		fontWeight: '600',
	},
	modalInput: {
		width: '100%',
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 6,
		fontSize: 13,
		backgroundColor: Colors.landing.white,
	},
	modalActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 12,
	},
	modalDeleteText: {
		fontSize: 13,
		color: '#374151',
		lineHeight: 18,
	},
	modalError: {
		fontSize: 12,
		color: '#b91c1c',
		fontWeight: '600',
	},
	dishDetailList: {
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 10,
		overflow: 'hidden',
	},
	dishDetailRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#f1f5f9',
	},
	dishDetailInfo: {
		flex: 1,
		paddingRight: 12,
	},
	dishDetailName: {
		fontSize: 13,
		fontWeight: '600',
		color: '#111827',
	},
	dishDetailMeta: {
		fontSize: 11,
		color: '#6b7280',
		marginTop: 2,
	},
	dishDetailQty: {
		fontSize: 12,
		color: '#111827',
		fontWeight: '600',
	},
	deleteButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 6,
		backgroundColor: '#dc2626',
	},
	deleteButtonText: {
		color: Colors.landing.white,
		fontSize: 13,
		fontWeight: '600',
	},
	ingredientList: {
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 8,
		maxHeight: 200,
		overflow: 'hidden',
	},
	ingredientRow: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#f1f5f9',
	},
	ingredientName: {
		fontSize: 13,
		fontWeight: '600',
		color: Colors.landing.primaryPurple,
	},
	ingredientCategory: {
		fontSize: 11,
		color: '#6b7280',
		marginTop: 2,
	},
	selectedSection: {
		gap: 8,
	},
	selectedRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#f1f5f9',
	},
	selectedInfo: {
		flex: 1,
		gap: 6,
	},
	selectedName: {
		fontSize: 13,
		fontWeight: '600',
		color: '#111827',
	},
	selectedInputs: {
		flexDirection: 'row',
		gap: 8,
	},
	selectedInput: {
		flex: 1,
	},
	removeText: {
		fontSize: 12,
		color: '#b91c1c',
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
		borderRadius: 6,
		backgroundColor: '#f3f4f6',
		alignItems: 'center',
		justifyContent: 'center',
	},
	paginationBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: 16,
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderTopWidth: 1,
		borderTopColor: '#e5e7eb',
		backgroundColor: Colors.landing.white,
		borderBottomLeftRadius: 8,
		borderBottomRightRadius: 8,
	},
	paginationLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		position: 'relative',
	},
	paginationLabel: {
		fontSize: 12,
		color: '#6b7280',
	},
	paginationInfo: {
		fontSize: 12,
		color: '#6b7280',
		fontVariant: ['tabular-nums'],
	},
	paginationButtons: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	pageButton: {
		width: 28,
		height: 28,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.landing.white,
	},
	pageButtonDisabled: {
		opacity: 0.4,
	},
	perPageButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 4,
		backgroundColor: Colors.landing.white,
	},
	perPageText: {
		fontSize: 12,
		color: '#374151',
		fontWeight: '500',
	},
	perPageMenu: {
		position: 'absolute',
		bottom: 32,
		left: 60,
		backgroundColor: Colors.landing.white,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 8,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
		zIndex: 10,
	},
	perPageOption: {
		paddingVertical: 8,
		paddingHorizontal: 16,
	},
	perPageOptionActive: {
		backgroundColor: Colors.landing.lightPurple,
	},
	perPageOptionText: {
		fontSize: 12,
		color: '#374151',
	},
	perPageOptionTextActive: {
		color: Colors.landing.primaryPurple,
		fontWeight: '600',
	},
});
