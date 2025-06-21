import React, { useRef, useState, useCallback, useEffect, createContext, useContext } from 'react';
import { Text, Platform, TouchableOpacity, Image, View, Dimensions, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { PanResponder, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// AI Mode Context
const AIModeContext = createContext({ enabled: false, toggle: () => {} });
export const useAIMode = () => useContext(AIModeContext);

// Animated overlay for AI mode
const AnimatedAIModeOverlay: React.FC<{ visible: boolean }> = ({ visible }) => {
  // Use SCREEN_WIDTH and SCREEN_HEIGHT for sizing
  const borderAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [borderAnim]);

  // Interpolate border color
  const borderColor = borderAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [
      'rgba(123,97,255,0.8)', // purple
      'rgba(0,180,255,0.8)',  // blue
      'rgba(255,60,80,0.8)',  // red
      'rgba(123,97,255,0.8)', // purple
    ],
  });

  // Floating island animation
  const islandAnim = borderAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 10, 0],
  });

  // Animated glint color for the island
  const glintColor = borderAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [
      'rgba(123,97,255,0.7)', // purple
      'rgba(0,180,255,0.7)',  // blue
      'rgba(255,60,80,0.7)',  // red
      'rgba(123,97,255,0.7)', // purple
    ],
  });

  // Fade animation for overlay
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, ...StyleSheet.absoluteFillObject, zIndex: 9999, pointerEvents: 'box-none' }}>
      {/* Thicker animated border overlay, full screen, not rounded */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderWidth: 8, // Thicker border
            borderColor: borderColor,
            zIndex: 9999,
          },
        ]}
      />
      {/* Floating island: top left, no outline, animated glint, no text, bigger, not a circle */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 30,
          left: 30,
          width: 120,
          height: 60,
          borderRadius: 45,
          overflow: 'hidden',
          zIndex: 10000,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Animated glint using LinearGradient and animated color */}
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: 24,
            backgroundColor: glintColor,
            opacity: 0.7,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
};

function TabLayout({ onHeaderSwipe }: { onHeaderSwipe: () => void }) {
  const { scheme } = useAccessibility();
  const theme = getThemeColors(scheme);
  const router = useRouter();

  // PanResponder for header swipe
  const panX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes with enough distance
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          onHeaderSwipe();
        }
        panX.setValue(0);
      },
      onPanResponderMove: Animated.event([
        null,
        { dx: panX },
      ], { useNativeDriver: false }),
    })
  ).current;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: (props) => (
          <View
            style={{ height: 60, backgroundColor: theme.background, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center', position: 'relative' }}
            {...panResponder.panHandlers}
          >
            {/* Profile button on the right */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 10, flex: 1 }}>
              <TouchableOpacity
                onPress={() => router.push('/profile')}
                style={{
                  borderRadius: 50,
                  overflow: 'hidden',
                  width: 36,
                  height: 36,
                  backgroundColor: '#ccc',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10, 
                  marginTop: 40
                }}
              >
                <Image
                  source={require('@/assets/images/noprofile.jpg')}
                  style={{ width: 50, height: 50, borderRadius: 18 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        ),
        headerShadowVisible: false, 
        headerTitle: '',
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.unselectedTab,
        tabBarStyle: Platform.select({
          ios: {
            height: 100,
            paddingBottom: 25,
            paddingTop: 15,
            backgroundColor: theme.background,
          },
          android: {
            height: 105,
            paddingBottom: 30,
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
            <IconSymbol name="house.fill" size={32} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>Home</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Equipment',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="hospital-box" size={32} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>Equipment</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="delivery"
        options={{
          title: 'Delivery',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="car" size={32} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>Delivery</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" size={32} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12 }}>Settings</Text>
          ),
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 74, y: SCREEN_HEIGHT / 2 - 40 })).current;
  const panValue = useRef({ x: SCREEN_WIDTH - 74, y: SCREEN_HEIGHT / 2 - 40 });
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();

  // Keep panValue in sync with Animated.ValueXY
  useEffect(() => {
    const id = pan.addListener((value) => {
      panValue.current = value;
    });
    return () => pan.removeListener(id);
  }, [pan]);

  // Floating help button panResponder (free drag, clamped to screen)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: panValue.current.x, y: panValue.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([
        null,
        { dx: pan.x, dy: pan.y },
      ], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        // Clamp after release
        let { x, y } = panValue.current;
        if (x < 8) x = 8;
        if (x > SCREEN_WIDTH - 64) x = SCREEN_WIDTH - 64;
        if (y < 24) y = 24;
        if (y > SCREEN_HEIGHT - 80) y = SCREEN_HEIGHT - 80;
        pan.setValue({ x, y });
      },
    }) 
  ).current;

  // AI mode state
  const [aiMode, setAIMode] = useState(false);
  const toggleAIMode = useCallback(() => setAIMode((v) => !v), []);

  return (
    <AIModeContext.Provider value={{ enabled: aiMode, toggle: toggleAIMode }}>
      <AccessibilityProvider>
        <TabLayout onHeaderSwipe={toggleAIMode} />
        <AnimatedAIModeOverlay visible={aiMode} />
        {/* Draggable floating help button, free movement */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            zIndex: 10001,
            pointerEvents: 'box-none',
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
              zIndex: 10001,
            }}
            {...panResponder.panHandlers}
          >
            <TouchableOpacity
              onPress={() => router.push('/helpdocs')}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#7B61FF',
                borderRadius: 28,
                width: 56,
                height: 56,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Ionicons name="help-circle" size={36} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </AccessibilityProvider>
    </AIModeContext.Provider>
  );
}
