import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { db } from '@/firebase/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function PaymentPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);

  const [address, setAddress] = useState('');
  const pricePerDay = Number(params.pricePerDay) || 0;
  const quantity = Number(params.quantity) || 1;
  const rentalDays = Number(params.rentalDays) || 1;
  const totalPrice = pricePerDay * quantity * rentalDays;

  const handleConfirm = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your delivery address.');
      return;
    }

    try {
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

      router.replace({
        pathname: '/delivery',
        params: {
          name: params.name,
          quantity: quantity.toString(),
          rentalDays: rentalDays.toString(),
          totalPrice: totalPrice.toFixed(2),
          rentalStart: params.rentalStart,
          rentalEnd: params.rentalEnd,
          deliveryAddress: address,
        },
      });
    } catch (err) {
      console.error('Error updating stock:', err);
      Alert.alert('Error', 'Failed to confirm order.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text, fontSize: textSize + 6 }]}>Payment</Text>

      <Text style={[styles.label, { color: theme.text, fontSize: textSize }]}>
        Total: ${totalPrice.toFixed(2)} ({quantity} item{quantity > 1 ? 's' : ''} × {rentalDays} day{rentalDays > 1 ? 's' : ''})
      </Text>

      <Text style={[styles.label, { color: theme.text, fontSize: textSize }]}>Delivery Address</Text>
      <TextInput
        placeholder="1234 Main St, City, Country"
        placeholderTextColor={theme.unselected}
        value={address}
        onChangeText={setAddress}
        style={[styles.input, { borderColor: theme.unselected, color: theme.text, fontSize: textSize }]}
        multiline
      />

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
