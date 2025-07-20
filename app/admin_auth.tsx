// app/admin_auth.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';

const AdminAuth: React.FC = () => {
    const router = useRouter();
    const { fontSize } = useAccessibility();
    const theme = getThemeColors();
    const textSize = getFontSizeValue(fontSize);

    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleVerify = async () => {
        setError('');
        if (!password) {
            setError('Please enter your password.');
            return;
        }

        try {
            const response = await fetch('http://192.168.50.221:8080/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'admin', password }),
            });

            const data = await response.json();
            if (response.ok) {
                // Redirect to admin dashboard
                router.replace('/admin');
            } else {
                setError(data.error || 'Invalid admin credentials.');
            }
        } catch (err) {
            console.error('Admin auth error:', err);
            setError('Could not verify admin. Try again.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme.text, fontSize: textSize + 8 }]}>
                Admin Verification
            </Text>

            <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
                placeholder="Enter admin password"
                placeholderTextColor="#aaa"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleVerify}
            >
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>
                    Enter Admin Mode
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 24,
    },
    backButton: {
        position: 'absolute',
        top: 35,
        left: 20,
        zIndex: 1,
        backgroundColor: 'transparent',
        padding: 6,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    button: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
});

export default AdminAuth;
