import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
    StyleSheet,
    TextInput as NativeTextInput,
    TouchableOpacity as NativeTouchableOpacity,
    KeyboardAvoidingView as NativeKeyboardAvoidingView,
    Platform,
    FlatList as NativeFlatList,
    ActivityIndicator as NativeActivityIndicator,
    SafeAreaView as NativeSafeAreaView,
    Dimensions,
    View as NativeView,
    Animated,
    Text as NativeText,
} from 'react-native';
import { Colors } from '@/constants/theme';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';

// Cast components to any for TS compatibility
const TextInput = NativeTextInput as any;
const KeyboardAvoidingView = NativeKeyboardAvoidingView as any;
const FlatList = NativeFlatList as any;
const ActivityIndicator = NativeActivityIndicator as any;
const SafeAreaView = NativeSafeAreaView as any;
const View = NativeView as any;
const TouchableOpacity = NativeTouchableOpacity as any;
const Text = NativeText as any;
const AnimatedView = Animated.View as any;

const { width } = Dimensions.get('window');

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
};

// Typing indicator component
const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
                ])
            ).start();
        };
        animate(dot1, 0);
        animate(dot2, 150);
        animate(dot3, 300);
    }, []);

    const dotStyle = (animValue: Animated.Value) => ({
        transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
    });

    return (
        <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
                <AnimatedView style={[styles.typingDot, dotStyle(dot1)]} />
                <AnimatedView style={[styles.typingDot, dotStyle(dot2)]} />
                <AnimatedView style={[styles.typingDot, dotStyle(dot3)]} />
            </View>
        </View>
    );
};

// Message bubble with fade-in animation
const MessageBubble = ({ item, isNew }: { item: Message; isNew: boolean }) => {
    const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
    const slideAnim = useRef(new Animated.Value(isNew ? 20 : 0)).current;
    const isUser = item.sender === 'user';

    useEffect(() => {
        if (isNew) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();
        }
    }, [isNew]);

    return (
        <AnimatedView
            style={[
                styles.messageRow,
                isUser && styles.messageRowUser,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
        >
            {!isUser && (
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarGradient}>
                        <Ionicons name="sparkles" size={14} color="#fff" />
                    </View>
                </View>
            )}
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                {isUser ? (
                    <Text style={styles.userMessageText}>{item.text}</Text>
                ) : (
                    <Markdown style={markdownStyles}>{item.text}</Markdown>
                )}
            </View>
        </AnimatedView>
    );
};

export default function Chatbot() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            text: "Hey there! 👋 I'm your **StockSense AI** assistant. Ask me anything about inventory management, predictions, or how to get the most out of the platform.",
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastMessageId, setLastMessageId] = useState<string | null>(null);
    const flatListRef = useRef<any>(null);
    const router = useRouter();

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setLastMessageId(userMessage.id);
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Use local IP address for physical device testing
            const response = await fetch('http://172.21.218.223:5001/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.text }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                sender: 'bot',
                timestamp: new Date(),
            };
            setLastMessageId(botMessage.id);
            setMessages((prev) => [...prev, botMessage]);
        } catch (error: any) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: `Sorry, something went wrong. ${error.message || 'Please try again.'}`,
                sender: 'bot',
                timestamp: new Date(),
            };
            setLastMessageId(errorMessage.id);
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (flatListRef.current && messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages, isLoading]);

    const renderMessage = ({ item }: { item: Message }) => (
        <MessageBubble item={item} isNew={item.id === lastMessageId} />
    );

    const quickPrompts = [
        "📊 Help me reduce waste",
        "🔮 Predict my stock needs",
        "💡 Optimization tips",
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Gradient Background */}
            <View style={styles.backgroundGradient} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <View style={styles.headerIcon}>
                        <Ionicons name="chatbubbles" size={20} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>StockSense AI</Text>
                        <Text style={styles.headerSubtitle}>Always here to help</Text>
                    </View>
                </View>
                <View style={styles.headerBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Online</Text>
                </View>
            </View>

            {/* Chat Container */}
            <View style={styles.chatContainer}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item: Message) => item.id}
                    contentContainerStyle={styles.messageList}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={isLoading ? <TypingIndicator /> : null}
                />

                {/* Quick Prompts (only show when no messages beyond intro) */}
                {messages.length === 1 && (
                    <View style={styles.quickPromptsContainer}>
                        <Text style={styles.quickPromptsTitle}>Try asking:</Text>
                        <View style={styles.quickPrompts}>
                            {quickPrompts.map((prompt, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.quickPromptButton}
                                    onPress={() => {
                                        setInput(prompt.replace(/[📊🔮💡]\s/, ''));
                                    }}
                                >
                                    <Text style={styles.quickPromptText}>{prompt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.inputArea}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[
                                styles.input,
                                Platform.OS === 'web' && { fontFamily: 'System', outlineStyle: 'none' } // Fix for emojis & remove focus ring
                            ]}
                            value={input}
                            onChangeText={setInput}
                            placeholder="Message StockSense AI..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            maxLength={2000}
                            autoCorrect={false}
                            spellCheck={false}
                            onKeyPress={(e: any) => {
                                if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (!input.trim() || isLoading) && styles.sendButtonDisabled,
                            ]}
                            onPress={sendMessage}
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Ionicons name="arrow-up" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.disclaimer}>
                        AI can make mistakes. Consider checking important information.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const markdownStyles: any = {
    body: { color: '#1f2937', fontSize: 15, lineHeight: 22 },
    heading1: { color: '#111827', fontWeight: '700' as const, fontSize: 20, marginTop: 16, marginBottom: 8 },
    heading2: { color: '#111827', fontWeight: '600' as const, fontSize: 18, marginTop: 14, marginBottom: 6 },
    heading3: { color: '#111827', fontWeight: '600' as const, fontSize: 16, marginTop: 12, marginBottom: 4 },
    strong: { fontWeight: '600' as const, color: '#111827' },
    em: { fontStyle: 'italic' as const },
    link: { color: '#6366f1', textDecorationLine: 'underline' as const },
    blockquote: {
        backgroundColor: '#f3f4f6',
        borderLeftColor: '#6366f1',
        borderLeftWidth: 3,
        paddingLeft: 12,
        paddingVertical: 8,
        marginVertical: 8,
        borderRadius: 4,
    },
    code_inline: {
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
        color: '#7c3aed',
    },
    code_block: {
        backgroundColor: '#1f2937',
        borderRadius: 8,
        padding: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
        color: '#e5e7eb',
        marginVertical: 8,
    },
    list_item: { marginVertical: 4 },
    bullet_list: { marginVertical: 8 },
    ordered_list: { marginVertical: 8 },
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fafafa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#ffffff',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.landing.primaryPurple,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#059669',
    },
    chatContainer: {
        flex: 1,
    },
    messageList: {
        padding: 24,
        paddingBottom: 100,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    messageRowUser: {
        justifyContent: 'flex-end',
    },
    avatarContainer: {
        marginRight: 10,
        marginBottom: 4,
    },
    avatarGradient: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.landing.accentPurple,
    },
    messageBubble: {
        maxWidth: '78%',
        padding: 14,
        borderRadius: 12,
    },
    userBubble: {
        backgroundColor: Colors.landing.primaryPurple,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    userMessageText: {
        color: '#ffffff',
        fontSize: 15,
        lineHeight: 22,
    },
    typingContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    typingBubble: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 5,
        marginLeft: 42,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#9ca3af',
    },
    quickPromptsContainer: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    quickPromptsTitle: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 12,
        fontWeight: '500',
    },
    quickPrompts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickPromptButton: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    quickPromptText: {
        fontSize: 14,
        color: Colors.landing.primaryPurple,
        fontWeight: '500',
    },
    inputArea: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.06)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingLeft: 18,
        paddingRight: 6,
        paddingVertical: 6,
        gap: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        maxHeight: 120,
        paddingVertical: 10,
        lineHeight: 22,
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
        backgroundColor: '#d1d5db',
    },
    disclaimer: {
        fontSize: 11,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 8,
    },
});