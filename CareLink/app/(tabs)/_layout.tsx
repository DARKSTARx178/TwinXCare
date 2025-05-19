import React from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#0af' : '#06f',
        tabBarStyle: Platform.select({
          ios: {
            height: 100,
            paddingBottom: 25,
            paddingTop: 15,
          },
          android: {
            height: 80,
            paddingBottom: 15,
            paddingTop: 10,
          },
          web: {
            height: 85,
            paddingBottom: 20,
            paddingTop: 12,
          }
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <View
              style={{
                borderRadius: 20,
                padding: 0,
                borderColor: focused ? (isDark ? '#fff' : '#000') : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSymbol
                size={32}
                name="house.fill"
                color={focused ? (isDark ? '#000' : '#fff') : color}
              />
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <View
              style={{
                borderColor: focused ? (isDark ? '#000' : '#fff') : 'transparent',
              }}
            >
              <Text style={{ color: focused ? 'black' : 'gray', fontSize: 12 }}>
                Home
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused, color }) => (
            <View
              style={{
                borderRadius: 20,
                padding: 0,
                borderColor: focused ? (isDark ? '#fff' : '#000') : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons
                size={32}
                name="hospital-box"
                color={focused ? (isDark ? '#000' : '#fff') : color}
              />
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <View
              style={{
                borderColor: focused ? (isDark ? '#000' : '#fff') : 'transparent',
              }}
            >
              <Text style={{ color: focused ? 'black' : 'gray', fontSize: 12 }}>
                Equipment
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
