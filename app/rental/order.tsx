import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { EquipmentStockLocation, PICKUP_LOCATIONS } from '@/utils/equipmentStock';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Avoid registering native Google Maps on Android builds without a Maps API key.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const NativeMaps = Platform.OS === 'android' ? null : require('react-native-maps');
const MapView = NativeMaps?.default;
const Marker = NativeMaps?.Marker;

export default function OrderPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { fontSize } = useAccessibility();
  const { theme } = useContext(ThemeContext);
  const textSize = getFontSizeValue(fontSize);

  const [quantity, setQuantity] = useState(1);
  const [rentalStart, setRentalStart] = useState(new Date());
  const [rentalEnd, setRentalEnd] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [swipeX] = useState(new Animated.Value(0));
  const [swiped, setSwiped] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const pricePerDay = Number(params.price) || 0;
  const stockLocations = useMemo<EquipmentStockLocation[]>(() => {
    try {
      if (typeof params.stockLocations === 'string') {
        return JSON.parse(params.stockLocations);
      }
    } catch (error) {
      console.warn('Failed to parse stock locations:', error);
    }
    const fallback = PICKUP_LOCATIONS[0];
    return [{ ...fallback, stock: Number(params.stock || 0) }];
  }, [params.stock, params.stockLocations]);
  const fallbackStock = Number(params.stock) || 0;
  const totalStock = stockLocations.length
    ? stockLocations.reduce((sum, location) => sum + Number(location.stock || 0), 0)
    : fallbackStock;
  const inStockLocations = stockLocations.filter((location) => Number(location.stock || 0) > 0);
  const canRenderNativePickupMap = Platform.OS !== 'android' && stockLocations.every((location) =>
    Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))
  );
  const [selectedPickupId, setSelectedPickupId] = useState<string | null>(inStockLocations[0]?.id || null);
  const selectedPickup = stockLocations.find((location) => location.id === selectedPickupId) || null;
  const selectedStock = selectedPickup ? Number(selectedPickup.stock || 0) : fallbackStock;
  const maxQty = Math.max(1, selectedStock);
  const canRent = totalStock > 0 && !!selectedPickup && selectedStock >= quantity;

  const getRentalDays = () => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.ceil((rentalEnd.getTime() - rentalStart.getTime()) / msPerDay);
    return days > 0 ? days : 1;
  };

  const responsiveText = (base: number) => Math.max(base * (SCREEN_WIDTH / 400), base * 0.85);
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
      if (dx >= 260 - 64 - 2 && canRent && !swiped) handleSwipe();
    },
    onPanResponderRelease: (_, gestureState) => {
      if (!swiped) {
        const swipeDistance = gestureState.moveX - startX;
        const threshold = 260 - 64 - 10;
        if (swipeDistance >= threshold && canRent) handleSwipe();
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
          pickupLocationId: selectedPickup?.id || '',
          pickupLocationName: selectedPickup?.name || '',
          pickupLocationAddress: selectedPickup?.address || '',
          pickupLocationLatitude: selectedPickup ? String(selectedPickup.latitude) : '',
          pickupLocationLongitude: selectedPickup ? String(selectedPickup.longitude) : '',
        },
      });

    }, 400);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.imageCard, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
            <Image source={{ uri: params.image as string }} style={styles.image} resizeMode="cover" />
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>${pricePerDay}/day</Text>
            </View>
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 12) }]}>{params.name}</Text>
            <Text style={[styles.brand, { color: theme.textDim, fontSize: responsiveText(textSize) }]}>{params.brand}</Text>

            <View style={[styles.stockBadge, { backgroundColor: totalStock > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
              <View style={[styles.stockDot, { backgroundColor: totalStock > 0 ? '#10b981' : '#ef4444' }]} />
              <Text style={[styles.stockText, { color: totalStock > 0 ? '#10b981' : '#ef4444' }]}>
                {totalStock > 0 ? `${totalStock} total units available` : 'Out of stock'}
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
            <Text style={[styles.description, { color: theme.textDim, fontSize: responsiveText(textSize - 2) }]}>
              {params.description || 'No detailed description available for this item.'}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 4 }]}>Quantity</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textDim }]}>How many do you need?</Text>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border }, (quantity === 1 || totalStock === 0) && { opacity: 0.5 }]}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity === 1 || totalStock === 0}
                >
                  <Ionicons name="remove" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.qtyValue, { color: theme.text }]}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border }, (quantity === maxQty || !canRent) && { opacity: 0.5 }]}
                  onPress={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity === maxQty || !canRent}
                >
                  <Ionicons name="add" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Pickup Point</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textDim, marginBottom: 16 }]}>
              Choose where this equipment should be reserved from.
            </Text>

            {stockLocations.length > 0 && canRenderNativePickupMap && MapView && Marker && (
              <MapView
                style={styles.pickupMap}
                initialRegion={{
                  latitude: selectedPickup?.latitude || stockLocations[0].latitude,
                  longitude: selectedPickup?.longitude || stockLocations[0].longitude,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }}
              >
                {stockLocations.map((location) => {
                  const available = Number(location.stock || 0) > 0;
                  const active = location.id === selectedPickupId;
                  return (
                    <Marker
                      key={location.id}
                      coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                      title={location.name}
                      description={`${location.stock} in stock`}
                      pinColor={!available ? '#ef4444' : active ? theme.primary : '#10b981'}
                      onPress={() => {
                        if (!available) {
                          Alert.alert('Out of Stock', `${location.name} has no units available.`);
                          return;
                        }
                        setSelectedPickupId(location.id);
                        setQuantity((q) => Math.min(q, Number(location.stock || 1)));
                      }}
                    />
                  );
                })}
              </MapView>
            )}

            <View style={styles.pickupCardList}>
              {stockLocations.map((location) => {
                const available = Number(location.stock || 0) > 0;
                const active = location.id === selectedPickupId;
                return (
                  <TouchableOpacity
                    key={location.id}
                    style={[
                      styles.pickupOption,
                      {
                        borderColor: active ? theme.primary : theme.border,
                        backgroundColor: active ? theme.primaryGlow : theme.surface,
                        opacity: available ? 1 : 0.5,
                      },
                    ]}
                    disabled={!available}
                    onPress={() => {
                      setSelectedPickupId(location.id);
                      setQuantity((q) => Math.min(q, Number(location.stock || 1)));
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickupOptionName, { color: active ? theme.primary : theme.text }]}>
                        {location.name}
                      </Text>
                      <Text style={[styles.pickupOptionAddress, { color: theme.textDim }]} numberOfLines={2}>
                        {location.address}
                      </Text>
                    </View>
                    <Text style={[styles.pickupOptionStock, { color: available ? theme.primary : '#ef4444' }]}>
                      {available ? `${location.stock}` : '0'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.pickerWrap, { borderColor: theme.border, backgroundColor: '#F1F5F9' }]}>
              <Picker
                selectedValue={selectedPickupId}
                onValueChange={(value) => {
                  const next = stockLocations.find((location) => location.id === value);
                  if (!next || Number(next.stock || 0) <= 0) return;
                  setSelectedPickupId(value);
                  setQuantity((q) => Math.min(q, Number(next.stock || 1)));
                }}
                style={{ color: theme.text }}
              >
                {inStockLocations.length === 0 ? (
                  <Picker.Item label="No pickup points with stock" value="" />
                ) : (
                  inStockLocations.map((location) => (
                    <Picker.Item
                      key={location.id}
                      label={`${location.name} (${location.stock} available)`}
                      value={location.id}
                    />
                  ))
                )}
              </Picker>
            </View>

            {selectedPickup && (
              <View style={[styles.pickupSummary, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.pickupName, { color: theme.text }]}>{selectedPickup.name}</Text>
                <Text style={[styles.pickupAddress, { color: theme.textDim }]}>{selectedPickup.address}</Text>
                <Text style={[styles.pickupStock, { color: theme.primary }]}>{selectedStock} units at this pickup point</Text>
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Rental Period</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textDim, marginBottom: 20 }]}>
              Selected for {getRentalDays()} day{getRentalDays() > 1 ? 's' : ''}
            </Text>

            <View style={styles.calendarContainer}>
              <TouchableOpacity
                style={[styles.datePicker, { backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border }]}
                onPress={() => setShowStart(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={theme.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.dateLabel, { color: theme.textDim }]}>Starts</Text>
                  <Text style={[styles.dateValue, { color: theme.text }]}>{rentalStart.toDateString()}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.dateDivider}>
                <Ionicons name="arrow-forward" size={16} color={theme.textDim} />
              </View>

              <TouchableOpacity
                style={[styles.datePicker, { backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border }]}
                onPress={() => setShowEnd(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={theme.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.dateLabel, { color: theme.textDim }]}>Ends</Text>
                  <Text style={[styles.dateValue, { color: theme.text }]}>{rentalEnd.toDateString()}</Text>
                </View>
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
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border }]}>
        <View style={styles.priceInfo}>
          <Text style={[styles.totalLabel, { color: theme.textDim }]}>Estimated Total</Text>
          <Text style={[styles.totalPrice, { color: theme.text }]}>
            ${(pricePerDay * quantity * getRentalDays()).toFixed(2)}
          </Text>
        </View>

        <View style={styles.swipeArea}>
          <View style={[styles.swipeTrack, { backgroundColor: '#F1F5F9' }]} {...(canRent ? panResponder.panHandlers : {})}>
            <Text style={[styles.swipeActionText, { color: theme.textDim }]}>
              {swiped ? 'ORDER PLACED' : canRent ? 'SWIPE TO RENT' : 'SELECT AVAILABLE PICKUP'}
            </Text>
            <Animated.View style={[
              styles.swipeThumb,
              { backgroundColor: !canRent ? '#CBD5E1' : theme.primary },
              { transform: [{ translateX: swipeX }] },
              swiped && { backgroundColor: '#10b981' },
              { borderWidth: 2, borderColor: '#fff' }
            ]}>
              <Ionicons name={swiped ? 'checkmark' : 'chevron-forward'} size={24} color="#fff" />
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  content: { paddingHorizontal: 20, paddingTop: 60 },
  imageCard: {
    width: '100%',
    height: 320,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: { width: '100%', height: '100%' },
  priceBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#81ade7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  priceBadgeText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  headerInfo: { alignItems: 'center', marginBottom: 25 },
  title: { fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  brand: { fontWeight: '600', marginBottom: 12 },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  stockDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  stockText: { fontSize: 13, fontWeight: '700' },
  card: {
    padding: 24,
    borderRadius: 28,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, fontWeight: '500' },
  description: { lineHeight: 22 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  qtyValue: { fontSize: 18, fontWeight: '800', marginHorizontal: 16, minWidth: 20, textAlign: 'center' },
  pickupMap: {
    height: 220,
    borderRadius: 18,
    marginBottom: 14,
  },
  pickupCardList: {
    gap: 10,
    marginBottom: 14,
  },
  pickupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
  },
  pickupOptionName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  pickupOptionAddress: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  pickupOptionStock: {
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 12,
  },
  pickerWrap: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  pickupSummary: {
    borderRadius: 16,
    padding: 14,
  },
  pickupName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  pickupAddress: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  pickupStock: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  calendarContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  datePicker: { flex: 1, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  dateLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '700' },
  dateDivider: { paddingHorizontal: 8 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
  },
  priceInfo: { flex: 1 },
  totalLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  totalPrice: { fontSize: 24, fontWeight: '900' },
  swipeArea: { flex: 1.5, marginLeft: 10 },
  swipeTrack: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  swipeActionText: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  swipeThumb: {
    position: 'absolute',
    left: 0,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
