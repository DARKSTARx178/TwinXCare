
import { ThemeContext } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Splash() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <Text style={[styles.text, { color: '#fff' }]}>TwinXCare</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 42,
    fontWeight: 'bold',
    fontFamily: 'RedHatDisplay_700Bold'
  },
});
