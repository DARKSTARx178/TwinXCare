import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { homeTranslations } from '@/utils/translations';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useContext, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrderHistoryWidget() {
    const { fontSize } = useAccessibility();
    const { theme } = useContext(ThemeContext);
    const { lang } = useLanguage();
    const textSize = getFontSizeValue(fontSize);
    const router = useRouter();
    const screenWidth = Dimensions.get('window').width;
    const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

    const [user, setUser] = useState<any>(null);
    const [orderHistory, setOrderHistory] = useState<any[]>([]);
    const t = homeTranslations[lang];

    useFocusEffect(
        useCallback(() => {
            console.log('🔄 OrderHistoryWidget: Focus effect triggered');
            let unsubscribeAuth: (() => void) | undefined;

            const fetchHistory = async (currentUser: any) => {
                if (!currentUser) {
                    console.log('❌ OrderHistoryWidget: No user, clearing history');
                    setUser(null);
                    setOrderHistory([]);
                    return;
                }

                console.log('👤 OrderHistoryWidget: User found:', currentUser.uid);
                setUser(currentUser);

                try {
                    const userRef = doc(db, 'users', currentUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        console.log('📄 OrderHistoryWidget: History count:', data.history?.length || 0);
                        const history = data.history || [];
                        setOrderHistory([...history].reverse());
                    } else {
                        console.log('⚠️ OrderHistoryWidget: User doc not found');
                        setOrderHistory([]);
                    }
                } catch (err) {
                    console.error('❌ OrderHistoryWidget: Fetch error:', err);
                    setOrderHistory([]);
                }
            };

            // Listen to auth state changes to ensure we have the user
            unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
                fetchHistory(currentUser);
            });

            return () => {
                if (unsubscribeAuth) unsubscribeAuth();
            };
        }, [])
    );

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize + 4), fontWeight: 'bold', marginBottom: 8 }}>
                    {t.orderHistory}
                </Text>
                <Text style={{ color: theme.unselected, fontSize: textSize }}>{t.signInToSeeHistory}</Text>
            </View>
        );
    }

    if (orderHistory.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize + 4), fontWeight: 'bold', marginBottom: 8 }}>
                    {t.orderHistory}
                </Text>
                <Text style={{ color: theme.unselected, fontSize: textSize }}>{t.noOrders}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize + 4), fontWeight: 'bold' }}>
                    {t.orderHistory}
                </Text>
                <TouchableOpacity onPress={() => router.push('/delivery')}>
                    <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: textSize }}>{t.seeFullHistory}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                {orderHistory.slice(0, 5).map((order, idx) => (
                    <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        style={[styles.card, { backgroundColor: theme.unselectedTab }]}
                        onPress={() => router.push('/delivery')}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: theme.text, fontSize: responsiveText(textSize) }]} numberOfLines={1}>
                                {order.name}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: order.status === 'Completed' ? '#4CAF50' : '#FFC107' }]}>
                                <Text style={styles.statusText}>{order.status || 'Pending'}</Text>
                            </View>
                        </View>

                        <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2), marginTop: 4 }}>
                            {t.amount}: ${order.totalPrice}
                        </Text>

                        {order.rentalStart && order.rentalEnd && (
                            <Text style={{ color: theme.unselected, fontSize: responsiveText(textSize - 3), marginTop: 4 }}>
                                {new Date(order.rentalStart).toLocaleDateString()} - {new Date(order.rentalEnd).toLocaleDateString()}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: 24,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    scrollContainer: {
        paddingBottom: 8, // For shadow
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginRight: 16,
        width: 240,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
