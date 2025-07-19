import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import React, { useState } from 'react';
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

// --- PAGE PROGRESS BAR ---
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
  console.log('PaymentPage mounted');
  // TEMP: Comment out context and navigation for debug
  const { scheme, fontSize } = useAccessibility(); // Uncommented for proper theme/font usage
  //@ts-ignore
  const theme = getThemeColors(scheme); // Uncommented
  const textSize = getFontSizeValue(fontSize); // Uncommented
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  // Use fallback theme for debug - REMOVED, using actual context now
  // const theme = { background: '#fff', text: '#222', primary: '#007AFF', unselected: '#ccc' };
  // const textSize = 18;
  // const responsiveText = (base: number) => base;

  const router = useRouter();
  let rawParams: any = {};
  try {
    rawParams = useLocalSearchParams() ?? {};
    console.log('useLocalSearchParams result:', rawParams);
  } catch (e) {
    console.error('Error in useLocalSearchParams:', e);
    rawParams = {};
  }
  const params = typeof rawParams === 'object' && rawParams !== null && !Array.isArray(rawParams) ? rawParams : {};
  console.log('params:', params);
  // const screenWidth = Dimensions.get('window').width; // Already defined above

  const [address, setAddress] = useState('');
  const [region, setRegion] = useState<any>({
    latitude: 22.3964, // Default: Hong Kong
    longitude: 114.1095,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [marker, setMarker] = useState<any>(null);

  // Debug logs for state
  React.useEffect(() => {
    console.log('address:', address);
    console.log('region:', region);
    console.log('marker:', marker);
  }, [address, region, marker]);

  // Add tick button to complete payment
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
        name: params.name as string,
        brand: params.brand as string,
        date: new Date().toISOString().split('T')[0],
        status: 'Ordered',
        amount: params.mode === 'buy' ? Number(params.price) * Number(params.quantity) : Math.max(1, Math.round(Number(params.price) * 0.18)) * Number(params.quantity) * (params.rentalStart && params.rentalEnd ? Math.ceil((new Date(params.rentalEnd as string).getTime() - new Date(params.rentalStart as string).getTime()) / (24 * 60 * 60 * 1000)) : 1),
        quantity: Number(params.quantity),
        mode: params.mode === 'rent' ? 'rent' : 'buy',
        rentalStart: params.mode === 'rent' ? new Date(params.rentalStart as string).toISOString().split('T')[0] : undefined,
        rentalEnd: params.mode === 'rent' ? new Date(params.rentalEnd as string).toISOString().split('T')[0] : undefined,
        image: params.image as string,
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

  // --- MAIN RETURN ---
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
            // 'details' is provided when fetchDetails is true
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
            key: 'AIzaSyAfvAGRlPuP3YQZ225gEqYYWzTafbVdsCw', // <<< IMPORTANT: Replace with your actual API Key
            language: 'en', // default: 'en'
            components: 'country:hk', // Restrict to Hong Kong, adjust as needed
          }}
          fetchDetails={true} // Fetch details about the place
          styles={{
            container: {
              flex: 0,
              position: 'absolute',
              width: '100%',
              zIndex: 1000,
            },
            textInputContainer: {
              width: '100%',
              backgroundColor: theme.background,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.unselected,
              paddingHorizontal: 8,
              paddingVertical: 4,
            },
            textInput: {
              height: 44,
              color: theme.text,
              fontSize: responsiveText(textSize),
            },
            predefinedPlacesDescription: {
              color: theme.primary,
            },
            listView: {
              backgroundColor: theme.background,
              borderColor: theme.unselected,
              borderWidth: 1,
              borderRadius: 8,
              marginTop: 50, // Adjust to show below the input
            },
            row: {
              padding: 13,
              height: 44,
              flexDirection: 'row',
            },
            description: {
              color: theme.text,
              fontSize: responsiveText(textSize - 2),
            },
          }}
          enablePoweredByContainer={false} // Hide "Powered by Google"
          nearbyPlacesAPI="GooglePlacesSearch" // Use Google Places Search API
          debounce={200} // Delay before making API calls
        />
      </View>

      {/* MapView */}
      <View style={{ width: '100%', maxWidth: 400, height: 220, alignSelf: 'center', marginBottom: 16, marginTop: 100 }}>
        <MapView
          style={{ flex: 1, borderRadius: 12 }}
          region={region}
          onRegionChangeComplete={setRegion} // Update region when user moves map
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
});
