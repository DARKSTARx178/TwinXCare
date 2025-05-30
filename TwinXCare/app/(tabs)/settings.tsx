import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';  // <-- import helper

export default function SettingsScreen() {
  const { scheme, setScheme, fontSize, setFontSize } = useAccessibility();
  const theme = getThemeColors(scheme);

  const colorOptions = [
    { label: 'Light Mode', value: 'lightMode' },
    { label: 'Dark Mode', value: 'darkMode' },
  ];

  const fontSizeOptions = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
  ];

  const textSize = getFontSizeValue(fontSize);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text>{'\n'}</Text>

      <Text style={[styles.title, { color: theme.text, fontSize: textSize + 8 }]}>
        Accessibility Options
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.text, fontSize: textSize + 2 }]}>
        Color Scheme
      </Text>
      {colorOptions.map((opt) => {
        const isSelected = scheme === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? theme.primary : theme.unselected,
                borderWidth: 1,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setScheme(opt.value as any)}
          >
            <Text
              style={{
                color: isSelected ? '#fff' : theme.text,
                fontWeight: '600',
                fontSize: textSize,
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 30, fontSize: textSize + 2 }]}>
        Font Size
      </Text>
      {fontSizeOptions.map((opt) => {
        const isSelected = fontSize === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? theme.primary : theme.unselected,
                borderWidth: 1,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setFontSize(opt.value as any)}
          >
            <Text
              style={{
                color: isSelected ? '#fff' : theme.text,
                fontWeight: '600',
                fontSize: textSize,
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      <Text>{'\n'}</Text> {/* padding */}
      <Text>{'\n'}</Text> {/* padding */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 10,
  },
  option: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
  },
});
