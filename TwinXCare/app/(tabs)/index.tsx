import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';  // import font size helper

const mockEquipment = [
  'Wheelchair',
  'Walker',
  'Hospital Bed',
  'Oxygen Tank',
  'Crutches',
  'Walking Stick',
  'Suction Machine',
];

export default function Explore() {
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);

  const [search, setSearch] = useState('');
  const filteredItems = mockEquipment.filter(item =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  const textSize = getFontSizeValue(fontSize);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text, fontSize: textSize + 8 }]}>
        Home
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  input: {
    height: 45,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    fontFamily: 'RedHatDisplay_400Regular',
  },
  item: {
    paddingVertical: 8,
    fontFamily: 'RedHatDisplay_500Medium',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
