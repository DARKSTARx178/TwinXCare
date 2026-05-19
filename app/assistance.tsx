import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase/firebase';

export default function Assistance() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('Anonymous');
  const router = useRouter();
  const { theme } = useContext(ThemeContext);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists() && userDoc.data()?.username) {
            setUsername(userDoc.data().username);
          }
        } catch (error) {
          console.error('Error fetching username:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Please enter your request.');
      return;
    }

    try {
      setSubmitting(true);

      // 1️⃣ Save to Firebase Firestore (requests collection)
      await addDoc(collection(db, "requests"), {
        username,
        message,
        createdAt: serverTimestamp(),
      });

      /*
      // 2️⃣ Temporarily disabled: Send request email via Vercel API
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';
      if (apiBaseUrl) {
        await fetch(`${apiBaseUrl}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, username: username || 'Anonymous', type: "assistance" }),
        });
      }
      */

      Alert.alert('Thank you!', 'Your request has been submitted.');
      setMessage('');
      router.back();
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="megaphone-outline" size={32} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Request Assistance</Text>
        <Text style={[styles.subtitle, { color: theme.textDim }]}>
          Tell us what you need and our team will get back to you as soon as possible.
        </Text>

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textDim }]}>Request Details</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Describe how we can help you today..."
            placeholderTextColor="#94a3b8"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
          onPress={handleSend}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitText, { color: theme.primary }]}>
            {submitting ? 'Sending Request...' : 'Send Request'}
          </Text>
          {!submitting && <Ionicons name="paper-plane-outline" size={20} color={theme.primary} style={{ marginLeft: 8 }} />}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textDim }]}>
            Your request will be sent directly to our support coordinators.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingTop: 40,
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
  card: {
    padding: 30,
    borderRadius: 32,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(129, 173, 231, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
    fontWeight: '500',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 25,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F1F5F9',
    minHeight: 150,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    width: '100%',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  infoBox: {
    flexDirection: 'row',
    marginTop: 25,
    backgroundColor: 'rgba(129, 173, 231, 0.05)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
});
