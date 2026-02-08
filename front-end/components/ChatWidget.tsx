import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { Colors } from '@/constants/theme';
import api from '@/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ChatAction {
    action: string;
    purpose: string;
    query: string;
}

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    actions?: ChatAction[];
}

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
}

// Animated typing indicator component
function TypingIndicator() {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createAnimation = (animValue: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(animValue, {
                        toValue: -8,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(animValue, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const anim1 = createAnimation(dot1, 0);
        const anim2 = createAnimation(dot2, 150);
        const anim3 = createAnimation(dot3, 300);

        anim1.start();
        anim2.start();
        anim3.start();

        return () => {
            anim1.stop();
            anim2.stop();
            anim3.stop();
        };
    }, []);

    return (
        <View style={styles.typingContainer}>
            <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
            <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
            <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
        </View>
    );
}

const CHAT_TABS_KEY = 'stocksense_chat_tabs';
const CHAT_NEXT_ID_KEY = 'stocksense_chat_next_id';

const DEFAULT_GREETING: Message = {
    id: 'greeting',
    text: "Hi! I'm **StockSense AI**. I can help you manage your inventory, look up dishes, check stock levels, and more. Just ask!",
    isUser: false,
    timestamp: new Date(),
};

interface ChatTab {
    id: number;
    label: string;
    messages: Message[];
}

function createTab(id: number): ChatTab {
    return {
        id,
        label: `Tab ${id}`,
        messages: [{ ...DEFAULT_GREETING, timestamp: new Date() }],
    };
}

export default function ChatWidget({ isOpen, onClose }: ChatWidgetProps) {
    const [tabs, setTabs] = useState<ChatTab[]>([createTab(1)]);
    const [activeTabId, setActiveTabId] = useState(1);
    const [nextTabId, setNextTabId] = useState(2);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const tabScrollRef = useRef<ScrollView>(null);

    // Check platform at render time, not module load time
    const isWeb = Platform.OS === 'web';
    const isLargeScreen = SCREEN_WIDTH > 768;

    // Load chat tabs on mount
    useEffect(() => {
        loadChatTabs();
    }, []);

    // Save chat tabs whenever they change
    useEffect(() => {
        saveChatTabs();
    }, [tabs, nextTabId]);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
    const messages = activeTab?.messages || [];

    const loadChatTabs = async () => {
        try {
            const [savedTabs, savedNextId] = await Promise.all([
                AsyncStorage.getItem(CHAT_TABS_KEY),
                AsyncStorage.getItem(CHAT_NEXT_ID_KEY),
            ]);
            if (savedTabs) {
                const parsed: ChatTab[] = JSON.parse(savedTabs);
                const restored = parsed.map(tab => ({
                    ...tab,
                    messages: tab.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp),
                    })),
                }));
                if (restored.length > 0) {
                    setTabs(restored);
                    setActiveTabId(restored[restored.length - 1].id);
                }
            }
            if (savedNextId) {
                setNextTabId(JSON.parse(savedNextId));
            }
        } catch (error) {
            console.error('Failed to load chat tabs:', error);
        }
    };

    const saveChatTabs = async () => {
        try {
            await Promise.all([
                AsyncStorage.setItem(CHAT_TABS_KEY, JSON.stringify(tabs)),
                AsyncStorage.setItem(CHAT_NEXT_ID_KEY, JSON.stringify(nextTabId)),
            ]);
        } catch (error) {
            console.error('Failed to save chat tabs:', error);
        }
    };

    // Find the lowest available tab ID (reuse gaps)
    const getNextAvailableTabId = (currentTabs: ChatTab[]): number => {
        const existingIds = currentTabs.map(t => t.id).sort((a, b) => a - b);
        for (let i = 1; i <= existingIds.length + 1; i++) {
            if (!existingIds.includes(i)) {
                return i;
            }
        }
        return existingIds.length + 1;
    };

    const addNewTab = () => {
        const newId = getNextAvailableTabId(tabs);
        const newTab = createTab(newId);
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newId);
        setInputText('');
        setTimeout(() => tabScrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const closeTab = (tabId: number) => {
        setTabs(prev => {
            const remaining = prev.filter(t => t.id !== tabId);
            if (remaining.length === 0) {
                // Always keep at least one tab - reset to tab 1
                const fresh = createTab(1);
                setActiveTabId(fresh.id);
                return [fresh];
            }
            if (activeTabId === tabId) {
                setActiveTabId(remaining[remaining.length - 1].id);
            }
            return remaining;
        });
    };

    const updateActiveMessages = (updater: (prev: Message[]) => Message[]) => {
        setTabs(prev => prev.map(tab =>
            tab.id === activeTabId
                ? { ...tab, messages: updater(tab.messages) }
                : tab
        ));
    };

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 10,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
            // Scroll to bottom when chat opens
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    // Scroll to bottom when switching tabs
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
        }
    }, [activeTabId]);

    const sendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        updateActiveMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            // Build conversation history for context (excluding the greeting)
            const history = messages
                .filter(m => m.id !== 'greeting')
                .map(m => ({
                    role: m.isUser ? 'user' : 'model',
                    text: m.text,
                }));

            const response = await api.post('/chat', {
                message: userMessage.text,
                history,
            });

            const data = response.data;

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response || "I'm sorry, I couldn't process that.",
                isUser: false,
                timestamp: new Date(),
                actions: data.actions && data.actions.length > 0 ? data.actions : undefined,
            };

            updateActiveMessages(prev => [...prev, aiMessage]);
        } catch (error: any) {
            const errText = error?.response?.data?.error || 'Connection error. Please try again.';
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: errText,
                isUser: false,
                timestamp: new Date(),
            };
            updateActiveMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    if (!isOpen) return null;

    return (
        <View style={[
            styles.overlay,
            isWeb && isLargeScreen && styles.overlayWeb
        ]}>
            {/* Backdrop - tap to close */}
            <TouchableOpacity
                style={[styles.backdrop, isWeb && isLargeScreen && styles.backdropWeb]}
                onPress={onClose}
                activeOpacity={1}
            />

            <Animated.View
                style={[
                    styles.container,
                    isWeb && isLargeScreen && styles.containerWeb,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    }
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name="sparkles" size={18} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>StockSense AI</Text>
                            <Text style={styles.headerSubtitle}>Online</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={addNewTab} style={styles.newChatButton}>
                            <Ionicons name="add" size={20} color={Colors.landing.primaryPurple} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tab bar */}
                {tabs.length > 1 && (
                    <View style={styles.tabBar}>
                        <ScrollView
                            ref={tabScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tabBarContent}
                        >
                            {tabs.map(tab => (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[
                                        styles.tab,
                                        tab.id === activeTabId && styles.tabActive,
                                    ]}
                                    onPress={() => setActiveTabId(tab.id)}
                                >
                                    <Text
                                        style={[
                                            styles.tabLabel,
                                            tab.id === activeTabId && styles.tabLabelActive,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {tab.label}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={14}
                                            color={tab.id === activeTabId ? Colors.landing.primaryPurple : '#999'}
                                        />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((message) => (
                        <View key={message.id}>
                            <View
                                style={[
                                    styles.messageBubble,
                                    message.isUser ? styles.userBubble : styles.aiBubble,
                                ]}
                            >
                                {message.isUser ? (
                                    <Text style={styles.userText}>{message.text}</Text>
                                ) : (
                                    <Markdown style={markdownStyles as any}>{message.text}</Markdown>
                                )}
                            </View>
                            {message.actions && message.actions.length > 0 && (
                                <View style={styles.actionsContainer}>
                                    {message.actions.map((action, idx) => (
                                        <View key={idx} style={styles.actionBadge}>
                                            <Ionicons
                                                name={action.action === 'write' ? 'create-outline' : 'search-outline'}
                                                size={12}
                                                color={Colors.landing.primaryPurple}
                                            />
                                            <Text style={styles.actionText}>{action.purpose}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                    {isLoading && (
                        <View style={[styles.messageBubble, styles.aiBubble]}>
                            <TypingIndicator />
                        </View>
                    )}
                </ScrollView>

                {/* Input */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                >
                    <View style={[styles.inputContainer, isWeb && styles.inputContainerWeb]}>
                        <TextInput
                            style={[
                                styles.input,
                                isWeb && { fontFamily: 'System', outlineStyle: 'none' } as any
                            ]}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type a message..."
                            placeholderTextColor="#999"
                            multiline
                            maxLength={500}
                            onSubmitEditing={sendMessage}
                            returnKeyType="send"
                            onKeyPress={(e: any) => {
                                if (isWeb && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                            onPress={sendMessage}
                            disabled={!inputText.trim() || isLoading}
                        >
                            <Ionicons name="arrow-up" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Animated.View>
        </View>
    );
}

const markdownStyles = {
    body: { color: '#333', fontSize: 14, lineHeight: 20 },
    paragraph: { marginVertical: 4 },
    strong: { fontWeight: '700' as const },
    em: { fontStyle: 'italic' as const },
    code_inline: {
        backgroundColor: 'rgba(52, 23, 85, 0.1)',
        color: Colors.landing.primaryPurple,
        paddingHorizontal: 4,
        borderRadius: 4,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
    },
    fence: {
        backgroundColor: 'rgba(52, 23, 85, 0.05)',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
    },
    code_block: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 12,
        color: '#333',
    },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    list_item: { marginVertical: 2 },
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        justifyContent: 'flex-end',
    },
    overlayWeb: {
        // On web large screens, position in bottom-right
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    backdropWeb: {
        backgroundColor: 'transparent',
    },
    container: {
        width: '100%',
        height: '70%',
        maxHeight: 600,
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    containerWeb: {
        width: 400,
        height: 560,
        maxHeight: 560,
        borderRadius: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        backgroundColor: '#fff',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    newChatButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(52, 23, 85, 0.08)',
    },
    avatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.landing.primaryPurple,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#22c55e',
    },
    closeButton: {
        padding: 8,
    },
    tabBar: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        backgroundColor: '#fff',
    },
    tabBarContent: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
    },
    tabActive: {
        backgroundColor: 'rgba(52, 23, 85, 0.1)',
    },
    tabLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    tabLabelActive: {
        color: Colors.landing.primaryPurple,
        fontWeight: '700',
    },
    messagesContainer: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.landing.primaryPurple,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    userText: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
        gap: 10,
    },
    inputContainerWeb: {
        paddingBottom: 12,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        color: '#333',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.landing.primaryPurple,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.landing.primaryPurple,
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        paddingHorizontal: 4,
        paddingBottom: 8,
        maxWidth: '85%',
    },
    actionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(52, 23, 85, 0.08)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    actionText: {
        fontSize: 11,
        color: Colors.landing.primaryPurple,
        fontWeight: '500',
    },
});
