import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';

export default function Profile() {
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);

  const menuItems = [
    { icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/settings') },
    { icon: 'key-outline', label: 'Change Password', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help', onPress: () => {} },
    { icon: 'log-out-outline', label: 'Logout', onPress: () => {}, isLogout: true },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <Image
        source={require('@/assets/images/noprofile.jpg')}
        style={styles.avatar}
      />

      <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 6, fontSize: textSize + 8 }}>Guest</Text>
      <Text style={{ color: theme.text, marginBottom: 20, fontSize: textSize }}>Not logged in!</Text>

      <View style={styles.optionsContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.option} onPress={item.onPress}>
            <Ionicons
              name={item.icon as any}
              size={22}
              color={item.isLogout ? '#d00' : theme.text}
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                color: item.isLogout ? '#d00' : theme.text,
                fontSize: textSize,
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  backButton: {
    position: 'absolute',
    top: 35,
    left: 20,
    zIndex: 1,
    backgroundColor: 'transparent',
    padding: 6,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  optionsContainer: {
    marginTop: 30,
    width: '85%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});
