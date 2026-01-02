import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { doc, getDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

interface Booking {
    serviceId: string;
    title: string;
    description: string;
    bookingDate: string;
    timeSlot: string;
    price?: number;
    createdAt: string;
}

export default function BookingsPage() {
    const { fontSize } = useAccessibility();
    const { theme } = useContext(ThemeContext);
    const textSize = getFontSizeValue(fontSize);

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    setLoading(false);
                    return;
                }

                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    const bookingArray = data.booking || [];
                    setBookings(bookingArray);
                }
            } catch (err) {
                console.error('Error fetching bookings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.headerSection}>
                <Text style={[styles.header, { color: theme.text, fontSize: textSize + 10 }]}>My Bookings</Text>
                <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
                    Active and upcoming appointments
                </Text>
            </View>

            {bookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(129, 173, 231, 0.1)' }]}>
                        <Text style={{ fontSize: 40 }}>📅</Text>
                    </View>
                    <Text style={{ color: theme.textDim, fontSize: textSize, fontWeight: '600' }}>No bookings found yet.</Text>
                    <Text style={{ color: theme.textDim, fontSize: textSize - 4, marginTop: 8 }}>Your scheduled services will appear here.</Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item, index) => `${item.serviceId}-${index}`}
                    contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 40 }}
                    renderItem={({ item }) => (
                        <View style={[styles.card, { backgroundColor: theme.surface }]}>
                            <View style={styles.cardHeader}>
                                <Text style={[styles.title, { color: theme.text, fontSize: textSize + 4 }]}>{item.title}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <Text style={[styles.statusText, { color: '#10b981' }]}>CONFIRMED</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={styles.infoItem}>
                                    <Text style={[styles.infoLabel, { color: theme.textDim }]}>DATE</Text>
                                    <Text style={[styles.infoValue, { color: theme.text }]}>{item.bookingDate}</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Text style={[styles.infoLabel, { color: theme.textDim }]}>TIME</Text>
                                    <Text style={[styles.infoValue, { color: theme.text }]}>{item.timeSlot}</Text>
                                </View>
                            </View>

                            <View style={[styles.descriptionBox, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                <Text style={[styles.description, { color: theme.textDim, fontSize: textSize - 2 }]}>
                                    {item.description}
                                </Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    headerSection: {
        marginTop: 40,
        marginBottom: 30,
        alignItems: 'center',
    },
    header: { fontWeight: '800', textAlign: 'center' },
    subtitle: { fontWeight: '500', marginTop: 4 },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    card: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: { fontWeight: '800', flex: 1, marginRight: 10 },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    descriptionBox: {
        padding: 16,
        borderRadius: 16,
    },
    description: {
        lineHeight: 20,
        fontWeight: '500',
    },
});
