import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { auth, db } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';

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
    const theme = getThemeColors();
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
            <Text> </Text> //spacing
            <Text style={[styles.header, { color: theme.text, fontSize: textSize + 4 }]}>My Bookings</Text>

            {bookings.length === 0 ? (
                <Text style={{ color: theme.unselected, fontSize: textSize }}>No bookings yet.</Text>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item, index) => `${item.serviceId}-${index}`}
                    renderItem={({ item }) => (
                        <View style={[styles.card, { backgroundColor: theme.card }]}>
                            <Text style={[styles.title, { color: theme.text, fontSize: textSize + 2 }]}>{item.title}</Text>
                            <Text style={[styles.timing, { color: theme.text, fontSize: textSize }]}>
                                {item.bookingDate} | {item.timeSlot}
                            </Text>
                            <Text style={[styles.description, { color: theme.unselected, fontSize: textSize }]}>
                                {item.description}
                            </Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: { fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    title: { fontWeight: 'bold', marginBottom: 4 },
    timing: { marginBottom: 6 },
    description: { fontStyle: 'italic' },
});
