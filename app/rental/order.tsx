import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Animated as RNAnimated } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function OrderPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);

  const [quantity, setQuantity] = useState(1);
  const [rentalStart, setRentalStart] = useState(new Date());
  const [rentalEnd, setRentalEnd] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [swipeX] = useState(new Animated.Value(0));
  const [swiped, setSwiped] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const pricePerDay = Number(params.price) || 0;
  const stock = Number(params.stock) || 0;
  const maxQty = Math.max(1, stock);

  const getRentalDays = () => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.ceil((rentalEnd.getTime() - rentalStart.getTime()) / msPerDay);
    return days > 0 ? days : 1;
  };

  const responsiveText = (base: number) => Math.max(base * (SCREEN_WIDTH / 400), base * 0.85);
  const boxBackground = theme.unselectedTab === '#fff' ? '#f0f0f0' : '#e0e0e0';

  let startX = 0;
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20,
    onPanResponderGrant: (_, gestureState) => {
      swipeX.setValue(0);
      startX = gestureState.x0;
    },
    onPanResponderMove: (_, gestureState) => {
      const dx = Math.max(0, Math.min(gestureState.moveX - startX, 260 - 64));
      swipeX.setValue(dx);
      if (dx >= 260 - 64 - 2 && stock > 0 && !swiped) handleSwipe();
    },
    onPanResponderRelease: (_, gestureState) => {
      if (!swiped) {
        const swipeDistance = gestureState.moveX - startX;
        const threshold = 260 - 64 - 10;
        if (swipeDistance >= threshold && stock > 0) handleSwipe();
        else Animated.spring(swipeX, { toValue: 0, useNativeDriver: false }).start();
      }
    },
  });

  function handleSwipe() {
    setSwiped(true);
    setTimeout(() => {
      router.replace({
        pathname: '/rental/payment',
        params: {
          docId: String(params.docId),
          name: String(params.name),
          brand: String(params.brand),
          pricePerDay: String(pricePerDay),
          quantity: String(quantity),
          rentalDays: String(getRentalDays()),
          rentalStart: rentalStart.toISOString(),
          rentalEnd: rentalEnd.toISOString(),
          image: String(params.image),
          description: String(params.description || ''),
        },
      });

    }, 400);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ height: 32 }} />

        {/* Product Info */}
        <View style={[styles.box, { alignItems: 'center', padding: 24, backgroundColor: boxBackground }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Image source={{ uri: params.image as string }} style={styles.image} />
          <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>{params.name}</Text>
          <Text style={[styles.brand, { color: theme.text, fontSize: responsiveText(textSize) }]}>{params.brand}</Text>
          <Text style={[styles.modeBtnText, { color: theme.primary, fontSize: responsiveText(textSize) }]}>
            Rent <Text style={[styles.modePrice, { color: theme.primary, fontSize: responsiveText(textSize - 2) }]}>${pricePerDay}/day</Text>
          </Text>
          <Text style={[styles.stock, { color: theme.text, fontSize: responsiveText(textSize) }]}>Stock: {stock}</Text>
          <Text style={[styles.description, { color: theme.text, fontSize: responsiveText(textSize - 2) }]}>{params.description || 'No description available.'}</Text>
        </View>

        {/* Quantity */}
        <View style={[styles.box, { backgroundColor: boxBackground }]}>
          <View style={styles.qtyRow}>
            <Text style={[styles.qtyLabel, { color: theme.text, fontSize: responsiveText(textSize) }]}>Quantity:</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, { backgroundColor: theme.unselectedTab }, quantity === 1 || stock === 0 ? styles.qtyBtnDisabled : null]}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity === 1 || stock === 0}
            >
              <Text style={[styles.qtyBtnText, { color: theme.text, fontSize: responsiveText(textSize + 2) }]}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.qtyValue, { color: theme.text, fontSize: responsiveText(textSize + 2) }]}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, { backgroundColor: theme.unselectedTab }, quantity === maxQty || stock === 0 ? styles.qtyBtnDisabled : null]}
              onPress={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity === maxQty || stock === 0}
            >
              <Text style={[styles.qtyBtnText, { color: theme.text, fontSize: responsiveText(textSize + 2) }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rental Calendar */}
        <View style={[styles.box, { paddingVertical: 16, backgroundColor: boxBackground }]}>
          <Text style={[styles.calendarLabel, { color: theme.text, fontSize: 16, textAlign: 'center' }]}>Select rental period:</Text>
          <View style={{ flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <TouchableOpacity style={[styles.calendarBtn, { backgroundColor: theme.unselectedTab }]} onPress={() => setShowStart(true)}>
              <Text style={[styles.calendarBtnText, { color: theme.primary, fontSize: 14 }]}>From: {rentalStart.toDateString()}</Text>
            </TouchableOpacity>
            <Text style={[styles.calendarLabel, { color: theme.text, fontSize: 14 }]}>({getRentalDays()} day{getRentalDays() > 1 ? 's' : ''})</Text>
            <TouchableOpacity style={[styles.calendarBtn, { backgroundColor: theme.unselectedTab }]} onPress={() => setShowEnd(true)}>
              <Text style={[styles.calendarBtnText, { color: theme.primary, fontSize: 14 }]}>To: {rentalEnd.toDateString()}</Text>
            </TouchableOpacity>
          </View>
          {showStart && (
            <DateTimePicker
              value={rentalStart}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => { if (date) { setRentalStart(date); if (date > rentalEnd) setRentalEnd(date); } setShowStart(false); }}
              minimumDate={new Date()}
            />
          )}
          {showEnd && (
            <DateTimePicker
              value={rentalEnd}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => { if (date && date >= rentalStart) setRentalEnd(date); setShowEnd(false); }}
              minimumDate={rentalStart}
            />
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderColor: theme.unselected }]}>
        <View style={styles.totalPriceBox}>
          <Text style={[styles.totalPriceLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 4) }]}>Total</Text>
          <Text style={[styles.totalPrice, { color: theme.text, fontSize: responsiveText(textSize + 4) }]}>
            ${(pricePerDay * quantity * getRentalDays()).toFixed(2)}
          </Text>
        </View>
        <View style={styles.swipeContainerCentered}>
          <Text style={[styles.swipeLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>Swipe to Order</Text>
          <View style={[styles.swipeTrack, { backgroundColor: theme.unselectedTab }]} {...(stock > 0 ? panResponder.panHandlers : {})}>
            <RNAnimated.View style={[styles.swipeThumb, { backgroundColor: stock === 0 ? theme.unselectedTab : theme.primary }, { transform: [{ translateX: swipeX }] }, swiped && { backgroundColor: '#4CAF50' }]}>
              <Text style={[styles.swipeThumbText, { fontSize: responsiveText(textSize + 10) }]}>{swiped ? '✓' : '→'}</Text>
            </RNAnimated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  box: { marginHorizontal: 16, marginVertical: 8, borderRadius: 12, padding: 16 },
  backButton: { alignSelf: 'flex-start', marginBottom: 16, padding: 0, borderRadius: 0, backgroundColor: 'transparent' },
  image: { width: 240, height: 240, borderRadius: 16, marginBottom: 20, backgroundColor: '#eee' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  brand: { fontSize: 20, marginBottom: 8, textAlign: 'center' },
  modeBtnText: { fontSize: 18, fontWeight: 'bold' },
  modePrice: { fontSize: 16, fontWeight: 'normal' },
  stock: { fontSize: 18, marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  qtyLabel: { fontSize: 18, marginRight: 10 },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  qtyBtnDisabled: { backgroundColor: '#ddd' },
  qtyBtnText: { fontSize: 22 },
  qtyValue: { fontSize: 20, fontWeight: 'bold', minWidth: 32, textAlign: 'center' },
  calendarLabel: { fontSize: 16, marginBottom: 4 },
  calendarBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginHorizontal: 4 },
  calendarBtnText: { fontSize: 16 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 40, paddingTop: 8, borderTopWidth: 1, paddingHorizontal: 24 },
  totalPriceBox: { alignItems: 'flex-start', justifyContent: 'flex-end', flex: 1, marginBottom: 8 },
  totalPriceLabel: { fontSize: 14, marginBottom: 2 },
  totalPrice: { fontSize: 22, fontWeight: 'bold' },
  swipeContainerCentered: { flex: 2, alignItems: 'center', justifyContent: 'flex-end', marginLeft: 0 },
  swipeLabel: { fontSize: 16, marginBottom: 8 },
  swipeTrack: { width: 260, height: 64, borderRadius: 32, justifyContent: 'center', overflow: 'hidden' },
  swipeThumb: { position: 'absolute', left: 0, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  swipeThumbText: { fontWeight: 'bold' },
});
