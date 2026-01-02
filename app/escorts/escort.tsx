import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { checkMatchForAvailability } from '@/services/matchingService';
import { Ionicons } from '@expo/vector-icons';
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
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
          <Ionicons name="calendar-outline" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Volunteer Availability</Text>
        <Text style={[styles.subtitle, { color: theme.textDim }]}>
          Offer your assistance to patients in need
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
        <Text style={[styles.cardHeading, { color: theme.text }]}>Service Schedule</Text>

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textDim }]}>Escort Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.datePicker, { backgroundColor: '#F1F5F9' }]}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
            <Text style={[styles.dateText, { color: theme.text }]}>{formatDate(date)}</Text>
          </TouchableOpacity>
        </View>

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

        <View style={[styles.formRow, { gap: 12 }]}>
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: theme.textDim }]}>Available From</Text>
            <TouchableOpacity
              onPress={() => setShowFromPicker(true)}
              style={[styles.timePicker, { backgroundColor: '#F1F5F9' }]}
            >
              <Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.timeText, { color: theme.text }]}>{formatTime(fromTime)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: theme.textDim }]}>Available Until</Text>
            <TouchableOpacity
              onPress={() => setShowToPicker(true)}
              style={[styles.timePicker, { backgroundColor: '#F1F5F9' }]}
            >
              <Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.timeText, { color: theme.text }]}>{formatTime(toTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

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

      <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
        <Text style={[styles.cardHeading, { color: theme.text }]}>Assignment Details</Text>

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textDim }]}>Preferred Location</Text>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Hospital, area, or facility"
            placeholderTextColor="#94a3b8"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.inputWrapper, { flex: 1, marginRight: 12 }]}>
            <Text style={[styles.label, { color: theme.textDim }]}>Capacity (Pax)</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="1"
              value={maxPax}
              onChangeText={setMaxPax}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputWrapper, { flex: 2 }]}>
            <Text style={[styles.label, { color: theme.textDim }]}>Contact Phone</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Your active number"
              placeholderTextColor="#94a3b8"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: theme.textDim }]}>Additional Notes</Text>
          <TextInput
            style={[styles.input, { color: theme.text, minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="Constraints or references..."
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface },
            submitting && { opacity: 0.7, backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitText, { color: submitting ? '#94B3B8' : theme.primary }]}>
            {submitting ? 'Registering...' : 'Register Availability'}
          </Text>
          {!submitting && <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  header: {
    marginTop: 100,
    marginBottom: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  card: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 32,
    marginBottom: 20,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
  },
  timePicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formRow: {
    flexDirection: 'row',
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 10,
  },
  submitText: {
    fontWeight: '800',
    fontSize: 16,
  },
});
