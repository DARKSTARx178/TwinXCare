import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import md5 from 'md5';

function safeKey(username: string) {
  // Only allow letters, numbers, dot, dash, underscore, and ensure not empty
  const cleaned = (username || '').trim();
  if (!cleaned || !/^[a-zA-Z0-9._-]+$/.test(cleaned)) return '';
  return 'user_' + cleaned;
}

function hashValue(value: string) {
  return md5(value);
}

const Login: React.FC = () => {
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const cleanedUsername = (username || '').trim();
    const key = safeKey(cleanedUsername);
    if (!cleanedUsername || !password) {
      setError('Please fill all fields.');
      return;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(cleanedUsername)) {
      setError('Username can only contain letters, numbers, dot, dash, and underscore.');
      return;
    }
    if (!key) {
      setError('Invalid username.');
      return;
    }
    // Extra debug logging for troubleshooting
    console.log('Login attempt:', { username: cleanedUsername, key });
    try {
      if (!key) {
        setError('Invalid key generated.');
        return;
      }
      const storedHash = await SecureStore.getItemAsync(key);
      if (!storedHash) {
        setError('User not found. Please register.');
        return;
      }
      const inputHash = hashValue(password);
      if (storedHash !== inputHash) {
        setError('Incorrect password.');
        return;
      }
      await SecureStore.setItemAsync('user', cleanedUsername);
      router.replace('/profile');
    } catch (e) {
      setError('Login failed. Please try again.');
      console.error('Login error:', e, { username: cleanedUsername, key });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>
      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize + 8, marginBottom: 20 }}>Login</Text>
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
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleLogin}>
        <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/register')}>
        <Text style={{ color: theme.primary, marginTop: 10 }}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

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
    backgroundColor: 'rgba(0,0,0,0.04)'
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
});

export default Login;