import { ThemeContext } from '@/contexts/ThemeContext';
import { db } from '@/firebase/firebase';
import { sendPushNotification } from '@/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminEscortMatch() {
    const router = useRouter();
    const { theme } = useContext(ThemeContext);
    const [requests, setRequests] = useState<any[]>([]);
    const [availabilities, setAvailabilities] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Pending Requests
            const reqQ = query(collection(db, 'escort', 'request', 'entries'), where('status', '==', 'pending'));
            const reqSnap = await getDocs(reqQ);
            const reqList = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setRequests(reqList);

            // Fetch Available Escorts
            const availQ = query(collection(db, 'escort', 'availability', 'entries'), where('status', '==', 'available'));
            const availSnap = await getDocs(availQ);
            const availList = availSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAvailabilities(availList);

        } catch (e) {
            console.error('Error fetching match data:', e);
        } finally {
            setLoading(false);
        }
    };

    const getUserPushToken = async (userId: string) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data().pushToken;
            }
        } catch (e) {
            console.error('Error fetching user push token:', e);
        }
        return null;
    };

    const handleCompromise = async (providerId: string, providerEmail: string, request: any) => {
        Alert.alert(
            'Request Compromise',
            `Send a notification to ${providerEmail} asking if they can help with the request at ${request.hospital} on ${request.date}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send',
                    onPress: async () => {
                        const token = await getUserPushToken(providerId);
                        if (token) {
                            const msg = `Can you help? A patient needs an escort on ${request.date} at ${request.time} (${request.hospital}). Please check if you can adjust your schedule.`;
                            await sendPushNotification(token, 'Compromise Request 🤝', msg, { requestId: request.id });
                            Alert.alert('Sent', 'Notification sent to provider.');
                        } else {
                            Alert.alert('Error', 'Provider has no push token.');
                        }
                    }
                }
            ]
        );
    };

    const renderRequestItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.unselectedTab, borderColor: selectedRequest?.id === item.id ? theme.primary : 'transparent', borderWidth: 2 }]}
            onPress={() => setSelectedRequest(item)}
        >
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.hospital}</Text>
            <Text style={{ color: theme.text }}>📅 {item.date} at {item.time}</Text>
            <Text style={{ color: theme.unselected }}>Reason: {item.appointmentReason}</Text>
        </TouchableOpacity>
    );

    const renderAvailabilityItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.unselectedTab }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.location}</Text>
            <Text style={{ color: theme.text }}>📅 {item.date} ({item.fromTime} - {item.toTime})</Text>
            <Text style={{ color: theme.unselected }}>Provider: {item.providerEmail}</Text>

            {selectedRequest && (
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleCompromise(item.providerId, item.providerEmail, selectedRequest)}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Request Compromise</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Escort Matching Admin</Text>
                <TouchableOpacity onPress={fetchData} style={{ padding: 8 }}>
                    <Ionicons name="refresh" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.column}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Pending Requests ({requests.length})</Text>
                    <FlatList
                        data={requests}
                        renderItem={renderRequestItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                </View>

                <View style={styles.column}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Available Escorts ({availabilities.length})</Text>
                    <Text style={{ color: theme.unselected, marginBottom: 8, fontSize: 12 }}>
                        {selectedRequest ? `Select an escort to ask for compromise for request: ${selectedRequest.hospital}` : 'Select a request on the left to enable actions'}
                    </Text>
                    <FlatList
                        data={availabilities}
                        renderItem={renderAvailabilityItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { flex: 1, flexDirection: 'row' },
    column: { flex: 1, paddingHorizontal: 8 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    card: { padding: 12, borderRadius: 8, marginBottom: 12 },
    cardTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
    actionButton: { marginTop: 8, padding: 8, borderRadius: 6, alignItems: 'center' }
});
