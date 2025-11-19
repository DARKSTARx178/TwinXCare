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

      // 2️⃣ Send email via Vercel function
      const response = await fetch('https://twin-x-care.vercel.app/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TwinXCareApp/1.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: `Feedback from ${username || 'Anonymous'} (Rating: ${rating}):\n\n${message}`,
          username: username || 'Anonymous',
          type: 'feedback', // optional to differentiate in logs/email
        }),
      });

      let data;
      if (response.status === 429) {
        console.error('Rate limited by Vercel. Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        throw new Error('Rate limited. Please try again.');
      }

      if (!response.ok && response.status >= 400) {
        const text = await response.text();
        console.error(`API error ${response.status}:`, text.substring(0, 200));
        data = { success: false, error: `Server error (${response.status})` };
      } else {
        const text = await response.text();
        try {
          data = text ? JSON.parse(text) : { success: false, error: 'Empty server response' };
        } catch (e) {
          console.warn('Failed to parse JSON response:', e);
          data = { success: false, error: 'Invalid server response' };
        }
      }

      if (!data.success) {
        console.warn('Email sending failed:', data.error);
      }

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

      <Text style={[styles.title, { color: theme.text }]}>Submit Feedback</Text>

      <TextInput
        style={[styles.input, { borderColor: theme.primary, color: theme.text }]}
        placeholder="Your feedback..."
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
      />

      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? theme.primary : '#bbb'}
              style={{ marginHorizontal: 2 }}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.primary }, submitting && { opacity: 0.6 }]}
        onPress={handleSend}
        disabled={submitting}
      >
        <Text style={[styles.submitText, { color: '#fff' }]}>
          {submitting ? 'Submitting...' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  backButton: { alignSelf: 'flex-start', marginBottom: 16, backgroundColor: 'transparent' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 18 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 18, minHeight: 100, textAlignVertical: 'top' },
  ratingRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 18 },
  submitButton: { padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 18 },
  submitText: { fontWeight: 'bold', fontSize: 18 },
});
