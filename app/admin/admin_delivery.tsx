import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface Order {
    transactionId: string;
    name: string;
    quantity: number;
    rentalStart: string;
    rentalEnd: string;
    totalPrice: string;
    deliveryAddress: string;
    deliveryEta?: string;
    status: 'Incomplete' | 'Completed';
    userId: string;
    userEmail: string;
    createdAt?: string;
}

export default function AdminDeliveryPage() {
    const { theme } = useContext(ThemeContext);
    const textSize = getFontSizeValue('medium');
    const screenWidth = Dimensions.get('window').width;
    const { fontSize } = useAccessibility();
    const router = useRouter();

    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [etaInputs, setEtaInputs] = useState<Record<string, string>>({});

    const responsiveText = (base: number) =>
        Math.max(base * (screenWidth / 400), base * 0.85);

    const fetchAllOrders = async () => {
        const usersSnap = await getDocs(collection(db, 'users'));
        const orders: Order[] = [];

        usersSnap.forEach(userDoc => {
            const data = userDoc.data();
            const history = data.history || [];
            history.forEach((order: any) => {
                orders.push({
                    ...order,
                    userId: userDoc.id,
                    userEmail: data.email || 'Unknown',
                });
            });
        });

        setAllOrders(
            orders.sort((a, b) =>
                a.createdAt && b.createdAt
                    ? a.createdAt < b.createdAt
                        ? 1
                        : -1
                    : 0
            )
        );
    };

    useEffect(() => {
        fetchAllOrders();
    }, []);

    const updateEta = async (order: Order, newEta: string) => {
        try {
            const userRef = doc(db, 'users', order.userId);
            const userSnap = await getDocs(collection(db, 'users'));
            const userDocSnap = await getDocs(collection(db, 'users'));
            const userDocData = (await getDocs(collection(db, 'users'))).docs.find(d => d.id === order.userId)?.data();
            if (!userDocData) return;

            const updatedHistory = userDocData.history.map((o: any) => {
                if (o.transactionId === order.transactionId) {
                    return { ...o, deliveryEta: newEta };
                }
                return o;
            });

            await updateDoc(userRef, { history: updatedHistory });
            fetchAllOrders();
            Alert.alert('Success', 'Info updated.');
        } catch (err) {
            console.error('Error updating info:', err);
            Alert.alert('Error', 'Failed to update delivery info.');
        }
    };

    const toggleStatus = async (order: Order) => {
        Alert.alert(
            'Confirm Status Change',
            `Are you sure you want to mark this order as ${order.status === 'Incomplete' ? 'Completed' : 'Incomplete'
            }?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: async () => {
                        try {
                            const userRef = doc(db, 'users', order.userId);
                            const userDocData = (await getDocs(collection(db, 'users'))).docs.find(d => d.id === order.userId)?.data();
                            if (!userDocData) return;

                            const updatedHistory = userDocData.history.map((o: any) => {
                                if (o.transactionId === order.transactionId) {
                                    return { ...o, status: o.status === 'Incomplete' ? 'Completed' : 'Incomplete' };
                                }
                                return o;
                            });

                            await updateDoc(userRef, { history: updatedHistory });
                            fetchAllOrders();
                        } catch (err) {
                            console.error('Error updating status:', err);
                            Alert.alert('Error', 'Failed to update status.');
                        }
                    },
                },
            ]
        );
    };

    const filteredOrders = allOrders.filter(o =>
        o.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.background }}
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
        >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.header}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
                    <Ionicons name="car-outline" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.title, { color: theme.text, fontSize: textSize + 10 }]}>Dispatch Center</Text>
                <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
                    Equipment Delivery & Order Fulfillment
                </Text>
            </View>

            <View style={styles.searchSection}>
                <View style={[styles.searchBar, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
                    <Ionicons name="search-outline" size={18} color={theme.textDim} />
                    <TextInput
                        placeholder="Search by Transaction ID..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[styles.searchInput, { color: theme.text }]}
                    />
                </View>
            </View>

            <View style={styles.orderList}>
                {filteredOrders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color={theme.textDim} />
                        <Text style={[styles.emptyText, { color: theme.textDim }]}>No orders match your search.</Text>
                    </View>
                ) : (
                    filteredOrders.map((order, idx) => (
                        <View key={idx} style={[styles.orderCard, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.orderMain}>
                                    <Text style={[styles.orderName, { color: theme.text }]}>{order.name}</Text>
                                    <View style={styles.qtyBadge}>
                                        <Text style={styles.qtyText}>x{order.quantity}</Text>
                                    </View>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: order.status === 'Completed' ? '#ecfdf5' : '#fff7ed' }
                                ]}>
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: order.status === 'Completed' ? '#10b981' : '#f97316' }
                                    ]} />
                                    <Text style={[
                                        styles.statusText,
                                        { color: order.status === 'Completed' ? '#065f46' : '#9a3412' }
                                    ]}>
                                        {order.status}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.orderDetails}>
                                <View style={styles.detailRow}>
                                    <Ionicons name="barcode-outline" size={14} color={theme.textDim} />
                                    <Text style={[styles.detailText, { color: theme.textDim }]}>ID: {order.transactionId}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Ionicons name="person-outline" size={14} color={theme.textDim} />
                                    <Text style={[styles.detailText, { color: theme.textDim }]}>{order.userEmail}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Ionicons name="location-outline" size={14} color={theme.textDim} />
                                    <Text style={[styles.detailText, { color: theme.textDim }]} numberOfLines={1}>{order.deliveryAddress}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.deliverySection}>
                                <Text style={[styles.sectionLabel, { color: theme.textDim }]}>ESTIMATED DELIVERY</Text>
                                <View style={styles.etaRow}>
                                    <View style={styles.etaInputWrapper}>
                                        <Ionicons name="time-outline" size={18} color={theme.primary} style={styles.etaIcon} />
                                        <TextInput
                                            placeholder="Set arrival time..."
                                            placeholderTextColor="#94a3b8"
                                            value={etaInputs[order.transactionId] ?? order.deliveryEta ?? ''}
                                            onChangeText={(text) => setEtaInputs(prev => ({ ...prev, [order.transactionId]: text }))}
                                            style={[styles.etaInput, { color: theme.text }]}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.confirmBtn, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
                                        onPress={() => updateEta(order, etaInputs[order.transactionId] ?? '')}
                                    >
                                        <Text style={[styles.confirmBtnText, { color: theme.primary }]}>Update</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.statusToggleBtn,
                                    { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }
                                ]}
                                onPress={() => toggleStatus(order)}
                            >
                                <Text style={[
                                    styles.statusToggleText,
                                    { color: theme.primary }
                                ]}>
                                    {order.status === 'Incomplete' ? 'Mark Completed' : 'Revert to Incomplete'}
                                </Text>
                                <Ionicons
                                    name={order.status === 'Incomplete' ? "checkmark-done" : "refresh"}
                                    size={18}
                                    color={theme.primary}
                                />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    header: {
        marginTop: 100,
        marginBottom: 30,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: { fontWeight: '800', textAlign: 'center' },
    subtitle: { fontWeight: '500', marginTop: 4, textAlign: 'center' },
    searchSection: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRadius: 20,
        height: 54,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '500',
    },
    orderList: {
        paddingHorizontal: 20,
    },
    orderCard: {
        borderRadius: 28,
        padding: 20,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    orderMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    orderName: {
        fontSize: 16,
        fontWeight: '800',
    },
    qtyBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    qtyText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    orderDetails: {
        gap: 6,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 13,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
    },
    deliverySection: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 8,
    },
    etaRow: {
        flexDirection: 'row',
        gap: 10,
    },
    etaInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        paddingHorizontal: 12,
    },
    etaIcon: {
        marginRight: 8,
    },
    etaInput: {
        flex: 1,
        height: 44,
        fontSize: 14,
        fontWeight: '600',
    },
    confirmBtn: {
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: 14,
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    statusToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 10,
    },
    statusToggleText: {
        fontSize: 14,
        fontWeight: '800',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 15,
        fontWeight: '500',
    },
});
