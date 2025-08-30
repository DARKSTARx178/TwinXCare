import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { db } from '@/firebase/firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Assistance() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  type ResponseData = {
    success: boolean;
    error?: string;
  };

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Please enter your request.');
      return;
    }

    const username = (await SecureStore.getItemAsync('user')) || 'Anonymous';

    try {
      setSubmitting(true);

      // 1️⃣ Send to Vercel API
      const response = await fetch('https://my-app.vercel.app/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, username }),
      });

      let data: ResponseData = { success: false };
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : { success: false, error: "Empty server response" };
      } catch (e) {
        console.warn("Failed to parse JSON response:", e);
        data = { success: false, error: "Invalid server response" };
      }

      if (data.success) {
        // 2️⃣ Save to Firebase Firestore
        await addDoc(collection(db, "requests"), {
          username,
          message,
          timestamp: serverTimestamp(),
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
