import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import StepBar from order page
import OrderPage from './order';

export default function PaymentPage() {
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);
  // This would be a real payment link in production
  const paymentUrl = 'https://buy.stripe.com/test_7sI7uQ0wQ0wQ0wQ0w';

  // StepBar for Product > Payment > Delivery
  function StepBar() {
    // Responsive step bar: reduce padding and line width for small screens
    const isSmallScreen = screenWidth < 400;
    return (
      <View style={[styles.stepBar, { backgroundColor: theme.background, paddingTop: isSmallScreen ? 12 : 24, paddingBottom: isSmallScreen ? 4 : 12 }]}> 
        <View style={[styles.step, { backgroundColor: theme.background, paddingHorizontal: isSmallScreen ? 4 : 12 }]}> 
          <View style={[styles.stepCircle, { borderColor: theme.primary, width: isSmallScreen ? 18 : 32, height: isSmallScreen ? 18 : 32, borderRadius: isSmallScreen ? 9 : 16, marginRight: isSmallScreen ? 4 : 8 }]}> 
            <Text style={[styles.stepCircleText, { color: theme.primary, fontSize: isSmallScreen ? 11 : 18 }]}>1</Text>
          </View>
          <Text style={[styles.stepText, { color: theme.text, fontSize: isSmallScreen ? responsiveText(textSize - 2) : responsiveText(textSize) } ]}>Product</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.unselected, width: isSmallScreen ? 12 : 32 }]} />
        <View style={[styles.step, styles.stepActive, { backgroundColor: theme.primary, paddingHorizontal: isSmallScreen ? 4 : 12 }]}> 
          <View style={[styles.stepCircle, { borderColor: theme.primary, width: isSmallScreen ? 18 : 32, height: isSmallScreen ? 18 : 32, borderRadius: isSmallScreen ? 9 : 16, marginRight: isSmallScreen ? 4 : 8 }]}> 
            <Text style={[styles.stepCircleText, { color: theme.background, fontSize: isSmallScreen ? 11 : 18 }]}>2</Text>
          </View>
          <Text style={[styles.stepTextActive, { color: theme.text, fontSize: isSmallScreen ? responsiveText(textSize - 2) : responsiveText(textSize) }]}>Payment</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.unselected, width: isSmallScreen ? 12 : 32 }]} />
        <View style={[styles.step, { backgroundColor: theme.background, paddingHorizontal: isSmallScreen ? 4 : 12 }]}> 
          <View style={[styles.stepCircle, { borderColor: theme.primary, width: isSmallScreen ? 18 : 32, height: isSmallScreen ? 18 : 32, borderRadius: isSmallScreen ? 9 : 16, marginRight: isSmallScreen ? 4 : 8 }]}> 
            <Text style={[styles.stepCircleText, { color: theme.primary, fontSize: isSmallScreen ? 11 : 18 }]}>3</Text>
          </View>
          <Text style={[styles.stepText, { color: theme.text, fontSize: isSmallScreen ? responsiveText(textSize - 2) : responsiveText(textSize) }]}>Delivery</Text>
        </View>
      </View>
    );
  }

  // Add tick button to complete payment
  const handlePaymentComplete = () => {
    const now = new Date();
    const timestamp = now.toLocaleString();
    const deliveryEta = new Date(now.getTime() + 2 * 60 * 60 * 1000).toLocaleString(); // 2 hours from now
    router.push({
      pathname: '/(tabs)/delivery',
      params: {
        orderTime: timestamp,
        transactionId: Math.random().toString(36).slice(2, 10).toUpperCase(),
        deliveryEta,
      },
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', padding: 24 }}>
      <StepBar />
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
  // Step bar styles (copied from order.tsx, adjust as needed)
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepActive: {
    borderRadius: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepCircleText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  stepText: {
    fontSize: 16,
    color: '#888',
  },
  stepTextActive: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: '#ccc',
    marginHorizontal: 2,
  },
});
