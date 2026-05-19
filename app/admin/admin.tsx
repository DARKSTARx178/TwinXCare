import { ThemeContext } from '@/contexts/ThemeContext';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Admin() {
    const router = useRouter();
    const { theme } = useContext(ThemeContext);
    const textSize = getFontSizeValue('medium');

    const menuItems = [
        { title: 'Manage Items', icon: 'cube-outline', route: './admin_equipmentMgt', color: '#81ade7' },
        { title: 'Manage Services', icon: 'construct-outline', route: './admin_serviceMgt', color: '#62b8ea' },
        { title: 'Manage Deliveries', icon: 'car-outline', route: './admin_delivery', color: '#10b981' },
        { title: 'Manage Users', icon: 'people-outline', route: './admin_userMgt', color: '#f59e0b' },
        { title: 'Escort Matching', icon: 'hand-left-outline', route: './admin_escort_match', color: '#8b5cf6' },
        { title: 'Inbox', icon: 'mail-open-outline', route: './admin_support', color: '#ec4899' },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.header}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
                    <Ionicons name="shield-checkmark" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.heading, { color: theme.text, fontSize: textSize + 10 }]}>Control Center</Text>
                <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
                    Administrative Oversight & Management
                </Text>
            </View>

            <View style={styles.grid}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
                        onPress={() => router.push(item.route as any)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.cardIconContainer, { backgroundColor: item.color + '15' }]}>
                            <Ionicons name={item.icon as any} size={28} color={item.color} />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.text, fontSize: textSize - 2 }]}>
                            {item.title}
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.textDim} style={{ marginTop: 8 }} />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={[styles.infoBox, { backgroundColor: 'rgba(129, 173, 231, 0.05)' }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.textDim }]}>
                    System updates and logs are tracked in real-time. Please ensure all modifications are documented.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    backButton: {
        position: "absolute",
        top: 50,
        left: 0,
        zIndex: 10,
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    header: {
        marginTop: 60,
        marginBottom: 40,
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    heading: { fontWeight: '800', textAlign: 'center' },
    subtitle: { fontWeight: '500', marginTop: 4, textAlign: 'center' },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        // damping: 0, // This property is not valid for StyleSheet.create
    },
    card: {
        width: '48%',
        padding: 24,
        borderRadius: 28,
        marginBottom: 16,
        alignItems: 'center',
    },
    cardIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 20,
    },
    infoBox: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 24,
        marginTop: 10,
        marginBottom: 40,
        alignItems: 'center',
    },
    infoText: {
        marginLeft: 12,
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
        lineHeight: 18,
    },
});
