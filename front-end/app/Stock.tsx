import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';
import FoodThumbnail from '@/components/FoodThumbnail';
import api from '@/services/api';
import { exportSpreadsheet, importSpreadsheet } from '@/services/spreadsheet';

type Batch = {
    id: number;
    name: string;
    category?: string | null;
    batchNum?: string | null;
    expiry?: string | null;
    qty?: number | null;
    unit?: string | null;
};

type StatusFilter = 'all' | 'healthy' | 'expiring' | 'expired';

type ModalType = 'add' | 'edit' | 'delete' | 'consume' | null;

type IngredientOption = {
    ingID: number;
    ingName: string;
    category?: string | null;
};

type DishOption = {
    dishID: number;
    dishName: string;
};

const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: 'All Status', value: 'all' },
    { label: 'Healthy', value: 'healthy' },
    { label: 'Expiring Soon', value: 'expiring' },
    { label: 'Expired', value: 'expired' },
];

export default function Stock() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortField, setSortField] = useState<keyof Batch | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [modalType, setModalType] = useState<ModalType>(null);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [batchNumInput, setBatchNumInput] = useState('');
    const [expiryInput, setExpiryInput] = useState('');
    const [qtyInput, setQtyInput] = useState('');
    const [unitInput, setUnitInput] = useState('');
    const [modalError, setModalError] = useState<string | null>(null);
    const [statusPickerOpen, setStatusPickerOpen] = useState(false);
    const [availableIngredients, setAvailableIngredients] = useState<IngredientOption[]>([]);
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [selectedIngredient, setSelectedIngredient] = useState<IngredientOption | null>(null);
    const [availableDishes, setAvailableDishes] = useState<DishOption[]>([]);
    const [dishSearch, setDishSearch] = useState('');
    const [selectedDish, setSelectedDish] = useState<DishOption | null>(null);
    const [cookedQtyInput, setCookedQtyInput] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showPerPageMenu, setShowPerPageMenu] = useState(false);

    const today = useMemo(() => new Date(), []);

    const getStatus = (expires?: string | null) => {
        if (!expires) {
            return { label: 'No Expiry', filter: 'healthy', pillStyle: styles.statusHealthy } as const;
        }
        const expiry = new Date(expires);
        const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (days < 0) {
            return { label: 'Expired', filter: 'expired', pillStyle: styles.statusExpired } as const;
        }
        if (days <= 3) {
            return { label: 'Expiring Soon', filter: 'expiring', pillStyle: styles.statusExpiring } as const;
        }
        return { label: 'Healthy', filter: 'healthy', pillStyle: styles.statusHealthy } as const;
    };

    const stats = useMemo(() => {
        return batches.reduce(
            (acc, batch) => {
                const status = getStatus(batch.expiry).filter;
                if (status === 'healthy') acc.healthy += 1;
                if (status === 'expiring') acc.expiring += 1;
                if (status === 'expired') acc.expired += 1;
                return acc;
            },
            { healthy: 0, expiring: 0, expired: 0 }
        );
    }, [batches]);

    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();
        let result = batches.filter((batch) => {
            const matchesSearch =
                !lowered ||
                batch.name.toLowerCase().includes(lowered) ||
                (batch.batchNum || '').toLowerCase().includes(lowered);
            const status = getStatus(batch.expiry).filter;
            const matchesStatus = statusFilter === 'all' || statusFilter === status;
            return matchesSearch && matchesStatus;
        });

        if (sortField) {
            result = [...result].sort((a, b) => {
                const aVal = (a[sortField] ?? '') as string | number;
                const bVal = (b[sortField] ?? '') as string | number;

                if (String(aVal) < String(bVal)) return sortDirection === 'asc' ? -1 : 1;
                if (String(aVal) > String(bVal)) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [batches, search, sortField, sortDirection, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paginatedRows = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, itemsPerPage]);

    const toggleSort = (field: keyof Batch) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const openModal = (type: ModalType, batch?: Batch) => {
        setModalType(type);
        setSelectedBatch(batch ?? null);
        setBatchNumInput(batch?.batchNum ?? '');
        setExpiryInput(batch?.expiry ?? '');
        setQtyInput(batch?.qty !== null && batch?.qty !== undefined ? String(batch.qty) : '');
        setUnitInput(batch?.unit ?? '');
        setModalError(null);
        setSelectedIngredient(null);
        setIngredientSearch('');
        setSelectedDish(null);
        setDishSearch('');
        setCookedQtyInput('');
        if (type === 'add') {
            loadAvailableIngredients();
        }
        if (type === 'consume') {
            loadAvailableDishes();
        }
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedBatch(null);
        setBatchNumInput('');
        setExpiryInput('');
        setQtyInput('');
        setUnitInput('');
        setModalError(null);
        setSelectedIngredient(null);
        setSelectedDish(null);
        setCookedQtyInput('');
    };

    const loadAvailableIngredients = async () => {
        try {
            const response = await api.get('/inventory/ingredients');
            const ingredients = response.data?.ingredients ?? [];
            setAvailableIngredients(
                ingredients.map((ing: { ingID: number; ingName?: string; category?: string | null }) => ({
                    ingID: ing.ingID,
                    ingName: ing.ingName || '-',
                    category: ing.category ?? null,
                }))
            );
        } catch (fetchError) {
            setModalError('Unable to load ingredient types.');
        }
    };

    const handleConfirm = async () => {
        if (!modalType) return;
        setModalError(null);

        try {
            if (modalType === 'add') {
                if (!selectedIngredient) {
                    setModalError('Select an ingredient type first.');
                    return;
                }
                const batchNum = batchNumInput.trim() || undefined;
                const expiry = expiryInput.trim() || undefined;
                if (!batchNum && !expiry) {
                    setModalError('Provide a batch ID or expiry date.');
                    return;
                }
                if (!qtyInput.trim() || !unitInput.trim()) {
                    setModalError('Provide quantity and unit.');
                    return;
                }
                await api.post('/stock/batches', {
                    ingID: selectedIngredient.ingID,
                    batchNum,
                    expiry,
                    qty: qtyInput.trim(),
                    unit: unitInput.trim(),
                });
            }

            if (modalType === 'edit' && selectedBatch) {
                await api.patch(`/stock/batches/${selectedBatch.id}`, {
                    batchNum: batchNumInput.trim() || null,
                    expiry: expiryInput.trim() || null,
                    qty: qtyInput.trim() || null,
                    unit: unitInput.trim() || null,
                });
            }

            if (modalType === 'delete' && selectedBatch) {
                await api.delete(`/stock/batches/${selectedBatch.id}`);
            }

            if (modalType === 'consume') {
                if (!selectedDish) {
                    setModalError('Select a dish first.');
                    return;
                }
                if (!cookedQtyInput.trim()) {
                    setModalError('Enter the cooked quantity.');
                    return;
                }
                await api.post('/stock/consume', {
                    dishID: selectedDish.dishID,
                    quantity: cookedQtyInput.trim(),
                });
            }

            setRefreshKey((prev) => prev + 1);
            closeModal();
        } catch (saveError) {
            setModalError('Unable to save changes. Please try again.');
        }
    };

    const statusLabel = statusOptions.find((option) => option.value === statusFilter)?.label ?? 'All Status';

    const filteredIngredients = useMemo(() => {
        const needle = ingredientSearch.trim().toLowerCase();
        if (!needle) return availableIngredients;
        return availableIngredients.filter((ing) => ing.ingName.toLowerCase().includes(needle));
    }, [availableIngredients, ingredientSearch]);

    const filteredDishes = useMemo(() => {
        const needle = dishSearch.trim().toLowerCase();
        if (!needle) return availableDishes;
        return availableDishes.filter((dish) => dish.dishName.toLowerCase().includes(needle));
    }, [availableDishes, dishSearch]);

    const loadAvailableDishes = async () => {
        try {
            const response = await api.get('/inventory/dishes');
            const dishes = response.data?.dishes ?? [];
            setAvailableDishes(
                dishes.map((dish: { dishID: number; dishName?: string }) => ({
                    dishID: dish.dishID,
                    dishName: dish.dishName || '-',
                }))
            );
        } catch (fetchError) {
            setModalError('Unable to load dishes.');
        }
    };

    useEffect(() => {
        const fetchBatches = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.get('/stock/batches');
                const serverBatches = response.data?.batches ?? [];
                setBatches(
                    serverBatches.map((batch: { ingID: number; ingName?: string; category?: string; batchNum?: string; expiry?: string; qty?: number; unit?: string }) => ({
                        id: batch.ingID,
                        name: batch.ingName || '-',
                        category: batch.category ?? null,
                        batchNum: batch.batchNum ?? null,
                        expiry: batch.expiry ?? null,
                        qty: typeof batch.qty === 'number' ? batch.qty : batch.qty ? Number(batch.qty) : null,
                        unit: batch.unit ?? null,
                    }))
                );
            } catch (fetchError) {
                setError('Unable to load stock batches.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBatches();
    }, [refreshKey]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <AuthHeader activeRoute="/Stock" />

            <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
                <View style={styles.contentWrapper}>
                    <View style={styles.pageHeader}>
                        <View>
                            <Text style={styles.title}>Batch Inventory</Text>
                            <Text style={styles.subtitle}>Manage stock by batch and expiry date</Text>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => exportSpreadsheet('/export/stock', 'stock.csv')}
                            >
                                <Ionicons name="download-outline" size={14} color="#374151" style={{ marginRight: 4 }} />
                                <Text style={styles.secondaryButtonText}>Export CSV</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={async () => {
                                    const result = await importSpreadsheet('/import/stock');
                                    if (result) setRefreshKey((prev) => prev + 1);
                                }}
                            >
                                <Ionicons name="cloud-upload-outline" size={14} color="#374151" style={{ marginRight: 4 }} />
                                <Text style={styles.secondaryButtonText}>Import CSV</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryButton} onPress={() => openModal('add')}>
                                <Text style={styles.primaryButtonText}>Add Batch</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => openModal('consume')}>
                                <Text style={styles.secondaryButtonText}>Log Cooked</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, styles.statCardHighlight]}>
                            <Text style={styles.statValue}>{batches.length}</Text>
                            <Text style={styles.statLabel}>Total Batches</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, styles.statHealthy]}>{stats.healthy}</Text>
                            <Text style={styles.statLabel}>Healthy</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, styles.statExpiring]}>{stats.expiring}</Text>
                            <Text style={styles.statLabel}>Expiring Soon</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, styles.statExpired]}>{stats.expired}</Text>
                            <Text style={styles.statLabel}>Expired</Text>
                        </View>
                    </View>

                    <View style={styles.filtersCard}>
                        <View style={styles.filterRow}>
                            <View style={styles.searchWrapper}>
                                <View style={styles.searchInputWrapper}>
                                    <Ionicons name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
                                    <TextInput
                                        style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                        placeholder="Search by ingredient or batch ID..."
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
                            <TouchableOpacity style={styles.selectButton} onPress={() => setStatusPickerOpen((prev) => !prev)}>
                                <Ionicons name="filter" size={14} color="#6b7280" />
                                <Text style={styles.selectText}>{statusLabel}</Text>
                                <Ionicons name="chevron-down" size={14} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryButton} onPress={() => toggleSort('expiry')}>
                                <Text style={styles.primaryButtonText}>Sort by Expiry</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => {
                                    setSearch('');
                                    setStatusFilter('all');
                                    setSortField(null);
                                    setSortDirection('asc');
                                }}
                            >
                                <Text style={styles.secondaryButtonText}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                        {statusPickerOpen && (
                            <View style={styles.dropdownMenu}>
                                {statusOptions.map((option) => {
                                    const isActive = option.value === statusFilter;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[styles.dropdownOption, isActive && styles.dropdownOptionActive]}
                                            onPress={() => {
                                                setStatusFilter(option.value);
                                                setStatusPickerOpen(false);
                                            }}
                                        >
                                            <Text style={[styles.dropdownOptionText, isActive && styles.dropdownOptionTextActive]}>
                                                {option.label}
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
                            <TouchableOpacity style={[styles.tableCell, styles.cellName]} onPress={() => toggleSort('name')}>
                                <Text style={styles.tableHeaderText}>Ingredient</Text>
                                <Ionicons name="swap-vertical" size={12} color="#6b7280" />
                            </TouchableOpacity>
                            <View style={[styles.tableCell, styles.cellCategory]}>
                                <Text style={styles.tableHeaderText}>Category</Text>
                            </View>
                            <TouchableOpacity style={[styles.tableCell, styles.cellBatch]} onPress={() => toggleSort('batchNum')}>
                                <Text style={styles.tableHeaderText}>Batch ID</Text>
                                <Ionicons name="swap-vertical" size={12} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tableCell, styles.cellQuantity]} onPress={() => toggleSort('qty')}>
                                <Text style={styles.tableHeaderText}>Quantity</Text>
                                <Ionicons name="swap-vertical" size={12} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tableCell, styles.cellDate]} onPress={() => toggleSort('expiry')}>
                                <Text style={styles.tableHeaderText}>Expires</Text>
                                <Ionicons name="swap-vertical" size={12} color="#6b7280" />
                            </TouchableOpacity>
                            <View style={[styles.tableCell, styles.cellStatus]}>
                                <Text style={styles.tableHeaderText}>Status</Text>
                            </View>
                            <View style={[styles.tableCell, styles.cellActions]}>
                                <Text style={styles.tableHeaderText}>Actions</Text>
                            </View>
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
                        {!isLoading && !error && filtered.length === 0 && (
                            <View style={styles.tableRow}>
                                <View style={styles.tableCell}>
                                    <Text style={styles.cellSecondary}>No batches found.</Text>
                                </View>
                            </View>
                        )}
                        {!isLoading && !error && paginatedRows.map((batch) => {
                            const status = getStatus(batch.expiry);
                            return (
                                <View key={batch.id} style={styles.tableRow}>
                                    <View style={styles.cellThumb}>
                                        <FoodThumbnail name={batch.name} size={36} type="ingredient" />
                                    </View>
                                    <View style={[styles.tableCell, styles.cellName]}>
                                        <Text style={styles.cellPrimary}>{batch.name}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellCategory]}>
                                        <Text style={styles.cellSecondary}>{batch.category || '-'}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellBatch]}>
                                        <Text style={styles.cellMono}>{batch.batchNum || '-'}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellQuantity]}>
                                        <Text style={styles.cellPrimary}>
                                            {batch.qty ?? '-'} {batch.unit || ''}
                                        </Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellDate]}>
                                        <Text style={styles.cellSecondary}>{batch.expiry || '-'}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellStatus]}>
                                        <View style={[styles.statusPill, status.pillStyle]}>
                                            <Text style={styles.statusText}>{status.label}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellActions]}>
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity onPress={() => openModal('edit', batch)} style={styles.iconButton}>
                                                <Ionicons name="pencil" size={16} color="#2563eb" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => openModal('delete', batch)} style={styles.iconButton}>
                                                <Ionicons name="trash" size={16} color="#dc2626" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Pagination */}
                    {!isLoading && !error && filtered.length > 0 && (
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
                                                style={[styles.dropdownOption, n === itemsPerPage && styles.dropdownOptionActive]}
                                                onPress={() => { setItemsPerPage(n); setShowPerPageMenu(false); }}
                                            >
                                                <Text style={[styles.dropdownOptionText, n === itemsPerPage && styles.dropdownOptionTextActive]}>{n}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                            <Text style={styles.paginationInfo}>
                                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
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
                        <Text style={styles.modalTitle}>
                            {modalType === 'edit' && 'Edit Batch'}
                            {modalType === 'delete' && 'Delete Batch'}
                            {modalType === 'add' && 'Add Batch'}
                            {modalType === 'consume' && 'Log Cooked Dish'}
                        </Text>
                        {modalType === 'edit' && selectedBatch && (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalLabel}>Batch</Text>
                                <Text style={styles.modalValue}>{selectedBatch.name}</Text>
                                <Text style={styles.modalLabel}>Batch ID (optional)</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="e.g. BTH-001-2024"
                                    value={batchNumInput}
                                    onChangeText={setBatchNumInput}
                                />
                                <Text style={styles.modalLabel}>Quantity</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={qtyInput}
                                    onChangeText={setQtyInput}
                                />
                                <Text style={styles.modalLabel}>Unit</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="kg, lb, L"
                                    value={unitInput}
                                    onChangeText={setUnitInput}
                                />
                                <Text style={styles.modalLabel}>Expiry date (YYYY-MM-DD)</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="2024-02-10"
                                    value={expiryInput}
                                    onChangeText={setExpiryInput}
                                />
                            </View>
                        )}
                        {modalType === 'delete' && selectedBatch && (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalValue}>Are you sure you want to delete this batch? This action cannot be undone.</Text>
                                <View style={styles.modalInfoBox}>
                                    <Text style={styles.modalInfoText}>{selectedBatch.name}</Text>
                                    <Text style={styles.modalInfoText}>{selectedBatch.batchNum || 'No batch ID'}</Text>
                                </View>
                            </View>
                        )}
                        {modalType === 'add' && (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalLabel}>Ingredient type</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Search ingredient types..."
                                    value={ingredientSearch}
                                    onChangeText={setIngredientSearch}
                                />
                                <View style={styles.ingredientList}>
                                    {filteredIngredients.map((ingredient) => (
                                        <TouchableOpacity
                                            key={ingredient.ingID}
                                            style={styles.ingredientRow}
                                            onPress={() => setSelectedIngredient(ingredient)}
                                        >
                                            <Text style={styles.ingredientName}>{ingredient.ingName}</Text>
                                            <Text style={styles.ingredientCategory}>{ingredient.category || 'Uncategorized'}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {selectedIngredient && (
                                    <Text style={styles.modalValue}>Selected: {selectedIngredient.ingName}</Text>
                                )}
                                <Text style={styles.modalLabel}>Batch ID (optional)</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="e.g. BTH-001-2024"
                                    value={batchNumInput}
                                    onChangeText={setBatchNumInput}
                                />
                                <Text style={styles.modalLabel}>Quantity</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={qtyInput}
                                    onChangeText={setQtyInput}
                                />
                                <Text style={styles.modalLabel}>Unit</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="kg, lb, L"
                                    value={unitInput}
                                    onChangeText={setUnitInput}
                                />
                                <Text style={styles.modalLabel}>Expiry date (YYYY-MM-DD)</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="2024-02-10"
                                    value={expiryInput}
                                    onChangeText={setExpiryInput}
                                />
                            </View>
                        )}

                        {modalType === 'consume' && (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalLabel}>Dish</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Search dishes..."
                                    value={dishSearch}
                                    onChangeText={setDishSearch}
                                />
                                <View style={styles.ingredientList}>
                                    {filteredDishes.map((dish) => (
                                        <TouchableOpacity
                                            key={dish.dishID}
                                            style={styles.ingredientRow}
                                            onPress={() => setSelectedDish(dish)}
                                        >
                                            <Text style={styles.ingredientName}>{dish.dishName}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {selectedDish && (
                                    <Text style={styles.modalValue}>Selected: {selectedDish.dishName}</Text>
                                )}
                                <Text style={styles.modalLabel}>Cooked quantity</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={cookedQtyInput}
                                    onChangeText={setCookedQtyInput}
                                />
                            </View>
                        )}

                        {modalError && <Text style={styles.modalError}>{modalError}</Text>}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm}>
                                <Text style={styles.primaryButtonText}>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButton} onPress={closeModal}>
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>
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
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 24,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flexGrow: 1,
        minWidth: 200,
        backgroundColor: Colors.landing.white,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 16,
    },
    statCardHighlight: {
        backgroundColor: Colors.landing.lightPurple,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '600',
        color: Colors.landing.primaryPurple,
        marginBottom: 6,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    statHealthy: {
        color: '#15803d',
    },
    statExpiring: {
        color: '#a16207',
    },
    statExpired: {
        color: '#b91c1c',
    },
    filtersCard: {
        backgroundColor: Colors.landing.lightPurple,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
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
        minWidth: 160,
    },
    selectText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
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
        paddingVertical: 12,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
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
        flex: 2.2,
    },
    cellCategory: {
        flex: 1.4,
    },
    cellBatch: {
        flex: 1.6,
    },
    cellQuantity: {
        flex: 1.3,
        justifyContent: 'flex-end',
    },
    cellDate: {
        flex: 1.4,
    },
    cellStatus: {
        flex: 1.3,
        justifyContent: 'center',
    },
    cellActions: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    cellPrimary: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    cellSecondary: {
        fontSize: 12,
        color: '#6b7280',
    },
    cellMono: {
        fontSize: 12,
        color: '#6b7280',
        fontVariant: ['tabular-nums'],
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    statusHealthy: {
        backgroundColor: '#dcfce7',
        borderColor: '#bbf7d0',
    },
    statusExpiring: {
        backgroundColor: '#fef3c7',
        borderColor: '#fde68a',
    },
    statusExpired: {
        backgroundColor: '#fee2e2',
        borderColor: '#fecaca',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#f3f4f6',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: Colors.landing.white,
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    modalBody: {
        gap: 12,
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
    },
    modalValue: {
        fontSize: 13,
        color: '#111827',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
    },
    modalError: {
        fontSize: 12,
        color: '#b91c1c',
        fontWeight: '600',
        marginBottom: 8,
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
    modalInfoBox: {
        backgroundColor: '#f3f4f6',
        borderRadius: 6,
        padding: 12,
    },
    modalInfoText: {
        fontSize: 12,
        color: '#6b7280',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    dropdownMenu: {
        marginTop: 12,
        backgroundColor: Colors.landing.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    dropdownOption: {
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dropdownOptionActive: {
        backgroundColor: Colors.landing.lightPurple,
    },
    dropdownOptionText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    dropdownOptionTextActive: {
        color: Colors.landing.primaryPurple,
        fontWeight: '600',
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

});
