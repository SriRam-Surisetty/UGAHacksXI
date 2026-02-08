import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';
import api from '@/services/api';
import { getUserProfile, saveUserProfile } from '@/services/storage';

type UserRow = {
    userID: number;
    email: string;
    role: string;
};

export default function Users() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'manager'>('manager');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

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
            } catch (error) {
                if (isMounted) {
                    router.replace('/Dashboard');
                }
            } finally {
                if (isMounted) {
                    setIsCheckingRole(false);
                }
            }
        };

        verifyRole();

        return () => {
            isMounted = false;
        };
    }, [router]);

    useEffect(() => {
        if (!isAdmin) return;
        let isMounted = true;

        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/users');
                const entries = response.data?.users ?? [];
                if (isMounted) {
                    setUsers(entries);
                }
            } catch (error) {
                if (isMounted) {
                    setNotice({ type: 'error', message: 'Unable to load users.' });
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchUsers();

        return () => {
            isMounted = false;
        };
    }, [isAdmin, refreshKey]);

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => a.email.localeCompare(b.email));
    }, [users]);

    const handleCreateUser = async () => {
        if (!email || !password || !role) {
            setNotice({ type: 'error', message: 'Email, password, and role are required.' });
            return;
        }

        if (isSaving) return;

        setIsSaving(true);
        setNotice(null);

        try {
            await api.post('/users', { email, password, role });
            setNotice({ type: 'success', message: 'User created.' });
            setEmail('');
            setPassword('');
            setRole('manager');
            setRefreshKey((prev) => prev + 1);
        } catch (error: any) {
            const status = error?.response?.status;
            const message =
                status === 409
                    ? 'User already exists.'
                    : error?.response?.data?.error || 'Unable to create user.';
            setNotice({ type: 'error', message });
        } finally {
            setIsSaving(false);
        }
    };

    if (isCheckingRole) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <AuthHeader activeRoute="/Users" />
                <View style={styles.loadingWrap}>
                    <Text style={styles.loadingText}>Checking access...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <AuthHeader activeRoute="/Users" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.title}>Users</Text>
                        <Text style={styles.subtitle}>Add team members and manage access by role.</Text>
                    </View>
                </View>

                {notice && (
                    <View style={[styles.notice, notice.type === 'success' ? styles.noticeSuccess : styles.noticeError]}>
                        <Text style={styles.noticeText}>{notice.message}</Text>
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Add user</Text>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="name@company.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!isSaving}
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Temporary password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Create a password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!isSaving}
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Role</Text>
                        <View style={styles.roleToggle}>
                            <TouchableOpacity
                                style={[styles.roleOption, role === 'manager' && styles.roleOptionActive]}
                                onPress={() => setRole('manager')}
                                disabled={isSaving}
                            >
                                <Text style={[styles.roleOptionText, role === 'manager' && styles.roleOptionTextActive]}>
                                    Manager
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleOption, role === 'admin' && styles.roleOptionActive]}
                                onPress={() => setRole('admin')}
                                disabled={isSaving}
                            >
                                <Text style={[styles.roleOptionText, role === 'admin' && styles.roleOptionTextActive]}>
                                    Admin
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.helperText}>Managers can view inventory but cannot manage users.</Text>
                    </View>
                    <TouchableOpacity style={styles.btnPrimary} onPress={handleCreateUser} disabled={isSaving}>
                        <Text style={styles.btnPrimaryText}>{isSaving ? 'Creating...' : 'Create user'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.sectionTitle}>Team members</Text>
                        <Text style={styles.countText}>{sortedUsers.length} total</Text>
                    </View>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCell, styles.tableHeaderText]}>Email</Text>
                        <Text style={[styles.tableCell, styles.tableHeaderText]}>Role</Text>
                    </View>
                    {isLoading ? (
                        <Text style={styles.loadingText}>Loading users...</Text>
                    ) : sortedUsers.length ? (
                        sortedUsers.map((user) => (
                            <View key={user.userID} style={styles.tableRow}>
                                <Text style={styles.tableCell}>{user.email}</Text>
                                <Text style={styles.tableCell}>{user.role}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No users found.</Text>
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
    card: {
        backgroundColor: Colors.landing.white,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(52, 23, 85, 0.12)',
        shadowColor: '#111111',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 3,
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
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.landing.black,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: 'rgba(52, 23, 85, 0.15)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        backgroundColor: Colors.landing.white,
    },
    roleToggle: {
        flexDirection: 'row',
        gap: 10,
    },
    roleOption: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(52, 23, 85, 0.2)',
        alignItems: 'center',
    },
    roleOptionActive: {
        backgroundColor: Colors.landing.primaryPurple,
        borderColor: Colors.landing.primaryPurple,
    },
    roleOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4b5563',
    },
    roleOptionTextActive: {
        color: Colors.landing.white,
    },
    helperText: {
        marginTop: 8,
        fontSize: 12,
        color: '#6b7280',
    },
    btnPrimary: {
        backgroundColor: Colors.landing.primaryPurple,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnPrimaryText: {
        color: Colors.landing.white,
        fontWeight: '700',
        fontSize: 14,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    tableCell: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
    },
    tableHeaderText: {
        fontWeight: '700',
        color: '#111827',
    },
    countText: {
        fontSize: 12,
        color: '#6b7280',
    },
    notice: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
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
