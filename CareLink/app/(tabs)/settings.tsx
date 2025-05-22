import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';

export default function SettingsScreen() {
  const { scheme, setScheme } = useAccessibility();
  const theme = getThemeColors(scheme);

  const options = [
    { label: 'Default', value: 'default' },
    { label: 'High Contrast', value: 'highContrast' },
    { label: 'Low Vision', value: 'lowVision' },
    { label: 'Color Blind Friendly', value: 'colorBlind' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Accessibility Options
      </Text>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[
            styles.option,
            scheme === opt.value && { backgroundColor: theme.primary },
          ]}
          onPress={() => setScheme(opt.value as any)}
        >
          <Text
            style={[
              styles.optionText,
              { color: scheme === opt.value ? '#fff' : theme.text },
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'RedHatDisplay_700Bold',
  },
  option: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  optionText: {
    fontSize: 18,
    fontFamily: 'RedHatDisplay_700Bold',
  },
});
