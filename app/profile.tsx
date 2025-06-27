import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import * as SecureStore from 'expo-secure-store';

export default function Profile() {
  const router = useRouter();
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const currentUser = await SecureStore.getItemAsync('user');
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    })();
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('user');
    setUser(null);
    Alert.alert('Signed Out', 'You have been signed out.');
  };

  const menuItems = [
    { icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/settings') },
    { icon: 'key-outline', label: 'Change Password', onPress: () => {}},
    { icon: 'help-circle-outline', label: 'Help', onPress: () => {} },
    user && { icon: 'log-out-outline', label: 'Logout', onPress: handleLogout, isLogout: true },
  ].filter(Boolean) as { icon: string; label: string; onPress: () => void | Promise<void>; isLogout?: boolean }[];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)')}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      {user ? (
        <>
          <View style={[styles.avatar, {backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center'}]}>
            <Text style={{color: theme.background, fontWeight: 'bold', fontSize: 48}}>
              {user.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 6, fontSize: textSize + 8 }}>{user}</Text>
          <Text style={{ color: theme.text, marginBottom: 20, fontSize: textSize }}>Signed in</Text>
        </>
      ) : (
        <>
          <Image
            source={require('@/assets/images/noprofile.jpg')}
            style={styles.avatar}
          />
          <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 6, fontSize: textSize + 8 }}>Guest</Text>
          <Text style={{ color: theme.text, marginBottom: 20, fontSize: textSize }}>Not logged in!</Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.primary,
              paddingVertical: 10,
              paddingHorizontal: 30,
              borderRadius: 8,
              marginBottom: 10,
            }}
            onPress={handleLogin}
          >
            <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: theme.primary,
              paddingVertical: 10,
              paddingHorizontal: 30,
              borderRadius: 8,
              marginBottom: 10,
            }}
            onPress={handleRegister}
          >
            <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: textSize }}>Register</Text>
          </TouchableOpacity>
        </>
      )}

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
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
