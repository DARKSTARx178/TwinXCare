import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    Dimensions,
    LayoutAnimation,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function DeliveryPage() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
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
      // Merge history and booking arrays into one timeline
      const combined = [
        ...(data.history || []).map((h: any) => ({ ...h, type: 'order' })),
        ...(data.booking || []).map((b: any) => ({ ...b, type: 'booking' })),
      ];
      // Sort by createdAt (if exists), else leave as is
      combined.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
      setOrderHistory(combined);
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

  const latest = orderHistory.length > 0 ? orderHistory[0] : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      {/* Top card (different for booking vs order) */}
      {latest && latest.type === 'order' && (
        <View style={[cardStyle(theme), { width: '90%', alignSelf: 'center' }]}>
          <Ionicons name="car" size={48} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>
            Delivery Scheduled
          </Text>

          <Text style={[labelStyle(theme), { fontSize: responsiveText(textSize - 2) }]}>Order Time</Text>
          <Text style={[valueStyle(theme), { fontSize: responsiveText(textSize) }]}>{latest.orderTime || 'N/A'}</Text>

          <Text style={[labelStyle(theme), { fontSize: responsiveText(textSize - 2) }]}>Transaction ID</Text>
          <Text style={[valueStyle(theme), { fontSize: responsiveText(textSize) }]}>{latest.transactionId || 'N/A'}</Text>

          {!latest.isRenew && (
            <>
              <Text style={[labelStyle(theme), { fontSize: responsiveText(textSize - 2) }]}>Delivery Details</Text>
              <Text style={[etaStyle(theme), { fontSize: responsiveText(textSize + 2) }]}>{latest.deliveryEta || 'N/A'}</Text>
            </>
          )}
        </View>
      )}

      {latest && latest.type === 'booking' && (
        <View style={[cardStyle(theme), { width: '90%', alignSelf: 'center' }]}>
          <Ionicons name="calendar" size={48} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>
            Booking Success
          </Text>

          <Text style={[labelStyle(theme), { fontSize: responsiveText(textSize - 2) }]}>Service</Text>
          <Text style={[valueStyle(theme), { fontSize: responsiveText(textSize) }]}>{latest.title || 'N/A'}</Text>

          <Text style={[labelStyle(theme), { fontSize: responsiveText(textSize - 2) }]}>Date</Text>
          <Text style={[valueStyle(theme), { fontSize: responsiveText(textSize) }]}>{latest.bookingDate || 'N/A'}</Text>

          <Text style={[labelStyle(theme), { fontSize: responsiveText(textSize - 2) }]}>Time</Text>
          <Text style={[valueStyle(theme), { fontSize: responsiveText(textSize) }]}>{latest.timeSlot || 'N/A'}</Text>

          <Text style={[labelStyle(theme), { fontSize: responsiveText(textSize - 2) }]}>Description</Text>
          <Text style={[valueStyle(theme), { fontSize: responsiveText(textSize) }]}>{latest.description || 'N/A'}</Text>
        </View>
      )}

      {/* Back button */}
      <TouchableOpacity style={[buttonStyle(theme)]} onPress={() => router.replace('/(tabs)')}>
        <Ionicons name="arrow-back" size={28} color={theme.background} />
        <Text style={{ color: theme.background, fontSize: responsiveText(textSize + 2), fontWeight: 'bold' }}>
          Back to Home
        </Text>
      </TouchableOpacity>

      {/* History section */}
      <Text style={{ color: theme.text, fontSize: responsiveText(textSize + 4), fontWeight: 'bold', marginTop: 32, marginBottom: 8 }}>     History</Text>

      {!user ? (
        <Text style={{ color: theme.unselected, fontSize: textSize }}>      Sign in to see history.</Text>
      ) : orderHistory.length === 0 ? (
        <Text style={{ color: theme.unselected, fontSize: textSize }}>      No records yet.</Text>
      ) : (
        orderHistory.map((entry, idx) => {
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
                {entry.type === 'order'
                  ? `${entry.name} x${entry.quantity}`
                  : `Booking: ${entry.title}`}
              </Text>

              {expanded && (
                <View style={{ marginTop: 8 }}>
                  {entry.type === 'order' ? (
                    <>
                      {entry.rentalStart && entry.rentalEnd && (
                        <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                          Rental: {entry.rentalStart} - {entry.rentalEnd}
                        </Text>
                      )}
                      <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                        Amount: ${entry.totalPrice}
                      </Text>
                      <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                        Transaction ID: {entry.transactionId}
                      </Text>
                      <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                        Delivery Address: {entry.deliveryAddress}
                      </Text>
                      {entry.deliveryEta && (
                        <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                          Delivery ETA: {entry.deliveryEta}
                        </Text>
                      )}
                      <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                        Status: {entry.status}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                        Date: {entry.bookingDate}
                      </Text>
                      <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                        Time: {entry.timeSlot}
                      </Text>
                      <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
                        Description: {entry.description}
                      </Text>
                    </>
                  )}
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
