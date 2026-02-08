import React, { useState, ReactNode } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import AuthHeader from './auth-header';
import ChatWidget from './ChatWidget';

interface DashboardLayoutProps {
    children: ReactNode;
    activeRoute?: string;
}

export default function DashboardLayout({ children, activeRoute }: DashboardLayoutProps) {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <AuthHeader activeRoute={activeRoute} onChatPress={() => setIsChatOpen(true)} />
            {children}
            <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.landing.lightPurple,
    },
});
