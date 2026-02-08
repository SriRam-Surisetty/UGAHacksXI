import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
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
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.landing.primaryPurple,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
    },
});
