import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import ChatWidget from './ChatWidget';

export default function FloatingChatButton() {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <>
            {/* Floating chat button */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => setIsChatOpen(true)}
                activeOpacity={0.8}
            >
                <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Chat widget */}
            <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
    );
}

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.landing.primaryPurple,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 9998,
        // Web-specific styling
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        } as any),
    },
});
