import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';

function TabLayout() {
  const { scheme } = useAccessibility();
  const theme = getThemeColors(scheme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarStyle: Platform.select({
          ios: {
            height: 100,
            paddingBottom: 25,
            paddingTop: 15,
            backgroundColor: theme.background,
          },
          android: {
            height: 105,
            paddingBottom: 10,
            paddingTop: 10,
            backgroundColor: theme.background,
          },
          web: {
            height: 85,
            paddingBottom: 20,
            paddingTop: 12,
            backgroundColor: theme.background,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={32}
              name="house.fill"
              color={color}
            />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color: color, fontSize: 12 }}>
              Home
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Equipment',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              size={32}
              name="hospital-box"
              color={color}
            />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color: color, fontSize: 12 }}>
              Equipment
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              size={32}
              name="cog"
              color={color}
            />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color: color, fontSize: 12 }}>
              Settings
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AccessibilityProvider>
      <TabLayout />
    </AccessibilityProvider>
  );
}
