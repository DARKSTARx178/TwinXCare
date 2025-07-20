import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import * as SecureStore from 'expo-secure-store';

import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useLanguage } from '../../hooks/useLanguage';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { getOrderHistory, addOrderToHistory, OrderHistoryItem } from '@/utils/userHistory';

export default function DeliveryPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const screenWidth = Dimensions.get('window').width;

  const params = useLocalSearchParams();
  const orderTime = params.orderTime as string;
  const transactionId = params.transactionId as string;
  const deliveryEta = params.deliveryEta as string;
  const isRenew = params.mode === 'renew';

  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const username = await SecureStore.getItemAsync('user');
      setUser(username);

      if (username) {
        const newOrder: OrderHistoryItem = {
          id: Date.now().toString(),
          name: (params.name as string) || 'Unknown Device',
          brand: (params.brand as string) || '',
          image: (params.image as string) || undefined,
          amount: parseFloat(params.amount as string) || 0,
          quantity: parseFloat(params.quantity as string) || 1,
          date: new Date().toISOString().split('T')[0],
          status: 'Scheduled',
          mode: (params.mode as 'rent' | 'renew' | 'buy') || 'rent',
          rentalStart: (params.rentalStart as string) || '',
          rentalEnd: (params.rentalEnd as string) || '',
        };

        await addOrderToHistory(username, newOrder);
        const history = await getOrderHistory(username);
        setOrderHistory(history);
      }
    })();
  }, []);

  const markedDates: { [key: string]: any } = {};
  if (deliveryEta) {
    let deliveryKey = '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(deliveryEta)) {
      deliveryKey = deliveryEta;
    } else {
      const parsed = new Date(deliveryEta);
      if (!isNaN(parsed.getTime())) {
        deliveryKey = parsed.toISOString().split('T')[0];
      }
    }
    if (deliveryKey) {
      markedDates[deliveryKey] = {
        selected: true,
        selectedColor: theme.primary,
      };
    }
  }

  orderHistory.forEach(order => {
    if (order.date) {
      markedDates[order.date] = markedDates[order.date] || {};
      markedDates[order.date].marked = true;
      markedDates[order.date].dotColor = '#4CAF50';
    }
  });

  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.card(theme), { width: '90%', alignSelf: 'center' }]}>
        <Ionicons name="car" size={48} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>
          {lang === 'zh' ? '已安排配送' : 'Delivery Scheduled'}
        </Text>

        <Text style={[styles.label(theme), { fontSize: responsiveText(textSize - 2) }]}>
          {lang === 'zh' ? '下单时间' : 'Order Time'}
        </Text>
        <Text style={[styles.value(theme), { fontSize: responsiveText(textSize) }]}>{orderTime}</Text>

        <Text style={[styles.label(theme), { fontSize: responsiveText(textSize - 2) }]}>
          {lang === 'zh' ? '交易编号' : 'Transaction ID'}
        </Text>
        <Text style={[styles.value(theme), { fontSize: responsiveText(textSize) }]}>{transactionId}</Text>

        {!isRenew && (
          <>
            <Text style={[styles.label(theme), { fontSize: responsiveText(textSize - 2) }]}>
              {lang === 'zh' ? '预计送达' : 'Estimated Delivery'}
            </Text>
            <Text style={[styles.eta(theme), { fontSize: responsiveText(textSize + 2) }]}>{deliveryEta}</Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button(theme)]}
        onPress={() => router.replace('/(tabs)')}
        accessibilityLabel={lang === 'zh' ? '返回设备' : 'Back to home'}
      >
        <Ionicons name="arrow-back" size={28} color={theme.background} />
        <Text style={{ color: theme.background, fontSize: responsiveText(textSize + 2), fontWeight: 'bold' }}>
          {lang === 'zh' ? '返回设备' : 'Back to Home'}
        </Text>
      </TouchableOpacity>

      <View style={[styles.calendarCard(theme)]}>
        <Ionicons name="calendar" size={32} color={theme.primary} />
        <Text style={[styles.calendarTitle(theme), { fontSize: responsiveText(textSize + 2) }]}>
          {lang === 'zh' ? '配送日历' : 'Delivery Calendar'}
        </Text>
        <Calendar
          style={{ borderRadius: 12, width: '100%', maxWidth: 350 }}
          markedDates={markedDates}
          markingType="custom"
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
        />
        <Text style={{ color: theme.text, fontSize: responsiveText(textSize), marginTop: 12 }}>
          {isRenew
            ? lang === 'zh'
              ? '续租订单无需配送。'
              : 'No delivery required for renewal orders.'
            : lang === 'zh'
              ? '您的配送安排在：'
              : 'Your delivery is scheduled for:'}
        </Text>
        {!isRenew && (
          <Text style={{ color: theme.primary, fontSize: responsiveText(textSize + 4), fontWeight: 'bold' }}>
            {deliveryEta}
          </Text>
        )}
      </View>

      <View style={{ width: '100%', marginTop: 32, paddingHorizontal: 16 }}>
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
            <View key={order.id} style={[styles.historyCard(theme)]}>
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
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize }}>
                    {order.amount != null ? `$${order.amount.toFixed(2)}` : '$0.00'}
                  </Text>
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
  line: theme => ({
    flex: 1,
    height: 3,
    backgroundColor: theme.unselected,
    marginHorizontal: 4,
    borderRadius: 2,
  }),
  card: theme => ({
    backgroundColor: theme.background,
    borderColor: theme.unselected,
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  }),
  title: {
    fontWeight: 'bold',
    marginVertical: 16,
  },
  label: theme => ({
    marginTop: 8,
    color: theme.unselected,
    fontWeight: '600',
  }),
  value: theme => ({
    color: theme.text,
    marginBottom: 4,
  }),
  eta: theme => ({
    color: theme.primary,
    fontWeight: 'bold',
    marginTop: 4,
  }),
  button: theme => ({
    backgroundColor: theme.primary,
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
    width: '90%',
    alignSelf: 'center',
  }),
  calendarCard: theme => ({
    backgroundColor: theme.unselected,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginTop: 32,
    width: '90%',
    alignSelf: 'center',
  }),
  calendarTitle: theme => ({
    color: theme.text,
    fontWeight: 'bold',
    marginVertical: 8,
  }),
  historyCard: theme => ({
    backgroundColor: theme.unselected,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  }),
});
