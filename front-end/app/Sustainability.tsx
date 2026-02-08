import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';
import api from '@/services/api';

/* ─── Types ───────────────────────────────────────────────────────────────── */

type Recipe = {
    name: string;
    description: string;
    ingredients: string[];
    steps: string[];
};

type FoodResource = {
    listing_name?: string;
    listing_desc?: string;
    media_website?: string;
    location_address?: string;
    location_city?: string;
    location_state?: string;
    location_zipcode?: string;
    distance?: number;
    [key: string]: any;
};

type Directory = 'farmersmarket' | 'foodhub' | 'csa' | 'onfarmmarket' | 'agritourism';

const DIRECTORY_OPTIONS: { label: string; value: Directory }[] = [
    { label: 'Farmers Markets', value: 'farmersmarket' },
    { label: 'Food Hubs', value: 'foodhub' },
    { label: 'CSA Programs', value: 'csa' },
    { label: 'On-Farm Markets', value: 'onfarmmarket' },
    { label: 'Agritourism', value: 'agritourism' },
];

const RADIUS_OPTIONS = ['10', '25', '50', '100'];

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function Sustainability() {
    // Recipes state
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [ingredientsUsed, setIngredientsUsed] = useState<string[]>([]);
    const [recipesLoading, setRecipesLoading] = useState(false);
    const [recipesError, setRecipesError] = useState<string | null>(null);
    const [recipesMessage, setRecipesMessage] = useState<string | null>(null);
    const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);

    // Food resources state
    const [resources, setResources] = useState<FoodResource[]>([]);
    const [resourcesLoading, setResourcesLoading] = useState(false);
    const [resourcesError, setResourcesError] = useState<string | null>(null);
    const [selectedDirectory, setSelectedDirectory] = useState<Directory>('farmersmarket');
    const [selectedRadius, setSelectedRadius] = useState('30');
    const [showDirPicker, setShowDirPicker] = useState(false);
    const [showRadiusPicker, setShowRadiusPicker] = useState(false);

    /* ─── Fetch recipes ──────────────────────────────────────────────────── */

    const fetchRecipes = useCallback(async () => {
        setRecipesLoading(true);
        setRecipesError(null);
        setRecipesMessage(null);
        try {
            const res = await api.get('/sustainability/recipes');
            setRecipes(res.data.recipes || []);
            setIngredientsUsed(res.data.ingredients_used || []);
            if (res.data.message) setRecipesMessage(res.data.message);
        } catch (err: any) {
            setRecipesError(err.response?.data?.error || 'Failed to load recipes');
        } finally {
            setRecipesLoading(false);
        }
    }, []);

    /* ─── Fetch nearby food resources ────────────────────────────────────── */

    const fetchResources = useCallback(async () => {
        setResourcesLoading(true);
        setResourcesError(null);
        try {
            const res = await api.get('/sustainability/nearby-food-resources', {
                params: { directory: selectedDirectory, radius: selectedRadius },
            });
            setResources(res.data.results || []);
        } catch (err: any) {
            setResourcesError(err.response?.data?.error || 'Failed to load food resources');
        } finally {
            setResourcesLoading(false);
        }
    }, [selectedDirectory, selectedRadius]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    /* ─── Render ─────────────────────────────────────────────────────────── */

    return (
        <View style={styles.root}>
            <AuthHeader activeRoute="/Sustainability" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero */}
                <View style={styles.hero}>
                    <Ionicons name="leaf" size={28} color={Colors.landing.primaryPurple} />
                    <Text style={styles.heroTitle}>Sustainability Hub</Text>
                    <Text style={styles.heroSubtitle}>
                        Reduce waste, discover recipes for expiring stock, and find nearby food donation resources.
                    </Text>
                </View>

                {/* ── Recipes Section ───────────────────────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="restaurant-outline" size={20} color={Colors.landing.primaryPurple} />
                        <Text style={styles.sectionTitle}>Suggested Recipes</Text>
                        <TouchableOpacity onPress={fetchRecipes} style={styles.refreshBtn}>
                            <Ionicons name="refresh" size={16} color={Colors.landing.primaryPurple} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionDesc}>
                        AI-generated recipes using your overstocked or soon-to-expire ingredients.
                    </Text>

                    {!recipesLoading && recipes.length === 0 && !recipesMessage && !recipesError && (
                        <TouchableOpacity style={styles.generateBtn} onPress={fetchRecipes} activeOpacity={0.7}>
                            <Ionicons name="sparkles-outline" size={18} color={Colors.landing.white} />
                            <Text style={styles.generateBtnText}>Generate Recipes</Text>
                        </TouchableOpacity>
                    )}

                    {ingredientsUsed.length > 0 && (
                        <View style={styles.chipRow}>
                            {ingredientsUsed.map((ing) => (
                                <View key={ing} style={styles.chip}>
                                    <Text style={styles.chipText}>{ing}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {recipesLoading && (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={Colors.landing.primaryPurple} />
                            <Text style={styles.loadingText}>Generating recipes…</Text>
                        </View>
                    )}

                    {recipesError && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{recipesError}</Text>
                        </View>
                    )}

                    {recipesMessage && !recipesLoading && (
                        <View style={styles.emptyBox}>
                            <Ionicons name="checkmark-circle-outline" size={24} color="#22c55e" />
                            <Text style={styles.emptyText}>{recipesMessage}</Text>
                        </View>
                    )}

                    {!recipesLoading &&
                        recipes.map((recipe, idx) => {
                            const isExpanded = expandedRecipe === idx;
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={styles.card}
                                    onPress={() => setExpandedRecipe(isExpanded ? null : idx)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{recipe.name}</Text>
                                        <Ionicons
                                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                            size={18}
                                            color="#6b7280"
                                        />
                                    </View>
                                    <Text style={styles.cardDesc}>{recipe.description}</Text>

                                    {isExpanded && (
                                        <View style={styles.expandedContent}>
                                            <Text style={styles.subHeading}>Ingredients</Text>
                                            {recipe.ingredients.map((ing, i) => (
                                                <View key={i} style={styles.bulletRow}>
                                                    <Text style={styles.bullet}>•</Text>
                                                    <Text style={styles.bulletText}>{ing}</Text>
                                                </View>
                                            ))}

                                            <Text style={[styles.subHeading, { marginTop: 12 }]}>Steps</Text>
                                            {recipe.steps.map((step, i) => (
                                                <View key={i} style={styles.bulletRow}>
                                                    <Text style={styles.stepNum}>{i + 1}.</Text>
                                                    <Text style={styles.bulletText}>{step}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                </View>

                {/* ── Nearby Food Resources Section ────────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="location-outline" size={20} color={Colors.landing.primaryPurple} />
                        <Text style={styles.sectionTitle}>Nearby Food Resources</Text>
                        <TouchableOpacity onPress={fetchResources} style={styles.refreshBtn}>
                            <Ionicons name="refresh" size={16} color={Colors.landing.primaryPurple} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionDesc}>
                        Donate surplus stock to local food shelters, farmers markets, and community programs.
                    </Text>

                    {/* Filters */}
                    <View style={styles.filterRow}>
                        {/* Directory Picker */}
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Directory</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => {
                                    setShowDirPicker(!showDirPicker);
                                    setShowRadiusPicker(false);
                                }}
                            >
                                <Text style={styles.dropdownText}>
                                    {DIRECTORY_OPTIONS.find((d) => d.value === selectedDirectory)?.label}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color="#6b7280" />
                            </TouchableOpacity>
                            {showDirPicker && (
                                <View style={styles.pickerMenu}>
                                    {DIRECTORY_OPTIONS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[
                                                styles.pickerItem,
                                                opt.value === selectedDirectory && styles.pickerItemActive,
                                            ]}
                                            onPress={() => {
                                                setSelectedDirectory(opt.value);
                                                setShowDirPicker(false);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.pickerItemText,
                                                    opt.value === selectedDirectory && styles.pickerItemTextActive,
                                                ]}
                                            >
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Radius Picker */}
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Radius (mi)</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => {
                                    setShowRadiusPicker(!showRadiusPicker);
                                    setShowDirPicker(false);
                                }}
                            >
                                <Text style={styles.dropdownText}>{selectedRadius} mi</Text>
                                <Ionicons name="chevron-down" size={14} color="#6b7280" />
                            </TouchableOpacity>
                            {showRadiusPicker && (
                                <View style={styles.pickerMenu}>
                                    {RADIUS_OPTIONS.map((r) => (
                                        <TouchableOpacity
                                            key={r}
                                            style={[
                                                styles.pickerItem,
                                                r === selectedRadius && styles.pickerItemActive,
                                            ]}
                                            onPress={() => {
                                                setSelectedRadius(r);
                                                setShowRadiusPicker(false);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.pickerItemText,
                                                    r === selectedRadius && styles.pickerItemTextActive,
                                                ]}
                                            >
                                                {r} miles
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {resourcesLoading && (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={Colors.landing.primaryPurple} />
                            <Text style={styles.loadingText}>Searching nearby…</Text>
                        </View>
                    )}

                    {resourcesError && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{resourcesError}</Text>
                        </View>
                    )}

                    {!resourcesLoading && !resourcesError && resources.length === 0 && (
                        <View style={styles.emptyBox}>
                            <Ionicons name="search-outline" size={24} color="#9ca3af" />
                            <Text style={styles.emptyText}>No food resources found in this area. Try a larger radius.</Text>
                        </View>
                    )}

                    {!resourcesLoading &&
                        resources.map((res, idx) => (
                            <View key={idx} style={styles.card}>
                                <Text style={styles.cardTitle}>{res.listing_name || 'Unnamed Listing'}</Text>
                                {res.listing_desc ? (
                                    <Text style={styles.cardDesc} numberOfLines={3}>
                                        {res.listing_desc}
                                    </Text>
                                ) : null}

                                <View style={styles.resourceMeta}>
                                    {(res.location_address || res.location_city) && (
                                        <View style={styles.metaRow}>
                                            <Ionicons name="location" size={14} color="#6b7280" />
                                            <Text style={styles.metaText}>
                                                {[res.location_address, res.location_city, res.location_state, res.location_zipcode]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </Text>
                                        </View>
                                    )}
                                    {res.distance != null && (
                                        <View style={styles.metaRow}>
                                            <Ionicons name="navigate-outline" size={14} color="#6b7280" />
                                            <Text style={styles.metaText}>{res.distance} mi away</Text>
                                        </View>
                                    )}
                                </View>

                                {res.media_website ? (
                                    <TouchableOpacity
                                        style={styles.linkBtn}
                                        onPress={() => {
                                            const url = res.media_website!.startsWith('http')
                                                ? res.media_website!
                                                : `https://${res.media_website}`;
                                            Linking.openURL(url);
                                        }}
                                    >
                                        <Ionicons name="open-outline" size={14} color={Colors.landing.primaryPurple} />
                                        <Text style={styles.linkBtnText}>Visit Website</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        ))}
                </View>
            </ScrollView>
            <FloatingChatButton />
        </View>
    );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.landing.lightPurple,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 80,
    },

    /* Hero */
    hero: {
        alignItems: 'center',
        marginBottom: 28,
        gap: 6,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: Colors.landing.primaryPurple,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        maxWidth: 500,
    },

    /* Section */
    section: {
        marginBottom: 32,
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
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.landing.black,
        flex: 1,
    },
    sectionDesc: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 16,
    },
    refreshBtn: {
        padding: 6,
    },
    generateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: Colors.landing.primaryPurple,
        borderRadius: 8,
        marginBottom: 16,
        alignSelf: 'center',
    },
    generateBtnText: {
        color: Colors.landing.white,
        fontSize: 15,
        fontWeight: '600',
    },

    /* Chips */
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16,
    },
    chip: {
        backgroundColor: Colors.landing.lightPurple,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    chipText: {
        fontSize: 12,
        color: Colors.landing.primaryPurple,
        fontWeight: '600',
    },

    /* Cards */
    card: {
        backgroundColor: Colors.landing.lightPurple,
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.landing.black,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 19,
    },
    expandedContent: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    subHeading: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.landing.primaryPurple,
        marginBottom: 6,
    },
    bulletRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 3,
        paddingRight: 12,
    },
    bullet: {
        fontSize: 13,
        color: '#6b7280',
    },
    stepNum: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.landing.primaryPurple,
        minWidth: 18,
    },
    bulletText: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
        lineHeight: 19,
    },

    /* Resource meta */
    resourceMeta: {
        marginTop: 8,
        gap: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 12,
        color: '#6b7280',
    },
    linkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: Colors.landing.white,
        borderWidth: 1,
        borderColor: Colors.landing.primaryPurple,
    },
    linkBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.landing.primaryPurple,
    },

    /* Filters */
    filterRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    filterGroup: {
        flex: 1,
        minWidth: 140,
        position: 'relative',
        zIndex: 10,
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
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
        top: 60,
        left: 0,
        right: 0,
        backgroundColor: Colors.landing.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : {}),
        zIndex: 100,
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

    /* States */
    centered: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    loadingText: {
        fontSize: 13,
        color: '#6b7280',
    },
    errorBox: {
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        fontSize: 13,
        color: '#dc2626',
        fontWeight: '600',
    },
    emptyBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        backgroundColor: Colors.landing.lightPurple,
        borderRadius: 8,
    },
    emptyText: {
        fontSize: 13,
        color: '#6b7280',
        flex: 1,
    },
});
