import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/utils/theme';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getFontSizeValue } from '@/utils/fontSizes';

const PwMgt: React.FC = () => {
    const router = useRouter();
    const theme = getThemeColors();
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
                setUsers(data.users); // ← Already an array like ["admin", "john"]
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
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme.text, fontSize: textSize + 8 }]}>
                Admin Controls
            </Text>

            <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
                placeholder="Admin Username"
                placeholderTextColor="#aaa"
                value={adminUser}
                onChangeText={setAdminUser}
                autoCapitalize="none"
            />

            <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
                placeholder="Admin Password"
                placeholderTextColor="#aaa"
                value={adminPass}
                onChangeText={setAdminPass}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleGetUsers}
            >
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>
                    Load Users
                </Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <ScrollView style={styles.scrollView}>
                {users.map((username) => (
                    <TouchableOpacity
                        key={username}
                        style={[
                            styles.userRow,
                            selectedUser === username && { backgroundColor: '#eee' },
                        ]}
                        onPress={() => setSelectedUser(username)}
                    >
                        <Text style={[styles.userText, { color: theme.text }]}>{username}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={[styles.label, { color: theme.text }]}>New Password:</Text>
            <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
                placeholder="Enter new password"
                placeholderTextColor="#aaa"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleResetPassword}
            >
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>
                    Reset Password
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: 'red' }]}
                onPress={handleDeleteUser}
            >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: textSize }}>
                    Delete User
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 80,
        paddingHorizontal: 20,
    },
    backButton: {
        position: 'absolute',
        top: 35,
        left: 20,
        zIndex: 1,
        padding: 6,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        marginTop: 10,
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    button: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    },
    successText: {
        color: 'green',
        marginBottom: 10,
    },
    scrollView: {
        maxHeight: 180,
        marginBottom: 10,
    },
    userRow: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
    },
    userText: {
        fontSize: 14,
    },
});

export default PwMgt;
