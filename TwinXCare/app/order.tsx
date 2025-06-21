import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Animated, PanResponder, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function OrderPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState<'buy' | 'rent'>('buy');
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [rentalStart, setRentalStart] = useState(new Date());
  const [rentalEnd, setRentalEnd] = useState(new Date(Date.now() + 24*60*60*1000));
  const price = Number(params.price) || 0;
  const rentPrice = Math.max(1, Math.round(price * 0.18));
  const stock = Number(params.stock) || 0;
  const maxQty = Math.max(1, stock);
  const [swipeX] = useState(new Animated.Value(0));
  const [swiped, setSwiped] = useState(false);

  // Helper to get number of days between rentalStart and rentalEnd
  const getRentalDays = () => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.ceil((rentalEnd.getTime() - rentalStart.getTime()) / msPerDay);
    return days > 0 ? days : 1;
  };

  // Swipe to order logic
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20,
    onPanResponderMove: Animated.event([
      null,
      { dx: swipeX },
    ], { useNativeDriver: false }),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > SCREEN_WIDTH * 0.35 && stock > 0) { // Lowered threshold for reliability
        setSwiped(true);
        setTimeout(() => {
          router.replace('/payment');
        }, 400);
      } else {
        Animated.spring(swipeX, { toValue: 0, useNativeDriver: false }).start();
      }
    },
  });

  // Step bar with numbers and delivery step
  function StepBar() {
    // Responsive step bar: reduce padding and line width for small screens
    const isSmallScreen = SCREEN_WIDTH < 400;
    return (
      <View style={[styles.stepBar, { backgroundColor: theme.background, paddingTop: isSmallScreen ? 12 : 24, paddingBottom: isSmallScreen ? 4 : 12 }]}> 
        <View style={[styles.step, styles.stepActive, { backgroundColor: theme.primary, paddingHorizontal: isSmallScreen ? 4 : 12 }]}> 
          <View style={[styles.stepCircle, { borderColor: theme.primary, width: isSmallScreen ? 18 : 24, height: isSmallScreen ? 18 : 24, borderRadius: isSmallScreen ? 9 : 12 }]}> 
            <Text style={[styles.stepCircleText, { color: theme.background, fontSize: isSmallScreen ? 11 : 14 }]}>1</Text>
          </View>
          <Text style={[styles.stepTextActive, { color: theme.text, fontSize: isSmallScreen ? textSize - 2 : textSize } ]}>Product</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.unselected, width: isSmallScreen ? 16 : 32 }]} />
        <View style={[styles.step, { backgroundColor: theme.background, paddingHorizontal: isSmallScreen ? 4 : 12 }]}> 
          <View style={[styles.stepCircle, { borderColor: theme.primary, width: isSmallScreen ? 18 : 24, height: isSmallScreen ? 18 : 24, borderRadius: isSmallScreen ? 9 : 12 }]}> 
            <Text style={[styles.stepCircleText, { color: theme.primary, fontSize: isSmallScreen ? 11 : 14 }]}>2</Text>
          </View>
          <Text style={[styles.stepText, { color: theme.text, fontSize: isSmallScreen ? textSize - 2 : textSize }]}>Delivery</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.unselected, width: isSmallScreen ? 16 : 32 }]} />
        <View style={[styles.step, { backgroundColor: theme.background, paddingHorizontal: isSmallScreen ? 4 : 12 }]}> 
          <View style={[styles.stepCircle, { borderColor: theme.primary, width: isSmallScreen ? 18 : 24, height: isSmallScreen ? 18 : 24, borderRadius: isSmallScreen ? 9 : 12 }]}> 
            <Text style={[styles.stepCircleText, { color: theme.primary, fontSize: isSmallScreen ? 11 : 14 }]}>3</Text>
          </View>
          <Text style={[styles.stepText, { color: theme.text, fontSize: isSmallScreen ? textSize - 2 : textSize }]}>Payment</Text>
        </View>
      </View>
    );
  }

  // Simple back arrow, no background
  function BackButton() {
    return (
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>
    );
  }

  // Rental calendar with start and end date
  function RentalCalendar() {
    const rentalDays = getRentalDays();
    return (
      <View style={styles.calendarBox}>
        <Text style={[styles.calendarLabel, { color: theme.text, fontSize: textSize }]}>Select rental period:</Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <TouchableOpacity style={[styles.calendarBtn, { backgroundColor: theme.unselected }]} onPress={() => setShowStartDate(true)}>
            <Text style={[styles.calendarBtnText, { color: theme.primary, fontSize: textSize - 2 }]}>From: {rentalStart.toDateString()}</Text>
          </TouchableOpacity>
          <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={[styles.calendarLabel, { color: theme.text, fontSize: textSize - 2 }]}>({rentalDays} day{rentalDays > 1 ? 's' : ''})</Text>
          </View>
          <TouchableOpacity style={[styles.calendarBtn, { backgroundColor: theme.unselected }]} onPress={() => setShowEndDate(true)}>
            <Text style={[styles.calendarBtnText, { color: theme.primary, fontSize: textSize - 2 }]}>To: {rentalEnd.toDateString()}</Text>
          </TouchableOpacity>
        </View>
        {showStartDate && (
          <DateTimePicker
            value={rentalStart}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, date) => {
              setShowStartDate(false);
              if (date) {
                setRentalStart(date);
                if (date > rentalEnd) setRentalEnd(date);
              }
            }}
            minimumDate={new Date()}
          />
        )}
        {showEndDate && (
          <DateTimePicker
            value={rentalEnd}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, date) => {
              setShowEndDate(false);
              if (date && date >= rentalStart) setRentalEnd(date);
            }}
            minimumDate={rentalStart}
          />
        )}
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <StepBar />
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <BackButton />
        <Image source={{ uri: params.image as string }} style={styles.image} />
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>{params.name}</Text>
        <Text style={[styles.brand, { color: theme.text, fontSize: responsiveText(textSize) }]}>{params.brand}</Text>
        {/* Buy/Rent selector */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: mode === 'buy' ? theme.primary : theme.unselected }]}
            onPress={() => setMode('buy')}
          >
            <Text style={[styles.modeBtnText, { color: mode === 'buy' ? theme.background : theme.text, fontSize: responsiveText(textSize) }]}>Buy
              <Text style={[styles.modePrice, { color: mode === 'buy' ? theme.background : theme.text, fontSize: responsiveText(textSize - 2) }]}>  ${price.toFixed(2)}</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: mode === 'rent' ? theme.primary : theme.unselected }]}
            onPress={() => setMode('rent')}
          >
            <Text style={[styles.modeBtnText, { color: mode === 'rent' ? theme.background : theme.text, fontSize: responsiveText(textSize) }]}>Rent
              <Text style={[styles.modePrice, { color: mode === 'rent' ? theme.background : theme.text, fontSize: responsiveText(textSize - 2) }]}>  ${rentPrice}/day</Text>
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.stock, { color: theme.text, fontSize: responsiveText(textSize) } ]}>Stock: {stock}</Text>
        <Text style={[styles.description, { color: theme.text, fontSize: responsiveText(textSize - 2) }]}>{params.description || 'No description available.'}</Text>
        {/* Quantity selector */}
        <View style={styles.qtyRow}>
          <Text style={[styles.qtyLabel, { color: theme.text, fontSize: responsiveText(textSize) }]}>Quantity:</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: theme.unselected }, quantity === 1 || stock === 0 ? styles.qtyBtnDisabled : null]}
            onPress={() => setQuantity(q => Math.max(1, q - 1))}
            disabled={quantity === 1 || stock === 0}
          >
            <Text style={[styles.qtyBtnText, { color: theme.text, fontSize: responsiveText(textSize + 2) }]}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { color: theme.text, fontSize: responsiveText(textSize + 2) }]}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: theme.unselected }, quantity === maxQty || stock === 0 ? styles.qtyBtnDisabled : null]}
            onPress={() => setQuantity(q => Math.min(maxQty, q + 1))}
            disabled={quantity === maxQty || stock === 0}
          >
            <Text style={[styles.qtyBtnText, { color: theme.text, fontSize: responsiveText(textSize + 2) }]}>+</Text>
          </TouchableOpacity>
        </View>
        {mode === 'rent' && <RentalCalendar />}
        {stock === 0 && (
          <Text style={[styles.outOfStock, { color: '#D32F2F', fontSize: responsiveText(textSize + 2) }]}>Out of stock</Text>
        )}
      </View>
      {/* Total and swipe to order at the bottom, swipe centered */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderColor: theme.unselected }]}> 
        <View style={styles.totalPriceBox}>
          <Text style={[styles.totalPriceLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 4) }]}>Total</Text>
          <Text style={[styles.totalPrice, { color: theme.text, fontSize: responsiveText(textSize + 4) }]}> 
            {mode === 'buy'
              ? `$${(price * quantity).toFixed(2)}`
              : `$${(rentPrice * quantity * getRentalDays()).toFixed(2)}`}
          </Text>
        </View>
        <View style={styles.swipeContainerCentered}>
          <Text style={[styles.swipeLabel, { color: theme.unselected, fontSize: responsiveText(textSize - 2) }]}>Swipe to Order</Text>
          <View style={[styles.swipeTrack, { backgroundColor: theme.unselected }]}> 
            <Animated.View
              style={[
                styles.swipeThumb,
                { backgroundColor: stock === 0 ? theme.unselected : theme.primary },
                { transform: [{ translateX: swipeX }] },
                swiped && { backgroundColor: '#4CAF50' },
              ]}
              {...(stock > 0 ? panResponder.panHandlers : {})}
            >
              <Text style={[styles.swipeThumbText, { fontSize: responsiveText(textSize + 10) }]}>{swiped ? '✓' : '→'}</Text>
            </Animated.View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 16,
  },
  stepActive: {
  },
  stepText: {
    marginLeft: 6,
    marginTop: 2,
  },
  stepTextActive: {
    marginLeft: 6,
    marginTop: 2,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stepCircleText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepLine: {
    width: 32,
    height: 3,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  container: {
    alignItems: 'center',
    padding: 24,
    flexGrow: 1,
    paddingBottom: 120,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    padding: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  image: {
    width: 240,
    height: 240,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  brand: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 12,
  },
  modeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    marginHorizontal: 6,
  },
  modeBtnActive: {
  },
  modeBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modeBtnTextActive: {
  },
  modePrice: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  stock: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  qtyLabel: {
    fontSize: 18,
    marginRight: 10,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  qtyBtnDisabled: {
    backgroundColor: '#ddd',
  },
  qtyBtnText: {
    fontSize: 22,
  },
  qtyValue: {
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 32,
    textAlign: 'center',
  },
  outOfStock: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  calendarBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  calendarBtnText: {
    fontSize: 16,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 40, // increased from 24 for more space below
    paddingTop: 8,
    borderTopWidth: 1,
    paddingHorizontal: 24,
  },
  totalPriceBox: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    flex: 1,
    marginBottom: 8,
  },
  totalPriceLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  swipeContainerCentered: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 0,
  },
  swipeLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  swipeTrack: {
    width: 260,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  swipeThumb: {
    position: 'absolute',
    left: 0,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  swipeThumbText: {
    fontWeight: 'bold',
  },
});
