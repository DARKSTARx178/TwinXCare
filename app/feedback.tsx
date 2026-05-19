import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase/firebase';

export default function Feedback() {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
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
      Alert.alert('Please enter your feedback.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Please select a rating.');
      return;
    }

    try {
      setSubmitting(true);

      // 1️⃣ Save feedback to Firebase Firestore
      await addDoc(collection(db, 'feedback'), {
        message,
        rating,
        username: username || 'Anonymous',
        createdAt: serverTimestamp(),
      });

      /*
      // 2️⃣ Temporarily disabled: Send email via Vercel function
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';
      if (apiBaseUrl) {
        await fetch(`${apiBaseUrl}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Feedback from ${username || 'Anonymous'} (Rating: ${rating}):\n\n${message}`,
            username: username || 'Anonymous',
            type: 'feedback',
          }),
        });
      }
      */

      setMessage('');
      setRating(0);
      Alert.alert('Thank you!', 'Your feedback has been submitted.');
      router.back();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback.');
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
          <Ionicons name="chatbubble-ellipses-outline" size={32} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Share Your Feedback</Text>
        <Text style={[styles.subtitle, { color: theme.textDim }]}>
          Your experience matters. Tell us how we're doing and help us improve our care.
        </Text>

        <View style={styles.ratingSection}>
          <Text style={[styles.label, { color: theme.textDim, textAlign: 'center' }]}>Overall Rating</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={38}
                  color={star <= rating ? "#f59e0b" : "#e2e8f0"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textDim }]}>Your Comments</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Tell us what's on your mind..."
            placeholderTextColor="#94a3b8"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }, (submitting) ? { opacity: 0.6 } : {}]}
          onPress={handleSend}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitText, { color: theme.primary }]}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
          {!submitting && <Ionicons name="send-outline" size={18} color={theme.primary} style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
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
  ratingSection: {
    width: '100%',
    marginBottom: 30,
    backgroundColor: 'rgba(129, 173, 231, 0.03)',
    padding: 18,
    borderRadius: 20,
  },
  ratingRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  starButton: { marginHorizontal: 6 },
  inputWrapper: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    fontSize: 15,
    backgroundColor: '#F1F5F9',
    minHeight: 120,
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
});
