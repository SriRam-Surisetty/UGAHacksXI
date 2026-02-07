import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    TextInput as NativeTextInput,
    TouchableOpacity,
    KeyboardAvoidingView as NativeKeyboardAvoidingView,
    Platform,
    FlatList as NativeFlatList,
    ActivityIndicator as NativeActivityIndicator,
    SafeAreaView as NativeSafeAreaView,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

// Cast components to any to fix strict TS error "JSX element class does not support attributes"
const TextInput = NativeTextInput as any;
const KeyboardAvoidingView = NativeKeyboardAvoidingView as any;
const FlatList = NativeFlatList as any;
const ActivityIndicator = NativeActivityIndicator as any;
const SafeAreaView = NativeSafeAreaView as any;

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
};

export default function Chatbot() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<any>(null); // Cast ref to any as well
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Replace with your actual backend URL
            // For Android Emulator use 'http://10.0.2.2:5001/chat'
            // For iOS Simulator use 'http://localhost:5001/chat'
            // For Physical Device use your machine's IP address
            const response = await fetch('http://localhost:5001/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

            setMessages((prev) => [...prev, botMessage]);
        } catch (error: any) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: error.message || 'Sorry, I encountered an error. Please try again.',
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <ThemedView
                style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.botBubble,
                    { backgroundColor: isUser ? theme.tint : (colorScheme === 'dark' ? '#333' : '#e5e5ea') }
                ]}
            >
                <ThemedText style={[styles.messageText, isUser && styles.userMessageText]}>
                    {item.text}
                </ThemedText>
            </ThemedView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ThemedView style={styles.header}>
                <ThemedText type="title">Gemini Chat</ThemedText>
            </ThemedView>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item: { id: any; }) => item.id}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                style={styles.inputContainer}
            >
                <ThemedView style={[styles.inputWrapper, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Type a message..."
                        placeholderTextColor="#888"
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: theme.tint, opacity: isLoading || !input.trim() ? 0.5 : 1 }]}
                        onPress={sendMessage}
                        disabled={isLoading || !input.trim()}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <IconSymbol name="paperplane.fill" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </ThemedView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        alignItems: 'center',
    },
    messageList: {
        padding: 16,
        paddingBottom: 32,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    botBubble: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
    },
    userMessageText: {
        color: '#fff',
    },
    inputContainer: {
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        margin: 16,
        borderRadius: 24,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});