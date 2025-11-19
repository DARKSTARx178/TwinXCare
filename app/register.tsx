import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getFontSizeValue } from '@/utils/fontSizes';
import { getThemeColors } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase/firebase';

export default function Register() {
  const router = useRouter();
  const { fontSize } = useAccessibility();
  const theme = getThemeColors();
  const textSize = getFontSizeValue(fontSize);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    if (!email || !password || !username) {
      setError('Please fill all fields.');
      return;
    }

    try {
      // ✅ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Add Firestore document with default role and default theme
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        role: 'user',      // default role
        createdAt: new Date(),
        history: [],
        booking: [],
        theme: getThemeColors()
      });

      // ✅ Firebase Auth persists session automatically
      router.replace('/profile');
    } catch (e: any) {
      console.error('Registration error:', e);
      setError(e.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize + 8, marginBottom: 20 }}>
        Register
      </Text>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
        placeholder="Username"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
        placeholder="Email"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleRegister}>
        <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={{ color: theme.primary, marginTop: 10 }}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 35,
    left: 20,
    zIndex: 1,
    backgroundColor: 'transparent',
    padding: 6,
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
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
});
