import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { checkMatchForAvailability } from '@/services/matchingService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EscortAvailability() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);

  const [date, setDate] = useState(new Date());
  const [fromTime, setFromTime] = useState(new Date());
  const [toTime, setToTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [location, setLocation] = useState('');
  const [maxPax, setMaxPax] = useState('1');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Helpers to format for Firestore (keeping existing string format)
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const handleSubmit = async () => {
    const dateStr = formatDate(date);
    const fromStr = formatTime(fromTime);
    const toStr = formatTime(toTime);

    if (!location.trim()) {
      Alert.alert('Please fill required fields', 'Location is required.');
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'escort', 'availability', 'entries'), {
        providerId: auth?.currentUser?.uid ?? 'guest',
        providerEmail: auth?.currentUser?.email ?? 'guest',
        date: dateStr,
        fromTime: fromStr,
        toTime: toStr,
        location,
        maxPax: Number(maxPax) || 1,
        contactPhone,
        notes,
        createdAt: serverTimestamp(),
        status: 'available'
      });

      console.log('✅ Availability added with ID:', docRef.id);

      const availData = {
        providerId: auth?.currentUser?.uid ?? 'guest',
        providerEmail: auth?.currentUser?.email ?? 'guest',
        date: dateStr,
        fromTime: fromStr,
        toTime: toStr,
        location,
        maxPax: Number(maxPax) || 1,
        contactPhone,
        notes,
        status: 'available'
      };

      checkMatchForAvailability(docRef.id, availData);

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

      <Text style={[styles.label, { color: theme.text }]}>Date</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { borderColor: theme.primary, justifyContent: 'center' }]}>
        <Text style={{ color: theme.text }}>{formatDate(date)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: theme.text }]}>From</Text>
          <TouchableOpacity onPress={() => setShowFromPicker(true)} style={[styles.input, { borderColor: theme.primary, justifyContent: 'center' }]}>
            <Text style={{ color: theme.text }}>{formatTime(fromTime)}</Text>
          </TouchableOpacity>
          {showFromPicker && (
            <DateTimePicker
              value={fromTime}
              mode="time"
              is24Hour={true}
              display="default"
              minuteInterval={5}
              onChange={(event, selectedDate) => {
                setShowFromPicker(false);
                if (selectedDate) setFromTime(selectedDate);
              }}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: theme.text }]}>To</Text>
          <TouchableOpacity onPress={() => setShowToPicker(true)} style={[styles.input, { borderColor: theme.primary, justifyContent: 'center' }]}>
            <Text style={{ color: theme.text }}>{formatTime(toTime)}</Text>
          </TouchableOpacity>
          {showToPicker && (
            <DateTimePicker
              value={toTime}
              mode="time"
              is24Hour={true}
              display="default"
              minuteInterval={5}
              onChange={(event, selectedDate) => {
                setShowToPicker(false);
                if (selectedDate) setToTime(selectedDate);
              }}
            />
          )}
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
