import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase/firebase';

export default function Assistance() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('Anonymous');
  const router = useRouter();

  type ResponseData = {
    success: boolean;
    error?: string;
    logs?: string[];
  };

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

      // 1️⃣ Send request to Vercel API (email + logs)
      const response = await fetch('https://twin-x-care.vercel.app/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TwinXCareApp/1.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ message, username: username || 'Anonymous', type: "assistance" }),
      });

      let data: ResponseData = { success: false };
      
      // Check for Vercel security checkpoint (429)
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
        try {
          const text = await response.text();
          console.log('API Response text:', text.substring(0, 500));
          console.log('Response status:', response.status);
          data = text ? JSON.parse(text) : { success: false, error: "Empty server response" };
          console.log('Parsed data:', data);
        } catch (e) {
          console.warn("Failed to parse JSON response:", e);
          data = { success: false, error: "Invalid server response" };
        }
      }

      if (data.success) {
        // 2️⃣ Save to Firebase Firestore (requests collection)
        await addDoc(collection(db, "requests"), {
          username,
          message,
          createdAt: serverTimestamp(), // match feedback page style
        });

        Alert.alert('Thank you!', 'Your request has been submitted.');
        setMessage('');
        router.back();
      } else {
        Alert.alert('Error', data.error || 'Failed to submit request.');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#222" />
      </TouchableOpacity>

      <Text style={styles.title}>Submit Assistance Request</Text>

      <TextInput
        style={styles.input}
        placeholder="Your request..."
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
      />

      <TouchableOpacity
        style={[styles.submitButton, submitting && { opacity: 0.6 }]}
        onPress={handleSend}
        disabled={submitting}
      >
        <Text style={styles.submitText}>
          {submitting ? 'Submitting...' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f9fafb' },
  backButton: { alignSelf: 'flex-start', marginBottom: 16, backgroundColor: 'transparent' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 18, color: '#222' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 18, backgroundColor: '#fff', minHeight: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#4a90e2', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 18 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
