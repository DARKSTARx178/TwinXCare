import { ThemeContext } from '@/contexts/ThemeContext';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebase/firebase';

export default function AdminEquipmentMgt() {
    const { theme } = useContext(ThemeContext);
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

    const fetchEquipment = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'equipment'));
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEquipmentList(items);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchEquipment();
    }, []);

    const router = useRouter();

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

    const handleUpdateStock = async (id: string, newStock: number) => {
        try {
            await updateDoc(doc(db, 'equipment', id), { stock: newStock });
            fetchEquipment();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to update stock.');
        }
    };

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

    const toggleExpand = (item: any) => {
        const id = item.id;
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
        setEditingFields(prev => {
            if (prev[id]) return prev;
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
                    <Ionicons name="construct-outline" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.title, { color: theme.text, fontSize: textSize + 10 }]}>Inventory</Text>
                <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
                    Manage
                </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
                <Text style={[styles.cardHeading, { color: theme.text }]}>Add Item</Text>

                <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                        <Text style={[styles.label, { color: theme.textDim }]}>Item Name</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="e.g. Wheelchair"
                            placeholderTextColor="#94a3b8"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>
                    <View style={styles.inputWrapper}>
                        <Text style={[styles.label, { color: theme.textDim }]}>Brand</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="e.g. HealthCo"
                            placeholderTextColor="#94a3b8"
                            value={brand}
                            onChangeText={setBrand}
                        />
                    </View>
                </View>

                <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                        <Text style={[styles.label, { color: theme.textDim }]}>Price/Day</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="0.00"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={price}
                            onChangeText={setPrice}
                        />
                    </View>
                    <View style={styles.inputWrapper}>
                        <Text style={[styles.label, { color: theme.textDim }]}>Initial Stock</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={stock}
                            onChangeText={setStock}
                        />
                    </View>
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={[styles.label, { color: theme.textDim }]}>Description</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, minHeight: 80, textAlignVertical: 'top' }]}
                        placeholder="Detailed item description..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={[styles.label, { color: theme.textDim }]}>Image URL</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="https://example.com/image.jpg"
                        placeholderTextColor="#94a3b8"
                        value={image}
                        onChangeText={setImage}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.addButton, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
                    onPress={handleAddEquipment}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.addButtonText, { color: theme.primary }]}>Register</Text>
                    <Ionicons name="add-circle-outline" size={20} color={theme.primary} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Inventory</Text>
                <View style={[styles.searchBar, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
                    <Ionicons name="search-outline" size={18} color={theme.textDim} />
                    <TextInput
                        placeholder="Search items..."
                        placeholderTextColor="#94a3b8"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        style={[styles.searchInput, { color: theme.text }]}
                    />
                </View>
            </View>

            <View style={styles.inventoryList}>
                {equipmentList.filter(e => {
                    const term = searchTerm.trim().toLowerCase();
                    if (!term) return true;
                    return (
                        (e.name || '').toLowerCase().includes(term) ||
                        (e.brand || '').toLowerCase().includes(term) ||
                        (e.description || '').toLowerCase().includes(term)
                    );
                }).map((item) => {
                    const isExpanded = !!expandedItems[item.id];
                    const editing = editingFields[item.id] || {};
                    const isManaging = isEditing[item.id];

                    return (
                        <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
                            <TouchableOpacity
                                onPress={() => toggleExpand(item)}
                                activeOpacity={0.7}
                                style={styles.cardMain}
                            >
                                <View style={styles.itemIconContainer}>
                                    <Ionicons name="cube-outline" size={24} color={theme.primary} />
                                </View>
                                <View style={styles.itemMainInfo}>
                                    <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                                    <View style={styles.itemMeta}>
                                        <Text style={[styles.itemBrand, { color: theme.textDim }]}>{item.brand}</Text>
                                        <View style={styles.dot} />
                                        <Text style={[styles.itemPrice, { color: theme.primary }]}>${item.price}/day</Text>
                                    </View>
                                </View>
                                <View style={styles.stockStatus}>
                                    <Text style={[styles.stockCount, { color: theme.text }]}>{item.stock}</Text>
                                    <Text style={[styles.stockLabel, { color: theme.textDim }]}>STOCK</Text>
                                </View>
                                <Ionicons
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color={theme.textDim}
                                    style={{ marginLeft: 10 }}
                                />
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.expandedContent}>
                                    <View style={styles.divider} />

                                    {!isManaging ? (
                                        <View style={styles.detailsView}>
                                            <Text style={[styles.detailDesc, { color: theme.textDim }]}>
                                                {item.description || 'No description provided.'}
                                            </Text>
                                            <View style={styles.manageRow}>
                                                <TouchableOpacity
                                                    style={[styles.manageBtn, { borderColor: theme.border, borderWidth: 1.5, backgroundColor: theme.surface }]}
                                                    onPress={() => handleUpdateStock(item.id, item.stock + 1)}
                                                >
                                                    <Ionicons name="add" size={18} color={theme.text} />
                                                    <Text style={[styles.manageBtnText, { color: theme.text }]}>Add Stock</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.manageBtn, { borderColor: theme.border, borderWidth: 1.5, backgroundColor: theme.surface }]}
                                                    onPress={() => handleUpdateStock(item.id, Math.max(0, item.stock - 1))}
                                                >
                                                    <Ionicons name="remove" size={18} color={theme.text} />
                                                    <Text style={[styles.manageBtnText, { color: theme.text }]}>Remove</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.manageBtn, { borderColor: theme.primary, borderWidth: 1.5, backgroundColor: theme.surface }]}
                                                    onPress={() => toggleEditMode(item.id, item)}
                                                >
                                                    <Ionicons name="create-outline" size={18} color={theme.primary} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.manageBtn, { borderColor: '#ef4444', borderWidth: 1.5, backgroundColor: theme.surface }]}
                                                    onPress={() => handleDeleteEquipment(item.id, item.name)}
                                                >
                                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.editForm}>
                                            <TextInput
                                                style={[styles.inlineInput, { color: theme.text }]}
                                                value={editing.name}
                                                onChangeText={(v) => setEditingFields(prev => ({ ...prev, [item.id]: { ...prev[item.id], name: v } }))}
                                            />
                                            <TextInput
                                                style={[styles.inlineInput, { color: theme.text }]}
                                                value={editing.brand}
                                                onChangeText={(v) => setEditingFields(prev => ({ ...prev, [item.id]: { ...prev[item.id], brand: v } }))}
                                            />
                                            <View style={styles.editRow}>
                                                <TextInput
                                                    style={[styles.inlineInput, { flex: 1, color: theme.text, marginRight: 8 }]}
                                                    value={editing.price}
                                                    keyboardType="numeric"
                                                    onChangeText={(v) => setEditingFields(prev => ({ ...prev, [item.id]: { ...prev[item.id], price: v } }))}
                                                />
                                                <TextInput
                                                    style={[styles.inlineInput, { flex: 1, color: theme.text }]}
                                                    value={editing.stock}
                                                    keyboardType="numeric"
                                                    onChangeText={(v) => setEditingFields(prev => ({ ...prev, [item.id]: { ...prev[item.id], stock: v } }))}
                                                />
                                            </View>
                                            <View style={styles.saveRow}>
                                                <TouchableOpacity
                                                    style={[styles.saveBtn, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
                                                    onPress={async () => { await handleUpdateEquipment(item.id); setIsEditing(prev => ({ ...prev, [item.id]: false })); }}
                                                >
                                                    <Text style={[styles.saveBtnText, { color: theme.primary }]}>Save Changes</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.cancelBtn, { borderColor: theme.border, borderWidth: 1.5, backgroundColor: theme.surface }]}
                                                    onPress={() => toggleEditMode(item.id)}
                                                >
                                                    <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}
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
        marginBottom: 30,
    },
    cardHeading: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 20,
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    inputWrapper: {
        flex: 1,
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
        marginBottom: 15,
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
    inventoryList: {
        paddingHorizontal: 20,
    },
    itemCard: {
        borderRadius: 24,
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    itemIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(129, 173, 231, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    itemMainInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 2,
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemBrand: {
        fontSize: 12,
        fontWeight: '600',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 8,
    },
    itemPrice: {
        fontSize: 12,
        fontWeight: '700',
    },
    stockStatus: {
        alignItems: 'center',
        paddingHorizontal: 12,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.05)',
    },
    stockCount: {
        fontSize: 16,
        fontWeight: '900',
    },
    stockLabel: {
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1,
    },
    expandedContent: {
        padding: 16,
        paddingTop: 0,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
    },
    detailsView: {
    },
    detailDesc: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 16,
    },
    manageRow: {
        flexDirection: 'row',
        gap: 8,
    },
    manageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6,
    },
    manageBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    editForm: {
        gap: 10,
    },
    inlineInput: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    editRow: {
        flexDirection: 'row',
    },
    saveRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    saveBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontWeight: '800',
        fontSize: 14,
    },
});
