import React, { useState, useRef, useEffect } from 'react';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
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

export default function ChatWidget({ isOpen, onClose }: ChatWidgetProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hi! I'm your AI assistant. How can I help you today?",
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Check platform at render time, not module load time
    const isWeb = Platform.OS === 'web';
    const isLargeScreen = SCREEN_WIDTH > 768;

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

    const sendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const response = await fetch('http://172.21.218.223:5001/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.text }),
            });

            const data = await response.json();

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response || "I'm sorry, I couldn't process that.",
                isUser: false,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Connection error. Please try again.',
                isUser: false,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
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
                            <Text style={styles.headerTitle}>AI Assistant</Text>
                            <Text style={styles.headerSubtitle}>Online</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((message) => (
                        <View
                            key={message.id}
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 20,
        overflow: 'hidden',
    },
    containerWeb: {
        width: 400,
        height: 560,
        maxHeight: 560,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
        // Web-specific shadow
        ...(Platform.OS === 'web' && {
            boxShadow: '0 16px 64px rgba(0, 0, 0, 0.3)',
        } as any),
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
        borderRadius: 16,
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
});
