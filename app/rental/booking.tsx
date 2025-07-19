import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
// import a calendar component if you have one, e.g. react-native-calendars
// import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

export default function Booking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const screenWidth = Dimensions.get('window').width;
  const [swipeX] = useState(new Animated.Value(0));
  const [swiped, setSwiped] = useState(false);

  // Destructure params for service info
  const {
    name = '',
    specialty = '',
    experience = '',
    price = '',
    image = '',
    description = '',
  } = params;

  // Simple back button
  function BackButton() {
    return (
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#222" />
      </TouchableOpacity>
    );
  }

  // Swipe to order logic (simple, no pan responder for now)
  function handleSwipe() {
    setSwiped(true);
    setTimeout(() => {
      router.replace({
        pathname: '/rental/payment',
        params: {
          name,
          specialty,
          experience,
          price,
          image,
          description,
          mode: 'service',
        },
      });
    }, 400);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 24 }}>
      <BackButton />
      <View style={styles.header}>
        <Image source={{ uri: String(image) }} style={[styles.image, { width: screenWidth - 48, height: (screenWidth - 48) * 0.5 }]} />
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>{specialty}</Text>
        <Text style={styles.subtitle}>{experience}</Text>
        <Text style={styles.price}>${price}/hr</Text>
      </View>
      <Text style={styles.desc}>{description}</Text>
      {/* Calendar and booking UI goes here */}
      <View style={styles.calendarBox}>
        <Text style={styles.calendarTitle}>Select a Date</Text>
        {/* <Calendar ... /> */}
        <Text style={{ color: '#888', marginTop: 12 }}>[Calendar component placeholder]</Text>
      </View>
      {/* Swipe to order */}
      <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 32 }}>
        <Text style={{ color: '#888', marginBottom: 8, fontSize: 16 }}>Swipe to Book</Text>
        <TouchableOpacity
          style={[styles.swipeTrack, { backgroundColor: '#e0e7ef' }]}
          activeOpacity={0.8}
          onPress={handleSwipe}
          disabled={swiped}
        >
          <Animated.View
            style={[
              styles.swipeThumb,
              { backgroundColor: swiped ? '#4CAF50' : '#4a90e2' },
            ]}
          >
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{swiped ? '✓' : '→'}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    padding: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  image: {
    borderRadius: 18,
    marginBottom: 12,
    resizeMode: 'cover',
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#444',
    marginBottom: 2,
    textAlign: 'center',
  },
  price: {
    fontSize: 20,
    color: '#4a90e2',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 16,
    color: '#444',
    marginBottom: 24,
  },
  calendarBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  swipeTrack: {
    width: 220,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  swipeThumb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
});
