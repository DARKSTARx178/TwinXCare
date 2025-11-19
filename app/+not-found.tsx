import { ThemeContext } from '@/contexts/ThemeContext';
import { Link, Stack } from 'expo-router';
import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  const { theme } = useContext(ThemeContext);
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>This screen does not exist... yet. 🛠️</Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text style={{ color: theme.primary }}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
