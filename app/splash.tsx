import { ThemeContext } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

export default function Splash() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[
        styles.content,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={[styles.logoCircle, { backgroundColor: theme.primaryGlow }]}>
          <Image
            source={require('@/assets/images/logo_all-white.png')}
            style={[styles.logo, { tintColor: theme.primary }]}
          />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>TwinXCare</Text>
        <Text style={[styles.subtitle, { color: theme.textDim }]}>Advanced Care Intelligence</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={[styles.loadingBar, { backgroundColor: '#F1F5F9' }]}>
          <Animated.View style={[
            styles.loadingProgress,
            {
              backgroundColor: theme.primary,
              width: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }
          ]} />
        </View>
        <Text style={[styles.version, { color: theme.textDim }]}>Version 2.0.4 • Alpha</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    width: '60%',
    alignItems: 'center',
  },
  loadingBar: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingProgress: {
    height: '100%',
  },
  version: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
