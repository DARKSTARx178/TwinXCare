import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useLanguage } from '../../hooks/useLanguage';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { getOrderHistory, OrderHistoryItem } from '@/utils/userHistory';
import * as SecureStore from 'expo-secure-store';

export default function DeliveryPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const screenWidth = Dimensions.get('window').width;
  const params = useLocalSearchParams();
  const orderTime = params.orderTime as string;
  const transactionId = params.transactionId as string;
  const deliveryEta = params.deliveryEta as string;

  // Progress bar step logic
  const [step] = useState(3); // 1: Product, 2: Payment, 3: Delivery
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const username = await SecureStore.getItemAsync('user');
      setUser(username);
      if (username) {
        const history = await getOrderHistory(username);
        setOrderHistory(history);
      } else {
        setOrderHistory([]);
      }
    })();
  }, []);

  // --- PAGE PROGRESS BAR ---
  function PageProgressBar({ step }: { step: 'order' | 'payment' | 'delivery' }) {
    const isSmallScreen = screenWidth < 400;
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: isSmallScreen ? 8 : 16, marginBottom: isSmallScreen ? 8 : 16, width: '90%', maxWidth: 350, minWidth: 220 }}>
        <MaterialCommunityIcons
          name="clipboard-list-outline"
          size={isSmallScreen ? 32 : 40}
          color={step === 'order' ? theme.primary : theme.unselected}
          style={{ opacity: step === 'order' ? 1 : 0.5, flex: 1, textAlign: 'center' }}
        />
        <View style={{ flex: 1, height: 3, backgroundColor: theme.unselected, marginHorizontal: 4, opacity: 0.5, borderRadius: 2, alignSelf: 'center' }} />
        <MaterialCommunityIcons
          name="credit-card-outline"
          size={isSmallScreen ? 32 : 40}
          color={step === 'payment' ? theme.primary : theme.unselected}
          style={{ opacity: step === 'payment' ? 1 : 0.5, flex: 1, textAlign: 'center' }}
        />
        <View style={{ flex: 1, height: 3, backgroundColor: theme.unselected, marginHorizontal: 4, opacity: 0.5, borderRadius: 2, alignSelf: 'center' }} />
        <MaterialCommunityIcons
          name="truck"
          size={isSmallScreen ? 32 : 40}
          color={step === 'delivery' ? theme.primary : theme.unselected}
          style={{ opacity: step === 'delivery' ? 1 : 0.5, flex: 1, textAlign: 'center' }}
        />
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
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <PageProgressBar step="delivery" />
      <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.unselected, width: '90%', maxWidth: 400, alignSelf: 'center' }]}> 
        <Ionicons name="car" size={48} color={theme.primary} style={{ marginBottom: 12 }} />
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>
          {lang === 'zh' ? '已安排配送' : 'Delivery Scheduled'}
        </Text>
        <Text style={[styles.label, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>
          {lang === 'zh' ? '下单时间' : 'Order Time'}
        </Text>
        <Text style={[styles.value, { color: theme.text, fontSize: responsiveText(textSize) }]}>{orderTime}</Text>
        <Text style={[styles.label, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>
          {lang === 'zh' ? '交易编号' : 'Transaction ID'}
        </Text>
        <Text style={[styles.value, { color: theme.text, fontSize: responsiveText(textSize) }]}>{transactionId}</Text>
        {!isRenew && (
          <>
            <Text style={[styles.label, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>
              {lang === 'zh' ? '预计送达' : 'Estimated Delivery'}
            </Text>
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
          width: '90%',
          maxWidth: 400,
          alignSelf: 'center',
        }}
        onPress={() => router.replace('/explore')}
        accessibilityLabel={lang === 'zh' ? '返回设备' : 'Back to explore'}
      >
        <Ionicons name="arrow-back" size={28} color={theme.background} />
        <Text style={{ color: theme.background, fontSize: responsiveText(textSize + 2), fontWeight: 'bold' }}>
          {lang === 'zh' ? '返回设备' : 'Back to Explore'}
        </Text>
      </TouchableOpacity>

      {/* Delivery Calendar below the back button */}
      <View style={{ marginTop: 32, width: '90%', maxWidth: 400, alignSelf: 'center', backgroundColor: theme.unselected, borderRadius: 18, padding: 20, alignItems: 'center' }}>
        <Ionicons name="calendar" size={32} color={theme.primary} style={{ marginBottom: 8 }} />
        <Text style={{ color: theme.text, fontSize: responsiveText(textSize + 2), fontWeight: 'bold', marginBottom: 8 }}>
          {lang === 'zh' ? '配送日历' : 'Delivery Calendar'}
        </Text>
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
          {isRenew
            ? lang === 'zh'
              ? '续租订单无需配送。'
              : 'No delivery required for renewal orders.'
            : lang === 'zh'
              ? '您的配送安排在：'
              : 'Your delivery is scheduled for:'}
        </Text>
        {!isRenew && (
          <Text style={{ color: theme.primary, fontSize: responsiveText(textSize + 4), fontWeight: 'bold', marginTop: 8 }}>
            {deliveryEta}
          </Text>
        )}
      </View>

      {/* Order History Section */}
      <View style={{ width: '100%', marginTop: 32 }}>
        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize + 4, marginBottom: 12 }}>
          {lang === 'zh' ? '订单历史' : 'Order History'}
        </Text>
        {!user ? (
          <Text style={{ color: theme.unselected, fontSize: textSize }}>
            {lang === 'zh' ? '请登录以查看订单历史。' : 'Please log in to view order history.'}
          </Text>
        ) : orderHistory.length === 0 ? (
          <Text style={{ color: theme.unselected, fontSize: textSize }}>
            {lang === 'zh' ? '暂无订单。' : 'No orders yet.'}
          </Text>
        ) : (
          orderHistory.map(order => (
            <View key={order.id} style={[styles.historyCard, { backgroundColor: theme.unselected }]}> 
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {order.image ? (
                  <Image source={{ uri: order.image }} style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12 }} />
                ) : (
                  <Ionicons name="cube" size={36} color={theme.primary} style={{ marginRight: 12 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize + 2 }}>{order.name}</Text>
                  <Text style={{ color: theme.text, fontSize: textSize - 2 }}>{order.brand}</Text>
                  <Text style={{ color: theme.unselected, fontSize: textSize - 2 }}>{order.date}</Text>
                  <Text style={{ color: theme.primary, fontSize: textSize - 2 }}>{order.status}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize }}>${order.amount.toFixed(2)}</Text>
                  <Text style={{ color: theme.text, fontSize: textSize - 2 }}>
                    {lang === 'zh' ? `数量: ${order.quantity}` : `Qty: ${order.quantity}`}
                  </Text>
                  {order.mode === 'rent' && (
                    <Text style={{ color: theme.text, fontSize: textSize - 2 }}>
                      {lang === 'zh'
                        ? `租期: ${order.rentalStart} - ${order.rentalEnd}`
                        : `Rental: ${order.rentalStart} - ${order.rentalEnd}`}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))
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
