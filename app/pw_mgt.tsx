import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const PwMgt: React.FC = () => {
    const router = useRouter();
    const { theme } = useContext(ThemeContext);
    const { fontSize } = useAccessibility();
    const textSize = getFontSizeValue(fontSize);

    const [adminUser, setAdminUser] = useState('');
    const [adminPass, setAdminPass] = useState('');
    const [users, setUsers] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const serverUrl = 'http://172.22.129.135:8080';

    const handleGetUsers = async () => {
        setError('');
        setSuccess('');
        if (!adminUser || !adminPass) {
            setError('Admin credentials are required.');
            return;
        }

        try {
            const res = await fetch(`${serverUrl}/api/getPasswords`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: adminUser, password: adminPass }),
            });

            const data = await res.json();
            if (res.ok) {
                setUsers(data.users);
            } else {
                setUsers([]);
                setError(data.error || 'Failed to fetch users.');
            }

        } catch (e) {
            console.error(e);
            setError('Server error.');
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser || !newPassword) {
            setError('User and new password required.');
            return;
        }

        try {
            const res = await fetch(`${serverUrl}/api/resetPassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminUsername: adminUser,
                    adminPassword: adminPass,
                    targetUsername: selectedUser,
                    newPassword,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess(`Password reset for ${selectedUser}`);
                setNewPassword('');
            } else {
                setError(data.error || 'Failed to reset password.');
            }
        } catch (e) {
            console.error(e);
            setError('Server error.');
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) {
            setError('Select a user to delete.');
            return;
        }

        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete ${selectedUser}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await fetch(`${serverUrl}/api/deleteUser`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    adminUsername: adminUser,
                                    adminPassword: adminPass,
                                    targetUsername: selectedUser,
                                }),
                            });

                            const data = await res.json();
                            if (res.ok) {
                                setSuccess(`${selectedUser} deleted.`);
                                setUsers((prev) => prev.filter((u) => u !== selectedUser));
                                setSelectedUser('');
                            } else {
                                setError(data.error || 'Failed to delete user.');
                            }
                        } catch (e) {
                            console.error(e);
                            setError('Server error.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.header}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
                    <Ionicons name="finger-print-outline" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.title, { color: theme.text, fontSize: textSize + 10 }]}>Account Security</Text>
                <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
                    User & Password Management
                </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
                <Text style={[styles.cardHeading, { color: theme.text }]}>Admin Authorization</Text>

                <View style={styles.inputWrapper}>
                    <Text style={[styles.label, { color: theme.textDim }]}>Admin Username</Text>
                    <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                        <Ionicons name="person-outline" size={20} color={theme.textDim} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Enter username"
                            placeholderTextColor="#94a3b8"
                            value={adminUser}
                            onChangeText={setAdminUser}
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={[styles.label, { color: theme.textDim }]}>Admin Password</Text>
                    <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={theme.textDim} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="••••••••"
                            placeholderTextColor="#94a3b8"
                            value={adminPass}
                            onChangeText={setAdminPass}
                            secureTextEntry
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.loadButton, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
                    onPress={handleGetUsers}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.loadButtonText, { color: theme.primary }]}>Authorize & Load Users</Text>
                    <Ionicons name="sync-outline" size={18} color={theme.primary} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {success ? (
                    <View style={styles.successContainer}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.successText}>{success}</Text>
                    </View>
                ) : null}
            </View>

            {users.length > 0 && (
                <View style={[styles.card, { backgroundColor: theme.surface, marginTop: 20, borderWidth: 1, borderColor: theme.border }]}>
                    <Text style={[styles.cardHeading, { color: theme.text }]}>User Directory</Text>
                    <View style={styles.userListContainer}>
                        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                            {users.map((username) => (
                                <TouchableOpacity
                                    key={username}
                                    style={[
                                        styles.userRow,
                                        { backgroundColor: theme.surface },
                                        selectedUser === username && { borderColor: theme.primary, borderWidth: 2 },
                                    ]}
                                    onPress={() => setSelectedUser(username)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="person"
                                        size={18}
                                        color={selectedUser === username ? theme.primary : theme.textDim}
                                        style={{ marginRight: 12 }}
                                    />
                                    <Text style={[
                                        styles.userText,
                                        { color: selectedUser === username ? theme.primary : theme.text }
                                    ]}>
                                        {username}
                                    </Text>
                                    {selectedUser === username && (
                                        <Ionicons name="checkmark" size={18} color={theme.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {selectedUser ? (
                        <View style={{ marginTop: 20 }}>
                            <Text style={[styles.label, { color: theme.textDim }]}>Modify Password for @{selectedUser}</Text>
                            <View style={[styles.inputContainer, { borderColor: theme.border, marginTop: 8 }]}>
                                <Ionicons name="shield-outline" size={20} color={theme.textDim} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="Enter new password"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                            </View>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.actionButton, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
                                    onPress={handleResetPassword}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.actionButtonText, { color: theme.primary }]}>Reset Password</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, { borderColor: '#ef4444', borderWidth: 2, backgroundColor: theme.surface }]}
                                    onPress={handleDeleteUser}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete User</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyStateText, { color: theme.textDim }]}>Select a user to manage their account</Text>
                        </View>
                    )}
                </View>
            )}
            <View style={{ height: 60 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
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
        marginTop: 100,
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
        padding: 24,
        borderRadius: 32,
    },
    cardHeading: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 20,
    },
    inputWrapper: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F1F5F9',
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '500',
    },
    loadButton: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    loadButtonText: {
        fontWeight: '800',
        fontSize: 15,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 8,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    successText: {
        color: '#10b981',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 8,
    },
    userListContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 8,
    },
    scrollView: {
        maxHeight: 250,
    },
    userRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.02)',
        alignItems: 'center',
        marginBottom: 4,
    },
    userText: {
        fontSize: 15,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    actionButton: {
        width: '48%',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 20,
    },
});

export default PwMgt;
