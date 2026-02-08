import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';
import api from '@/services/api';
import { deleteUserProfile, getUserProfile, saveUserProfile } from '@/services/storage';

/* ─── Types ───────────────────────────────────────────────────────────────── */

type OrgData = {
    orgID: number;
    orgName: string;
    org_email: string | null;
    latCoord: number | null;
    longCoord: number | null;
};

type SettingsData = {
    expiringSoonDays: number;
    overstockThreshold: number;
    lowStockThreshold: number;
    sustainabilityRecipeDays: number;
    nearbySearchRadius: number;
    nearbyDirectory: string;
    currency: string;
    timezone: string;
};

const DIRECTORY_OPTIONS = [
    { label: 'Farmers Markets', value: 'farmersmarket' },
    { label: 'Food Hubs', value: 'foodhub' },
    { label: 'CSA Programs', value: 'csa' },
    { label: 'On-Farm Markets', value: 'onfarmmarket' },
    { label: 'Agritourism', value: 'agritourism' },
];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

const TIMEZONE_OPTIONS = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'UTC',
];

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function Settings() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Org fields
    const [orgName, setOrgName] = useState('');
    const [orgEmail, setOrgEmail] = useState('');
    const [address1, setAddress1] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('');
    const [latCoord, setLatCoord] = useState<string>('');
    const [longCoord, setLongCoord] = useState<string>('');

    // Settings fields
    const [expiringSoonDays, setExpiringSoonDays] = useState('3');
    const [overstockThreshold, setOverstockThreshold] = useState('10');
    const [lowStockThreshold, setLowStockThreshold] = useState('2');
    const [sustainabilityRecipeDays, setSustainabilityRecipeDays] = useState('5');
    const [nearbySearchRadius, setNearbySearchRadius] = useState('30');
    const [nearbyDirectory, setNearbyDirectory] = useState('farmersmarket');
    const [currency, setCurrency] = useState('USD');
    const [timezone, setTimezone] = useState('America/New_York');

    // Dropdown visibility
    const [showDirPicker, setShowDirPicker] = useState(false);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [showTimezonePicker, setShowTimezonePicker] = useState(false);

    /* ─── Role check ─────────────────────────────────────────────────────── */
    useEffect(() => {
        let isMounted = true;
        const verifyRole = async () => {
            try {
                const cached = await getUserProfile();
                const cachedRole = String(cached?.role || '').toLowerCase();
                if (cachedRole) {
                    if (!isMounted) return;
                    if (cachedRole !== 'admin') { router.replace('/Dashboard'); return; }
                    setIsAdmin(true);
                    setIsCheckingRole(false);
                    return;
                }
                const response = await api.get('/users/me');
                const userRole = String(response.data?.role || '').toLowerCase();
                if (!isMounted) return;
                if (userRole !== 'admin') { router.replace('/Dashboard'); return; }
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

    /* ─── Load data ──────────────────────────────────────────────────────── */
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [orgRes, settingsRes] = await Promise.all([
                api.get('/org'),
                api.get('/settings'),
            ]);

            const org: OrgData = orgRes.data;
            setOrgName(org.orgName || '');
            setOrgEmail(org.org_email || '');
            setLatCoord(org.latCoord != null ? String(org.latCoord) : '');
            setLongCoord(org.longCoord != null ? String(org.longCoord) : '');

            const s: SettingsData = settingsRes.data.settings;
            setExpiringSoonDays(String(s.expiringSoonDays));
            setOverstockThreshold(String(s.overstockThreshold));
            setLowStockThreshold(String(s.lowStockThreshold));
            setSustainabilityRecipeDays(String(s.sustainabilityRecipeDays));
            setNearbySearchRadius(String(s.nearbySearchRadius));
            setNearbyDirectory(s.nearbyDirectory || 'farmersmarket');
            setCurrency(s.currency || 'USD');
            setTimezone(s.timezone || 'America/New_York');
        } catch (err: any) {
            setNotice({ type: 'error', message: err.response?.data?.error || 'Failed to load settings' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) loadData();
    }, [isAdmin, loadData]);

    /* ─── Save org ───────────────────────────────────────────────────────── */
    const handleSaveOrg = async () => {
        setIsSaving(true);
        setNotice(null);
        try {
            const payload: Record<string, any> = {
                orgName,
                org_email: orgEmail,
            };
            // Only send address for geocoding if filled in
            if (address1 || city || state || zipCode || country) {
                payload.address1 = address1;
                payload.city = city;
                payload.state = state;
                payload.zipCode = zipCode;
                payload.country = country;
            }
            const res = await api.patch('/org', payload);
            setLatCoord(res.data.latCoord != null ? String(res.data.latCoord) : '');
            setLongCoord(res.data.longCoord != null ? String(res.data.longCoord) : '');

            // Clear cached profile so header picks up new org name
            await deleteUserProfile();

            setNotice({ type: 'success', message: 'Organization updated.' });
        } catch (err: any) {
            setNotice({ type: 'error', message: err.response?.data?.error || 'Failed to save organization.' });
        } finally {
            setIsSaving(false);
        }
    };

    /* ─── Save settings ──────────────────────────────────────────────────── */
    const handleSaveSettings = async () => {
        setIsSaving(true);
        setNotice(null);
        try {
            await api.patch('/settings', {
                expiringSoonDays: parseInt(expiringSoonDays, 10) || 3,
                overstockThreshold: parseInt(overstockThreshold, 10) || 10,
                lowStockThreshold: parseInt(lowStockThreshold, 10) || 2,
                sustainabilityRecipeDays: parseInt(sustainabilityRecipeDays, 10) || 5,
                nearbySearchRadius: parseInt(nearbySearchRadius, 10) || 30,
                nearbyDirectory,
                currency,
                timezone,
            });
            setNotice({ type: 'success', message: 'Settings saved.' });
        } catch (err: any) {
            setNotice({ type: 'error', message: err.response?.data?.error || 'Failed to save settings.' });
        } finally {
            setIsSaving(false);
        }
    };

    /* ─── Picker helper ──────────────────────────────────────────────────── */
    const closeAllPickers = () => {
        setShowDirPicker(false);
        setShowCurrencyPicker(false);
        setShowTimezonePicker(false);
    };

    /* ─── Render ─────────────────────────────────────────────────────────── */

    if (isCheckingRole) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <AuthHeader activeRoute="/Settings" />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.landing.primaryPurple} />
                    <Text style={styles.loadingText}>Checking access…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <AuthHeader activeRoute="/Settings" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={closeAllPickers}
            >
                {/* Header */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.title}>Settings</Text>
                        <Text style={styles.subtitle}>
                            Manage your organization profile and system preferences.
                        </Text>
                    </View>
                </View>

                {notice && (
                    <View style={[styles.notice, notice.type === 'success' ? styles.noticeSuccess : styles.noticeError]}>
                        <Text style={styles.noticeText}>{notice.message}</Text>
                    </View>
                )}

                {isLoading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={Colors.landing.primaryPurple} />
                    </View>
                ) : (
                    <>
                        {/* ── Organization Section ─────────────────────────── */}
                        <View style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="business-outline" size={20} color={Colors.landing.primaryPurple} />
                                <Text style={styles.sectionTitle}>Organization</Text>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Organization Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={orgName}
                                    onChangeText={setOrgName}
                                    placeholder="Your business name"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Contact Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={orgEmail}
                                    onChangeText={setOrgEmail}
                                    placeholder="org@example.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Location sub-section */}
                            <View style={styles.subSection}>
                                <Text style={styles.subSectionTitle}>Location</Text>
                                <Text style={styles.hintText}>
                                    Update your address to re-geocode, or leave empty to keep current coordinates.
                                </Text>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Street Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={address1}
                                        onChangeText={setAddress1}
                                        placeholder="123 Main St"
                                    />
                                </View>

                                <View style={styles.formRow}>
                                    <View style={[styles.formGroup, styles.flex1]}>
                                        <Text style={styles.label}>City</Text>
                                        <TextInput style={styles.input} value={city} onChangeText={setCity} />
                                    </View>
                                    <View style={[styles.formGroup, styles.flex1]}>
                                        <Text style={styles.label}>State</Text>
                                        <TextInput style={styles.input} value={state} onChangeText={setState} />
                                    </View>
                                </View>

                                <View style={styles.formRow}>
                                    <View style={[styles.formGroup, styles.flex1]}>
                                        <Text style={styles.label}>ZIP Code</Text>
                                        <TextInput style={styles.input} value={zipCode} onChangeText={setZipCode} />
                                    </View>
                                    <View style={[styles.formGroup, styles.flex1]}>
                                        <Text style={styles.label}>Country</Text>
                                        <TextInput style={styles.input} value={country} onChangeText={setCountry} />
                                    </View>
                                </View>

                                {(latCoord || longCoord) ? (
                                    <View style={styles.coordBox}>
                                        <Ionicons name="location" size={16} color={Colors.landing.primaryPurple} />
                                        <Text style={styles.coordText}>
                                            Current: {latCoord}, {longCoord}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.coordBox}>
                                        <Ionicons name="location-outline" size={16} color="#9ca3af" />
                                        <Text style={styles.coordTextMuted}>No coordinates set</Text>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[styles.btnPrimary, isSaving && styles.btnDisabled]}
                                onPress={handleSaveOrg}
                                disabled={isSaving}
                            >
                                <Text style={styles.btnPrimaryText}>
                                    {isSaving ? 'Saving…' : 'Save Organization'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* ── Thresholds & Alerts Section ──────────────────── */}
                        <View style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="speedometer-outline" size={20} color={Colors.landing.primaryPurple} />
                                <Text style={styles.sectionTitle}>Thresholds & Alerts</Text>
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, styles.flex1]}>
                                    <Text style={styles.label}>Expiring Soon (days)</Text>
                                    <Text style={styles.hintText}>
                                        Items expiring within this many days are flagged.
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={expiringSoonDays}
                                        onChangeText={setExpiringSoonDays}
                                        keyboardType="numeric"
                                        placeholder="3"
                                    />
                                </View>
                                <View style={[styles.formGroup, styles.flex1]}>
                                    <Text style={styles.label}>Overstock Threshold</Text>
                                    <Text style={styles.hintText}>
                                        Quantities above this are considered overstocked.
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={overstockThreshold}
                                        onChangeText={setOverstockThreshold}
                                        keyboardType="numeric"
                                        placeholder="10"
                                    />
                                </View>
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, styles.flex1]}>
                                    <Text style={styles.label}>Low Stock Threshold</Text>
                                    <Text style={styles.hintText}>
                                        Items below this quantity trigger low stock alerts.
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={lowStockThreshold}
                                        onChangeText={setLowStockThreshold}
                                        keyboardType="numeric"
                                        placeholder="2"
                                    />
                                </View>
                                <View style={[styles.formGroup, styles.flex1]}>
                                    <Text style={styles.label}>Recipe Suggestion Window (days)</Text>
                                    <Text style={styles.hintText}>
                                        Suggest recipes for items expiring within this window.
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={sustainabilityRecipeDays}
                                        onChangeText={setSustainabilityRecipeDays}
                                        keyboardType="numeric"
                                        placeholder="5"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* ── Sustainability Defaults Section ──────────────── */}
                        <View style={[styles.card, { zIndex: 30 }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="leaf-outline" size={20} color={Colors.landing.primaryPurple} />
                                <Text style={styles.sectionTitle}>Sustainability Defaults</Text>
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, styles.flex1]}>
                                    <Text style={styles.label}>Default Search Radius (mi)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={nearbySearchRadius}
                                        onChangeText={setNearbySearchRadius}
                                        keyboardType="numeric"
                                        placeholder="30"
                                    />
                                </View>
                                <View style={[styles.formGroup, styles.flex1, { zIndex: 20 }]}>
                                    <Text style={styles.label}>Default Directory</Text>
                                    <TouchableOpacity
                                        style={styles.dropdown}
                                        onPress={() => {
                                            setShowDirPicker(!showDirPicker);
                                            setShowCurrencyPicker(false);
                                            setShowTimezonePicker(false);
                                        }}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {DIRECTORY_OPTIONS.find((d) => d.value === nearbyDirectory)?.label || nearbyDirectory}
                                        </Text>
                                        <Ionicons name="chevron-down" size={14} color="#6b7280" />
                                    </TouchableOpacity>
                                    {showDirPicker && (
                                        <View style={styles.pickerMenu}>
                                            {DIRECTORY_OPTIONS.map((opt) => (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    style={[styles.pickerItem, opt.value === nearbyDirectory && styles.pickerItemActive]}
                                                    onPress={() => { setNearbyDirectory(opt.value); setShowDirPicker(false); }}
                                                >
                                                    <Text style={[styles.pickerItemText, opt.value === nearbyDirectory && styles.pickerItemTextActive]}>
                                                        {opt.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* ── General Preferences Section ──────────────────── */}
                        <View style={[styles.card, { zIndex: 20 }]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="settings-outline" size={20} color={Colors.landing.primaryPurple} />
                                <Text style={styles.sectionTitle}>General Preferences</Text>
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, styles.flex1, { zIndex: 15 }]}>
                                    <Text style={styles.label}>Currency</Text>
                                    <TouchableOpacity
                                        style={styles.dropdown}
                                        onPress={() => {
                                            setShowCurrencyPicker(!showCurrencyPicker);
                                            setShowDirPicker(false);
                                            setShowTimezonePicker(false);
                                        }}
                                    >
                                        <Text style={styles.dropdownText}>{currency}</Text>
                                        <Ionicons name="chevron-down" size={14} color="#6b7280" />
                                    </TouchableOpacity>
                                    {showCurrencyPicker && (
                                        <View style={styles.pickerMenu}>
                                            {CURRENCY_OPTIONS.map((c) => (
                                                <TouchableOpacity
                                                    key={c}
                                                    style={[styles.pickerItem, c === currency && styles.pickerItemActive]}
                                                    onPress={() => { setCurrency(c); setShowCurrencyPicker(false); }}
                                                >
                                                    <Text style={[styles.pickerItemText, c === currency && styles.pickerItemTextActive]}>{c}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                                <View style={[styles.formGroup, styles.flex1, { zIndex: 10 }]}>
                                    <Text style={styles.label}>Timezone</Text>
                                    <TouchableOpacity
                                        style={styles.dropdown}
                                        onPress={() => {
                                            setShowTimezonePicker(!showTimezonePicker);
                                            setShowDirPicker(false);
                                            setShowCurrencyPicker(false);
                                        }}
                                    >
                                        <Text style={styles.dropdownText}>{timezone}</Text>
                                        <Ionicons name="chevron-down" size={14} color="#6b7280" />
                                    </TouchableOpacity>
                                    {showTimezonePicker && (
                                        <View style={styles.pickerMenu}>
                                            {TIMEZONE_OPTIONS.map((tz) => (
                                                <TouchableOpacity
                                                    key={tz}
                                                    style={[styles.pickerItem, tz === timezone && styles.pickerItemActive]}
                                                    onPress={() => { setTimezone(tz); setShowTimezonePicker(false); }}
                                                >
                                                    <Text style={[styles.pickerItemText, tz === timezone && styles.pickerItemTextActive]}>{tz}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Save Settings Button */}
                        <TouchableOpacity
                            style={[styles.btnPrimary, styles.btnFullWidth, isSaving && styles.btnDisabled]}
                            onPress={handleSaveSettings}
                            disabled={isSaving}
                        >
                            <Ionicons name="save-outline" size={18} color={Colors.landing.white} />
                            <Text style={styles.btnPrimaryText}>
                                {isSaving ? 'Saving…' : 'Save All Settings'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
            <FloatingChatButton />
        </SafeAreaView>
    );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.landing.lightPurple,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 80,
        gap: 20,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        color: '#6b7280',
    },

    /* Header */
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

    /* Notice */
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

    /* Cards */
    card: {
        backgroundColor: Colors.landing.white,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.landing.black,
    },

    /* Sub-sections */
    subSection: {
        marginTop: 8,
        padding: 14,
        borderRadius: 10,
        backgroundColor: Colors.landing.lightPurple,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 16,
    },
    subSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.landing.primaryPurple,
        marginBottom: 4,
    },
    hintText: {
        fontSize: 11,
        color: '#9ca3af',
        marginBottom: 6,
    },

    /* Form */
    formGroup: {
        marginBottom: 14,
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
    },
    flex1: {
        flex: 1,
    },
    label: {
        marginBottom: 4,
        color: Colors.landing.black,
        fontWeight: '600',
        fontSize: 13,
    },
    input: {
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        fontSize: 14,
        backgroundColor: Colors.landing.white,
        color: '#111827',
    },

    /* Coords */
    coordBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: Colors.landing.white,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    coordText: {
        fontSize: 12,
        color: Colors.landing.primaryPurple,
        fontWeight: '600',
    },
    coordTextMuted: {
        fontSize: 12,
        color: '#9ca3af',
    },

    /* Dropdowns */
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: Colors.landing.white,
    },
    dropdownText: {
        fontSize: 13,
        color: '#374151',
    },
    pickerMenu: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        backgroundColor: Colors.landing.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : {}),
        zIndex: 100,
        maxHeight: 200,
    },
    pickerItem: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    pickerItemActive: {
        backgroundColor: Colors.landing.lightPurple,
    },
    pickerItemText: {
        fontSize: 13,
        color: '#374151',
    },
    pickerItemTextActive: {
        color: Colors.landing.primaryPurple,
        fontWeight: '600',
    },

    /* Buttons */
    btnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: Colors.landing.primaryPurple,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    btnFullWidth: {
        alignSelf: 'stretch',
    },
    btnPrimaryText: {
        color: Colors.landing.white,
        fontSize: 15,
        fontWeight: '600',
    },
    btnDisabled: {
        opacity: 0.6,
    },
});
