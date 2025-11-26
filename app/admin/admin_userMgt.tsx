import { ThemeContext } from '@/contexts/ThemeContext';
import { db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    updateDoc,
} from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AdminUserMgt() {
    const { theme } = useContext(ThemeContext);
    const textSize = getFontSizeValue('medium');
    const screenWidth = Dimensions.get('window').width;

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const querySnap = await getDocs(collection(db, 'users'));
            const usersData: any[] = [];
            querySnap.forEach((docSnap) => {
                usersData.push({ id: docSnap.id, ...docSnap.data() });
            });
            setUsers(usersData);
        } catch (err) {
            console.error('Error fetching users:', err);
            Alert.alert('Error', 'Could not fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleRole = async (userId: string, currentRole?: string) => {
        console.log('Pressed toggleRole for user:', userId, 'currentRole:', currentRole);

        try {
            const normalizedRole = currentRole || 'user';
            const newRole = normalizedRole === 'admin' ? 'user' : 'admin';

            await updateDoc(doc(db, 'users', userId), { role: newRole });
            Alert.alert('Success', `User role updated to ${newRole}`);
            fetchUsers();
        } catch (err) {
            console.error('Error updating role:', err);
            Alert.alert('Error', 'Could not update role');
        }
    };

    const deleteUser = async (userId: string, role?: string) => {
        console.log('Pressed deleteUser for user:', userId, 'role:', role);

        if (role === 'admin') {
            Alert.alert(
                'Not Allowed',
                'You must switch the user role to "user" before deleting an admin account.'
            );
            return;
        }

        Alert.alert('Confirm Delete', 'Are you sure you want to delete this user?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'users', userId));
                        Alert.alert('Deleted', 'User has been removed');
                        fetchUsers();
                    } catch (err) {
                        console.error('Error deleting user:', err);
                        Alert.alert('Error', 'Could not delete user');
                    }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.background }}
            contentContainerStyle={{ padding: 16 }}
        >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={theme.text} left={-15} bottom={15} />
            </TouchableOpacity>
            <Text>  </Text>
            <Text>  </Text>
            <Text>  </Text>
            <Text
                style={{
                    fontSize: textSize + 6,
                    fontWeight: 'bold',
                    color: theme.text,
                    marginBottom: 16,
                }}
            >
                User Management
            </Text>

            {users.map((user) => {
                const role = user.role || 'user';

                return (
                    <View
                        key={user.id}
                        style={[
                            styles.card,
                            { backgroundColor: theme.unselectedTab, width: screenWidth - 32 },
                        ]}
                    >
                        <Text style={[styles.name, { color: theme.text, fontSize: textSize + 2 }]}>
                            {user.username || 'Unnamed User'}
                        </Text>
                        <Text style={{ color: theme.text, fontSize: textSize - 2 }}>
                            Email: {user.email || 'N/A'}
                        </Text>
                        <Text style={{ color: theme.text, fontSize: textSize - 2 }}>
                            Role: {role}
                        </Text>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: theme.primary }]}
                                onPress={() => toggleRole(user.id, role)}
                            >
                                <Ionicons name="person-circle" size={20} color="#fff" />
                                <Text style={[styles.buttonText, { color: '#fff' }]}>
                                    Toggle Role
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    { backgroundColor: role === 'admin' ? theme.unselected : 'red' },
                                ]}
                                onPress={() => deleteUser(user.id, role)}
                            >
                                <Ionicons name="trash" size={20} color="#fff" />
                                <Text style={[styles.buttonText, { color: '#fff' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignSelf: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    name: {
        fontWeight: 'bold',
        marginBottom: 6,
    },
    actions: {
        flexDirection: 'row',
        marginTop: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginRight: 12,
    },
    buttonText: {
        marginLeft: 8,
        fontWeight: '600',
        fontSize: 14,
    },
    backButton: { position: "absolute", top: 35, left: 20, zIndex: 1, backgroundColor: "transparent", padding: 6 },
});
