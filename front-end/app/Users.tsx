import { useEffect, useMemo, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
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

    // Edit modal state
    const [editUser, setEditUser] = useState<UserRow | null>(null);
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRole, setEditRole] = useState<'admin' | 'manager'>('manager');
    const [isEditing, setIsEditing] = useState(false);

    const openEditModal = (user: UserRow) => {
        setEditUser(user);
        setEditEmail(user.email);
        setEditPassword('');
        setEditRole(user.role as 'admin' | 'manager');
    };

    const closeEditModal = () => {
        setEditUser(null);
        setEditEmail('');
        setEditPassword('');
        setEditRole('manager');
    };

    const handleEditUser = async () => {
        if (!editUser) return;
        if (isEditing) return;
        setIsEditing(true);
        setNotice(null);

        try {
            const body: Record<string, string> = {};
            if (editEmail && editEmail !== editUser.email) body.email = editEmail;
            if (editPassword) body.password = editPassword;
            if (editRole !== editUser.role) body.role = editRole;

            if (Object.keys(body).length === 0) {
                closeEditModal();
                return;
            }

            await api.patch(`/users/${editUser.userID}`, body);
            setNotice({ type: 'success', message: 'User updated.' });
            closeEditModal();
            setRefreshKey((prev) => prev + 1);
        } catch (error: any) {
            const message = error?.response?.data?.error || 'Unable to update user.';
            setNotice({ type: 'error', message });
        } finally {
            setIsEditing(false);
        }
    };

    const handleDeleteUser = async (user: UserRow) => {
        setNotice(null);
        try {
            await api.delete(`/users/${user.userID}`);
            setNotice({ type: 'success', message: `${user.email} deleted.` });
            setRefreshKey((prev) => prev + 1);
        } catch (error: any) {
            const message = error?.response?.data?.error || 'Unable to delete user.';
            setNotice({ type: 'error', message });
        }
    };

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
                        <Text style={[styles.tableCellSmall, styles.tableHeaderText]}>Role</Text>
                        <Text style={[styles.tableCellActions, styles.tableHeaderText]}>Actions</Text>
                    </View>
                    {isLoading ? (
                        <Text style={styles.loadingText}>Loading users...</Text>
                    ) : sortedUsers.length ? (
                        sortedUsers.map((user) => (
                            <View key={user.userID} style={styles.tableRow}>
                                <Text style={styles.tableCell}>{user.email}</Text>
                                <Text style={styles.tableCellSmall}>{user.role}</Text>
                                <View style={styles.tableCellActions}>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(user)}>
                                        <Ionicons name="pencil" size={16} color={Colors.landing.primaryPurple} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionBtnDanger} onPress={() => handleDeleteUser(user)}>
                                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No users found.</Text>
                    )}
                </View>
            </ScrollView>

            {/* Edit User Modal */}
            <Modal visible={!!editUser} transparent animationType="fade" onRequestClose={closeEditModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.sectionTitle}>Edit user</Text>
                            <TouchableOpacity onPress={closeEditModal}>
                                <Ionicons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="name@company.com"
                                value={editEmail}
                                onChangeText={setEditEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!isEditing}
                            />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>New password (leave blank to keep current)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter new password"
                                value={editPassword}
                                onChangeText={setEditPassword}
                                secureTextEntry
                                editable={!isEditing}
                            />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Role</Text>
                            <View style={styles.roleToggle}>
                                <TouchableOpacity
                                    style={[styles.roleOption, editRole === 'manager' && styles.roleOptionActive]}
                                    onPress={() => setEditRole('manager')}
                                    disabled={isEditing}
                                >
                                    <Text style={[styles.roleOptionText, editRole === 'manager' && styles.roleOptionTextActive]}>
                                        Manager
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleOption, editRole === 'admin' && styles.roleOptionActive]}
                                    onPress={() => setEditRole('admin')}
                                    disabled={isEditing}
                                >
                                    <Text style={[styles.roleOptionText, editRole === 'admin' && styles.roleOptionTextActive]}>
                                        Admin
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnSecondary} onPress={closeEditModal} disabled={isEditing}>
                                <Text style={styles.btnSecondaryText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnPrimary} onPress={handleEditUser} disabled={isEditing}>
                                <Text style={styles.btnPrimaryText}>{isEditing ? 'Saving...' : 'Save changes'}</Text>
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
        borderColor: '#d1d5db',
        borderRadius: 8,
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
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
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
        borderRadius: 8,
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
    tableCellSmall: {
        width: 80,
        fontSize: 13,
        color: '#374151',
    },
    tableCellActions: {
        width: 80,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'flex-end',
    },
    actionBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#f3f0ff',
    },
    actionBtnDanger: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#fef2f2',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: Colors.landing.white,
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 440,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    btnSecondary: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    btnSecondaryText: {
        fontWeight: '700',
        fontSize: 14,
        color: '#374151',
    },
});
