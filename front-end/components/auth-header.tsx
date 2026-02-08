import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { deleteToken, deleteUserId } from '@/services/storage';

const fontFamilies = {
    regular: 'IBMPlexSans_400Regular',
    semiBold: 'IBMPlexSans_600SemiBold',
    bold: 'IBMPlexSans_700Bold',
    groteskBold: 'SpaceGrotesk_700Bold',
};

type AuthHeaderProps = {
    activeRoute?: string;
    onChatPress?: () => void;
};

const navItems = [
    { label: 'Dashboard', route: '/Dashboard' },
    { label: 'Stock', route: '/Stock' },
    { label: 'Inventory', route: '/Inventory' },
    { label: 'Chat', route: null }, // Chat uses popup instead of navigation
    { label: 'Support', route: '/Support' },
    { label: 'Users', route: '/Users' },
];

export default function AuthHeader({ activeRoute, onChatPress }: AuthHeaderProps) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await deleteToken();
            await deleteUserId();
        } finally {
            router.replace('/login');
        }
    };

    const handleNavPress = (item: typeof navItems[0]) => {
        if (item.label === 'Chat' && onChatPress) {
            onChatPress();
        } else if (item.route) {
            router.push(item.route);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inner}>
                <View style={styles.leftGroup}>
                    <Text style={styles.brand}>StockSense</Text>
                    <View style={styles.nav}>
                        {navItems.map((item) => {
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
                        <Text style={styles.userName}>Admin User</Text>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>AU</Text>
                        </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: fontFamilies.semiBold,
        fontWeight: '600',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.landing.primaryPurple,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: Colors.landing.white,
        fontFamily: fontFamilies.bold,
        fontWeight: '700',
        fontSize: 11,
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
