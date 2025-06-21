import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';

export default function DeliveryPage() {
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const screenWidth = Dimensions.get('window').width;
  const params = useLocalSearchParams();
  const orderTime = params.orderTime as string;
  const transactionId = params.transactionId as string;
  const deliveryEta = params.deliveryEta as string;

  // Progress bar step logic
  const [step] = useState(3); // 1: Product, 2: Payment, 3: Delivery
  // Mock order history
  const orderHistory = [
    { id: '1', name: 'Oxygen Concentrator', date: '2025-06-21', status: 'Delivered', amount: 120 },
    { id: '2', name: 'Wheelchair', date: '2025-06-18', status: 'Delivered', amount: 60 },
    { id: '3', name: 'Hospital Bed', date: '2025-06-15', status: 'Returned', amount: 200 },
  ];

  function StepBar() {
    // Responsive step bar: reduce padding and line width for small screens
    const isSmallScreen = screenWidth < 400;
    return (
      <View style={[styles.stepBar, { backgroundColor: theme.background, paddingTop: isSmallScreen ? 12 : 24, paddingBottom: isSmallScreen ? 4 : 12 }]}> 
        <View style={[styles.step, styles.stepActive, { backgroundColor: step === 1 ? theme.primary : theme.background, paddingHorizontal: isSmallScreen ? 4 : 12 }]}> 
          <View style={[styles.stepCircle, { borderColor: theme.primary, width: isSmallScreen ? 18 : 32, height: isSmallScreen ? 18 : 32, borderRadius: isSmallScreen ? 9 : 16, marginRight: isSmallScreen ? 4 : 8 }]}> 
            <Text style={[styles.stepCircleText, { color: step === 1 ? theme.background : theme.primary, fontSize: isSmallScreen ? 11 : 18 }]}>1</Text>
          </View>
          <Text style={[step === 1 ? styles.stepTextActive : styles.stepText, { color: theme.text, fontSize: isSmallScreen ? textSize - 2 : textSize }]}>Product</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.unselected, width: isSmallScreen ? 12 : 32 }]} />
        <View style={[styles.step, { backgroundColor: step === 2 ? theme.primary : theme.background, paddingHorizontal: isSmallScreen ? 4 : 12 }]}> 
          <View style={[styles.stepCircle, { borderColor: theme.primary, width: isSmallScreen ? 18 : 32, height: isSmallScreen ? 18 : 32, borderRadius: isSmallScreen ? 9 : 16, marginRight: isSmallScreen ? 4 : 8 }]}> 
            <Text style={[styles.stepCircleText, { color: step === 2 ? theme.background : theme.primary, fontSize: isSmallScreen ? 11 : 18 }]}>2</Text>
          </View>
          <Text style={[step === 2 ? styles.stepTextActive : styles.stepText, { color: theme.text, fontSize: isSmallScreen ? textSize - 2 : textSize }]}>Payment</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.unselected, width: isSmallScreen ? 12 : 32 }]} />
        <View style={[styles.step, styles.stepActive, { backgroundColor: step === 3 ? theme.primary : theme.background, paddingHorizontal: isSmallScreen ? 4 : 12 }]}> 
          <View style={[styles.stepCircle, { borderColor: theme.primary, width: isSmallScreen ? 18 : 32, height: isSmallScreen ? 18 : 32, borderRadius: isSmallScreen ? 9 : 16, marginRight: isSmallScreen ? 4 : 8 }]}> 
            <Text style={[styles.stepCircleText, { color: step === 3 ? theme.background : theme.primary, fontSize: isSmallScreen ? 11 : 18 }]}>3</Text>
          </View>
          <Text style={[step === 3 ? styles.stepTextActive : styles.stepText, { color: theme.text, fontSize: isSmallScreen ? textSize - 2 : textSize }]}>Delivery</Text>
        </View>
      </View>
    );
  }

  // Responsive text size: scale down for small screens
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  // Prepare marked dates for calendar
  type MarkedDatesType = {
    [date: string]: any;
  };
  const markedDates: MarkedDatesType = {};
  // Highlight deliveryEta
  if (deliveryEta) {
    // Try to extract a valid YYYY-MM-DD date string
    let deliveryKey = '';
    // If deliveryEta is already in YYYY-MM-DD, use it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(deliveryEta)) {
      deliveryKey = deliveryEta;
    } else {
      // Try to parse as Date and convert to YYYY-MM-DD
      const parsed = new Date(deliveryEta);
      if (!isNaN(parsed.getTime())) {
        deliveryKey = parsed.toISOString().split('T')[0];
      }
    }
    if (deliveryKey) {
      markedDates[deliveryKey] = {
        selected: true,
        selectedColor: theme.primary,
        customStyles: {
          text: { color: theme.background, fontWeight: 'bold' },
        },
      };
    }
  }
  // Highlight order history
  orderHistory.forEach(order => {
    if (order.date) {
      markedDates[order.date] = markedDates[order.date] || {};
      markedDates[order.date].marked = true;
      markedDates[order.date].dotColor = '#4CAF50';
    }
  });

  // If mode is 'renew', do not show delivery time
  const isRenew = params.mode === 'renew';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', padding: 24 }}>
      <StepBar />
      <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.unselected }]}> 
        <Ionicons name="car" size={48} color={theme.primary} style={{ marginBottom: 12 }} />
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>Delivery Scheduled</Text>
        <Text style={[styles.label, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>Order Time</Text>
        <Text style={[styles.value, { color: theme.text, fontSize: responsiveText(textSize) }]}>{orderTime}</Text>
        <Text style={[styles.label, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>Transaction ID</Text>
        <Text style={[styles.value, { color: theme.text, fontSize: responsiveText(textSize) }]}>{transactionId}</Text>
        {!isRenew && (
          <>
            <Text style={[styles.label, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>Estimated Delivery</Text>
            <Text style={[styles.value, { color: theme.primary, fontSize: responsiveText(textSize + 2), fontWeight: 'bold' }]}>{deliveryEta}</Text>
          </>
        )}
      </View>
      
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
        onPress={() => router.replace('/explore')}
        accessibilityLabel="Back to explore"
      >
        <Ionicons name="arrow-back" size={28} color={theme.background} />
        <Text style={{ color: theme.background, fontSize: responsiveText(textSize + 2), fontWeight: 'bold' }}>Back to Equipment</Text>
      </TouchableOpacity>

      {/* Delivery Calendar below the back button */}
      <View style={{ marginTop: 32, width: '100%', maxWidth: 400, backgroundColor: theme.unselected, borderRadius: 18, padding: 20, alignItems: 'center' }}>
        <Ionicons name="calendar" size={32} color={theme.primary} style={{ marginBottom: 8 }} />
        <Text style={{ color: theme.text, fontSize: responsiveText(textSize + 2), fontWeight: 'bold', marginBottom: 8 }}>Delivery Calendar</Text>
        <Calendar
          style={{ borderRadius: 12, width: '100%', minWidth: 280, maxWidth: 350 }}
          theme={{
            backgroundColor: theme.unselected,
            calendarBackground: theme.unselected,
            textSectionTitleColor: theme.text,
            selectedDayBackgroundColor: theme.primary,
            selectedDayTextColor: theme.background,
            todayTextColor: theme.primary,
            dayTextColor: theme.text,
            textDisabledColor: '#ccc',
            dotColor: theme.primary,
            arrowColor: theme.primary,
            monthTextColor: theme.text,
            indicatorColor: theme.primary,
          }}
          markedDates={markedDates}
          markingType="custom"
        />
        <Text style={{ color: theme.text, fontSize: responsiveText(textSize), textAlign: 'center', marginTop: 12 }}>
          {isRenew ? 'No delivery for renewal orders.' : 'Your delivery is scheduled for:'}
        </Text>
        {!isRenew && (
          <Text style={{ color: theme.primary, fontSize: responsiveText(textSize + 4), fontWeight: 'bold', marginTop: 8 }}>
            {deliveryEta}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    marginTop: 8,
    fontWeight: '600',
  },
  value: {
    marginBottom: 4,
  },
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
  historyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 8,
  },
});
