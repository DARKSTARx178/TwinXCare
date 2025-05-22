import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';

export default function Explore() {
  const { scheme } = useAccessibility();
  const theme = getThemeColors(scheme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>
        equipment rental
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'RedHatDisplay_700Bold',
  },
});
