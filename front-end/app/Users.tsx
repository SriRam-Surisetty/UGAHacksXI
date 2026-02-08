import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';
import FloatingChatButton from '@/components/FloatingChatButton';

export default function Users() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <AuthHeader activeRoute="/Users" />
            <View style={styles.content}>
                <Text style={styles.title}>Users</Text>
                <Text style={styles.subtitle}>User management is coming soon.</Text>
            </View>

            {/* Floating Chat Button */}
            <FloatingChatButton />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.landing.white,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 32,
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
        textAlign: 'center',
    },
});
