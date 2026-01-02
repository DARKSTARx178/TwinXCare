import { ThemeContext } from '@/contexts/ThemeContext';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebase/firebase';

interface ScheduleItem {
    date: string;
    from: string;
    to: string;
    pax: number;
}

interface ServiceItem {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: string;
    company: string;
    image?: string;
    schedule: ScheduleItem[];
}

export default function AdminServiceMgt() {
    const { theme } = useContext(ThemeContext);
    const textSize = getFontSizeValue('medium');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [company, setCompany] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');

    const [services, setServices] = useState<ServiceItem[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const [newDate, setNewDate] = useState('');
    const [newFrom, setNewFrom] = useState('');
    const [newTo, setNewTo] = useState('');
    const [newPax, setNewPax] = useState('');
    const router = useRouter();

    const fetchServices = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'services'));
            const items: ServiceItem[] = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                description: doc.data().description,
                price: doc.data().price,
                duration: doc.data().duration,
                company: doc.data().company,
                image: doc.data().image,
                schedule: doc.data().schedule || [],
            }));
            setServices(items);
        } catch (err) {
            console.error('Error fetching services:', err);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleAddService = async () => {
        if (!name || !description || !price || !duration || !company) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        try {
            await addDoc(collection(db, 'services'), {
                name,
                description,
                price: Number(price),
                duration,
                company,
                image: photoUrl,
                schedule: [],
            });
            setName(''); setDescription(''); setPrice(''); setDuration(''); setCompany(''); setPhotoUrl('');
            fetchServices();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to add service');
        }
    };

    const handleDateChange = (text: string) => {
        let cleaned = text.replace(/\D/g, '').slice(0, 8);
        if (cleaned.length > 4) cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
        if (cleaned.length > 7) cleaned = cleaned.slice(0, 7) + '-' + cleaned.slice(7);
        setNewDate(cleaned);
    };

    const handleTimeChange = (text: string, setter: (val: string) => void) => {
        let cleaned = text.replace(/\D/g, '').slice(0, 4);
        if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2);
        setter(cleaned);
    };

    const handleAddSchedule = async (serviceId: string) => {
        if (!newDate || !newFrom || !newTo || !newPax) {
            Alert.alert('Error', 'Fill all schedule fields');
            return;
        }

        const service = services.find(s => s.id === serviceId);
        if (!service) return;

        const updatedSchedule = [...service.schedule, {
            date: newDate,
            from: newFrom,
            to: newTo,
            pax: Number(newPax),
        }];

        try {
            await updateDoc(doc(db, 'services', serviceId), { schedule: updatedSchedule });
            setNewDate(''); setNewFrom(''); setNewTo(''); setNewPax('');
            fetchServices();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to add schedule');
        }
    };

    const handleDeleteSchedule = async (serviceId: string, index: number) => {
        const service = services.find(s => s.id === serviceId);
        if (!service) return;

        const updatedSchedule = service.schedule.filter((_, i) => i !== index);
        await updateDoc(doc(db, 'services', serviceId), { schedule: updatedSchedule });
        fetchServices();
    };

    const handleDeleteService = async (serviceId: string) => {
        try {
            await deleteDoc(doc(db, 'services', serviceId));
            fetchServices();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to delete service.');
        }
    };

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
                    <Ionicons name="calendar-outline" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.title, { color: theme.text, fontSize: textSize + 10 }]}>Service Catalog</Text>
                <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
                    Management of Professional Healthcare Services
                </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <Text style={[styles.cardHeading, { color: theme.text }]}>Add New Service</Text>

                <View style={styles.inputWrapper}>
                    <Text style={[styles.label, { color: theme.textDim }]}>Service Name</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="e.g. Elderly Home Visit"
                        placeholderTextColor="#94a3b8"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={[styles.formRow, { gap: 12 }]}>
                    <View style={styles.inputWrapper}>
                        <Text style={[styles.label, { color: theme.textDim }]}>Price</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="0.00"
                            placeholderTextColor="#94a3b8"
                            value={price}
                            keyboardType="numeric"
                            onChangeText={setPrice}
                        />
                    </View>
                    <View style={styles.inputWrapper}>
                        <Text style={[styles.label, { color: theme.textDim }]}>Duration</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="e.g. 60m"
                            placeholderTextColor="#94a3b8"
                            value={duration}
                            onChangeText={setDuration}
                        />
                    </View>
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={[styles.label, { color: theme.textDim }]}>Providing Company</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="e.g. CarePro Inc."
                        placeholderTextColor="#94a3b8"
                        value={company}
                        onChangeText={setCompany}
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={[styles.label, { color: theme.textDim }]}>Description</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, minHeight: 80, textAlignVertical: 'top' }]}
                        placeholder="Detail the service offerings..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={[styles.label, { color: theme.textDim }]}>Photo URL</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="https://images.unsplash.com/..."
                        placeholderTextColor="#94a3b8"
                        value={photoUrl}
                        onChangeText={setPhotoUrl}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={handleAddService}
                    activeOpacity={0.8}
                >
                    <Text style={styles.addButtonText}>Create Service Listing</Text>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Service Registry</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textDim }]}>Manage availability and details</Text>
            </View>

            <View style={styles.listContainer}>
                {services.map(service => (
                    <View key={service.id} style={[styles.serviceCard, { backgroundColor: theme.surface }]}>
                        <TouchableOpacity
                            onPress={() => setExpandedId(expandedId === service.id ? null : service.id)}
                            activeOpacity={0.7}
                            style={styles.cardMain}
                        >
                            <View style={styles.serviceIcon}>
                                <Ionicons name="medkit-outline" size={24} color={theme.primary} />
                            </View>
                            <View style={styles.serviceInfo}>
                                <Text style={[styles.serviceName, { color: theme.text }]}>{service.name}</Text>
                                <Text style={[styles.serviceCompany, { color: theme.textDim }]}>{service.company}</Text>
                            </View>
                            <View style={styles.serviceMeta}>
                                <Text style={[styles.servicePrice, { color: theme.primary }]}>${service.price}</Text>
                                <Text style={[styles.serviceDuration, { color: theme.textDim }]}>{service.duration}</Text>
                            </View>
                            <Ionicons
                                name={expandedId === service.id ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={theme.textDim}
                                style={{ marginLeft: 10 }}
                            />
                        </TouchableOpacity>

                        {expandedId === service.id && (
                            <View style={styles.expandedContent}>
                                <View style={styles.divider} />
                                <Text style={[styles.descText, { color: theme.textDim }]}>{service.description}</Text>

                                <View style={styles.managementSection}>
                                    <Text style={[styles.subSectionTitle, { color: theme.text }]}>Manage Schedule</Text>

                                    <View style={styles.scheduleInputs}>
                                        <View style={styles.formRow}>
                                            <TextInput
                                                style={[styles.inlineInput, { flex: 1.5, color: theme.text }]}
                                                placeholder="YYYY-MM-DD"
                                                placeholderTextColor="#94a3b8"
                                                value={newDate}
                                                onChangeText={handleDateChange}
                                            />
                                            <TextInput
                                                style={[styles.inlineInput, { flex: 1, color: theme.text }]}
                                                placeholder="Pax"
                                                placeholderTextColor="#94a3b8"
                                                value={newPax}
                                                keyboardType="numeric"
                                                onChangeText={setNewPax}
                                            />
                                        </View>
                                        <View style={styles.formRow}>
                                            <TextInput
                                                style={[styles.inlineInput, { flex: 1, color: theme.text }]}
                                                placeholder="From (HH:MM)"
                                                placeholderTextColor="#94a3b8"
                                                value={newFrom}
                                                onChangeText={(text) => handleTimeChange(text, setNewFrom)}
                                            />
                                            <TextInput
                                                style={[styles.inlineInput, { flex: 1, color: theme.text }]}
                                                placeholder="To (HH:MM)"
                                                placeholderTextColor="#94a3b8"
                                                value={newTo}
                                                onChangeText={(text) => handleTimeChange(text, setNewTo)}
                                            />
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.addScheduleBtn, { backgroundColor: theme.primaryGlow }]}
                                            onPress={() => handleAddSchedule(service.id)}
                                        >
                                            <Ionicons name="add" size={18} color={theme.primary} />
                                            <Text style={[styles.addScheduleText, { color: theme.primary }]}>Add Time Slot</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.scheduleList}>
                                        {service.schedule.map((s, i) => (
                                            <View key={i} style={[styles.scheduleRow, { backgroundColor: '#F8FAFC' }]}>
                                                <View style={styles.slotDetails}>
                                                    <View style={styles.dateInfo}>
                                                        <Ionicons name="calendar-outline" size={12} color={theme.primary} />
                                                        <Text style={[styles.slotDate, { color: theme.text }]}>{s.date}</Text>
                                                    </View>
                                                    <Text style={[styles.slotTime, { color: theme.textDim }]}>{s.from} - {s.to} • {s.pax} pax</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.slotDeleteBtn}
                                                    onPress={() => handleDeleteSchedule(service.id, i)}
                                                >
                                                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        style={styles.deleteServiceBtn}
                                        onPress={() => handleDeleteService(service.id)}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                        <Text style={styles.deleteServiceText}>Remove Service Entirely</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                ))}
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
    card: {
        marginHorizontal: 20,
        padding: 24,
        borderRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 6,
        marginBottom: 30,
    },
    cardHeading: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 20,
    },
    inputWrapper: {
        marginBottom: 16,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: '600',
    },
    formRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    addButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 15,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
    },
    sectionSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
    },
    listContainer: {
        paddingHorizontal: 20,
    },
    serviceCard: {
        borderRadius: 24,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
        overflow: 'hidden',
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
    },
    serviceIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(129, 173, 231, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 2,
    },
    serviceCompany: {
        fontSize: 12,
        fontWeight: '500',
    },
    serviceMeta: {
        alignItems: 'flex-end',
        paddingLeft: 10,
    },
    servicePrice: {
        fontSize: 16,
        fontWeight: '900',
    },
    serviceDuration: {
        fontSize: 11,
        fontWeight: '600',
    },
    expandedContent: {
        padding: 18,
        paddingTop: 0,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
    },
    descText: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 20,
    },
    managementSection: {
    },
    subSectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 12,
    },
    scheduleInputs: {
        gap: 8,
        marginBottom: 20,
    },
    inlineInput: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        fontWeight: '600',
        marginRight: 8,
    },
    addScheduleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 4,
        gap: 6,
    },
    addScheduleText: {
        fontSize: 13,
        fontWeight: '800',
    },
    scheduleList: {
        gap: 8,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
    },
    slotDetails: {
        flex: 1,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    slotDate: {
        fontSize: 13,
        fontWeight: '700',
    },
    slotTime: {
        fontSize: 11,
        fontWeight: '500',
    },
    slotDeleteBtn: {
        padding: 4,
    },
    deleteServiceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 25,
        paddingVertical: 10,
        gap: 8,
    },
    deleteServiceText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '700',
    },
});
