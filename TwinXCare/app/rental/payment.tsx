import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { addOrderHistory } from '@/utils/userHistory';
import * as SecureStore from 'expo-secure-store';

// Import MapView and GooglePlacesAutocomplete
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

function PageProgressBar({ step }: { step: 'order' | 'payment' | 'delivery' }) {
  const { scheme } = useAccessibility();
  //@ts-ignore
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
  const { scheme, fontSize } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  const router = useRouter();
  let rawParams: any = {};
  try {
    rawParams = useLocalSearchParams() ?? {};
    console.log('useLocalSearchParams result:', rawParams);
  } catch (e) {
    console.error('Error in useLocalSearchParams:', e);
    rawParams = {}; // Ensure it's always an empty object if parsing fails
  }

  // Check if params is an object and safely extract values
  const params = rawParams && typeof rawParams === 'object' && !Array.isArray(rawParams) ? rawParams : {};
  console.log('params:', params);

  // Safely extract required values from params
  const { name, brand, price, quantity, mode, rentalStart, rentalEnd, image } = params;

  const [address, setAddress] = useState('');
  const [region, setRegion] = useState<any>({
    latitude: 22.3964, // Default: Hong Kong
    longitude: 114.1095,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [marker, setMarker] = useState<any>(null);

  useEffect(() => {
    console.log('address:', address);
    console.log('region:', region);
    console.log('marker:', marker);
  }, [address, region, marker]);

  const handlePaymentComplete = async () => {
    if (!address || !marker) {
      alert('Please enter a delivery address and select it from suggestions.');
      return;
    }

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
        name: name as string,
        brand: brand as string,
        date: new Date().toISOString().split('T')[0],
        status: 'Ordered',
        amount: mode === 'buy' ? Number(price) * Number(quantity) : Math.max(1, Math.round(Number(price) * 0.18)) * Number(quantity) * (rentalStart && rentalEnd ? Math.ceil((new Date(rentalEnd as string).getTime() - new Date(rentalStart as string).getTime()) / (24 * 60 * 60 * 1000)) : 1),
        quantity: Number(quantity),
        mode: mode === 'rent' ? 'rent' : 'buy',
        rentalStart: mode === 'rent' ? new Date(rentalStart as string).toISOString().split('T')[0] : undefined,
        rentalEnd: mode === 'rent' ? new Date(rentalEnd as string).toISOString().split('T')[0] : undefined,
        image: image as string,
        address: address,
        latitude: marker?.latitude,
        longitude: marker?.longitude,
      });
    } catch (e) { console.error('Order history save error', e); }

    router.push({
      pathname: '/(tabs)/delivery',
      params: {
        orderTime: timestamp,
        transactionId: Math.random().toString(36).slice(2, 10).toUpperCase(),
        deliveryEta,
        address: address,
        latitude: marker?.latitude,
        longitude: marker?.longitude,
      },
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <PageProgressBar step="payment" />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 10) }]}>Complete Your Payment</Text>
      <Text style={[styles.text, { color: theme.text, fontSize: responsiveText(textSize) }]}>Enter your delivery address:</Text>

      {/* Google Places Autocomplete Input */}
      <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center', marginBottom: 12, zIndex: 1000 }}>
        <GooglePlacesAutocomplete
          placeholder="Search for address"
          onPress={(data, details = null) => {
            if (details) {
              const { lat, lng } = details.geometry.location;
              setAddress(data.description);
              setRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
              setMarker({ latitude: lat, longitude: lng });
            }
          }}
          query={{
            key: 'YOUR_GOOGLE_MAPS_API_KEY', // <<< Make sure your API key is valid and working
            language: 'en',
            components: 'country:hk', // Adjust as needed
          }}
          fetchDetails={true}
          styles={{
            container: { position: 'absolute', width: '100%', zIndex: 1000 },
            textInputContainer: {
              backgroundColor: theme.background,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.unselected,
              paddingHorizontal: 8,
              paddingVertical: 4,
            },
            textInput: { height: 44, color: theme.text, fontSize: responsiveText(textSize) },
            listView: { backgroundColor: theme.background, borderColor: theme.unselected, borderWidth: 1, borderRadius: 8, marginTop: 50 },
          }}
          enablePoweredByContainer={false}
          nearbyPlacesAPI="GooglePlacesSearch"
          debounce={200}
        />
      </View>

      {/* MapView */}
      <View style={{ width: '100%', maxWidth: 400, height: 220, alignSelf: 'center', marginBottom: 16, marginTop: 100 }}>
        <MapView
          style={{ flex: 1, borderRadius: 12 }}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {marker && <Marker coordinate={marker} />}
        </MapView>
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 24 },
  backButton: { alignSelf: 'flex-start', marginBottom: 24, padding: 8, borderRadius: 8 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#222' },
  text: { fontSize: 18, color: '#444', marginBottom: 16, textAlign: 'center' },
  link: { fontSize: 18, color: '#007AFF', textDecorationLine: 'underline', marginBottom: 24 },
});
