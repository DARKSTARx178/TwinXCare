import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import LocationAutocomplete, { SelectedLocation } from '@/components/LocationAutocomplete';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { updateLocationStock } from '@/utils/equipmentStock';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, doc, getDoc, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PaymentPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { fontSize } = useAccessibility();
  const { theme } = useContext(ThemeContext);
  const textSize = getFontSizeValue(fontSize);

  const [address, setAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<SelectedLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    console.log('📦 PaymentPage params:', params);
  }, [params]);

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
  const warehouseLocation = {
    id: String(params.pickupLocationId || ''),
    name: String(params.pickupLocationName || ''),
    address: String(params.pickupLocationAddress || ''),
    latitude: Number(params.pickupLocationLatitude || 0),
    longitude: Number(params.pickupLocationLongitude || 0),
  };

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
      console.log('Expo Push Result:', result);
    } catch (error) {
      console.error('Error sending Expo Push:', error);
    }
  };

  const handleConfirm = async () => {
    if (submittingRef.current) {
      return;
    }

    if (type === 'equipment' && !address.trim()) {
      Alert.alert('Error', 'Please enter your delivery address.');
      console.log('Missing address');
      return;
    }

    if (type === 'equipment' && !warehouseLocation.id) {
      Alert.alert('Error', 'Please select a pickup warehouse before payment.');
      return;
    }

    if (type === 'service' && (!params.phone || !params.bookingDate || !params.timeSlot || !params.docId)) {
      const missingFields: string[] = [];
      if (!params.phone) missingFields.push('phone');
      if (!params.bookingDate) missingFields.push('bookingDate');
      if (!params.timeSlot) missingFields.push('timeSlot');
      if (!params.docId) missingFields.push('docId');
      Alert.alert('Error', `Missing service info: ${missingFields.join(', ')}`);
      console.log('Missing service info:', missingFields);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      console.log('Confirm button pressed. Type:', type);

      if (type === 'equipment') {
        console.log('📦 Equipment booking started for:', params.docId);

        const productRef = doc(db, 'equipment', params.docId as string);
        const user = auth.currentUser;
        if (user) {
          console.log('👤 User ID:', user.uid);
          const userRef = doc(db, 'users', user.uid);

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
            deliveryLocation: deliveryLocation ? {
              latitude: deliveryLocation.latitude,
              longitude: deliveryLocation.longitude,
            } : null,
            warehouseLocation,
            warehouseLocationId: warehouseLocation.id,
            warehouseLocationName: warehouseLocation.name,
            warehouseLocationAddress: warehouseLocation.address,
            orderTime,
            transactionId,
            status: 'Incomplete',
            createdAt: new Date().toISOString(),
          };

          const pushToken = await runTransaction(db, async (transaction) => {
            const productSnap = await transaction.get(productRef);
            if (!productSnap.exists()) {
              throw new Error('Product not found.');
            }

            const productData = productSnap.data();
            const stockUpdate = updateLocationStock(productData, warehouseLocation.id, quantity);
            const currentStock = productData?.stock || 0;
            console.log('Current stock:', currentStock);

            if (Number(stockUpdate.stock) < 0) {
              throw new Error('Not enough stock available.');
            }

            const userSnap = await transaction.get(userRef);
            const userData = userSnap.data();

            transaction.update(productRef, stockUpdate);
            transaction.set(userRef, { history: arrayUnion(orderData) }, { merge: true });

            return userData?.pushToken;
          });

          console.log('Stock updated and order saved');

          const notifTitle = 'Order Confirmed!';
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
            console.log('Local Notification scheduled');
          } catch (notifErr) {
            console.error('Local Notification failed:', notifErr);
          }

          if (pushToken) {
            console.log('🚀 Sending Expo Push to:', pushToken);
            await sendPushNotification(
              pushToken,
              notifTitle,
              notifBody,
              { transactionId: transactionId || 'unknown', screen: '/(tabs)/delivery' }
            );
          } else {
            console.log('No push token found for user');
          }
        }

        router.replace('/delivery');
      }

      else if (type === 'service') {
        console.log('Service booking params check...');
        console.log('Deducting pax for:', { date: params.bookingDate, slot: params.timeSlot });

        const serviceRef = doc(db, 'services', params.docId as string);
        const snapshot = await getDoc(serviceRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const schedule = Array.isArray(data.schedule) ? data.schedule : [];
          const updatedSchedule = schedule.map((slot: any) => {
            if (slot.date === params.bookingDate && `${slot.from} - ${slot.to}` === params.timeSlot) {
              console.log('Updating slot:', slot);
              return { ...slot, pax: Math.max((slot.pax || 1) - 1, 0) };
            }
            return slot;
          });
          await updateDoc(serviceRef, { schedule: updatedSchedule });
          console.log('Schedule updated');
        }

        const user = auth.currentUser;
        if (user) {
          console.log('User ID:', user.uid);
          const userRef = doc(db, 'users', user.uid);
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

          console.log('Saving booking data:', bookingData);
          await setDoc(userRef, { booking: arrayUnion(bookingData) }, { merge: true });
          console.log('Booking saved');

          const serviceTitle = 'Booking Confirmed!';
          const serviceBody = `Your booking for ${params.name} on ${params.bookingDate} at ${params.timeSlot} has been confirmed.`;

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
            console.log('Local Service Notification scheduled');
          } catch (notifErr) {
            console.error('Local Service Notification failed:', notifErr);
          }

          if (pushToken) {
            console.log('Sending Expo Push to:', pushToken);
            await sendPushNotification(pushToken, serviceTitle, serviceBody);
          } else {
            console.log('No push token found for user');
          }
        }

        router.replace('/delivery');
      }

      else {
        Alert.alert('Error', 'Invalid booking type.');
        console.log('Invalid booking type detected:', type);
      }
    } catch (err) {
      console.error('Error confirming booking:', err);
      const message = err instanceof Error ? err.message : 'Failed to confirm booking.';
      Alert.alert('Error', message);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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

          {type === 'equipment' && warehouseLocation.name && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textDim }]}>Pickup Warehouse</Text>
              <Text style={[styles.summaryValue, { color: theme.text, textAlign: 'right', flex: 1 }]}>{warehouseLocation.name}</Text>
            </View>
          )}

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
              <LocationAutocomplete
                label="Address"
                placeholder="Search your delivery address"
                value={address}
                onChangeText={setAddress}
                onLocationSelected={setDeliveryLocation}
                disabled={isSubmitting}
                theme={theme}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.confirmButton,
            {
              borderColor: isSubmitting ? theme.textDim : theme.primary,
              borderWidth: 2,
              backgroundColor: theme.surface,
              opacity: isSubmitting ? 0.65 : 1,
            },
          ]}
          onPress={handleConfirm}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.confirmButtonText, { color: theme.primary, marginLeft: 10 }]}>Processing...</Text>
            </>
          ) : (
            <>
              <Text style={[styles.confirmButtonText, { color: theme.primary }]}>Complete Transaction</Text>
              <Ionicons name="shield-checkmark" size={20} color={theme.primary} style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.securitySeal}>
          <Ionicons name="lock-closed-outline" size={14} color={theme.textDim} />
          <Text style={[styles.securityText, { color: theme.textDim }]}>Secure SSL Encrypted Payment (not really secure or real)</Text>
        </View>
      </ScrollView>

      {isSubmitting && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <View style={[styles.loadingBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingTitle, { color: theme.text }]}>Processing payment</Text>
            <Text style={[styles.loadingText, { color: theme.textDim }]}>Please wait while we confirm your booking.</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 48,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  loadingBox: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  loadingTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '800',
  },
  loadingText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
