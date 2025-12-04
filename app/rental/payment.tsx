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
      <Text style={[styles.title, { color: theme.text, fontSize: textSize + 6 }]}>Payment</Text>

      <Text style={[styles.label, { color: theme.text, fontSize: textSize }]}>
        Total: ${totalPrice.toFixed(2)} ({quantity} item{quantity > 1 ? 's' : ''} × {rentalDays}{' '}
        day{rentalDays > 1 ? 's' : ''})
      </Text>

      {type === 'equipment' && (
        <>
          <Text style={[styles.label, { color: theme.text, fontSize: textSize }]}>Delivery Address</Text>
          <TextInput
            placeholder="1234 Main St, City, Country"
            placeholderTextColor={theme.unselected}
            value={address}
            onChangeText={setAddress}
            style={[
              styles.input,
              { borderColor: theme.unselected, color: theme.text, fontSize: textSize },
            ]}
            multiline
          />
        </>
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleConfirm}>
        <Ionicons name="checkmark-circle-outline" size={24} color={theme.background} />
        <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize + 2 }}>
          Confirm Payment
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  label: { marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: 32,
  },
});
