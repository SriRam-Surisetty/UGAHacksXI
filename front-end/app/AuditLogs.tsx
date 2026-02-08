import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';
import api from '@/services/api';
import { getUserProfile, saveUserProfile } from '@/services/storage';

type AuditEntry = {
    logID: number;
    timestamp: string | null;
    userID: number | null;
    userEmail: string | null;
    action: string;
    resource_type: string;
    resource_id: number | null;
    details: Record<string, any> | null;
    ip_address: string | null;
};

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
    CREATE: { bg: '#dcfce7', text: '#166534' },
    UPDATE: { bg: '#dbeafe', text: '#1e40af' },
    DELETE: { bg: '#fef2f2', text: '#991b1b' },
    LOGIN: { bg: '#f3e8ff', text: '#6b21a8' },
    LOGIN_FAILED: { bg: '#fef2f2', text: '#991b1b' },
    EXPORT: { bg: '#fef9c3', text: '#854d0e' },
    IMPORT: { bg: '#fef9c3', text: '#854d0e' },
    CONSUME: { bg: '#ffedd5', text: '#9a3412' },
    CHAT: { bg: '#e0f2fe', text: '#0c4a6e' },
};

const PAGE_SIZE = 25;

export default function AuditLogs() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [resourceFilter, setResourceFilter] = useState('');

    const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'EXPORT', 'IMPORT', 'CONSUME', 'CHAT', 'ORDER'];
    const RESOURCES = ['auth', 'user', 'org', 'ingredient', 'dish', 'batch', 'stock', 'chat', 'settings'];

    useEffect(() => {
        let isMounted = true;
        const verifyRole = async () => {
            try {
                const cached = await getUserProfile();
                const cachedRole = String(cached?.role || '').toLowerCase();
                if (cachedRole) {
                    if (!isMounted) return;
                    if (cachedRole !== 'admin') {
                        router.replace('/Dashboard');
                        return;
                    }
                    setIsAdmin(true);
                    return;
                }
                const response = await api.get('/users/me');
                const userRole = String(response.data?.role || '').toLowerCase();
                if (!isMounted) return;
                if (userRole !== 'admin') {
                    router.replace('/Dashboard');
                    return;
                }
                setIsAdmin(true);
                await saveUserProfile({
                    orgName: response.data?.orgName ?? null,
                    role: response.data?.role ?? null,
                    email: response.data?.email ?? null,
                });
            } catch {
                if (isMounted) router.replace('/Dashboard');
            } finally {
                if (isMounted) setIsCheckingRole(false);
            }
        };
        verifyRole();
        return () => { isMounted = false; };
    }, [router]);

    useEffect(() => {
        if (!isAdmin) return;
        let isMounted = true;
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const params: Record<string, string | number> = {
                    page,
                    per_page: PAGE_SIZE,
                };
                if (actionFilter) params.action = actionFilter;
                if (resourceFilter) params.resource_type = resourceFilter;

                const response = await api.get('/audit-logs', { params });
                if (isMounted) {
                    setLogs(response.data?.logs ?? []);
                    setTotal(response.data?.total ?? 0);
                }
            } catch {
                if (isMounted) setNotice({ type: 'error', message: 'Unable to load audit logs.' });
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchLogs();
        return () => { isMounted = false; };
    }, [isAdmin, page, actionFilter, resourceFilter]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const formatTimestamp = (ts: string | null) => {
        if (!ts) return '-';
        const d = new Date(ts);
        return d.toLocaleString();
    };

    const formatDetails = (details: Record<string, any> | null) => {
        if (!details || Object.keys(details).length === 0) return '-';
        return Object.entries(details)
            .map(([k, v]) => {
                if (typeof v === 'object' && v !== null) {
                    if (v.from !== undefined && v.to !== undefined) {
                        return `${k}: ${v.from} \u2192 ${v.to}`;
                    }
                    return `${k}: ${JSON.stringify(v)}`;
                }
                return `${k}: ${v}`;
            })
            .join(', ');
    };

    const handleFilterAction = (action: string) => {
        setActionFilter((prev) => (prev === action ? '' : action));
        setPage(1);
    };

    const handleFilterResource = (resource: string) => {
        setResourceFilter((prev) => (prev === resource ? '' : resource));
        setPage(1);
    };

    if (isCheckingRole) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <AuthHeader activeRoute="/AuditLogs" />
                <View style={styles.loadingWrap}>
                    <Text style={styles.loadingText}>Checking access...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <AuthHeader activeRoute="/AuditLogs" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.title}>Audit Logs</Text>
                        <Text style={styles.subtitle}>
                            Track all actions performed across your organization.
                        </Text>
                    </View>
                    <Text style={styles.countText}>{total} entries</Text>
                </View>

                {notice && (
                    <View style={[styles.notice, notice.type === 'success' ? styles.noticeSuccess : styles.noticeError]}>
                        <Text style={styles.noticeText}>{notice.message}</Text>
                    </View>
                )}

                {/* Filters */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Filters</Text>
                    <Text style={styles.filterLabel}>Action</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                        {ACTIONS.map((a) => (
                            <TouchableOpacity
                                key={a}
                                style={[
                                    styles.filterChip,
                                    actionFilter === a && styles.filterChipActive,
                                ]}
                                onPress={() => handleFilterAction(a)}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        actionFilter === a && styles.filterChipTextActive,
                                    ]}
                                >
                                    {a}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <Text style={[styles.filterLabel, { marginTop: 12 }]}>Resource</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                        {RESOURCES.map((r) => (
                            <TouchableOpacity
                                key={r}
                                style={[
                                    styles.filterChip,
                                    resourceFilter === r && styles.filterChipActive,
                                ]}
                                onPress={() => handleFilterResource(r)}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        resourceFilter === r && styles.filterChipTextActive,
                                    ]}
                                >
                                    {r}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Log Table */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.sectionTitle}>Activity</Text>
                        <Text style={styles.pageInfo}>
                            Page {page} of {totalPages}
                        </Text>
                    </View>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCellTime, styles.tableHeaderText]}>Time</Text>
                        <Text style={[styles.tableCellUser, styles.tableHeaderText]}>User</Text>
                        <Text style={[styles.tableCellAction, styles.tableHeaderText]}>Action</Text>
                        <Text style={[styles.tableCellResource, styles.tableHeaderText]}>Resource</Text>
                        <Text style={[styles.tableCellIp, styles.tableHeaderText]}>IP Address</Text>
                        <Text style={[styles.tableCellDetails, styles.tableHeaderText]}>Details</Text>
                    </View>
                    {isLoading ? (
                        <Text style={styles.loadingText}>Loading...</Text>
                    ) : logs.length ? (
                        logs.map((log) => {
                            const colors = ACTION_COLORS[log.action] || { bg: '#f3f4f6', text: '#374151' };
                            return (
                                <View key={log.logID} style={styles.tableRow}>
                                    <Text style={styles.tableCellTime}>{formatTimestamp(log.timestamp)}</Text>
                                    <Text style={styles.tableCellUser} numberOfLines={1}>
                                        {log.userEmail || '-'}
                                    </Text>
                                    <View style={styles.tableCellAction}>
                                        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                                            <Text style={[styles.badgeText, { color: colors.text }]}>
                                                {log.action}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.tableCellResource}>{log.resource_type}</Text>
                                    <Text style={styles.tableCellIp} numberOfLines={1}>
                                        {log.ip_address || '-'}
                                    </Text>
                                    <Text style={styles.tableCellDetails} numberOfLines={2}>
                                        {formatDetails(log.details)}
                                    </Text>
                                </View>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyText}>No audit logs found.</Text>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <View style={styles.pagination}>
                            <TouchableOpacity
                                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                                onPress={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                <Ionicons name="chevron-back" size={16} color={page <= 1 ? '#d1d5db' : '#374151'} />
                                <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>Prev</Text>
                            </TouchableOpacity>
                            <Text style={styles.pageInfo}>
                                {page} / {totalPages}
                            </Text>
                            <TouchableOpacity
                                style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}>Next</Text>
                                <Ionicons name="chevron-forward" size={16} color={page >= totalPages ? '#d1d5db' : '#374151'} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
            <FloatingChatButton />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.landing.white,
    },
    content: {
        paddingHorizontal: 24,
        paddingVertical: 32,
        gap: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.landing.black,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#4a4a4a',
        maxWidth: 520,
    },
    countText: {
        fontSize: 12,
        color: '#6b7280',
    },
    card: {
        backgroundColor: Colors.landing.white,
        borderRadius: 10,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.landing.black,
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.landing.black,
        marginBottom: 8,
    },
    filterRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#d1d5db',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: Colors.landing.primaryPurple,
        borderColor: Colors.landing.primaryPurple,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4b5563',
    },
    filterChipTextActive: {
        color: Colors.landing.white,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tableHeaderText: {
        fontWeight: '700',
        color: '#111827',
        fontSize: 12,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        alignItems: 'center',
    },
    tableCellTime: {
        width: 160,
        fontSize: 12,
        color: '#374151',
    },
    tableCellUser: {
        width: 160,
        fontSize: 12,
        color: '#374151',
    },
    tableCellAction: {
        width: 120,
    },
    tableCellResource: {
        width: 100,
        fontSize: 12,
        color: '#374151',
    },
    tableCellIp: {
        width: 120,
        fontSize: 12,
        color: '#374151',
    },
    tableCellDetails: {
        flex: 1,
        fontSize: 12,
        color: '#6b7280',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginTop: 16,
    },
    pageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        gap: 4,
    },
    pageBtnDisabled: {
        borderColor: '#e5e7eb',
    },
    pageBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    pageBtnTextDisabled: {
        color: '#d1d5db',
    },
    pageInfo: {
        fontSize: 13,
        color: '#6b7280',
    },
    notice: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    noticeSuccess: {
        backgroundColor: '#eefaf2',
        borderColor: '#bbf7d0',
    },
    noticeError: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
    },
    noticeText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
    },
    emptyText: {
        paddingVertical: 16,
        fontSize: 13,
        color: '#6b7280',
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadingText: {
        fontSize: 14,
        color: '#6b7280',
    },
});
