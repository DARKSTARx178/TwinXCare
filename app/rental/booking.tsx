import React, { useRef, useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  Animated as RNAnimated,
  PanResponder,
  Platform,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../../firebase/firebase';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';

const SCREEN_WIDTH = Dimensions.get('window').width;
const db = getFirestore(app);

export default function BookingScreen() {
  const params = useLocalSearchParams() as any;
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors();
  const textSize = getFontSizeValue(fontSize);
  const responsiveText = (size: number) => Math.max(size * (SCREEN_WIDTH / 400), size * 0.85);

  const bookPrice = Number(params.price || 0);

  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ from: string; to: string; pax: number }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [swiped, setSwiped] = useState(false);
  const swipeX = useRef(new RNAnimated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: RNAnimated.event([null, { dx: swipeX }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 200) {
          if (!fullName || !phone || !address || !selectedSlot || !bookingDate) {
            alert('Please fill all required fields, pick a date, and select a time slot.');
            RNAnimated.spring(swipeX, { toValue: 0, useNativeDriver: false }).start();
            return;
          }

          setSwiped(true);
          setTimeout(() => {
            router.replace({
              pathname: '/rental/payment',
              params: {
                ...params,
                price: bookPrice.toString(),
                fromBooking: 'true',
                bookingDate,
                timeSlot: selectedSlot,
                fullName,
                phone,
                address,
                notes,
                type: 'service',
              },
            });
          }, 300);
        } else {
          RNAnimated.spring(swipeX, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const boxBackground = theme.unselectedTab === '#fff' ? '#f0f0f0' : '#e0e0e0';

  // Fetch service schedule from Firebase
  useEffect(() => {
    if (!params.id) return;
    async function fetchServiceData() {
      try {
        const docRef = doc(db, 'services', params.id);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          const schedule = data.schedule || [];
          const uniqueDates = Array.from(new Set(schedule.map((s: any) => s.date))) as string[];
          setAvailableDates(uniqueDates);
          if (uniqueDates.length > 0) {
            setBookingDate(uniqueDates[0]);
            filterTimeSlots(schedule, uniqueDates[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching service:', error);
      }
    }

    function filterTimeSlots(schedule: any[], date: string) {
      const slots = schedule.filter((s) => s.date === date);
      setTimeSlots(slots);
      setSelectedSlot(null);
    }

    fetchServiceData();
  }, [params.id]);

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
        <Text style={{ color: theme.text, fontSize: responsiveText(textSize), marginBottom: 8 }}>
          Choose booking date:
        </Text>
        <RNPickerSelect
          onValueChange={(value) => {
            setBookingDate(value);
            if (params.id) {
              getDoc(doc(db, 'services', params.id))
                .then((snap) => {
                  if (snap.exists()) {
                    const schedule = snap.data().schedule || [];
                    const slots = schedule.filter((s: any) => s.date === value);
                    setTimeSlots(slots);
                    setSelectedSlot(null);
                  }
                })
                .catch(console.error);
            }
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
        <Text style={{ color: theme.text, fontSize: responsiveText(textSize), marginBottom: 8 }}>
          Select a time slot:
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {timeSlots.length === 0 ? (
            <Text style={{ color: theme.unselected }}>No slots available</Text>
          ) : (
            timeSlots.map((slot) => {
              const slotText = `${slot.from} - ${slot.to}`;
              return (
                <TouchableOpacity
                  key={slotText}
                  style={[
                    styles.slotBtn,
                    { backgroundColor: selectedSlot === slotText ? theme.primary : theme.unselected },
                  ]}
                  onPress={() => setSelectedSlot(slotText)}
                >
                  <Text
                    style={{
                      color: selectedSlot === slotText ? '#fff' : theme.text,
                      fontSize: responsiveText(textSize - 2),
                    }}
                  >
                    {slotText}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>
    );
  }

  function UserDetailsForm() {
    return (
      <View style={[styles.box, { backgroundColor: boxBackground }]}>
        <TextInput
          placeholder="Full Name"
          placeholderTextColor={theme.unselected}
          value={fullName}
          onChangeText={setFullName}
          style={[styles.input, { borderColor: theme.unselected, color: theme.text }]}
        />
        <TextInput
          placeholder="Phone"
          placeholderTextColor={theme.unselected}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={[styles.input, { borderColor: theme.unselected, color: theme.text }]}
        />
        <TextInput
          placeholder="Address"
          placeholderTextColor={theme.unselected}
          value={address}
          onChangeText={setAddress}
          style={[styles.input, { borderColor: theme.unselected, color: theme.text }]}
        />
        <TextInput
          placeholder="Notes (Optional)"
          placeholderTextColor={theme.unselected}
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, { borderColor: theme.unselected, color: theme.text }]}
          multiline
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ height: 32 }} />
        <View style={styles.container}>
          <BackButton />
          {params.image && <Image source={{ uri: params.image }} style={styles.image} />}
          <Text style={[styles.title, { fontSize: responsiveText(textSize + 8), color: theme.text }]}>
            {params.name}
          </Text>
          {params.description && (
            <Text style={[styles.description, { fontSize: responsiveText(textSize - 1), color: theme.text }]}>
              {params.description}
            </Text>
          )}
          <Text style={[styles.modeBtnText, { color: theme.primary, fontSize: responsiveText(textSize) }]}>
            Book <Text style={[styles.modePrice, { fontSize: responsiveText(textSize - 2) }]}>${bookPrice}</Text>
          </Text>

          <BookingCalendar />
          <TimeSlotSelector />
          <UserDetailsForm />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { borderColor: theme.unselected, backgroundColor: theme.background }]}>
        <View style={styles.totalPriceBox}>
          <Text style={[styles.totalPriceLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 4) }]}>
            Total
          </Text>
          <Text style={[{ fontWeight: 'bold' }, { color: theme.text, fontSize: responsiveText(textSize + 4) }]}>
            ${bookPrice.toFixed(2)}
          </Text>
        </View>
        <View style={styles.swipeContainerCentered}>
          <Text style={[styles.swipeLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>
            Swipe to Book
          </Text>
          <View style={[styles.swipeTrack, { backgroundColor: theme.unselectedTab }]} {...panResponder.panHandlers}>
            <RNAnimated.View
              style={[
                styles.swipeThumb,
                { backgroundColor: swiped ? '#4CAF50' : theme.primary, transform: [{ translateX: swipeX }] },
              ]}
            >
              <Text style={[styles.swipeThumbText, { fontSize: responsiveText(textSize + 10) }]}>
                {swiped ? '✓' : '→'}
              </Text>
            </RNAnimated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 16 },
  box: { marginVertical: 8, borderRadius: 12, padding: 16 },
  image: { width: 240, height: 240, borderRadius: 16, marginVertical: 16, alignSelf: 'center' },
  title: { fontWeight: 'bold', textAlign: 'center' },
  description: { marginVertical: 12, textAlign: 'left', lineHeight: 20, alignSelf: 'stretch', flexShrink: 1 },
  modeBtnText: { marginBottom: 16, textAlign: 'center' },
  modePrice: { fontWeight: 'bold' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, borderTopWidth: 1 },
  totalPriceBox: { flex: 1, justifyContent: 'flex-end' },
  swipeContainerCentered: { flex: 2, alignItems: 'center' },
  swipeLabel: { marginBottom: 8 },
  swipeTrack: { width: 260, height: 64, borderRadius: 32, justifyContent: 'center' },
  swipeThumb: { position: 'absolute', left: 0, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  swipeThumbText: { color: '#fff', fontWeight: 'bold' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  slotBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  totalPriceLabel: { fontWeight: '500' },
});
