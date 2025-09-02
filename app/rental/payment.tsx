import { useAccessibility } from '@/contexts/AccessibilityContext';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { getThemeColors } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PaymentPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { fontSize } = useAccessibility();
  const theme = getThemeColors();
  const textSize = getFontSizeValue(fontSize);

  const [address, setAddress] = useState('');
  const pricePerDay = Number(params.pricePerDay || params.price || 0);
  const quantity = Number(params.quantity || 1);
  const rentalDays = Number(params.rentalDays || 1);
  const totalPrice = pricePerDay * quantity * rentalDays;

  const handleConfirm = async () => {
    try {
      if (params.type === 'equipment') {
        // --- Equipment booking logic (unchanged) ---
        if (!address.trim()) {
          Alert.alert('Error', 'Please enter your delivery address.');
          return;
        }

        const productRef = doc(db, 'equipment', params.docId as string);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
          Alert.alert('Error', 'Product not found.');
          return;
        }

        const currentStock = productSnap.data()?.stock || 0;
        if (currentStock < quantity) {
          Alert.alert('Error', 'Not enough stock available.');
          return;
        }

        await updateDoc(productRef, { stock: currentStock - quantity });

        const user = auth.currentUser;
        if (user) {
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
            orderTime,
            transactionId,
            status: 'Incomplete',
            createdAt: new Date().toISOString(),
          };

          await updateDoc(userRef, { history: arrayUnion(orderData) });
        }

        router.replace('/delivery');
      } else if (params.type === 'service') {
        // --- Service booking logic ---
        if (!params.phone || !params.bookingDate || !params.timeSlot || !params.docId) {
          const missingFields: string[] = [];
          if (!params.phone) missingFields.push("phone");
          if (!params.bookingDate) missingFields.push("bookingDate");
          if (!params.timeSlot) missingFields.push("timeSlot");
          if (!params.docId) missingFields.push("docId");

          Alert.alert(
            "Error",
            `Missing service info: ${missingFields.join(", ")}`
          );
          return;
        }

        // Deduct pax in the corresponding service
        const serviceRef = doc(db, 'services', params.docId as string);
        const snapshot = await getDoc(serviceRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const schedule = Array.isArray(data.schedule) ? data.schedule : [];
          const updatedSchedule = schedule.map((slot: any) => {
            if (slot.date === params.bookingDate && `${slot.from} - ${slot.to}` === params.timeSlot) {
              return { ...slot, pax: Math.max((slot.pax || 1) - 1, 0) };
            }
            return slot;
          });
          await updateDoc(serviceRef, { schedule: updatedSchedule });
        }

        // Save booking under user profile
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'users', user.uid);

          const bookingData = {
            serviceId: params.docId,
            title: params.name || "Untitled Event",
            description: params.description || "",
            bookingDate: params.bookingDate,
            timeSlot: params.timeSlot,
            price: params.price,
            createdAt: new Date().toISOString(),
          };

          await updateDoc(userRef, { booking: arrayUnion(bookingData) });
        }

        // Navigate to delivery page
        router.replace('/delivery');
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
      Alert.alert('Error', 'Failed to confirm payment.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text, fontSize: textSize + 6 }]}>Payment</Text>

      <Text style={[styles.label, { color: theme.text, fontSize: textSize }]}>
        Total: ${totalPrice.toFixed(2)} ({quantity} item{quantity > 1 ? 's' : ''} × {rentalDays} day{rentalDays > 1 ? 's' : ''})
      </Text>

      {params.type === 'equipment' && (
        <>
          <Text style={[styles.label, { color: theme.text, fontSize: textSize }]}>Delivery Address</Text>
          <TextInput
            placeholder="1234 Main St, City, Country"
            placeholderTextColor={theme.unselected}
            value={address}
            onChangeText={setAddress}
            style={[styles.input, { borderColor: theme.unselected, color: theme.text, fontSize: textSize }]}
            multiline
          />
        </>
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleConfirm}>
        <Ionicons name="checkmark-circle-outline" size={24} color={theme.background} />
        <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize + 2 }}>Confirm Payment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  label: { marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 24, minHeight: 80, textAlignVertical: 'top' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 14, borderRadius: 32 },
});
