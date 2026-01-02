import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { getFontSizeValue } from '@/utils/fontSizes';
import { getThemeColors } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase/firebase';

export default function Register() {
  const router = useRouter();
  const { fontSize } = useAccessibility();
  const { theme } = useContext(ThemeContext);
  const textSize = getFontSizeValue(fontSize);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'standard' | 'escort'>('standard');
  const [error, setError] = useState('');
  const userTypeOptions = [
    { label: 'Senior', value: 'standard' },
    { label: 'Escort', value: 'escort' }
  ] as const;

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

      // ✅ Add Firestore document. Role stays 'user' by default; admins must change role server-side.
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        role: 'user',
        userType,
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

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.logoCircle}>
          <Ionicons name="person-add-outline" size={40} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text, fontSize: textSize + 10 }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
          Join the TwinXCare community today
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textDim }]}>Username</Text>
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <Ionicons name="person-outline" size={20} color={theme.textDim} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="John Doe"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textDim }]}>Email Address</Text>
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={20} color={theme.textDim} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="john@example.com"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textDim }]}>Password</Text>
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textDim} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: theme.textDim, alignSelf: 'flex-start', marginBottom: 12 }]}>I am signing up as</Text>
        <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 20 }}>
          {userTypeOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setUserType(opt.value)}
              style={[
                styles.userTypeButton,
                userType === opt.value && { borderColor: theme.primary, backgroundColor: 'rgba(129, 173, 231, 0.1)' }
              ]}
            >
              <Text style={{ color: userType === opt.value ? theme.primary : theme.text, fontWeight: userType === opt.value ? '700' : '500' }}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleRegister}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { fontSize: textSize }]}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.footerLink}>
          <Text style={{ color: theme.textDim }}>
            Already have an account? <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  card: {
    padding: 32,
    borderRadius: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(129, 173, 231, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#81ade7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'transparent'
  },
  errorContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLink: {
    marginTop: 24,
  },
});
