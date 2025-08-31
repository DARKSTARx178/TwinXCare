import { db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { getThemeColors } from '@/utils/theme';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';

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
    const theme = getThemeColors();
    const textSize = getFontSizeValue('medium');
    const screenWidth = Dimensions.get('window').width;

    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [etaInputs, setEtaInputs] = useState<Record<string, string>>({});

    const responsiveText = (base: number) =>
        Math.max(base * (screenWidth / 400), base * 0.85);

    // Fetch all users' orders
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
            Alert.alert('Success', 'ETA updated.');
        } catch (err) {
            console.error('Error updating ETA:', err);
            Alert.alert('Error', 'Failed to update delivery ETA.');
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
                            const userSnap = await getDocs(collection(db, 'users'));
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
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text> </Text>
            <Text style={{ color: theme.text, fontSize: responsiveText(textSize + 4), marginLeft: 16, marginBottom: 8 }}>
                Delivery Management
            </Text>
            <TextInput
                placeholder="Search by Transaction ID"
                placeholderTextColor={theme.unselected}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { borderColor: theme.unselected, color: theme.text, fontSize: textSize }]}
            />

            {filteredOrders.length === 0 ? (
                <Text style={{ color: theme.unselected, fontSize: textSize, margin: 16 }}>No orders found.</Text>
            ) : (
                filteredOrders.map((order, idx) => (
                    <View
                        key={idx}
                        style={{
                            backgroundColor: theme.unselectedTab,
                            borderRadius: 12,
                            padding: 16,
                            marginVertical: 8,
                            width: '90%',
                            alignSelf: 'center',
                        }}
                    >
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: responsiveText(textSize) }}>
                            {order.name} x{order.quantity}
                        </Text>
                        <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                            Transaction ID: {order.transactionId}
                        </Text>
                        <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                            User: {order.userEmail}
                        </Text>
                        <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                            Status: {order.status}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                            <TextInput
                                placeholder="Set Estimated Delivery"
                                placeholderTextColor={theme.unselected}
                                value={etaInputs[order.transactionId] ?? order.deliveryEta ?? ''}
                                onChangeText={(text) => setEtaInputs(prev => ({ ...prev, [order.transactionId]: text }))}
                                style={{
                                    flex: 1,
                                    borderWidth: 1,
                                    borderColor: theme.unselected,
                                    borderRadius: 8,
                                    padding: 8,
                                    color: theme.text,
                                    fontSize: textSize,
                                }}
                            />
                            <TouchableOpacity
                                style={{
                                    marginLeft: 8,
                                    backgroundColor: theme.primary,
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    borderRadius: 8,
                                }}
                                onPress={() => updateEta(order, etaInputs[order.transactionId] ?? '')}
                            >
                                <Text style={{ color: theme.background, fontWeight: 'bold' }}>Confirm</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: order.status === 'Incomplete' ? theme.primary : 'green' }]}
                            onPress={() => toggleStatus(order)}
                        >
                            <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>
                                {order.status === 'Incomplete' ? 'Mark Completed' : 'Mark Incomplete'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    searchInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        margin: 16,
    },
    button: {
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: 'center',
        marginTop: 8,
    },
});
