import React, { useMemo, useState } from 'react';
import {
    Modal,
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
import ChatWidget from '@/components/ChatWidget';

type Batch = {
    id: number;
    name: string;
    batchId: string;
    quantity: number;
    unit: string;
    received: string;
    expires: string;
};

type StatusFilter = 'all' | 'healthy' | 'expiring' | 'expired';

type ModalType = 'add' | 'adjust' | 'waste' | 'delete' | null;

const initialBatches: Batch[] = [
    { id: 1, name: 'Organic Tomatoes', batchId: 'BTH-001-2024', quantity: 25, unit: 'kg', received: '2024-02-01', expires: '2024-02-10' },
    { id: 2, name: 'Fresh Mozzarella', batchId: 'BTH-002-2024', quantity: 12, unit: 'kg', received: '2024-02-03', expires: '2024-02-08' },
    { id: 3, name: 'Basil Leaves', batchId: 'BTH-003-2024', quantity: 3.5, unit: 'kg', received: '2024-02-05', expires: '2024-02-15' },
    { id: 4, name: 'Olive Oil', batchId: 'BTH-004-2024', quantity: 50, unit: 'L', received: '2024-01-15', expires: '2024-12-31' },
    { id: 5, name: 'Chicken Breast', batchId: 'BTH-005-2024', quantity: 18, unit: 'kg', received: '2024-02-04', expires: '2024-02-06' },
    { id: 6, name: 'Fresh Lettuce', batchId: 'BTH-006-2024', quantity: 8, unit: 'kg', received: '2024-02-06', expires: '2024-02-09' },
];

const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: 'All Status', value: 'all' },
    { label: 'Healthy', value: 'healthy' },
    { label: 'Expiring Soon', value: 'expiring' },
    { label: 'Expired', value: 'expired' },
];

export default function Stock() {
    const [batches, setBatches] = useState<Batch[]>(initialBatches);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortField, setSortField] = useState<keyof Batch | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [modalType, setModalType] = useState<ModalType>(null);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [quantityInput, setQuantityInput] = useState('');
    const [wasteReason, setWasteReason] = useState('');
    const [statusPickerOpen, setStatusPickerOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const today = useMemo(() => new Date(), []);

    const getStatus = (expires: string) => {
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
                const status = getStatus(batch.expires).filter;
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
                batch.batchId.toLowerCase().includes(lowered);
            const status = getStatus(batch.expires).filter;
            const matchesStatus = statusFilter === 'all' || statusFilter === status;
            return matchesSearch && matchesStatus;
        });

        if (sortField) {
            result = [...result].sort((a, b) => {
                let aVal: string | number = a[sortField];
                let bVal: string | number = b[sortField];

                if (sortField === 'quantity') {
                    aVal = Number(aVal);
                    bVal = Number(bVal);
                }

                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [batches, search, sortField, sortDirection, statusFilter]);

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
        setQuantityInput(batch ? String(batch.quantity) : '');
        setWasteReason('');
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedBatch(null);
        setQuantityInput('');
        setWasteReason('');
    };

    const handleConfirm = () => {
        if (!modalType) return;

        if (modalType === 'adjust' && selectedBatch) {
            const nextQuantity = Number(quantityInput);
            if (!Number.isNaN(nextQuantity)) {
                // TODO: replace with backend call to update batch quantity.
                setBatches((prev) =>
                    prev.map((batch) => (batch.id === selectedBatch.id ? { ...batch, quantity: nextQuantity } : batch))
                );
            }
        }

        if ((modalType === 'waste' || modalType === 'delete') && selectedBatch) {
            // TODO: replace with backend call to remove or update batch.
            setBatches((prev) => prev.filter((batch) => batch.id !== selectedBatch.id));
        }

        if (modalType === 'add') {
            // TODO: replace with backend call to create a new batch.
        }

        closeModal();
    };

    const statusLabel = statusOptions.find((option) => option.value === statusFilter)?.label ?? 'All Status';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <AuthHeader activeRoute="/Stock" onChatPress={() => setIsChatOpen(true)} />

            <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
                <View style={styles.contentWrapper}>
                    <View style={styles.pageHeader}>
                        <View>
                            <Text style={styles.title}>Batch Inventory</Text>
                            <Text style={styles.subtitle}>Manage stock by batch and expiry date</Text>
                        </View>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => openModal('add')}>
                            <Text style={styles.primaryButtonText}>Add Batch</Text>
                        </TouchableOpacity>
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
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search by ingredient or batch ID..."
                                    value={search}
                                    onChangeText={setSearch}
                                />
                            </View>
                            <TouchableOpacity style={styles.selectButton} onPress={() => setStatusPickerOpen(true)}>
                                <Text style={styles.selectText}>{statusLabel}</Text>
                                <Ionicons name="chevron-down" size={16} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryButton} onPress={() => toggleSort('expires')}>
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
                    </View>

                    <View style={styles.tableCard}>
                        <View style={styles.tableHeader}>
                            <TouchableOpacity style={[styles.tableCell, styles.cellName]} onPress={() => toggleSort('name')}>
                                <Text style={styles.tableHeaderText}>Ingredient</Text>
                                <Ionicons name="swap-vertical" size={12} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tableCell, styles.cellBatch]} onPress={() => toggleSort('batchId')}>
                                <Text style={styles.tableHeaderText}>Batch ID</Text>
                                <Ionicons name="swap-vertical" size={12} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tableCell, styles.cellQuantity]} onPress={() => toggleSort('quantity')}>
                                <Text style={styles.tableHeaderText}>Quantity</Text>
                                <Ionicons name="swap-vertical" size={12} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tableCell, styles.cellDate]} onPress={() => toggleSort('received')}>
                                <Text style={styles.tableHeaderText}>Received</Text>
                                <Ionicons name="swap-vertical" size={12} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tableCell, styles.cellDate]} onPress={() => toggleSort('expires')}>
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

                        {filtered.map((batch) => {
                            const status = getStatus(batch.expires);
                            return (
                                <View key={batch.id} style={styles.tableRow}>
                                    <View style={[styles.tableCell, styles.cellName]}>
                                        <Text style={styles.cellPrimary}>{batch.name}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellBatch]}>
                                        <Text style={styles.cellMono}>{batch.batchId}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellQuantity]}>
                                        <Text style={styles.cellPrimary}>{batch.quantity} {batch.unit}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellDate]}>
                                        <Text style={styles.cellSecondary}>{batch.received}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellDate]}>
                                        <Text style={styles.cellSecondary}>{batch.expires}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellStatus]}>
                                        <View style={[styles.statusPill, status.pillStyle]}>
                                            <Text style={styles.statusText}>{status.label}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellActions]}>
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity onPress={() => openModal('adjust', batch)} style={styles.iconButton}>
                                                <Ionicons name="pencil" size={16} color="#2563eb" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => openModal('waste', batch)} style={styles.iconButton}>
                                                <Ionicons name="alert-circle" size={16} color="#ea580c" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => openModal('delete', batch)} style={styles.iconButton}>
                                                <Ionicons name="close" size={16} color="#dc2626" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            <Modal transparent visible={modalType !== null} animationType="fade" onRequestClose={closeModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {modalType === 'adjust' && 'Adjust Quantity'}
                            {modalType === 'waste' && 'Mark as Waste'}
                            {modalType === 'delete' && 'Delete Batch'}
                            {modalType === 'add' && 'Add Batch'}
                        </Text>
                        {modalType === 'adjust' && selectedBatch && (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalLabel}>Batch</Text>
                                <Text style={styles.modalValue}>{selectedBatch.batchId} - {selectedBatch.name}</Text>
                                <Text style={styles.modalLabel}>New Quantity ({selectedBatch.unit})</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    keyboardType="numeric"
                                    value={quantityInput}
                                    onChangeText={setQuantityInput}
                                />
                            </View>
                        )}
                        {modalType === 'waste' && selectedBatch && (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalLabel}>Batch</Text>
                                <Text style={styles.modalValue}>{selectedBatch.batchId} - {selectedBatch.name}</Text>
                                <Text style={styles.modalLabel}>Reason</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Expired, spoiled, damaged..."
                                    value={wasteReason}
                                    onChangeText={setWasteReason}
                                />
                            </View>
                        )}
                        {modalType === 'delete' && selectedBatch && (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalValue}>Are you sure you want to delete this batch? This action cannot be undone.</Text>
                                <View style={styles.modalInfoBox}>
                                    <Text style={styles.modalInfoText}>{selectedBatch.batchId}</Text>
                                    <Text style={styles.modalInfoText}>{selectedBatch.name} - {selectedBatch.quantity} {selectedBatch.unit}</Text>
                                </View>
                            </View>
                        )}
                        {modalType === 'add' && (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalValue}>Batch creation will be wired to the backend soon.</Text>
                            </View>
                        )}

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

            <Modal transparent visible={statusPickerOpen} animationType="fade" onRequestClose={() => setStatusPickerOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerCard}>
                        <Text style={styles.modalTitle}>Select Status</Text>
                        {statusOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={styles.pickerOption}
                                onPress={() => {
                                    setStatusFilter(option.value);
                                    setStatusPickerOpen(false);
                                }}
                            >
                                <Text style={styles.pickerText}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setStatusPickerOpen(false)}>
                            <Text style={styles.secondaryButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Floating Chat Widget */}
            <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
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
    secondaryButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
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
        borderRadius: 12,
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
        borderRadius: 12,
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: Colors.landing.white,
        minWidth: 140,
        justifyContent: 'space-between',
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
    cellName: {
        flex: 2.2,
    },
    cellBatch: {
        flex: 1.6,
    },
    cellQuantity: {
        flex: 1.2,
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
        borderRadius: 8,
        backgroundColor: '#f9fafb',
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
        borderRadius: 12,
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
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
    },
    modalInfoBox: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
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
    pickerCard: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: Colors.landing.white,
        borderRadius: 12,
        padding: 20,
        gap: 10,
    },
    pickerOption: {
        paddingVertical: 8,
    },
    pickerText: {
        fontSize: 14,
        color: '#111827',
    },
});
