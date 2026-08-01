import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { homeTranslations } from '@/utils/translations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GoogleGenAI } from '@google/genai';
import { useFocusEffect } from '@react-navigation/native';
import { Tabs, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Keyboard, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { aiExploreFilterControl } from './explore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'demo-key' });

function TabLayout({ onHeaderSwipe }: { onHeaderSwipe?: () => void }) {
  const { lang } = useLanguage();
  const t = homeTranslations[lang];
  const { theme } = useContext(ThemeContext);
  const { fontSize } = useAccessibility();
  const textSize = getFontSizeValue(fontSize);
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchUsername = async () => {
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && isActive) {
            const data = userSnap.data();
            setProfileUser(data.username || user.email || null);
          }
        }
      };

      fetchUsername();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const panX = useRef(new Animated.Value(0)).current;
  const headerPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 20,
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 50 && onHeaderSwipe) {
          onHeaderSwipe();
        }
        panX.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dx: panX }], { useNativeDriver: false }),
    })
  ).current;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => (
          <View
            style={{
              height: 95,
              backgroundColor: theme.background,
              justifyContent: 'flex-end',
              flexDirection: 'row',
              alignItems: 'center',
              position: 'relative',
              paddingHorizontal: 12,
            }}
            {...headerPanResponder.panHandlers}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 10, flex: 1 }}>
              <TouchableOpacity
                onPress={() => router.push('/profile')}
                style={{
                  borderRadius: 50,
                  overflow: 'hidden',
                  width: 54,
                  height: 54,
                  backgroundColor: profileUser ? theme.primary : '#ccc',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 8,
                  marginTop: 24,
                }}
              >
                {profileUser ? (
                  <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: Math.max(18, textSize - 2) }}>
                    {typeof profileUser === 'string' && profileUser.length > 0
                      ? profileUser.includes('@')
                        ? profileUser.split('@')[0].charAt(0).toUpperCase()
                        : profileUser.charAt(0).toUpperCase()
                      : '?'}
                  </Text>
                ) : (
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#64748b', fontWeight: '800', fontSize: 16 }}>?</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ),
        headerShadowVisible: false,
        headerTitle: '',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.unselected,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 100 : 105,
          paddingBottom: Platform.OS === 'ios' ? 25 : 30,
          paddingTop: Platform.OS === 'ios' ? 15 : 10,
          backgroundColor: theme.background,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.home, tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: Math.max(11, textSize - 8) }}>{t.home}</Text> }} />
      <Tabs.Screen name="explore" options={{ title: t.equipment, tabBarIcon: ({ color }) => <MaterialCommunityIcons name="hospital-box" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: Math.max(11, textSize - 8) }}>{t.equipment}</Text> }} />
      <Tabs.Screen name="services" options={{ title: t.escort, tabBarIcon: ({ color }) => <MaterialCommunityIcons name="car-side" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: Math.max(11, textSize - 8) }}>{t.escort}</Text> }} />
      <Tabs.Screen name="delivery" options={{ title: t.delivery, tabBarIcon: ({ color }) => <MaterialCommunityIcons name="car" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: Math.max(11, textSize - 8) }}>{t.delivery}</Text> }} />
      <Tabs.Screen name="settings" options={{ title: t.settings, tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cog" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: Math.max(11, textSize - 8) }}>{t.settings}</Text> }} />
    </Tabs>
  );
}

function AIOverlay({
  visible,
  aiInput,
  setAiInput,
  aiResponse,
  setAiResponse,
  showAiInput,
  setShowAiInput,
  loading,
  setLoading,
  slideAnim,
  handleAskGemini,
  onAIClick,
  onCloseAIMode,
}: {
  visible: boolean;
  aiInput: string;
  setAiInput: (value: string) => void;
  aiResponse: string;
  setAiResponse: (value: string) => void;
  showAiInput: boolean;
  setShowAiInput: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  setLoading: (value: boolean) => void;
  slideAnim: Animated.Value;
  handleAskGemini: () => void;
  onAIClick: () => void;
  onCloseAIMode: () => void;
}) {
  const { fontSize } = useAccessibility();
  const textSize = getFontSizeValue(fontSize);
  const insets = useSafeAreaInsets();
  const [replyCollapsed, setReplyCollapsed] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const aiInputRef = useRef(aiInput);

  useEffect(() => {
    Animated.loop(
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 7000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: false,
      })
    ).start();
  }, [borderAnim]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, visible]);

  useEffect(() => {
    if (visible) {
      setShowAiInput(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [visible, setShowAiInput, slideAnim]);

  useEffect(() => {
    aiInputRef.current = aiInput;
  }, [aiInput]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['rgba(123,97,255,0.8)', 'rgba(0,180,255,0.8)', 'rgba(255,60,80,0.8)', 'rgba(123,97,255,0.8)'],
  });
  const glintColor = borderAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['rgba(123,97,255,0.7)', 'rgba(0,180,255,0.7)', 'rgba(255,60,80,0.7)', 'rgba(123,97,255,0.7)'],
  });
  const waveTranslate = borderAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 12, 0],
  });
  const waveScale = borderAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.98, 1],
  });
  const waveOpacity = borderAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.92, 1, 0.92],
  });
  const inputBarRight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [280, 100],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top,
        left: 0,
        right: 0,
        height: 116,
        opacity: fadeAnim,
      }}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onCloseAIMode}
        style={{
          position: 'absolute',
          top: 6,
          left: 24,
          right: 100,
          height: 20,
          borderRadius: 999,
          backgroundColor: 'rgba(123,97,255,0.32)',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 6,
            borderRadius: 999,
            backgroundColor: 'rgba(123,97,255,0.20)',
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            height: 6,
            borderRadius: 999,
            backgroundColor: glintColor,
            transform: [{ translateX: waveTranslate }, { scaleX: waveScale }],
            opacity: waveOpacity,
          }}
        />
      </TouchableOpacity>
      <Animated.View
        pointerEvents="auto"
        style={{
          position: 'absolute',
          top: 34,
          left: 24,
          right: inputBarRight,
          minHeight: 48,
          borderRadius: 28,
          backgroundColor: 'rgba(123,97,255,0.34)',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 8,
          shadowColor: '#000',
          shadowOpacity: 0.14,
          shadowRadius: 4,
          elevation: 6,
        }}
      >
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: 28,
            backgroundColor: glintColor,
            opacity: 0.42,
          }}
        />
        <TouchableOpacity onPress={onAIClick} style={{ position: 'absolute', left: 16, top: 8, width: 34, height: 34, zIndex: 2, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialCommunityIcons name="keyboard" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowAiInput((prev) => !prev)} style={{ position: 'absolute', left: 60, top: 8, width: 34, height: 34, justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
          <MaterialCommunityIcons name="microphone" size={24} color="#fff" />
        </TouchableOpacity>

        <Animated.View
          style={{
            position: 'absolute',
            left: 108,
            top: 6,
            right: 8,
            height: 36,
            opacity: slideAnim,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 10,
            paddingRight: 10,
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          {showAiInput && (
            <>
              <TextInput
                style={{
                  flex: 1,
                  color: '#fff',
                  fontSize: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 6,
                  marginRight: 6,
                  backgroundColor: 'transparent',
                }}
                placeholder="Ask..."
                placeholderTextColor="#eee"
                value={aiInput}
                onChangeText={setAiInput}
                editable={!loading}
              />
              <TouchableOpacity onPress={handleAskGemini} disabled={loading || !aiInput.trim()} style={{ zIndex: 2, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="send" size={20} color={loading ? '#aaa' : '#fff'} />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </Animated.View>

      {aiResponse ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: 72 + insets.top,
            left: 20,
            right: 20,
            alignSelf: 'center',
            backgroundColor: 'rgba(123,97,255,0.42)',
            borderRadius: 34,
            padding: replyCollapsed ? 10 : 18,
            zIndex: 100,
            maxHeight: replyCollapsed ? 56 : 220,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: replyCollapsed ? 'center' : 'flex-start',
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setReplyCollapsed((c) => !c)}
            style={{ flexDirection: 'row', alignItems: 'center', zIndex: 2 }}
          >
            <MaterialCommunityIcons name={replyCollapsed ? 'chevron-down' : 'chevron-up'} size={22} color="#fff" style={{ marginRight: 8 }} />
          </TouchableOpacity>
          {!replyCollapsed && (
            <ScrollView contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>{aiResponse}</Text>
            </ScrollView>
          )}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [aiMode, setAIMode] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleAIMode = useCallback(() => setAIMode((value) => !value), []);
  const allowedRoutes = ['/profile', '/helpdocs', '/settings', '/explore', '/delivery', '/index'];

  const handleAICommand = useCallback((responseTextOrRoute: string) => {
    const searchActionMatch = responseTextOrRoute.match(/ACTION:search:(.*)/i);
    if (searchActionMatch && typeof aiExploreFilterControl.setSearch === 'function') {
      aiExploreFilterControl.setSearch(searchActionMatch[1].trim());
      router.push('/explore');
      return;
    }

    if (typeof responseTextOrRoute === 'string' && responseTextOrRoute.startsWith('/') && allowedRoutes.includes(responseTextOrRoute)) {
      router.push(responseTextOrRoute as any);
      return;
    }

    const lower = responseTextOrRoute.toLowerCase();
    const routeKeywords = [
      { keywords: ['profile', 'user profile'], route: '/profile' },
      { keywords: ['helpdocs', 'help docs', 'support'], route: '/helpdocs' },
      { keywords: ['settings', 'app settings'], route: '/settings' },
      { keywords: ['explore', 'equipment'], route: '/explore' },
      { keywords: ['delivery'], route: '/delivery' },
      { keywords: ['home', 'index', 'main page'], route: '/index' },
    ];

    for (const { keywords, route } of routeKeywords) {
      for (const keyword of keywords) {
        if (lower.includes(`go to ${keyword}`) || lower.includes(`open ${keyword}`) || lower.includes(keyword)) {
          router.push(route as any);
          return;
        }
      }
    }
  }, [router]);

  const handleAskGemini = useCallback(async () => {
    setLoading(true);
    try {
      const prompt = aiInput.trim();
      if (!prompt) {
        setAiResponse('Please type a request such as “open settings” or “search wheelchair”.');
        setLoading(false);
        return;
      }

      const lower = prompt.toLowerCase();
      if (lower.includes('search') || lower.includes('find') || lower.includes('look for')) {
        const match = prompt.match(/(?:search|find|look for)\s+(.+)/i);
        const keywords = match?.[1]?.trim() || prompt;
        setAiResponse(`Search request prepared for: ${keywords}`);
        handleAICommand(`ACTION:search:${keywords}`);
      } else {
        const systemPrompt = 'You are a helpful assistant for a medical equipment rental app. For equipment requests reply ACTION:search:{keywords}. For navigation reply /route. If unrelated, reply a short helpful message.';
        const userMessage = `${systemPrompt}\n\nUser: ${prompt}`;
        const apiKey = process.env.GENAI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        let reply = '';

        if (apiKey && apiKey !== 'demo-key') {
          const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          });
          reply = res?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response';
        } else {
          reply = prompt.toLowerCase().includes('profile')
            ? '/profile'
            : prompt.toLowerCase().includes('settings')
              ? '/settings'
              : prompt.toLowerCase().includes('help') || prompt.toLowerCase().includes('support')
                ? '/helpdocs'
                : prompt.toLowerCase().includes('equipment') || prompt.toLowerCase().includes('explore')
                  ? '/explore'
                  : prompt.toLowerCase().includes('delivery')
                    ? '/delivery'
                    : prompt.toLowerCase().includes('home') || prompt.toLowerCase().includes('main')
                      ? '/index'
                      : 'I can help you navigate the app or search the catalog. Try “open settings” or “search wheelchair”.';
        }

        if (/^ACTION:search:/i.test(reply) || reply.trim() === 'NONE' || allowedRoutes.includes(reply.trim())) {
          setAiResponse(reply.trim() === 'NONE' ? 'No matching action found.' : `Action received: ${reply}`);
        } else {
          setAiResponse(reply);
        }
        handleAICommand(reply);
      }
    } catch (error) {
      setAiResponse('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [aiInput, handleAICommand]);

  const handleAIFloatingIslandClick = () => {
    setShowAiInput((prev) => {
      const next = !prev;
      Animated.timing(slideAnim, {
        toValue: next ? 1 : 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      if (!next) Keyboard.dismiss();
      return next;
    });
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TabLayout onHeaderSwipe={toggleAIMode} />

      {aiMode ? (
        <AIOverlay
          visible={aiMode}
          aiInput={aiInput}
          setAiInput={setAiInput}
          aiResponse={aiResponse}
          setAiResponse={setAiResponse}
          showAiInput={showAiInput}
          setShowAiInput={setShowAiInput}
          loading={loading}
          setLoading={setLoading}
          slideAnim={slideAnim}
          handleAskGemini={handleAskGemini}
          onAIClick={handleAIFloatingIslandClick}
          onCloseAIMode={() => setAIMode(false)}
        />
      ) : null}

    </View>
  );
}
