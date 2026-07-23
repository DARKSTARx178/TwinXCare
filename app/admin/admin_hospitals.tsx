import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type HospitalCatalogItem = {
	id: string;
	name: string;
	active?: boolean;
};

const HOSPITAL_DOC_PATH = ['escort', 'hospital'] as const;

export default function AdminHospitals() {
	const router = useRouter();
	const { theme } = useContext(ThemeContext);
	const textSize = getFontSizeValue('medium');

	const [authorized, setAuthorized] = useState(false);
	const [loading, setLoading] = useState(true);
	const [catalog, setCatalog] = useState<HospitalCatalogItem[]>([]);
	const [newName, setNewName] = useState('');
	const [savingCatalog, setSavingCatalog] = useState(false);

	const loadData = useCallback(async () => {
		const user = auth.currentUser;
		if (!user) {
			setAuthorized(false);
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const userDoc = await getDoc(doc(db, 'users', user.uid));
			const role = userDoc.exists() ? String(userDoc.data().role || 'user') : 'user';
			if (role !== 'admin') {
				setAuthorized(false);
				setLoading(false);
				return;
			}
			setAuthorized(true);

			const hospitalDoc = await getDoc(doc(db, 'escort', 'hospital'));
			const hospitalData = hospitalDoc.exists() ? (hospitalDoc.data() as any) : {};
			const items = Array.isArray(hospitalData.list) ? hospitalData.list : [];
			const catalogData = items
				.filter((item: any) => item.active !== false)
				.map((item: any, index: number) => ({ id: item.id || `hospital-${index}`, ...item }))
				.sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || '')));
			setCatalog(catalogData as HospitalCatalogItem[]);
		} catch (error) {
			console.error('Failed to load hospital admin data:', error);
			Alert.alert('Error', 'Unable to load hospital admin data.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const addCatalogItem = async () => {
		const name = newName.trim();
		if (!name) {
			Alert.alert('Missing Name', 'Please enter a hospital name.');
			return;
		}

		setSavingCatalog(true);
		try {
			const hospitalDocRef = doc(db, 'escort', 'hospital');
			const hospitalDoc = await getDoc(hospitalDocRef);
			const currentData = hospitalDoc.exists() ? (hospitalDoc.data() as any) : {};
			const existingList = Array.isArray(currentData.list) ? currentData.list : [];
			const nextItem = {
				id: `hospital-${Date.now()}`,
				name,
				active: true,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
				createdBy: auth.currentUser?.uid ?? 'unknown',
				createdByEmail: auth.currentUser?.email ?? 'unknown',
			};
			await setDoc(hospitalDocRef, {
				...currentData,
				list: [...existingList, nextItem],
				updatedAt: serverTimestamp(),
			}, { merge: true });
			setNewName('');
			await loadData();
		} catch (error) {
			console.error('Failed to create hospital item:', error);
			Alert.alert('Error', 'Unable to create hospital item.');
		} finally {
			setSavingCatalog(false);
		}
	};

	const toggleCatalogActive = async (item: HospitalCatalogItem) => {
		try {
			const hospitalDocRef = doc(db, 'escort', 'hospital');
			const hospitalDoc = await getDoc(hospitalDocRef);
			const currentData = hospitalDoc.exists() ? (hospitalDoc.data() as any) : {};
			const existingList = Array.isArray(currentData.list) ? currentData.list : [];
			const nextList = existingList.map((entry: any) =>
				entry.id === item.id ? { ...entry, active: entry.active === false, updatedAt: serverTimestamp() } : entry
			);
			await setDoc(hospitalDocRef, {
				...currentData,
				list: nextList,
				updatedAt: serverTimestamp(),
			}, { merge: true });
			await loadData();
		} catch (error) {
			console.error('Failed to toggle hospital item:', error);
			Alert.alert('Error', 'Unable to update item status.');
		}
	};

	const removeCatalogItem = async (item: HospitalCatalogItem) => {
		Alert.alert('Delete Hospital', `Delete "${item.name}" from the hospital catalog?`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					try {
						const hospitalDocRef = doc(db, 'escort', 'hospital');
						const hospitalDoc = await getDoc(hospitalDocRef);
						const currentData = hospitalDoc.exists() ? (hospitalDoc.data() as any) : {};
						const existingList = Array.isArray(currentData.list) ? currentData.list : [];
						const nextList = existingList.filter((entry: any) => entry.id !== item.id);
						await setDoc(hospitalDocRef, {
							...currentData,
							list: nextList,
							updatedAt: serverTimestamp(),
						}, { merge: true });
						await loadData();
					} catch (error) {
						console.error('Failed to delete hospital item:', error);
						Alert.alert('Error', 'Unable to delete item.');
					}
				},
			},
		]);
	};

	if (loading) {
		return (
			<View style={[styles.center, { backgroundColor: theme.background }]}> 
				<Text style={{ color: theme.textDim }}>Loading...</Text>
			</View>
		);
	}

	if (!authorized) {
		return (
			<View style={[styles.center, { backgroundColor: theme.background, paddingHorizontal: 24 }]}> 
				<Text style={[styles.deniedTitle, { color: theme.text }]}>Admin access required</Text>
				<Text style={[styles.deniedText, { color: theme.textDim }]}>Only admins can manage hospitals.</Text>
				<TouchableOpacity onPress={() => router.back()} style={[styles.backOnlyBtn, { borderColor: theme.primary }]}> 
					<Text style={{ color: theme.primary, fontWeight: '800' }}>Go Back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
			<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
				<Ionicons name="arrow-back" size={28} color={theme.text} />
			</TouchableOpacity>

			<View style={styles.header}>
				<View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}> 
					<Ionicons name="medkit-outline" size={30} color={theme.primary} />
				</View>
				<Text style={[styles.title, { color: theme.text }]}>Hospital Catalog</Text>
				<Text style={[styles.subtitle, { color: theme.textDim }]}>Manage hospital names for escort requests.</Text>
			</View>

			<View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
				<Text style={[styles.cardTitle, { color: theme.text }]}>Add a Hospital</Text>
				<TextInput
					style={[styles.input, { color: theme.text }]}
					placeholder="Hospital name"
					placeholderTextColor="#94a3b8"
					value={newName}
					onChangeText={setNewName}
				/>
				<TouchableOpacity onPress={addCatalogItem} style={[styles.addButton, { backgroundColor: theme.surface, borderColor: theme.primary }]} disabled={savingCatalog}>
					<Text style={[styles.addButtonText, { color: theme.primary }]}>{savingCatalog ? 'Adding...' : 'Add Hospital'}</Text>
				</TouchableOpacity>
			</View>

			<View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
				<Text style={[styles.cardTitle, { color: theme.text }]}>Hospital list</Text>
				{catalog.length === 0 ? (
					<Text style={[styles.emptyText, { color: theme.textDim }]}>No hospitals configured yet.</Text>
				) : (
					catalog.map((item) => (
						<View key={item.id} style={[styles.listItem, { borderColor: theme.border }]}> 
							<View style={styles.listHeader}>
								<Text style={[styles.itemTitle, { color: theme.text }]}>{item.name}</Text>
								<Text style={[styles.badge, { backgroundColor: item.active ? '#ecfdf5' : '#fef2f2', color: item.active ? '#047857' : '#b91c1c' }]}>{item.active ? 'Active' : 'Inactive'}</Text>
							</View>
							<View style={styles.itemActions}>
								<TouchableOpacity style={[styles.actionButton, { borderColor: theme.primary }]} onPress={() => toggleCatalogActive(item)}>
									<Text style={[styles.actionText, { color: theme.primary }]}>{item.active ? 'Disable' : 'Enable'}</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.actionButton, { borderColor: '#ef4444' }]} onPress={() => removeCatalogItem(item)}>
									<Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
								</TouchableOpacity>
							</View>
						</View>
					))
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20 },
	backButton: {
		position: 'absolute',
		top: 50,
		left: 0,
		zIndex: 10,
		padding: 8,
		borderRadius: 12,
		backgroundColor: 'rgba(0,0,0,0.03)',
	},
	header: {
		marginTop: 60,
		marginBottom: 30,
		alignItems: 'center',
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
		marginBottom: 20,
		padding: 20,
		borderRadius: 28,
	},
	cardTitle: {
		fontWeight: '800',
		fontSize: 16,
		marginBottom: 14,
	},
	input: {
		borderWidth: 1,
		borderColor: '#CBD5E1',
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontWeight: '700',
	},
	addButton: {
		marginTop: 14,
		paddingVertical: 14,
		borderRadius: 16,
		borderWidth: 2,
		justifyContent: 'center',
		alignItems: 'center',
	},
	addButtonText: {
		fontWeight: '800',
	},
	emptyText: {
		fontSize: 14,
		fontWeight: '600',
	},
	listItem: {
		padding: 16,
		borderRadius: 22,
		marginBottom: 12,
	},
	listHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	itemTitle: {
		fontSize: 15,
		fontWeight: '800',
	},
	badge: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		fontWeight: '800',
	},
	itemActions: {
		flexDirection: 'row',
		gap: 12,
	},
	actionButton: {
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 16,
		borderWidth: 1,
	},
	actionText: {
		fontWeight: '700',
	},
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	deniedTitle: {
		fontSize: 18,
		fontWeight: '800',
		marginBottom: 8,
	},
	deniedText: {
		fontSize: 14,
		fontWeight: '500',
	},
	backOnlyBtn: {
		marginTop: 18,
		paddingVertical: 12,
		paddingHorizontal: 18,
		borderRadius: 16,
		borderWidth: 1,
	},
});
