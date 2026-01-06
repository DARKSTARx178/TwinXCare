import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PaymentPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { fontSize } = useAccessibility();
  const { theme } = useContext(ThemeContext);
  const textSize = getFontSizeValue(fontSize);

  const [address, setAddress] = useState('');

  // 🔍 Debug params
  useEffect(() => {
    console.log('📦 PaymentPage params:', params);
  }, [params]);

  // ✅ Detect type (fallback detection)
  let type = (params.type as string)?.toLowerCase();
  if (!type) {
    if (params.pricePerDay) type = 'equipment';
    else type = 'service';
  }
  console.log('🔍 Detected booking type:', type);

  const pricePerDay = Number(params.pricePerDay || params.price || 0);
  const quantity = Number(params.quantity || 1);
  const rentalDays = Number(params.rentalDays || 1);
  const totalPrice = pricePerDay * quantity * rentalDays;

  console.log('💰 Price breakdown:', { pricePerDay, quantity, rentalDays, totalPrice });

  const sendPushNotification = async (expoPushToken: string, title: string, body: string, data: any = {}) => {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      const result = await response.json();
      console.log('🚀 Expo Push Result:', result);
    } catch (error) {
      console.error('❌ Error sending Expo Push:', error);
    }
  };

  const handleConfirm = async () => {
    try {
      console.log('🟢 Confirm button pressed. Type:', type);

      // ✅ EQUIPMENT BOOKING
      if (type === 'equipment') {
        if (!address.trim()) {
          Alert.alert('Error', 'Please enter your delivery address.');
          console.log('❌ Missing address');
          return;
        }

        console.log('📦 Equipment booking started for:', params.docId);

        const productRef = doc(db, 'equipment', params.docId as string);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
          Alert.alert('Error', 'Product not found.');
          console.log('❌ Product not found:', params.docId);
          return;
        }

        const currentStock = productSnap.data()?.stock || 0;
        console.log('📊 Current stock:', currentStock);

        if (currentStock < quantity) {
          Alert.alert('Error', 'Not enough stock available.');
          console.log('❌ Insufficient stock. Requested:', quantity);
          return;
        }

        await updateDoc(productRef, { stock: currentStock - quantity });
        console.log('✅ Stock updated:', currentStock - quantity);

        const user = auth.currentUser;
        if (user) {
          console.log('👤 User ID:', user.uid);
          const userRef = doc(db, 'users', user.uid);

          // Fetch user doc to get push token
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          const pushToken = userData?.pushToken;

          const orderTime = new Date().toISOString();
          const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
          const transactionId = `${(params.docId as string).substr(0, 3).toUpperCase()}-${randomSuffix}`;

          const orderData = {
            productId: params.docId,
            name: params.name,
            quantity,
            rentalDays,
            rentalStart: params.rentalStart,
            rentalEnd: params.rentalEnd,
            totalPrice: totalPrice.toFixed(2),
            deliveryAddress: address,
            orderTime,
            transactionId,
            status: 'Incomplete',
            createdAt: new Date().toISOString(),
          };

          console.log('📝 Saving order data:', orderData);
          await setDoc(userRef, { history: arrayUnion(orderData) }, { merge: true });
          console.log('✅ Order saved');

          const notifTitle = 'Order Confirmed! 🎉';
          const notifBody = `Your order for ${params.name} has been placed successfully.`;

          // 🔔 Send Local Notification
          console.log('🔔 Attempting to schedule local notification...');
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });

          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: notifTitle,
                body: notifBody,
                data: { transactionId },
              },
              trigger: null,
            });
            console.log('✅ Local Notification scheduled');
          } catch (notifErr) {
            console.error('❌ Local Notification failed:', notifErr);
          }

          // 🚀 Send Expo Push Notification
          if (pushToken) {
            console.log('🚀 Sending Expo Push to:', pushToken);
            await sendPushNotification(
              pushToken,
              notifTitle,
              notifBody,
              { transactionId: transactionId || 'unknown', screen: '/(tabs)/delivery' }
            );
          } else {
            console.log('⚠️ No push token found for user');
          }
        }

        router.replace('/delivery');
      }

      // ✅ SERVICE BOOKING
      else if (type === 'service') {
        console.log('📆 Service booking params check...');
        if (!params.phone || !params.bookingDate || !params.timeSlot || !params.docId) {
          const missingFields: string[] = [];
          if (!params.phone) missingFields.push('phone');
          if (!params.bookingDate) missingFields.push('bookingDate');
          if (!params.timeSlot) missingFields.push('timeSlot');
          if (!params.docId) missingFields.push('docId');
          Alert.alert('Error', `Missing service info: ${missingFields.join(', ')}`);
          console.log('❌ Missing service info:', missingFields);
          return;
        }

        console.log('📊 Deducting pax for:', { date: params.bookingDate, slot: params.timeSlot });

        const serviceRef = doc(db, 'services', params.docId as string);
        const snapshot = await getDoc(serviceRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const schedule = Array.isArray(data.schedule) ? data.schedule : [];
          const updatedSchedule = schedule.map((slot: any) => {
            if (slot.date === params.bookingDate && `${slot.from} - ${slot.to}` === params.timeSlot) {
              console.log('🔄 Updating slot:', slot);
              return { ...slot, pax: Math.max((slot.pax || 1) - 1, 0) };
            }
            return slot;
          });
          await updateDoc(serviceRef, { schedule: updatedSchedule });
          console.log('✅ Schedule updated');
        }

        const user = auth.currentUser;
        if (user) {
          console.log('👤 User ID:', user.uid);
          const userRef = doc(db, 'users', user.uid);

          // Fetch user doc to get push token
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          const pushToken = userData?.pushToken;

          const bookingData = {
            serviceId: params.docId,
            title: params.name || 'Untitled Service',
            description: params.description || '',
            bookingDate: params.bookingDate,
            timeSlot: params.timeSlot,
            price: params.price,
            createdAt: new Date().toISOString(),
          };

          console.log('📝 Saving booking data:', bookingData);
          await setDoc(userRef, { booking: arrayUnion(bookingData) }, { merge: true });
          console.log('✅ Booking saved');

          const serviceTitle = 'Booking Confirmed! 🎉';
          const serviceBody = `Your booking for ${params.name} on ${params.bookingDate} at ${params.timeSlot} has been confirmed.`;

          // 🔔 Send Local Notification
          console.log('🔔 Attempting to schedule local notification...');
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });

          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: serviceTitle,
                body: serviceBody,
              },
              trigger: null,
            });
            console.log('✅ Local Service Notification scheduled');
          } catch (notifErr) {
            console.error('❌ Local Service Notification failed:', notifErr);
          }

          // 🚀 Send Expo Push Notification
          if (pushToken) {
            console.log('🚀 Sending Expo Push to:', pushToken);
            await sendPushNotification(pushToken, serviceTitle, serviceBody);
          } else {
            console.log('⚠️ No push token found for user');
          }
        }

        router.replace('/delivery');
      }

      // ❌ UNKNOWN TYPE
      else {
        Alert.alert('Error', 'Invalid booking type.');
        console.log('❌ Invalid booking type detected:', type);
      }
    } catch (err) {
      console.error('❌ Error confirming booking:', err);
      Alert.alert('Error', 'Failed to confirm booking.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
          <Ionicons name="cash-outline" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text, fontSize: textSize + 10 }]}>Payment Details</Text>
        <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
          Finalize your {type} booking
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
        <Text style={[styles.cardHeading, { color: theme.text }]}>Order Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textDim }]}>Quantity</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{quantity}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textDim }]}>Duration</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{rentalDays} Day{rentalDays > 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Total Amount</Text>
          <Text style={[styles.totalValue, { color: theme.primary }]}>${totalPrice.toFixed(2)}</Text>
        </View>
      </View>

      {type === 'equipment' && (
        <View style={[styles.card, { backgroundColor: theme.surface, marginTop: 20, borderWidth: 1, borderColor: theme.border }]}>
          <Text style={[styles.cardHeading, { color: theme.text }]}>Delivery Information</Text>
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: theme.textDim }]}>Address</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <Ionicons name="location-outline" size={20} color={theme.textDim} style={styles.inputIcon} />
              <TextInput
                placeholder="1234 Main St, City, Country"
                placeholderTextColor="#94a3b8"
                value={address}
                onChangeText={setAddress}
                style={[styles.input, { color: theme.text }]}
                multiline
              />
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.confirmButton, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
        onPress={handleConfirm}
        activeOpacity={0.8}
      >
        <Text style={[styles.confirmButtonText, { color: theme.primary }]}>Complete Transaction</Text>
        <Ionicons name="shield-checkmark" size={20} color={theme.primary} style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      <View style={styles.securitySeal}>
        <Ionicons name="lock-closed-outline" size={14} color={theme.textDim} />
        <Text style={[styles.securityText, { color: theme.textDim }]}>Secure SSL Encrypted Payment (not really secure or real)</Text>
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
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontWeight: '800', textAlign: 'center' },
  subtitle: { fontWeight: '500', marginTop: 4, textAlign: 'center' },
  card: {
    padding: 24,
    borderRadius: 32,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 14, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 16, fontWeight: '800' },
  totalValue: { fontSize: 24, fontWeight: '900' },
  inputWrapper: { width: '100%' },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
  },
  inputIcon: { marginRight: 10, marginTop: 2 },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 60,
  },
  confirmButton: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  confirmButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  securitySeal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});
