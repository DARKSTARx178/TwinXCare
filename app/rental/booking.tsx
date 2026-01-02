import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import app from '../../firebase/firebase';

const SCREEN_WIDTH = Dimensions.get('window').width;
const db = getFirestore(app);

export default function BookingScreen() {
  const rawParams = useLocalSearchParams() as any;
  const params = React.useMemo(() => ({ ...rawParams }), []);
  const router = useRouter();
  const { fontSize } = useAccessibility();
  const { theme } = useContext(ThemeContext);
  const textSize = getFontSizeValue(fontSize);
  const responsiveText = (size: number) =>
    Math.max(size * (SCREEN_WIDTH / 400), size * 0.85);

  const bookPrice = Number(params.price || 0);

  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ from: string; to: string; pax?: number }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const fixedName = params.username || 'Guest';
  const fixedAddress = params.venue || 'Fixed Venue';
  const phoneRef = useRef<string>('');
  const notesRef = useRef<string>('');

  const scheduleRef = useRef<any[]>([]);
  const boxBackground = theme.unselectedTab === '#fff' ? '#f0f0f0' : '#e0e0e0';

  useEffect(() => {
    async function fetchSchedule() {
      try {
        let schedule: any[] = [];
        if (params.schedule) schedule = JSON.parse(params.schedule);
        else if (params.id) {
          const docRef = doc(db, 'services', params.id);
          const snapshot = await getDoc(docRef);
          if (snapshot.exists()) schedule = Array.isArray(snapshot.data().schedule) ? snapshot.data().schedule : [];
        }
        scheduleRef.current = schedule;
        const uniqueDates = Array.from(new Set(schedule.map((s: any) => s.date))).filter(Boolean);
        setAvailableDates(uniqueDates);
        if (uniqueDates.length > 0) {
          setBookingDate(uniqueDates[0]);
          setTimeSlots(schedule.filter((s) => s.date === uniqueDates[0]));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchSchedule();
  }, [params.id, params.schedule]);

  function BackButton() {
    return (
      <TouchableOpacity style={{ alignSelf: 'flex-start', padding: 16 }} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>
    );
  }

  function BookingCalendar() {
    return (
      <View style={[styles.box, { backgroundColor: boxBackground }]}>
        <Text style={{ color: theme.text, fontSize: responsiveText(textSize), marginBottom: 8 }}>Choose booking date:</Text>
        <RNPickerSelect
          onValueChange={(value) => {
            setBookingDate(value);
            const slots = scheduleRef.current.filter((s: any) => s.date === value);
            setTimeSlots(slots);
            setSelectedSlot(null);
          }}
          items={availableDates.map((d) => ({ label: d, value: d }))}
          value={bookingDate}
          style={{
            inputAndroid: { color: theme.text, fontSize: responsiveText(textSize), padding: 12 },
            inputIOS: { color: theme.text, fontSize: responsiveText(textSize), padding: 12 },
          }}
        />
      </View>
    );
  }

  function TimeSlotSelector() {
    return (
      <View style={[styles.box, { backgroundColor: boxBackground }]}>
        <Text style={{ color: theme.text, fontSize: responsiveText(textSize), marginBottom: 8 }}>Select a time slot:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {timeSlots.length === 0 ? <Text style={{ color: theme.unselected }}>No slots available</Text> :
            timeSlots.map((slot) => {
              const slotText = `${slot.from} - ${slot.to}`;
              const active = selectedSlot === slotText;
              return (
                <TouchableOpacity
                  key={slotText}
                  style={[
                    styles.slotBtn,
                    { backgroundColor: active ? theme.primary : theme.unselected },
                    slot.pax === 0 ? { opacity: 0.5 } : {}
                  ]}
                  onPress={() => slot.pax === 0 ? null : setSelectedSlot(slotText)}
                >
                  <Text style={{ color: active ? '#fff' : theme.text, fontSize: responsiveText(textSize - 2) }}>
                    {slotText}{slot.pax === 0 ? ' (Full)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>
      </View>
    );
  }

  function UserDetailsForm() {
    return (
      <View style={[styles.box, { backgroundColor: boxBackground }]}>
        <TextInput
          placeholder="Phone"
          placeholderTextColor={theme.unselected}
          defaultValue={phoneRef.current}
          onChangeText={(t) => (phoneRef.current = t)}
          keyboardType="phone-pad"
          style={[styles.input, { borderColor: theme.unselected, color: theme.text }]}
        />
        <TextInput
          placeholder="Notes (Optional)"
          placeholderTextColor={theme.unselected}
          defaultValue={notesRef.current}
          onChangeText={(t) => (notesRef.current = t)}
          multiline
          style={[styles.input, { borderColor: theme.unselected, color: theme.text }]}
        />
      </View>
    );
  }

  const isBookingDisabled = !phoneRef.current?.trim() || !selectedSlot || (selectedSlot && scheduleRef.current.find(s => `${s.from} - ${s.to}` === selectedSlot)?.pax === 0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.imageCard, { backgroundColor: theme.surface }]}>
            {params.image && <Image source={{ uri: params.image }} style={styles.image} resizeMode="cover" />}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>${bookPrice}</Text>
            </View>
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.title, { fontSize: responsiveText(textSize + 12), color: theme.text }]}>{params.name}</Text>
            {params.description && (
              <Text style={[styles.description, { fontSize: responsiveText(textSize - 1), color: theme.textDim }]}>
                {params.description}
              </Text>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Booking Date</Text>
            </View>
            <View style={[styles.pickerContainer, { backgroundColor: '#F1F5F9' }]}>
              <RNPickerSelect
                onValueChange={(value) => {
                  setBookingDate(value);
                  const slots = scheduleRef.current.filter((s: any) => s.date === value);
                  setTimeSlots(slots);
                  setSelectedSlot(null);
                }}
                items={availableDates.map((d) => ({ label: d, value: d }))}
                value={bookingDate}
                style={{
                  inputAndroid: { color: theme.text, fontSize: responsiveText(textSize), padding: 12 },
                  inputIOS: { color: theme.text, fontSize: responsiveText(textSize), padding: 12 },
                }}
              />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Time Slot</Text>
            </View>
            <View style={styles.slotGrid}>
              {timeSlots.length === 0 ? (
                <Text style={{ color: theme.textDim }}>No slots available for this date</Text>
              ) : (
                timeSlots.map((slot) => {
                  const slotText = `${slot.from} - ${slot.to}`;
                  const active = selectedSlot === slotText;
                  const isFull = slot.pax === 0;
                  return (
                    <TouchableOpacity
                      key={slotText}
                      disabled={isFull}
                      style={[
                        styles.slotBtn,
                        { borderColor: theme.border },
                        active && { backgroundColor: theme.primary, borderColor: theme.primary },
                        isFull && { opacity: 0.4, backgroundColor: '#f1f5f9' }
                      ]}
                      onPress={() => setSelectedSlot(slotText)}
                    >
                      <Text style={[
                        styles.slotText,
                        { color: active ? '#fff' : theme.text },
                        isFull && { color: theme.textDim }
                      ]}>
                        {slotText}{isFull ? ' (Full)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact & Notes</Text>
            </View>
            <TextInput
              placeholder="Your Phone Number"
              placeholderTextColor="#94a3b8"
              defaultValue={phoneRef.current}
              onChangeText={(t) => (phoneRef.current = t)}
              keyboardType="phone-pad"
              style={[styles.input, { backgroundColor: '#F1F5F9', color: theme.text }]}
            />
            <TextInput
              placeholder="Special instructions or notes..."
              placeholderTextColor="#94a3b8"
              defaultValue={notesRef.current}
              onChangeText={(t) => (notesRef.current = t)}
              multiline
              numberOfLines={3}
              style={[styles.input, { backgroundColor: '#F1F5F9', color: theme.text, minHeight: 100, textAlignVertical: 'top' }]}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.surface }]}>
        <View style={styles.priceSection}>
          <Text style={[styles.totalLabel, { color: theme.textDim }]}>Total Price</Text>
          <Text style={[styles.totalValue, { color: theme.text }]}>${bookPrice.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.bookButton,
            { backgroundColor: isBookingDisabled ? '#E2E8F0' : theme.primary }
          ]}
          disabled={isBookingDisabled}
          activeOpacity={0.8}
          onPress={() => {
            const slotObj = scheduleRef.current.find(
              s => s.date === bookingDate && `${s.from} - ${s.to}` === selectedSlot
            );
            router.replace({
              pathname: '/rental/payment',
              params: {
                ...params,
                docId: params.id,
                price: bookPrice.toString(),
                fromBooking: 'true',
                bookingDate,
                timeSlot: selectedSlot,
                slotPax: slotObj?.pax ?? 0,
                fullName: fixedName,
                phone: phoneRef.current,
                address: fixedAddress,
                notes: notesRef.current || '',
                type: 'service',
              },
            });
          }}
        >
          <Text style={[styles.bookButtonText, { color: isBookingDisabled ? '#94B3B8' : '#fff' }]}>
            Complete Booking
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  content: { paddingHorizontal: 20, paddingTop: 60 },
  imageCard: {
    width: '100%',
    height: 300,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#81ade7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  headerInfo: { marginBottom: 25, alignItems: 'center' },
  title: { fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  description: { textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  card: {
    padding: 24,
    borderRadius: 28,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontWeight: '800', fontSize: 16 },
  pickerContainer: { borderRadius: 16, overflow: 'hidden' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  slotText: { fontWeight: '700', fontSize: 13 },
  input: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 20,
  },
  priceSection: { flex: 1 },
  totalLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  totalValue: { fontSize: 24, fontWeight: '900' },
  bookButton: {
    flex: 1.5,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#81ade7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: { fontWeight: '800', fontSize: 16 },
});
