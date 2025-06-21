import React from 'react';
import { Stack } from 'expo-router';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';

export default function RootLayout() {
  return (
    <AccessibilityProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AccessibilityProvider>
  );
}
