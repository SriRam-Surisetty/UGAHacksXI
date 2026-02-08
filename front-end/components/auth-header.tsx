import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import api from '@/services/api';
import { deleteToken, deleteUserId, deleteUserProfile, getToken, getUserProfile, saveUserProfile } from '@/services/storage';

const fontFamilies = {
    regular: 'IBMPlexSans_400Regular',
    semiBold: 'IBMPlexSans_600SemiBold',
    bold: 'IBMPlexSans_700Bold',
    groteskBold: 'SpaceGrotesk_700Bold',
};

type AuthHeaderProps = {
    activeRoute?: string;
};

const navItems = [
    { label: 'Dashboard', route: '/Dashboard' },
    { label: 'Stock', route: '/Stock' },
    { label: 'Inventory', route: '/Inventory' },
    { label: 'Users', route: '/Users' },
    { label: 'Support', route: '/Support' },
];

export default function AuthHeader({ activeRoute }: AuthHeaderProps) {
    const router = useRouter();
    const [orgName, setOrgName] = useState('Organization');
    const [roleName, setRoleName] = useState('User');
    const [email, setEmail] = useState('');

    useEffect(() => {
        let isMounted = true;

        const verifySession = async () => {
            try {
                const token = await getToken();
                if (!token && isMounted) {
                    await deleteToken();
                    await deleteUserId();
                    await deleteUserProfile();
                    router.replace('/login');
                    return;
                }
            } catch (error) {
                if (isMounted) {
                    router.replace('/login');
                }
            }
        };

        verifySession();

        return () => {
            isMounted = false;
        };
    }, [router]);

    useEffect(() => {
        let isMounted = true;

        const loadUserInfo = async () => {
            try {
                const cached = await getUserProfile();
                if (cached && isMounted) {
                    setOrgName(cached.orgName || 'Organization');
                    setRoleName(cached.role || 'User');
                    setEmail(cached.email || '');
                    return;
                }

                const response = await api.get('/users/me');
                if (isMounted) {
                    setOrgName(response.data?.orgName || 'Organization');
                    setRoleName(response.data?.role || 'User');
                    setEmail(response.data?.email || '');
                    await saveUserProfile({
                        orgName: response.data?.orgName ?? null,
                        role: response.data?.role ?? null,
                        email: response.data?.email ?? null,
                    });
                }
            } catch (error) {
                if (isMounted) {
                    setOrgName('Organization');
                    setRoleName('User');
                    setEmail('');
                }
            }
        };

        loadUserInfo();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleLogout = async () => {
        try {
            await deleteToken();
            await deleteUserId();
            await deleteUserProfile();
        } finally {
            router.replace('/login');
        }
    };

    const handleNavPress = (item: typeof navItems[0]) => {
        if (item.route) {
            router.push(item.route);
        }
    };

    const visibleNavItems = roleName.toLowerCase() === 'admin'
        ? navItems
        : navItems.filter((item) => item.route !== '/Users');

    return (
        <View style={styles.container}>
            <View style={styles.inner}>
                <View style={styles.leftGroup}>
                    <Text style={styles.brand}>StockSense</Text>
                    <View style={styles.nav}>
                        {visibleNavItems.map((item) => {
                            const isActive = activeRoute === item.route;
                            return (
                                <TouchableOpacity key={item.label} onPress={() => handleNavPress(item)}>
                                    <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
                <View style={styles.rightGroup}>
                    <View style={styles.userGroup}>
                        <Text style={styles.userName}>{orgName}</Text>
                        <Text style={styles.roleName}>
                            {email ? `${email} (${roleName})` : roleName}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.landing.white,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    inner: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 20,
        flexWrap: 'wrap',
        width: '100%',
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
    },
    brand: {
        fontSize: 22,
        fontFamily: fontFamilies.groteskBold,
        fontWeight: '700',
        color: Colors.landing.primaryPurple,
    },
    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        fontFamily: fontFamilies.semiBold,
        fontWeight: '600',
        gap: 20,
    },
    navText: {
        fontFamily: fontFamilies.bold,
        color: '#6b7280',
        fontWeight: '600',
    },
    navTextActive: {
        color: Colors.landing.primaryPurple,
        fontWeight: '700',
    },
    rightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        marginLeft: 'auto',
    },
    userGroup: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 2,
    },
    userName: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: fontFamilies.semiBold,
        fontWeight: '600',
    },
    roleName: {
        fontSize: 12,
        color: '#9ca3af',
        fontFamily: fontFamilies.regular,
        fontWeight: '500',
    },
    logoutButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.landing.primaryPurple,
    },
    logoutText: {
        color: Colors.landing.white,
        fontFamily: fontFamilies.semiBold,
        fontWeight: '600',
        fontSize: 14,
    },
});
