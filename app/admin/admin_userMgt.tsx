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
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
        >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.header}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
                    <Ionicons name="people-outline" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.title, { color: theme.text, fontSize: textSize + 10 }]}>User Management</Text>
                <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
                    Directory of {users.length} registered accounts
                </Text>
            </View>

            <View style={styles.listContainer}>
                {users.map((user) => {
                    const role = user.role || 'user';
                    const isAdmin = role === 'admin';

                    return (
                        <View
                            key={user.id}
                            style={[styles.card, { backgroundColor: theme.surface }]}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.avatarCircle, { backgroundColor: isAdmin ? theme.primaryGlow : '#F1F5F9' }]}>
                                    <Ionicons
                                        name={isAdmin ? "shield-checkmark" : "person"}
                                        size={22}
                                        color={isAdmin ? theme.primary : theme.textDim}
                                    />
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={[styles.userName, { color: theme.text }]}>
                                        {user.username || 'Unnamed User'}
                                    </Text>
                                    <Text style={[styles.userEmail, { color: theme.textDim }]}>
                                        {user.email || 'No email provided'}
                                    </Text>
                                </View>
                                <View style={[styles.roleBadge, { backgroundColor: isAdmin ? 'rgba(129, 173, 231, 0.15)' : 'rgba(148, 163, 184, 0.1)' }]}>
                                    <Text style={[styles.roleText, { color: isAdmin ? theme.primary : theme.textDim }]}>
                                        {role.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.cardActions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: '#F1F5F9' }]}
                                    onPress={() => toggleRole(user.id, role)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="swap-horizontal" size={18} color={theme.textDim} />
                                    <Text style={[styles.actionText, { color: theme.text }]}>Change Role</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: isAdmin ? '#F8FAFC' : '#fee2e2' }]}
                                    onPress={() => deleteUser(user.id, role)}
                                    disabled={isAdmin}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="trash-outline" size={18} color={isAdmin ? '#94a3b8' : '#ef4444'} />
                                    <Text style={[styles.actionText, { color: isAdmin ? '#94a3b8' : '#ef4444' }]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    listContainer: {
        paddingHorizontal: 20,
    },
    card: {
        padding: 20,
        borderRadius: 28,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        fontWeight: '500',
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        gap: 8,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
    },
});
