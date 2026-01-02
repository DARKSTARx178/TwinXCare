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
            const reqQ = query(collection(db, 'escort', 'request', 'entries'), where('status', '==', 'pending'));
            const reqSnap = await getDocs(reqQ);
            const reqList = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setRequests(reqList);

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
            style={[
                styles.itemCard,
                {
                    backgroundColor: theme.surface,
                    borderColor: selectedRequest?.id === item.id ? theme.primary : theme.border,
                    borderWidth: selectedRequest?.id === item.id ? 2 : 1
                }
            ]}
            onPress={() => setSelectedRequest(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Ionicons name="medical" size={18} color="#ef4444" />
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.hospital}</Text>
            </View>
            <View style={styles.cardDetail}>
                <Ionicons name="calendar-outline" size={14} color={theme.textDim} />
                <Text style={[styles.detailText, { color: theme.text }]}>{item.date} • {item.time}</Text>
            </View>
            <Text style={[styles.reasonText, { color: theme.textDim }]} numberOfLines={2}>{item.appointmentReason}</Text>
        </TouchableOpacity>
    );

    const renderAvailabilityItem = ({ item }: { item: any }) => (
        <View style={[styles.itemCard, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
                <Ionicons name="person-circle" size={18} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.providerEmail.split('@')[0]}</Text>
            </View>
            <View style={styles.cardDetail}>
                <Ionicons name="time-outline" size={14} color={theme.textDim} />
                <Text style={[styles.detailText, { color: theme.text }]}>{item.date} • {item.fromTime}-{item.toTime}</Text>
            </View>
            <Text style={[styles.locationText, { color: theme.textDim }]}>Loc: {item.location}</Text>

            {selectedRequest && (
                <TouchableOpacity
                    style={[styles.matchBtn, { borderColor: theme.primary, borderWidth: 1.5, backgroundColor: theme.surface }]}
                    onPress={() => handleCompromise(item.providerId, item.providerEmail, selectedRequest)}
                >
                    <Ionicons name="hand-left" size={14} color={theme.primary} />
                    <Text style={[styles.matchBtnText, { color: theme.primary }]}>Ask for Help</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.header}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
                    <Ionicons name="git-pull-request-outline" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>Escort Matcher</Text>
                <Text style={[styles.subtitle, { color: theme.textDim }]}>
                    Connect volunteers with medical requests
                </Text>
            </View>

            <View style={styles.content}>
                <View style={styles.column}>
                    <View style={styles.columnHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Requests</Text>
                        <View style={styles.countBadge}><Text style={styles.countText}>{requests.length}</Text></View>
                    </View>
                    <FlatList
                        data={requests}
                        renderItem={renderRequestItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                </View>

                <View style={styles.column}>
                    <View style={styles.columnHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Volunteers</Text>
                        <View style={[styles.countBadge, { backgroundColor: theme.primaryGlow }]}><Text style={[styles.countText, { color: theme.primary }]}>{availabilities.length}</Text></View>
                    </View>
                    <FlatList
                        data={availabilities}
                        renderItem={renderAvailabilityItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                </View>
            </View>

            {!selectedRequest && (
                <View style={[styles.hintBox, { backgroundColor: theme.surface }]}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                    <Text style={[styles.hintText, { color: theme.textDim }]}>Select a request on the left to start matching.</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
        marginBottom: 20,
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
    title: { fontSize: 24, fontWeight: '900' },
    subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
    content: { flex: 1, flexDirection: 'row', paddingHorizontal: 12 },
    column: { flex: 1, paddingHorizontal: 6 },
    columnHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
        paddingHorizontal: 4,
    },
    sectionTitle: { fontSize: 15, fontWeight: '800' },
    countBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    countText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
    itemCard: {
        padding: 14,
        borderRadius: 20,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    cardTitle: { fontSize: 13, fontWeight: '800', flex: 1 },
    cardDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    detailText: { fontSize: 11, fontWeight: '600' },
    reasonText: { fontSize: 10, lineHeight: 14, fontWeight: '500' },
    locationText: { fontSize: 10, fontWeight: '600' },
    matchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 10,
        marginTop: 10,
        gap: 6,
    },
    matchBtnText: { fontSize: 11, fontWeight: '800' },
    hintBox: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 20,
        padding: 16,
        borderRadius: 20,
        gap: 12,
    },
    hintText: { fontSize: 12, fontWeight: '500' },
});
