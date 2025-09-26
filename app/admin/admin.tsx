import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';

export default function Admin() {
    const router = useRouter();
    const theme = getThemeColors();
    const textSize = getFontSizeValue('medium');

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={theme.text} left={-30} bottom={25} />
            </TouchableOpacity>
            <Text>  </Text>
            <Text>  </Text>
            <Text>  </Text>
            <Text style={[styles.heading, { color: theme.text, fontSize: textSize + 8 }]}>Admin Dashboard</Text>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => router.push('./admin_equipmentMgt')}
            >
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Manage Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => router.push('./admin_serviceMgt')}
            >
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Manage Services</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => router.push('./admin_delivery')}
            >
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Manage Deliveries</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => router.push('./admin_userMgt')}
            >
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Manage Users</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24 },
    heading: { fontWeight: 'bold', marginBottom: 24 },
    button: { padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
    backButton: { position: "absolute", top: 35, left: 20, zIndex: 1, backgroundColor: "transparent", padding: 6 },
});
