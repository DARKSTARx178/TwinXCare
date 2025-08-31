import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { getThemeColors } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  UIManager,
  Platform,
  RefreshControl,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function DeliveryPage() {
  const router = useRouter();
  const theme = getThemeColors();
  const textSize = getFontSizeValue('medium');
  const screenWidth = Dimensions.get('window').width;

  const [user, setUser] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const responsiveText = (base: number) =>
    Math.max(base * (screenWidth / 400), base * 0.85);

  const fetchUserHistory = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setUser(currentUser);

    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      setOrderHistory([...data.history || []].reverse());
    }
  };

  useEffect(() => {
    fetchUserHistory();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserHistory();
    setRefreshing(false);
  }, []);

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newSet = new Set(expandedOrders);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setExpandedOrders(newSet);
  };

  const latestOrder = orderHistory.length > 0 ? orderHistory[0] : null;
  const orderTime = latestOrder?.orderTime || 'N/A';
  const transactionId = latestOrder?.transactionId || 'N/A';
  const deliveryEta = latestOrder?.deliveryEta || 'N/A';
  const isRenew = latestOrder?.isRenew || false;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      {/* Delivery Scheduled card */}
      <View style={[cardStyle(theme), { width: '90%', alignSelf: 'center' }]}>
        <Ionicons name="car" size={48} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>
          Delivery Scheduled
        </Text>

        <Text style={[labelStyle(theme), { fontSize: responsiveText(textSize - 2) }]}>Order Time</Text>
        <Text style={[valueStyle(theme), { fontSize: responsiveText(textSize) }]}>{orderTime}</Text>

        <Text style={[labelStyle(theme), { fontSize: responsiveText(textSize - 2) }]}>Transaction ID</Text>
        <Text style={[valueStyle(theme), { fontSize: responsiveText(textSize) }]}>{transactionId}</Text>

        {!isRenew && (
          <>
            <Text style={[labelStyle(theme), { fontSize: responsiveText(textSize - 2) }]}>Estimated Delivery</Text>
            <Text style={[etaStyle(theme), { fontSize: responsiveText(textSize + 2) }]}>{deliveryEta}</Text>
          </>
        )}
      </View>

      {/* Back button */}
      <TouchableOpacity style={[buttonStyle(theme)]} onPress={() => router.replace('/(tabs)')}>
        <Ionicons name="arrow-back" size={28} color={theme.background} />
        <Text style={{ color: theme.background, fontSize: responsiveText(textSize + 2), fontWeight: 'bold' }}>
          Back to Home
        </Text>
      </TouchableOpacity>

      {/* Order History */}
      <Text style={{ color: theme.text, fontSize: responsiveText(textSize + 4), fontWeight: 'bold', marginTop: 32, marginBottom: 8 }}>    History</Text>

      {!user ? (
        <Text style={{ color: theme.unselected, fontSize: textSize }}>Sign in to see history.</Text>
      ) : orderHistory.length === 0 ? (
        <Text style={{ color: theme.unselected, fontSize: textSize }}>No orders yet.</Text>
      ) : (
        orderHistory.map((order, idx) => {
          const expanded = expandedOrders.has(idx);
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => toggleExpand(idx)}
              style={{
                backgroundColor: theme.unselectedTab,
                borderRadius: 12,
                padding: 16,
                marginVertical: 8,
                width: '90%',
                alignSelf: 'center',
              }}
            >
              <Text style={{ color: theme.text, fontSize: responsiveText(textSize), fontWeight: 'bold' }}>
                {order.name} x{order.quantity}
              </Text>

              {expanded && (
                <View style={{ marginTop: 8 }}>
                  {order.rentalStart && order.rentalEnd && (
                    <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                      Rental: {order.rentalStart} - {order.rentalEnd}
                    </Text>
                  )}
                  <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                    Amount: ${order.totalPrice}
                  </Text>
                  <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                    Transaction ID: {order.transactionId}
                  </Text>
                  <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                    Delivery Address: {order.deliveryAddress}
                  </Text>
                  {order.deliveryEta && (
                    <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                      Delivery ETA: {order.deliveryEta}
                    </Text>
                  )}
                  <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                    Status: {order.status}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const cardStyle = (theme: Record<string, any>) => ({
  backgroundColor: theme.background,
  borderColor: theme.unselected,
  borderWidth: 1,
  borderRadius: 24,
  padding: 24,
  alignItems: 'center' as const,
  marginBottom: 32,
});

const buttonStyle = (theme: any) => ({
  backgroundColor: theme.primary,
  borderRadius: 32,
  paddingVertical: 16,
  paddingHorizontal: 32,
  flexDirection: 'row' as const,
  alignItems: 'center' as 'center',
  gap: 12,
  marginTop: 32,
  width: '90%' as unknown as number,
  alignSelf: 'center' as const,
});

const styles = StyleSheet.create({
  title: { fontWeight: 'bold', marginVertical: 16 },
});

const labelStyle = (theme: Record<string, any>) => ({
  color: theme.unselected,
  fontWeight: '600' as const,
  marginTop: 12,
});

const valueStyle = (theme: Record<string, any>) => ({
  color: theme.text,
  marginBottom: 8,
});

const etaStyle = (theme: Record<string, any>) => ({
  color: theme.primary,
  fontWeight: 'bold' as const,
  marginBottom: 8,
});
