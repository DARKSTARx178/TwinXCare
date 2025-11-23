import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EscortAvailability() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);

  const [date, setDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [location, setLocation] = useState('');
  const [maxPax, setMaxPax] = useState('1');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date.trim() || !fromTime.trim() || !toTime.trim() || !location.trim()) {
      Alert.alert('Please fill required fields', 'Date, from/to time and location are required.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'escort', 'availability', 'entries'), {
        providerId: auth?.currentUser?.uid ?? 'guest',
        providerEmail: auth?.currentUser?.email ?? 'guest',
        date,
        fromTime,
        toTime,
        location,
        maxPax: Number(maxPax) || 1,
        contactPhone,
        notes,
        createdAt: serverTimestamp(),
        status: 'available'
      });

      Alert.alert('Availability submitted', 'Thank you — your availability has been posted.');
      router.back();
    } catch (error) {
      console.error('Failed to submit availability:', error);
      Alert.alert('Error', 'Failed to submit availability. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}> 
      <Text style={[styles.title, { color: theme.text }]}>Volunteer / Escort Availability</Text>

      <Text style={[styles.label, { color: theme.text }]}>Date (YYYY-MM-DD)</Text>
      <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="2025-11-10" value={date} onChangeText={setDate} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: theme.text }]}>From (HH:MM)</Text>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="09:00" value={fromTime} onChangeText={setFromTime} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: theme.text }]}>To (HH:MM)</Text>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="12:00" value={toTime} onChangeText={setToTime} />
        </View>
      </View>

      <Text style={[styles.label, { color: theme.text }]}>Location</Text>
      <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Hospital / Area" value={location} onChangeText={setLocation} />

      <Text style={[styles.label, { color: theme.text }]}>Max Pax</Text>
      <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="1" value={maxPax} onChangeText={setMaxPax} keyboardType="numeric" />

      <Text style={[styles.label, { color: theme.text }]}>Contact phone</Text>
      <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />

      <Text style={[styles.label, { color: theme.text }]}>Notes</Text>
      <TextInput style={[styles.input, { minHeight: 80, borderColor: theme.primary, color: theme.text }]} placeholder="Any notes or constraints" value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.primary }, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
        <Text style={[styles.submitText, { color: '#fff' }]}>{submitting ? 'Submitting...' : 'Submit Availability'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 14, marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  submitButton: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', marginTop: 18, marginBottom: 40 },
  submitText: { fontWeight: '700', fontSize: 16 }
});
