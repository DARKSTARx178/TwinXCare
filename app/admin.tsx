// app/admin.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/utils/theme';

export default function AdminScreen() {
    const router = useRouter();
    const theme = getThemeColors();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.header, { color: theme.text }]}>Admin Dashboard</Text>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/pw_mgt')}
            >
                <Text style={{ color: theme.background, fontWeight: 'bold' }}>Manage User Passwords</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
});
