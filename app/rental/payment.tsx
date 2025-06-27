import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { addOrderHistory } from '@/utils/userHistory';
import * as SecureStore from 'expo-secure-store';

// --- PAGE PROGRESS BAR ---
function PageProgressBar({ step }: { step: 'order' | 'payment' | 'delivery' }) {
  const { scheme } = useAccessibility();
  const theme = getThemeColors(scheme);
  const isSmallScreen = Dimensions.get('window').width < 400;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: isSmallScreen ? 8 : 16, marginBottom: isSmallScreen ? 8 : 16, maxWidth: 320 }}>
      <MaterialCommunityIcons
        name="clipboard-list-outline"
        size={isSmallScreen ? 32 : 40}
        color={step === 'order' ? theme.primary : theme.unselected}
        style={{ opacity: step === 'order' ? 1 : 0.5 }}
      />
      <View style={{ width: isSmallScreen ? 18 : 32, height: 3, backgroundColor: theme.unselected, marginHorizontal: 4, opacity: 0.5, borderRadius: 2 }} />
      <MaterialCommunityIcons
        name="credit-card-outline"
        size={isSmallScreen ? 32 : 40}
        color={step === 'payment' ? theme.primary : theme.unselected}
        style={{ opacity: step === 'payment' ? 1 : 0.5 }}
      />
      <View style={{ width: isSmallScreen ? 18 : 32, height: 3, backgroundColor: theme.unselected, marginHorizontal: 4, opacity: 0.5, borderRadius: 2 }} />
      <MaterialCommunityIcons
        name="truck"
        size={isSmallScreen ? 32 : 40}
        color={step === 'delivery' ? theme.primary : theme.unselected}
        style={{ opacity: step === 'delivery' ? 1 : 0.5 }}
      />
    </View>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);
  // This would be a real payment link in production
  const paymentUrl = 'https://buy.stripe.com/test_7sI7uQ0wQ0wQ0wQ0w';

  // Add tick button to complete payment
  const handlePaymentComplete = async () => {
    const now = new Date();
    const timestamp = now.toLocaleString();
    const deliveryEta = new Date(now.getTime() + 2 * 60 * 60 * 1000).toLocaleString(); // 2 hours from now
    const username = await SecureStore.getItemAsync('user');
    if (!username) {
      router.replace('/login');
      return;
    }
    try {
      await addOrderHistory(username, {
        id: Date.now().toString(),
        name: params.name as string,
        brand: params.brand as string,
        date: new Date().toISOString().split('T')[0],
        status: 'Ordered',
        amount: params.mode === 'buy' ? Number(params.price) * Number(params.quantity) : Math.max(1, Math.round(Number(params.price) * 0.18)) * Number(params.quantity) * (params.rentalStart && params.rentalEnd ? Math.ceil((new Date(params.rentalEnd as string).getTime() - new Date(params.rentalStart as string).getTime()) / (24 * 60 * 60 * 1000)) : 1),
        quantity: Number(params.quantity),
        mode: params.mode === 'rent' ? 'rent' : 'buy',
        rentalStart: params.mode === 'rent' ? new Date(params.rentalStart as string).toISOString().split('T')[0] : undefined,
        rentalEnd: params.mode === 'rent' ? new Date(params.rentalEnd as string).toISOString().split('T')[0] : undefined,
        image: params.image as string,
      });
    } catch (e) { console.error('Order history save error', e); }
    router.push({
      pathname: '/(tabs)/delivery',
      params: {
        orderTime: timestamp,
        transactionId: Math.random().toString(36).slice(2, 10).toUpperCase(),
        deliveryEta,
      },
    });
  };

  // --- MAIN RETURN ---
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <PageProgressBar step="payment" />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 10) }]}>Complete Your Payment</Text>
      <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(textSize) }]}>Tap the link below to pay securely:</Text>
      <Text style={[styles.link, { color: theme.primary, fontSize: responsiveText(textSize) }]} onPress={() => router.push(paymentUrl)}>
        {paymentUrl}
      </Text>
      <TouchableOpacity
        style={{
          marginTop: 32,
          backgroundColor: theme.primary,
          borderRadius: 32,
          paddingVertical: 16,
          paddingHorizontal: 32,
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          width: '90%',
          maxWidth: 400,
          alignSelf: 'center',
        }}
        onPress={handlePaymentComplete}
        accessibilityLabel="Mark payment as complete and go to delivery"
      >
        <Ionicons name="checkmark-circle" size={32} color={theme.background} />
        <Text style={{ color: theme.background, fontSize: responsiveText(textSize + 4), fontWeight: 'bold' }}>Payment Complete</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
    padding: 8,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  text: {
    fontSize: 18,
    color: '#444',
    marginBottom: 16,
    textAlign: 'center',
  },
  link: {
    fontSize: 18,
    color: '#007AFF',
    textDecorationLine: 'underline',
    marginBottom: 24,
  },
});
