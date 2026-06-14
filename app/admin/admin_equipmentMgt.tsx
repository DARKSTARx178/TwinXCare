import { ThemeContext } from '@/contexts/ThemeContext';
import LocationAutocomplete, { SelectedLocation } from '@/components/LocationAutocomplete';
import { db } from '@/firebase/firebase';
import { EquipmentStockLocation, PICKUP_LOCATIONS, getTotalEquipmentStock, normalizeEquipmentLocations } from '@/utils/equipmentStock';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Warehouse = Omit<EquipmentStockLocation, 'stock'> & {
    source?: 'default' | 'firebase';
};

type EquipmentEditFields = {
    name: string;
    brand: string;
    price: string;
    description: string;
    image: string;
    stockByLocation: EquipmentStockLocation[];
};

const WAREHOUSE_COLLECTION = 'equipmentWarehouses';

const makeWarehouseId = (name: string) =>
    name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `warehouse-${Date.now()}`;

const toWarehouseStock = (warehouse: Warehouse, stock = 0): EquipmentStockLocation => ({
    id: warehouse.id,
    name: warehouse.name,
    address: warehouse.address,
    latitude: warehouse.latitude,
    longitude: warehouse.longitude,
    stock,
});

export default function AdminEquipmentMgt() {
    const { theme } = useContext(ThemeContext);
    const textSize = getFontSizeValue('medium');
    const router = useRouter();

    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [newEquipmentStock, setNewEquipmentStock] = useState<Record<string, string>>({});
    const [equipmentList, setEquipmentList] = useState<any[]>([]);
    const [warehouseList, setWarehouseList] = useState<Warehouse[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingFields, setEditingFields] = useState<Record<string, EquipmentEditFields>>({});
    const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [warehouseAddress, setWarehouseAddress] = useState('');
    const [selectedWarehouseLocation, setSelectedWarehouseLocation] = useState<SelectedLocation | null>(null);
    const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);

    const availableWarehouses = useMemo<Warehouse[]>(() => {
        if (warehouseList.length > 0) return warehouseList;
        return PICKUP_LOCATIONS.map((location) => ({ ...location, source: 'default' as const }));
    }, [warehouseList]);

    const fetchEquipment = useCallback(async () => {
        try {
            const snapshot = await getDocs(collection(db, 'equipment'));
            const items = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                const stockByLocation = normalizeEquipmentLocations(data);
                return {
                    id: docSnap.id,
                    ...data,
                    stockByLocation,
                    stock: getTotalEquipmentStock(stockByLocation),
                };
            });
            setEquipmentList(items);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const fetchWarehouses = useCallback(async () => {
        try {
            const snapshot = await getDocs(collection(db, WAREHOUSE_COLLECTION));
            const warehouses = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    name: String(data.name || 'Warehouse'),
                    address: String(data.address || 'Pickup point'),
                    latitude: Number(data.latitude ?? data.lat ?? 1.3521),
                    longitude: Number(data.longitude ?? data.lon ?? 103.8198),
                    source: 'firebase' as const,
                };
            });
            setWarehouseList(warehouses);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchEquipment();
        fetchWarehouses();
    }, [fetchEquipment, fetchWarehouses]);

    useEffect(() => {
        setNewEquipmentStock((prev) => {
            const next = { ...prev };
            availableWarehouses.forEach((warehouse) => {
                if (next[warehouse.id] == null) next[warehouse.id] = '';
            });
            return next;
        });
    }, [availableWarehouses]);

    const createEditFields = (item: any): EquipmentEditFields => {
        const currentLocations = normalizeEquipmentLocations(item);
        const currentById = currentLocations.reduce<Record<string, EquipmentStockLocation>>((acc, location) => {
            acc[location.id] = location;
            return acc;
        }, {});

        const stockByLocation = availableWarehouses.map((warehouse) => ({
            ...toWarehouseStock(warehouse),
            stock: currentById[warehouse.id]?.stock ?? 0,
        }));

        currentLocations.forEach((location) => {
            if (!stockByLocation.some((entry) => entry.id === location.id)) {
                stockByLocation.push(location);
            }
        });

        return {
            name: item.name ?? '',
            brand: item.brand ?? '',
            price: item.price != null ? String(item.price) : '',
            description: item.description ?? '',
            image: item.image ?? '',
            stockByLocation,
        };
    };

    const clearWarehouseForm = () => {
        setWarehouseAddress('');
        setSelectedWarehouseLocation(null);
        setEditingWarehouseId(null);
    };

    const handleSaveWarehouse = async () => {
        if (!warehouseAddress || !selectedWarehouseLocation) {
            Alert.alert('Error', 'Please select a warehouse address from the autofill suggestions.');
            return;
        }

        const warehouseDisplayName = selectedWarehouseLocation.address.split(',')[0]?.trim() || 'Warehouse';
        const payload = {
            name: warehouseDisplayName,
            address: selectedWarehouseLocation.address.trim(),
            latitude: selectedWarehouseLocation.latitude,
            longitude: selectedWarehouseLocation.longitude,
            updatedAt: new Date(),
        };

        try {
            const warehouseId = editingWarehouseId || makeWarehouseId(payload.name);
            await setDoc(doc(db, WAREHOUSE_COLLECTION, warehouseId), {
                ...payload,
                createdAt: new Date(),
            }, { merge: true });

            const equipmentSnapshot = await getDocs(collection(db, 'equipment'));
            await Promise.all(equipmentSnapshot.docs.map(async (equipmentDoc) => {
                const data = equipmentDoc.data();
                const locations = normalizeEquipmentLocations(data);
                const updatedLocations = locations.map((location) => (
                    location.id === warehouseId
                        ? { ...location, ...payload, id: warehouseId, stock: Number(location.stock || 0) }
                        : location
                ));
                if (updatedLocations.some((location) => location.id === warehouseId)) {
                    await updateDoc(doc(db, 'equipment', equipmentDoc.id), {
                        stockByLocation: updatedLocations,
                        stock: getTotalEquipmentStock(updatedLocations),
                    });
                }
            }));

            Alert.alert('Success', editingWarehouseId ? 'Warehouse updated.' : 'Warehouse added.');
            clearWarehouseForm();
            fetchWarehouses();
            fetchEquipment();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to save warehouse.');
        }
    };

    const startEditWarehouse = (warehouse: Warehouse) => {
        setEditingWarehouseId(warehouse.id);
        setWarehouseAddress(warehouse.address);
        setSelectedWarehouseLocation({
            address: warehouse.address,
            latitude: warehouse.latitude,
            longitude: warehouse.longitude,
        });
    };

    const handleDeleteWarehouse = (warehouse: Warehouse) => {
        Alert.alert(
            'Delete Warehouse',
            `Delete "${warehouse.name}" from the warehouse list? Existing equipment stock at this warehouse will remain until each item is edited.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, WAREHOUSE_COLLECTION, warehouse.id));
                            fetchWarehouses();
                        } catch (e) {
                            console.error(e);
                            Alert.alert('Error', 'Failed to delete warehouse.');
                        }
                    },
                },
            ]
        );
    };

    const handleAddEquipment = async () => {
        if (!name || !brand || !price) {
            Alert.alert('Error', 'Please fill all required fields.');
            return;
        }

        const locationStocks = availableWarehouses.map((warehouse) => (
            toWarehouseStock(warehouse, Math.max(0, Number(newEquipmentStock[warehouse.id]) || 0))
        ));
        const totalStock = getTotalEquipmentStock(locationStocks);

        try {
            await addDoc(collection(db, 'equipment'), {
                name,
                brand,
                price: Number(price),
                stock: totalStock,
                stockByLocation: locationStocks,
                description,
                image,
                createdAt: new Date(),
            });

            Alert.alert('Success', 'Equipment added!');
            setName('');
            setBrand('');
            setPrice('');
            setNewEquipmentStock({});
            setDescription('');
            setImage('');
            fetchEquipment();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to add equipment.');
        }
    };

    const updateNewEquipmentStockField = (locationId: string, value: string) => {
        setNewEquipmentStock((prev) => ({
            ...prev,
            [locationId]: value.replace(/[^0-9]/g, ''),
        }));
    };

    const updateWarehouseStockField = (itemId: string, locationId: string, value: string) => {
        setEditingFields((prev) => {
            const current = prev[itemId];
            if (!current) return prev;
            return {
                ...prev,
                [itemId]: {
                    ...current,
                    stockByLocation: current.stockByLocation.map((location) => (
                        location.id === locationId
                            ? { ...location, stock: Math.max(0, Number(value) || 0) }
                            : location
                    )),
                },
            };
        });
    };

    const handleDeleteEquipment = async (id: string, itemName: string) => {
        Alert.alert(
            'Delete Equipment',
            `Are you sure you want to delete "${itemName}"?`,
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
        setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
        setEditingFields((prev) => {
            if (prev[id]) return prev;
            return { ...prev, [id]: createEditFields(item) };
        });
    };

    const toggleEditMode = (id: string, item?: any) => {
        setEditingFields((prev) => {
            if (prev[id]) return prev;
            return { ...prev, [id]: createEditFields(item) };
        });
        setIsEditing((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleUpdateEquipment = async (id: string) => {
        const fields = editingFields[id];
        if (!fields) return;

        const stockByLocation = fields.stockByLocation.map((location) => ({
            ...location,
            stock: Math.max(0, Number(location.stock) || 0),
        }));

        try {
            await updateDoc(doc(db, 'equipment', id), {
                name: fields.name,
                brand: fields.brand,
                price: Number(fields.price) || 0,
                stock: getTotalEquipmentStock(stockByLocation),
                stockByLocation,
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

    const filteredEquipment = equipmentList.filter((equipment) => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;
        return (
            (equipment.name || '').toLowerCase().includes(term) ||
            (equipment.brand || '').toLowerCase().includes(term) ||
            (equipment.description || '').toLowerCase().includes(term) ||
            normalizeEquipmentLocations(equipment).some((location) =>
                location.name.toLowerCase().includes(term) ||
                location.address.toLowerCase().includes(term)
            )
        );
    });

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
                    <Ionicons name="business-outline" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.title, { color: theme.text, fontSize: textSize + 10 }]}>Inventory</Text>
                <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
                    Manage equipment, warehouses, and location stock
                </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
                <Text style={[styles.cardHeading, { color: theme.text }]}>Warehouse Pickup Points</Text>
                <Text style={[styles.helperText, { color: theme.textDim }]}>
                    These locations are used by the customer map, dropdown, stock grouping, and delivery receipts.
                </Text>

                <View style={styles.inputWrapper}>
                    <LocationAutocomplete
                        label="Warehouse Address"
                        value={warehouseAddress}
                        onChangeText={setWarehouseAddress}
                        onLocationSelected={setSelectedWarehouseLocation}
                        placeholder="Search and select a pickup warehouse address"
                        theme={theme}
                    />
                </View>

                <View style={styles.saveRow}>
                    <TouchableOpacity
                        style={[styles.saveBtn, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
                        onPress={handleSaveWarehouse}
                    >
                        <Text style={[styles.saveBtnText, { color: theme.primary }]}>
                            {editingWarehouseId ? 'Save Warehouse' : 'Add Warehouse'}
                        </Text>
                    </TouchableOpacity>
                    {editingWarehouseId && (
                        <TouchableOpacity
                            style={[styles.cancelBtn, { borderColor: theme.border, borderWidth: 1.5, backgroundColor: theme.surface }]}
                            onPress={clearWarehouseForm}
                        >
                            <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.warehouseList}>
                    {availableWarehouses.map((warehouse) => (
                        <View key={warehouse.id} style={[styles.warehouseCard, { borderColor: theme.border }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.warehouseName, { color: theme.text }]}>{warehouse.name}</Text>
                                <Text style={[styles.warehouseAddress, { color: theme.textDim }]}>{warehouse.address}</Text>
                            </View>
                            <TouchableOpacity style={styles.iconButton} onPress={() => startEditWarehouse(warehouse)}>
                                <Ionicons name="create-outline" size={18} color={theme.primary} />
                            </TouchableOpacity>
                            {warehouse.source === 'firebase' && (
                                <TouchableOpacity style={styles.iconButton} onPress={() => handleDeleteWarehouse(warehouse)}>
                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
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

                <Text style={[styles.label, { color: theme.textDim }]}>Warehouse Stock</Text>
                <View style={styles.locationStockList}>
                    {availableWarehouses.map((warehouse) => (
                        <View key={warehouse.id} style={[styles.stockEditRow, { borderColor: theme.border }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.locationName, { color: theme.text }]}>{warehouse.name}</Text>
                                <Text style={[styles.locationAddress, { color: theme.textDim }]}>{warehouse.address}</Text>
                            </View>
                            <TextInput
                                style={[styles.stockInput, { color: theme.text }]}
                                value={newEquipmentStock[warehouse.id] ?? ''}
                                placeholder="0"
                                placeholderTextColor="#94a3b8"
                                keyboardType="numeric"
                                onChangeText={(value) => updateNewEquipmentStockField(warehouse.id, value)}
                            />
                        </View>
                    ))}
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
                        placeholder="Search items or warehouses..."
                        placeholderTextColor="#94a3b8"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        style={[styles.searchInput, { color: theme.text }]}
                    />
                </View>
            </View>

            <View style={styles.inventoryList}>
                {filteredEquipment.map((item) => {
                    const isExpanded = !!expandedItems[item.id];
                    const editing = editingFields[item.id];
                    const isManaging = isEditing[item.id];
                    const itemLocations = normalizeEquipmentLocations(item);

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
                                    <Text style={[styles.stockCount, { color: theme.text }]}>{getTotalEquipmentStock(itemLocations)}</Text>
                                    <Text style={[styles.stockLabel, { color: theme.textDim }]}>TOTAL</Text>
                                </View>
                                <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
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
                                            <View style={styles.locationStockList}>
                                                {itemLocations.map((location) => (
                                                    <View key={location.id} style={[styles.locationStockRow, { borderColor: theme.border }]}>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={[styles.locationName, { color: theme.text }]}>{location.name}</Text>
                                                            <Text style={[styles.locationAddress, { color: theme.textDim }]}>{location.address}</Text>
                                                        </View>
                                                        <Text style={[styles.locationStock, { color: location.stock > 0 ? theme.primary : '#ef4444' }]}>
                                                            {location.stock}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                            <View style={styles.manageRow}>
                                                <TouchableOpacity
                                                    style={[styles.manageBtn, { borderColor: theme.primary, borderWidth: 1.5, backgroundColor: theme.surface }]}
                                                    onPress={() => toggleEditMode(item.id, item)}
                                                >
                                                    <Ionicons name="create-outline" size={18} color={theme.primary} />
                                                    <Text style={[styles.manageBtnText, { color: theme.primary }]}>Manage</Text>
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
                                                value={editing?.name}
                                                onChangeText={(v) => setEditingFields((prev) => ({ ...prev, [item.id]: { ...prev[item.id], name: v } }))}
                                            />
                                            <TextInput
                                                style={[styles.inlineInput, { color: theme.text }]}
                                                value={editing?.brand}
                                                onChangeText={(v) => setEditingFields((prev) => ({ ...prev, [item.id]: { ...prev[item.id], brand: v } }))}
                                            />
                                            <TextInput
                                                style={[styles.inlineInput, { color: theme.text }]}
                                                value={editing?.price}
                                                keyboardType="numeric"
                                                onChangeText={(v) => setEditingFields((prev) => ({ ...prev, [item.id]: { ...prev[item.id], price: v } }))}
                                            />
                                            <Text style={[styles.label, { color: theme.textDim }]}>Warehouse Stock</Text>
                                            {editing?.stockByLocation.map((location) => (
                                                <View key={location.id} style={[styles.stockEditRow, { borderColor: theme.border }]}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.locationName, { color: theme.text }]}>{location.name}</Text>
                                                        <Text style={[styles.locationAddress, { color: theme.textDim }]}>{location.address}</Text>
                                                    </View>
                                                    <TextInput
                                                        style={[styles.stockInput, { color: theme.text }]}
                                                        value={String(location.stock)}
                                                        keyboardType="numeric"
                                                        onChangeText={(value) => updateWarehouseStockField(item.id, location.id, value)}
                                                    />
                                                </View>
                                            ))}
                                            <TextInput
                                                style={[styles.inlineInput, { color: theme.text, minHeight: 70, textAlignVertical: 'top' }]}
                                                value={editing?.description}
                                                multiline
                                                onChangeText={(v) => setEditingFields((prev) => ({ ...prev, [item.id]: { ...prev[item.id], description: v } }))}
                                            />
                                            <TextInput
                                                style={[styles.inlineInput, { color: theme.text }]}
                                                value={editing?.image}
                                                onChangeText={(v) => setEditingFields((prev) => ({ ...prev, [item.id]: { ...prev[item.id], image: v } }))}
                                            />
                                            <View style={styles.saveRow}>
                                                <TouchableOpacity
                                                    style={[styles.saveBtn, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
                                                    onPress={async () => {
                                                        await handleUpdateEquipment(item.id);
                                                        setIsEditing((prev) => ({ ...prev, [item.id]: false }));
                                                    }}
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
        position: 'absolute',
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
        marginBottom: 10,
    },
    helperText: {
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 18,
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
    detailsView: {},
    detailDesc: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 16,
    },
    manageRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
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
    warehouseList: {
        gap: 10,
        marginTop: 16,
    },
    warehouseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        gap: 8,
    },
    warehouseName: {
        fontSize: 14,
        fontWeight: '800',
    },
    warehouseAddress: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    iconButton: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    warehousePickerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 18,
    },
    warehousePill: {
        borderWidth: 1.5,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    warehousePillText: {
        fontSize: 12,
        fontWeight: '800',
    },
    locationStockList: {
        gap: 8,
    },
    locationStockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
    },
    locationName: {
        fontSize: 13,
        fontWeight: '800',
    },
    locationAddress: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    locationStock: {
        fontSize: 18,
        fontWeight: '900',
        marginLeft: 12,
    },
    stockEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 14,
        padding: 10,
        gap: 10,
    },
    stockInput: {
        width: 72,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '900',
    },
});
