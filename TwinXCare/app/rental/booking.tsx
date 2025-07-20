import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Booking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const screenWidth = Dimensions.get('window').width;
  const [swipeX] = useState(new Animated.Value(0));
  const [swiped, setSwiped] = useState(false);

  const {
    name = '',
    specialty = '',
    experience = '',
    price = '',
    image = '',
    description = '',
  } = params;

  function BackButton() {
    return (
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#1f2937" />
      </TouchableOpacity>
    );
  }

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BackButton />
      <View style={styles.card}>
        <Image source={{ uri: String(image) }} style={styles.image} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.specialty}>{specialty}</Text>
        <Text style={styles.experience}>{experience}</Text>
        <Text style={styles.price}>${price}/hr</Text>
      </View>

      <Text style={styles.description}>{description}</Text>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Select a Date</Text>
        <Text style={styles.placeholder}>[Calendar component placeholder]</Text>
      </View>

      <View style={styles.swipeContainer}>
        <Text style={styles.swipeText}>Swipe to Book</Text>
        <TouchableOpacity
          style={styles.swipeTrack}
          activeOpacity={0.8}
          onPress={handleSwipe}
          disabled={swiped}
        >
          <Animated.View
            style={[styles.swipeThumb, { backgroundColor: swiped ? '#4CAF50' : '#1d4ed8' }]}
          >
            <Text style={styles.swipeIcon}>{swiped ? '✓' : '→'}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#e5e7eb',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 16,
    color: '#374151',
  },
  experience: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 24,
  },
  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  placeholder: {
    color: '#9ca3af',
  },
  swipeContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  swipeText: {
    color: '#6b7280',
    marginBottom: 8,
    fontSize: 16,
  },
  swipeTrack: {
    width: 220,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dbeafe',
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
    elevation: 3,
  },
  swipeIcon: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
});
