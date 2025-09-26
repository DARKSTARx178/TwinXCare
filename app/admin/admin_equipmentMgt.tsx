import { getFontSizeValue } from '@/utils/fontSizes';
import { getThemeColors } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebase/firebase';

export default function AdminEquipmentMgt() {
    const theme = getThemeColors();
    const textSize = getFontSizeValue('medium');

    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [equipmentList, setEquipmentList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingFields, setEditingFields] = useState<Record<string, any>>({});
    const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    // Fetch all equipment from Firestore
    const fetchEquipment = async () => {
        const snapshot = await getDocs(collection(db, 'equipment'));
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipmentList(items);
    };

    useEffect(() => {
        fetchEquipment();
    }, []);

    const router = useRouter();

    // Add new equipment
    const handleAddEquipment = async () => {
        if (!name || !brand || !price || !stock) {
            Alert.alert('Error', 'Please fill all required fields.');
            return;
        }

        try {
            await addDoc(collection(db, 'equipment'), {
                name,
                brand,
                price: Number(price),
                stock: Number(stock),
                description,
                image,
                createdAt: new Date(),
            });

            Alert.alert('Success', 'Equipment added!');
            setName(''); setBrand(''); setPrice(''); setStock(''); setDescription(''); setImage('');
            fetchEquipment();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to add equipment.');
        }
    };

    // Update stock
    const handleUpdateStock = async (id: string, newStock: number) => {
        try {
            await updateDoc(doc(db, 'equipment', id), { stock: newStock });
            fetchEquipment();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to update stock.');
        }
    };

    // Delete equipment
    const handleDeleteEquipment = async (id: string, name: string) => {
        Alert.alert(
            'Delete Equipment',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'equipment', id));
                            fetchEquipment();
                        } catch (e) {
                            console.error(e);
                            Alert.alert('Error', 'Failed to delete equipment.');
                        }
                    },
                },
            ]
        );
    };

    // Toggle expand/collapse and initialize editing fields for that item
    const toggleExpand = (item: any) => {
        const id = item.id;
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
        // initialize editing values when expanding
        setEditingFields(prev => {
            if (prev[id]) return prev; // already initialized
            return {
                ...prev,
                [id]: {
                    name: item.name ?? '',
                    brand: item.brand ?? '',
                    price: item.price != null ? String(item.price) : '',
                    stock: item.stock != null ? String(item.stock) : '',
                    description: item.description ?? '',
                    image: item.image ?? '',
                }
            };
        });
    };

    const toggleEditMode = (id: string, item?: any) => {
        // ensure fields initialized
        setEditingFields(prev => {
            if (prev[id]) return prev;
            return {
                ...prev,
                [id]: {
                    name: item?.name ?? '',
                    brand: item?.brand ?? '',
                    price: item?.price != null ? String(item.price) : '',
                    stock: item?.stock != null ? String(item.stock) : '',
                    description: item?.description ?? '',
                    image: item?.image ?? '',
                }
            };
        });

        setIsEditing(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Update equipment fields
    const handleUpdateEquipment = async (id: string) => {
        const fields = editingFields[id];
        if (!fields) return;
        try {
            await updateDoc(doc(db, 'equipment', id), {
                name: fields.name,
                brand: fields.brand,
                price: Number(fields.price) || 0,
                stock: Number(fields.stock) || 0,
                description: fields.description,
                image: fields.image,
            });
            Alert.alert('Success', 'Equipment updated!');
            fetchEquipment();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to update equipment.');
        }
    };
    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={theme.text} left={-30} bottom={25} />
            </TouchableOpacity>
            <Text>  </Text>
            <Text>  </Text>
            <Text>  </Text>
            <Text style={[styles.heading, { color: theme.text, fontSize: textSize + 6 }]}>Manage Equipment</Text>

            {/* Add New Equipment (compact: two-column rows) */}
            <View style={styles.inputContainer}>
                <View style={styles.row}>
                    <TextInput style={[styles.inputHalf, { borderColor: theme.primary, color: theme.text }]} placeholder="Name" placeholderTextColor="#aaa" value={name} onChangeText={setName} />
                    <TextInput style={[styles.inputHalf, { borderColor: theme.primary, color: theme.text }]} placeholder="Brand" placeholderTextColor="#aaa" value={brand} onChangeText={setBrand} />
                </View>
                <View style={styles.row}>
                    <TextInput style={[styles.inputHalf, { borderColor: theme.primary, color: theme.text }]} placeholder="Price (per day)" placeholderTextColor="#aaa" keyboardType="numeric" value={price} onChangeText={setPrice} />
                    <TextInput style={[styles.inputHalf, { borderColor: theme.primary, color: theme.text }]} placeholder="Stock" placeholderTextColor="#aaa" keyboardType="numeric" value={stock} onChangeText={setStock} />
                </View>
                <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Description" placeholderTextColor="#aaa" value={description} onChangeText={setDescription} />
                <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Image URL" placeholderTextColor="#aaa" value={image} onChangeText={setImage} />

                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleAddEquipment}>
                    <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Add Equipment</Text>
                </TouchableOpacity>
            </View>

            {/* Existing Equipment List */}
            <Text style={[styles.subHeading, { color: theme.text, fontSize: textSize + 4 }]}>Existing Equipment</Text>
            <TextInput
                placeholder="Search equipment..."
                placeholderTextColor="#999"
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={[styles.searchInput, { borderColor: theme.unselected, color: theme.text }]}
            />

            <FlatList
                data={equipmentList.filter(e => {
                    const term = searchTerm.trim().toLowerCase();
                    if (!term) return true;
                    return (
                        (e.name || '').toLowerCase().includes(term) ||
                        (e.brand || '').toLowerCase().includes(term) ||
                        (e.description || '').toLowerCase().includes(term)
                    );
                })}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                    const isExpanded = !!expandedItems[item.id];
                    const editing = editingFields[item.id] || {};
                    return (
                        <TouchableOpacity
                            onPress={() => toggleExpand(item)}
                            activeOpacity={0.95}
                            style={[styles.itemContainer, { borderColor: theme.unselected }]}
                        >
                            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize }}>
                                {item.name} ({item.brand})
                            </Text>

                            {isExpanded && (
                                <View style={{ marginTop: 10 }}>
                                    {/* Title and brand as bold lines */}
                                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize + 2 }}>{item.name}</Text>
                                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize }}>{item.brand}</Text>

                                    {/* Price, Stock, Description stacked */}
                                    {!isEditing[item.id] && (
                                        <View style={{ marginTop: 8 }}>
                                            <Text style={{ color: theme.text, fontSize: textSize }}>Price: ${item.price}</Text>
                                            <Text style={{ color: theme.text, fontSize: textSize, marginTop: 6 }}>Stock: {item.stock}</Text>
                                            {item.description ? <Text style={{ color: theme.text, fontSize: textSize, marginTop: 6 }}>Description: {item.description}</Text> : null}
                                        </View>
                                    )}

                                    {/* Edit mode: inputs stacked similarly */}
                                    {isEditing[item.id] && (
                                        <View style={{ marginTop: 8 }}>
                                            <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} value={editing.name} onChangeText={(v) => setEditingFields(prev => ({ ...prev, [item.id]: { ...prev[item.id], name: v } }))} />
                                            <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} value={editing.brand} onChangeText={(v) => setEditingFields(prev => ({ ...prev, [item.id]: { ...prev[item.id], brand: v } }))} />
                                            <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} value={editing.price} keyboardType="numeric" onChangeText={(v) => setEditingFields(prev => ({ ...prev, [item.id]: { ...prev[item.id], price: v } }))} />
                                            <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} value={editing.stock} keyboardType="numeric" onChangeText={(v) => setEditingFields(prev => ({ ...prev, [item.id]: { ...prev[item.id], stock: v } }))} />
                                            <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} value={editing.description} onChangeText={(v) => setEditingFields(prev => ({ ...prev, [item.id]: { ...prev[item.id], description: v } }))} />
                                        </View>
                                    )}

                                    {/* Single row of 4 buttons at bottom */}
                                    <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
                                        {!isEditing[item.id] ? (
                                            <>
                                                <TouchableOpacity style={[styles.smallButton, { backgroundColor: theme.primary }]} onPress={() => handleUpdateStock(item.id, item.stock + 1)}>
                                                    <Text style={{ color: theme.background }}>+1</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#d32f2f' }]} onPress={() => handleUpdateStock(item.id, Math.max(0, item.stock - 1))}>
                                                    <Text style={{ color: '#fff' }}>-1</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#1976d2' }]} onPress={() => toggleEditMode(item.id, item)}>
                                                    <Text style={{ color: '#fff' }}>Edit</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#e53935' }]} onPress={() => handleDeleteEquipment(item.id, item.name)}>
                                                    <Text style={{ color: '#fff' }}>Delete</Text>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <>
                                                <TouchableOpacity style={[styles.smallButton, { backgroundColor: theme.primary }]} onPress={async () => { await handleUpdateEquipment(item.id); setIsEditing(prev => ({ ...prev, [item.id]: false })); }}>
                                                    <Text style={{ color: theme.background }}>Save</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#9e9e9e' }]} onPress={() => { setEditingFields(prev => ({ ...prev, [item.id]: { name: item.name ?? '', brand: item.brand ?? '', price: String(item.price ?? ''), stock: String(item.stock ?? ''), description: item.description ?? '', image: item.image ?? '' } })); setIsEditing(prev => ({ ...prev, [item.id]: false })); }}>
                                                    <Text style={{ color: '#fff' }}>Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.smallButton, { backgroundColor: theme.primary }]} onPress={() => setEditingFields(prev => ({ ...prev, [item.id]: { ...prev[item.id], stock: String(Number(prev[item.id]?.stock || item.stock) + 1) } }))}>
                                                    <Text style={{ color: theme.background }}>+1</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#e53935' }]} onPress={() => handleDeleteEquipment(item.id, item.name)}>
                                                    <Text style={{ color: '#fff' }}>Delete</Text>
                                                </TouchableOpacity>
                                            </>
                                        )}
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24 },
    heading: { fontWeight: 'bold', marginBottom: 20 },
    subHeading: { fontWeight: 'bold', marginTop: 20, marginBottom: 12 },
    inputContainer: { marginBottom: 24 },
    input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: 'rgba(0,0,0,0.03)' },
    inputHalf: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: 'rgba(0,0,0,0.03)', marginRight: 8 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stockControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    searchInput: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
    button: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    itemContainer: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
    smallButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
    backButton: { position: "absolute", top: 35, left: 20, zIndex: 1, backgroundColor: "transparent", padding: 6 },
});
